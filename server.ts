import express from 'express';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), 'fintrack.db');
const JSON_STORE_FILE = path.join(process.cwd(), 'fintrack_store.json');

const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    nama: 'Budi (Admin Utama)',
    role: 'admin',
    password: '123',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF9U4CSCjhOmmHyRpV9fMEoHdq7v_PLRO2pfrC-LsrdAZFiD2XaUCCsq5yxLY8CA6VOXTFHVukJKAvhFXaJ3M8UEOwB7it6tJ5ONKSQBMOFSeSs473lpc5bLS7oZZhkRcDEne5XMObGJpccu5jKdHLjkTj-5C9vWEBvC9pXU25wXemoNICJSumtgVh070E-VvEy80BJP5-pUt-mwFc8RLCE8eviNEirOnAanA_RrWm9_U37Gz7Jfkw'
  },
  {
    id: 'usr-kasir-1',
    username: 'kasir1',
    nama: 'Siti (Kasir Shift 1)',
    role: 'kasir',
    password: '123',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF9U4CSCjhOmmHyRpV9fMEoHdq7v_PLRO2pfrC-LsrdAZFiD2XaUCCsq5yxLY8CA6VOXTFHVukJKAvhFXaJ3M8UEOwB7it6tJ5ONKSQBMOFSeSs473lpc5bLS7oZZhkRcDEne5XMObGJpccu5jKdHLjkTj-5C9vWEBvC9pXU25wXemoNICJSumtgVh070E-VvEy80BJP5-pUt-mwFc8RLCE8eviNEirOnAanA_RrWm9_U37Gz7Jfkw'
  }
];

let db: Database | null = null;
let memoryStore: Record<string, any> = {};

function loadJsonStore() {
  try {
    if (fs.existsSync(JSON_STORE_FILE)) {
      const raw = fs.readFileSync(JSON_STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading JSON store:', e);
  }
}

function saveJsonStore() {
  try {
    fs.writeFileSync(JSON_STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving JSON store:', e);
  }
}

function saveDb() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (e) {
      console.error('Error exporting SQLite db:', e);
    }
  }
}

async function initDatabase() {
  loadJsonStore();

  try {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const SQL = await initSqlJs({
      locateFile: (file) => {
        if (file.endsWith('.wasm') && fs.existsSync(wasmPath)) {
          return wasmPath;
        }
        return file;
      }
    });

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  } catch (e) {
    console.error('SQLite init skipped/failed, falling back to JSON store:', e);
  }

  if (!getKv('users', null)) {
    setKv('users', DEFAULT_USERS);
  }
  if (!getKv('platforms', null)) {
    setKv('platforms', ['Cash / Tunai', 'BriLink', 'Dana', 'Mitra Shopee', 'QRIS', 'Transfer Bank']);
  }
  if (!getKv('jenis', null)) {
    setKv('jenis', ['Transfer', 'Tarik Tunai', 'Top Up', 'Pembayaran']);
  }
  if (getKv('transactions', null) === null) {
    setKv('transactions', []);
  }
  if (getKv('kasbons', null) === null) {
    setKv('kasbons', []);
  }
  if (getKv('pengeluaran', null) === null) {
    setKv('pengeluaran', []);
  }
  if (getKv('mutasis', null) === null) {
    setKv('mutasis', []);
  }
  if (getKv('saldoAwalMap', null) === null) {
    setKv('saldoAwalMap', {});
  }

  saveDb();
}

function getKv(key: string, defaultValue: any) {
  if (memoryStore[key] !== undefined && memoryStore[key] !== null) {
    return memoryStore[key];
  }
  if (db) {
    try {
      const stmt = db.prepare('SELECT value FROM kv WHERE key = ?');
      stmt.bind([key]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        if (row.value !== undefined && row.value !== null) {
          const val = JSON.parse(row.value as string);
          memoryStore[key] = val;
          return val;
        }
      } else {
        stmt.free();
      }
    } catch (e) {
      console.error('Error reading kv for key from SQLite:', key, e);
    }
  }
  return defaultValue;
}

function setKv(key: string, value: any) {
  memoryStore[key] = value;
  saveJsonStore();
  if (db) {
    try {
      db.run('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
      saveDb();
    } catch (e) {
      console.error('Error writing kv for key to SQLite:', key, e);
    }
  }
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Prevent browser caching for API endpoints
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  // API Endpoints
  app.get('/api/data', (req, res) => {
    const data = {
      users: getKv('users', null),
      transactions: getKv('transactions', null),
      kasbons: getKv('kasbons', null),
      pengeluaran: getKv('pengeluaran', null),
      mutasis: getKv('mutasis', null),
      platforms: getKv('platforms', null),
      jenis: getKv('jenis', null),
      saldoAwalMap: getKv('saldoAwalMap', null),
      settings: getKv('settings', null),
    };
    res.json({ status: 'ok', data });
  });

  app.post('/api/sync', (req, res) => {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    setKv(key, value);
    res.json({ status: 'ok', key });
  });

  app.post('/api/reset', (req, res) => {
    db.run('DELETE FROM kv;');
    saveDb();
    res.json({ status: 'ok', message: 'Database reset successfully' });
  });

  // Vite Middleware for Development or Static Files for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server FinTrack + SQLite running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
