import React, { useState, useEffect, useRef } from 'react';
import { NavTab, UserAccount, TransactionItem, KasbonItem, PengeluaranItem, MutasiSaldoItem } from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_KASBON,
  INITIAL_PENGELUARAN,
  INITIAL_MUTASI,
  INITIAL_LOGIN_LOGS,
  INITIAL_PLATFORMS,
  INITIAL_JENIS_TRANSAKSI
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExportLaporanView } from './components/ExportLaporanView';
import { LaporanView } from './components/LaporanView';
import { DashboardView } from './components/DashboardView';
import { TransaksiView } from './components/TransaksiView';
import { KasbonView } from './components/KasbonView';
import { PengeluaranView } from './components/PengeluaranView';
import { SaldoView } from './components/SaldoView';
import { PlatformJenisView } from './components/PlatformJenisView';
import { SettingsView } from './components/SettingsView';
import { AkunView } from './components/AkunView';
import { CetakStrukModal } from './components/CetakStrukModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './components/LoginView';

const INITIAL_USERS: UserAccount[] = [
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

export default function App() {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('fintrack_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('fintrack_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS[0];
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('fintrack_is_logged_in') === 'true';
  });

  // Active tab state
  const [activeTab, setActiveTabState] = useState<NavTab>('dashboard');
  const [isCetakStrukOpen, setIsCetakStrukOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Application Data State
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const saved = localStorage.getItem('fintrack_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [kasbons, setKasbons] = useState<KasbonItem[]>(() => {
    const saved = localStorage.getItem('fintrack_kasbons');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_KASBON;
  });

  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranItem[]>(() => {
    const saved = localStorage.getItem('fintrack_pengeluaran');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PENGELUARAN;
  });

  const [mutasis, setMutasis] = useState<MutasiSaldoItem[]>(() => {
    const saved = localStorage.getItem('fintrack_mutasis');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MUTASI;
  });

  const [loginLogs] = useState(INITIAL_LOGIN_LOGS);

  // Platforms and Transaction Types state
  const [platforms, setPlatforms] = useState<string[]>(() => {
    const saved = localStorage.getItem('fintrack_platforms');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PLATFORMS;
  });

  const [jenisList, setJenisList] = useState<string[]>(() => {
    const saved = localStorage.getItem('fintrack_jenis');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_JENIS_TRANSAKSI;
  });

  const [saldoAwalMap, setSaldoAwalMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('fintrack_saldo_awal');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Helper function to sync user action mutations to server and localStorage
  const syncMutation = (key: string, value: any, localStorageKey: string) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(value));
    } catch (e) {
      console.error(`localStorage save error for ${key}:`, e);
    }
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).catch((err) => console.error(`Sync mutation error for ${key}:`, err));
  };

  const updateUsers = (updater: React.SetStateAction<UserAccount[]>) => {
    setUserAccounts((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: UserAccount[]) => UserAccount[])(prev) : updater;
      syncMutation('users', next, 'fintrack_users');
      return next;
    });
  };

  const updateTransactions = (updater: React.SetStateAction<TransactionItem[]>) => {
    setTransactions((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: TransactionItem[]) => TransactionItem[])(prev) : updater;
      syncMutation('transactions', next, 'fintrack_transactions');
      return next;
    });
  };

  const updateKasbons = (updater: React.SetStateAction<KasbonItem[]>) => {
    setKasbons((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: KasbonItem[]) => KasbonItem[])(prev) : updater;
      syncMutation('kasbons', next, 'fintrack_kasbons');
      return next;
    });
  };

  const updatePengeluaran = (updater: React.SetStateAction<PengeluaranItem[]>) => {
    setPengeluaranList((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: PengeluaranItem[]) => PengeluaranItem[])(prev) : updater;
      syncMutation('pengeluaran', next, 'fintrack_pengeluaran');
      return next;
    });
  };

  const updateMutasis = (updater: React.SetStateAction<MutasiSaldoItem[]>) => {
    setMutasis((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: MutasiSaldoItem[]) => MutasiSaldoItem[])(prev) : updater;
      syncMutation('mutasis', next, 'fintrack_mutasis');
      return next;
    });
  };

  const updatePlatforms = (updater: React.SetStateAction<string[]>) => {
    setPlatforms((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: string[]) => string[])(prev) : updater;
      syncMutation('platforms', next, 'fintrack_platforms');
      return next;
    });
  };

  const updateJenisList = (updater: React.SetStateAction<string[]>) => {
    setJenisList((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: string[]) => string[])(prev) : updater;
      syncMutation('jenis', next, 'fintrack_jenis');
      return next;
    });
  };

  const updateSaldoAwalMap = (updater: React.SetStateAction<Record<string, number>>) => {
    setSaldoAwalMap((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Record<string, number>) => Record<string, number>)(prev) : updater;
      syncMutation('saldoAwalMap', next, 'fintrack_saldo_awal');
      return next;
    });
  };

  const fetchData = () => {
    return fetch('/api/data', { cache: 'no-store' })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 'ok' && res.data) {
          // 1. Users
          if (Array.isArray(res.data.users) && res.data.users.length > 0) {
            setUserAccounts(res.data.users);
            localStorage.setItem('fintrack_users', JSON.stringify(res.data.users));
            setCurrentUser((prev) => {
              const matched = res.data.users.find((u: UserAccount) => u.id === prev.id || u.username.toLowerCase() === prev.username.toLowerCase());
              return matched || res.data.users[0];
            });
          }

          // 2. Transactions
          if (Array.isArray(res.data.transactions)) {
            setTransactions(res.data.transactions);
            localStorage.setItem('fintrack_transactions', JSON.stringify(res.data.transactions));
          }

          // 3. Kasbons
          if (Array.isArray(res.data.kasbons)) {
            setKasbons(res.data.kasbons);
            localStorage.setItem('fintrack_kasbons', JSON.stringify(res.data.kasbons));
          }

          // 4. Pengeluaran
          if (Array.isArray(res.data.pengeluaran)) {
            setPengeluaranList(res.data.pengeluaran);
            localStorage.setItem('fintrack_pengeluaran', JSON.stringify(res.data.pengeluaran));
          }

          // 5. Mutasis
          if (Array.isArray(res.data.mutasis)) {
            setMutasis(res.data.mutasis);
            localStorage.setItem('fintrack_mutasis', JSON.stringify(res.data.mutasis));
          }

          // 6. Platforms
          if (Array.isArray(res.data.platforms) && res.data.platforms.length > 0) {
            setPlatforms(res.data.platforms);
            localStorage.setItem('fintrack_platforms', JSON.stringify(res.data.platforms));
          }

          // 7. Jenis
          if (Array.isArray(res.data.jenis) && res.data.jenis.length > 0) {
            setJenisList(res.data.jenis);
            localStorage.setItem('fintrack_jenis', JSON.stringify(res.data.jenis));
          }

          // 8. Saldo Awal Map
          if (res.data.saldoAwalMap && typeof res.data.saldoAwalMap === 'object') {
            setSaldoAwalMap(res.data.saldoAwalMap);
            localStorage.setItem('fintrack_saldo_awal', JSON.stringify(res.data.saldoAwalMap));
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching data from server:', err);
      });
  };

  // On mount: One-time seed for existing device data to server + initial fetch + auto-poll
  useEffect(() => {
    const isSeeded = localStorage.getItem('fintrack_seeded_v1');
    if (!isSeeded) {
      const existingTrxs = localStorage.getItem('fintrack_transactions');
      const existingUsers = localStorage.getItem('fintrack_users');
      const existingKasbons = localStorage.getItem('fintrack_kasbons');
      const existingPengeluaran = localStorage.getItem('fintrack_pengeluaran');
      const existingMutasis = localStorage.getItem('fintrack_mutasis');

      if (existingTrxs) {
        try { syncMutation('transactions', JSON.parse(existingTrxs), 'fintrack_transactions'); } catch (e) {}
      }
      if (existingUsers) {
        try { syncMutation('users', JSON.parse(existingUsers), 'fintrack_users'); } catch (e) {}
      }
      if (existingKasbons) {
        try { syncMutation('kasbons', JSON.parse(existingKasbons), 'fintrack_kasbons'); } catch (e) {}
      }
      if (existingPengeluaran) {
        try { syncMutation('pengeluaran', JSON.parse(existingPengeluaran), 'fintrack_pengeluaran'); } catch (e) {}
      }
      if (existingMutasis) {
        try { syncMutation('mutasis', JSON.parse(existingMutasis), 'fintrack_mutasis'); } catch (e) {}
      }
      localStorage.setItem('fintrack_seeded_v1', 'true');
    }

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Save session state to localStorage
  useEffect(() => {
    localStorage.setItem('fintrack_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fintrack_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const allowedKasirTabs: NavTab[] = ['transaksi', 'pengeluaran', 'saldo', 'pengaturan', 'akun'];

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'kasir') {
      setActiveTabState('transaksi');
    } else {
      setActiveTabState('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const setActiveTab = (tab: NavTab) => {
    if (currentUser.role === 'kasir' && !allowedKasirTabs.includes(tab)) {
      setActiveTabState('transaksi');
    } else {
      setActiveTabState(tab);
    }
  };

  const handleSwitchAccount = (account: UserAccount) => {
    setCurrentUser(account);
    if (account.role === 'kasir' && !allowedKasirTabs.includes(activeTab)) {
      setActiveTabState('transaksi');
    }
  };

  const handleUpdateUserAccount = (updated: UserAccount) => {
    updateUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleAddUserAccount = (newAcc: UserAccount) => {
    updateUsers((prev) => [...prev, newAcc]);
  };

  const handleDeleteUserAccount = (accId: string) => {
    updateUsers((prev) => prev.filter((u) => u.id !== accId));
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        userAccounts={userAccounts}
        onLoginSuccess={handleLoginSuccess}
        onRefreshUsers={(freshUsers) => setUserAccounts(freshUsers)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCetakStruk={() => setIsCetakStrukOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUserRole={currentUser.role}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Top App Header */}
        <Header
          activeTab={activeTab}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          currentUser={currentUser}
          userAccounts={userAccounts}
          onSwitchAccount={handleSwitchAccount}
          onNavigateToAkun={() => setActiveTab('akun')}
          onLogout={handleLogout}
        />

        {/* Main Content Body */}
        <main className="flex-1 mt-16 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 bg-[#f8f9ff] w-full max-w-full overflow-x-hidden">
          {activeTab === 'export_laporan' && currentUser.role === 'admin' && (
            <ExportLaporanView
              transactions={transactions}
              kasbons={kasbons}
              pengeluaranList={pengeluaranList}
              mutasis={mutasis}
              loginLogs={loginLogs}
              platforms={platforms}
            />
          )}

          {activeTab === 'dashboard' && currentUser.role === 'admin' && (
            <DashboardView
              transactions={transactions}
              kasbons={kasbons}
              pengeluaranList={pengeluaranList}
              mutasis={mutasis}
              platforms={platforms}
              saldoAwalMap={saldoAwalMap}
              onNavigateToExport={() => setActiveTab('export_laporan')}
              onOpenCetakStruk={() => setIsCetakStrukOpen(true)}
            />
          )}

          {activeTab === 'transaksi' && (
            <TransaksiView
              transactions={transactions}
              setTransactions={updateTransactions}
              onOpenCetakStruk={() => setIsCetakStrukOpen(true)}
              platforms={platforms}
              jenisList={jenisList}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'laporan' && currentUser.role === 'admin' && (
            <LaporanView
              transactions={transactions}
              kasbons={kasbons}
              pengeluaranList={pengeluaranList}
              mutasis={mutasis}
              platforms={platforms}
              saldoAwalMap={saldoAwalMap}
              onNavigateToExport={() => setActiveTab('export_laporan')}
            />
          )}

          {activeTab === 'kasbon' && currentUser.role === 'admin' && (
            <KasbonView
              kasbons={kasbons}
              setKasbons={updateKasbons}
              onNavigateToExport={() => setActiveTab('export_laporan')}
            />
          )}

          {activeTab === 'pengeluaran' && (
            <PengeluaranView
              pengeluaranList={pengeluaranList}
              setPengeluaranList={updatePengeluaran}
              onNavigateToExport={() => setActiveTab('export_laporan')}
              platforms={platforms}
            />
          )}

          {activeTab === 'saldo' && (
            <SaldoView
              mutasis={mutasis}
              setMutasis={updateMutasis}
              platforms={platforms}
              saldoAwalMap={saldoAwalMap}
              setSaldoAwalMap={updateSaldoAwalMap}
              onNavigateToExport={() => setActiveTab('export_laporan')}
              currentUser={currentUser}
              transactions={transactions}
              pengeluaranList={pengeluaranList}
            />
          )}

          {activeTab === 'platform_jenis' && currentUser.role === 'admin' && (
            <PlatformJenisView
              platforms={platforms}
              setPlatforms={updatePlatforms}
              jenisList={jenisList}
              setJenisList={updateJenisList}
              transactions={transactions}
            />
          )}

          {activeTab === 'akun' && (
            <AkunView
              currentUser={currentUser}
              userAccounts={userAccounts}
              loginLogs={loginLogs}
              onSwitchAccount={handleSwitchAccount}
              onUpdateUserAccount={handleUpdateUserAccount}
              onAddUserAccount={handleAddUserAccount}
              onDeleteUserAccount={handleDeleteUserAccount}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'pengaturan' && (
            <SettingsView activeTab={activeTab} />
          )}
        </main>
      </div>

      {/* Receipt Printing Modal */}
      <CetakStrukModal
        isOpen={isCetakStrukOpen}
        onClose={() => setIsCetakStrukOpen(false)}
        transactions={transactions}
      />

      {/* Smartphone Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setMobileOpen(true)}
        onOpenCetakStruk={() => setIsCetakStrukOpen(true)}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
