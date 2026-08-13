import { useState, useEffect, useRef } from 'react';
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

  const isInitialLoaded = useRef(false);

  // Sync helper
  const syncToServer = (key: string, value: any) => {
    if (!isInitialLoaded.current) return;
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
  };

  // Fetch initial data from SQLite server API if available
  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 'ok' && res.data) {
          if (res.data.users && Array.isArray(res.data.users) && res.data.users.length > 0) {
            setUserAccounts(res.data.users);
          }
          if (res.data.transactions && Array.isArray(res.data.transactions)) setTransactions(res.data.transactions);
          if (res.data.kasbons && Array.isArray(res.data.kasbons)) setKasbons(res.data.kasbons);
          if (res.data.pengeluaran && Array.isArray(res.data.pengeluaran)) setPengeluaranList(res.data.pengeluaran);
          if (res.data.mutasis && Array.isArray(res.data.mutasis)) setMutasis(res.data.mutasis);
          if (res.data.platforms && Array.isArray(res.data.platforms)) setPlatforms(res.data.platforms);
          if (res.data.jenis && Array.isArray(res.data.jenis)) setJenisList(res.data.jenis);
          if (res.data.saldoAwalMap && typeof res.data.saldoAwalMap === 'object') setSaldoAwalMap(res.data.saldoAwalMap);
        }
      })
      .catch(() => {
        // Static or offline mode
      })
      .finally(() => {
        isInitialLoaded.current = true;
      });
  }, []);

  // Save to localStorage and SQLite server effects
  useEffect(() => {
    localStorage.setItem('fintrack_users', JSON.stringify(userAccounts));
    syncToServer('users', userAccounts);
  }, [userAccounts]);

  useEffect(() => {
    localStorage.setItem('fintrack_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fintrack_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
    syncToServer('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fintrack_kasbons', JSON.stringify(kasbons));
    syncToServer('kasbons', kasbons);
  }, [kasbons]);

  useEffect(() => {
    localStorage.setItem('fintrack_pengeluaran', JSON.stringify(pengeluaranList));
    syncToServer('pengeluaran', pengeluaranList);
  }, [pengeluaranList]);

  useEffect(() => {
    localStorage.setItem('fintrack_mutasis', JSON.stringify(mutasis));
    syncToServer('mutasis', mutasis);
  }, [mutasis]);

  useEffect(() => {
    localStorage.setItem('fintrack_platforms', JSON.stringify(platforms));
    syncToServer('platforms', platforms);
  }, [platforms]);

  useEffect(() => {
    localStorage.setItem('fintrack_jenis', JSON.stringify(jenisList));
    syncToServer('jenis', jenisList);
  }, [jenisList]);

  useEffect(() => {
    localStorage.setItem('fintrack_saldo_awal', JSON.stringify(saldoAwalMap));
    syncToServer('saldoAwalMap', saldoAwalMap);
  }, [saldoAwalMap]);

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
    setUserAccounts(userAccounts.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleAddUserAccount = (newAcc: UserAccount) => {
    setUserAccounts([...userAccounts, newAcc]);
  };

  const handleDeleteUserAccount = (accId: string) => {
    setUserAccounts(userAccounts.filter((u) => u.id !== accId));
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
              onNavigateToExport={() => setActiveTab('export_laporan')}
              onOpenCetakStruk={() => setIsCetakStrukOpen(true)}
            />
          )}

          {activeTab === 'transaksi' && (
            <TransaksiView
              transactions={transactions}
              setTransactions={setTransactions}
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
              onNavigateToExport={() => setActiveTab('export_laporan')}
            />
          )}

          {activeTab === 'kasbon' && currentUser.role === 'admin' && (
            <KasbonView
              kasbons={kasbons}
              setKasbons={setKasbons}
              onNavigateToExport={() => setActiveTab('export_laporan')}
            />
          )}

          {activeTab === 'pengeluaran' && (
            <PengeluaranView
              pengeluaranList={pengeluaranList}
              setPengeluaranList={setPengeluaranList}
              onNavigateToExport={() => setActiveTab('export_laporan')}
              platforms={platforms}
            />
          )}

          {activeTab === 'saldo' && (
            <SaldoView
              mutasis={mutasis}
              setMutasis={setMutasis}
              platforms={platforms}
              saldoAwalMap={saldoAwalMap}
              setSaldoAwalMap={setSaldoAwalMap}
              onNavigateToExport={() => setActiveTab('export_laporan')}
              currentUser={currentUser}
              transactions={transactions}
              pengeluaranList={pengeluaranList}
            />
          )}

          {activeTab === 'platform_jenis' && currentUser.role === 'admin' && (
            <PlatformJenisView
              platforms={platforms}
              setPlatforms={setPlatforms}
              jenisList={jenisList}
              setJenisList={setJenisList}
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
