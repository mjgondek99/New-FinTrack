import React, { useState } from 'react';
import { NavTab, UserAccount } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onToggleMobileMenu: () => void;
  currentUser?: UserAccount;
  userAccounts?: UserAccount[];
  onSwitchAccount?: (account: UserAccount) => void;
  onNavigateToAkun?: () => void;
  onLogout?: () => void;
}

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Dashboard Utama',
  transaksi: 'Daftar Transaksi Agen',
  laporan: 'Laporan Keuangan',
  kasbon: 'Manajemen Kasbon Pelanggan',
  pengeluaran: 'Catatan Pengeluaran',
  saldo: 'Info & Mutasi Saldo',
  platform_jenis: 'Kelola Platform & Jenis Transaksi',
  export_laporan: 'Export Data Laporan',
  akun: 'Profil & Akun Agen',
  pengaturan: 'Pengaturan Sistem'
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleMobileMenu,
  currentUser,
  userAccounts = [],
  onSwitchAccount,
  onNavigateToAkun,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Switch account with password verification state
  const [targetSwitchAccount, setTargetSwitchAccount] = useState<UserAccount | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleInitiateSwitch = (acc: UserAccount) => {
    if (currentUser && acc.id === currentUser.id) return;
    setTargetSwitchAccount(acc);
    setSwitchPassword('');
    setSwitchError(null);
    setShowSwitchPassword(false);
    setShowProfile(false);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSwitchAccount) return;

    const expectedPass = targetSwitchAccount.password || '123';
    if (switchPassword === expectedPass) {
      if (onSwitchAccount) onSwitchAccount(targetSwitchAccount);
      setTargetSwitchAccount(null);
      setSwitchPassword('');
      setSwitchError(null);
    } else {
      setSwitchError(`Password yang Anda masukkan salah untuk akun @${targetSwitchAccount.username}!`);
    }
  };

  const profileImg = currentUser?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDF9U4CSCjhOmmHyRpV9fMEoHdq7v_PLRO2pfrC-LsrdAZFiD2XaUCCsq5yxLY8CA6VOXTFHVukJKAvhFXaJ3M8UEOwB7it6tJ5ONKSQBMOFSeSs473lpc5bLS7oZZhkRcDEne5XMObGJpccu5jKdHLjkTj-5C9vWEBvC9pXU25wXemoNICJSumtgVh070E-VvEy80BJP5-pUt-mwFc8RLCE8eviNEirOnAanA_RrWm9_U37Gz7Jfkw";

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-[#f8f9ff] border-b border-[#c6c6cd] z-40 flex justify-between items-center px-4 md:px-8 w-full shadow-xs">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-[#45464d] hover:bg-[#eff4ff] rounded-full transition-colors"
          title="Buka Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="md:hidden">
          <h1 className="text-lg font-bold text-black">FinTrack</h1>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-black">{TAB_TITLES[activeTab]}</h2>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4 relative">
        <div className="flex gap-1 text-[#45464d]">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowHelp(false);
                setShowProfile(false);
              }}
              className="p-2 hover:bg-[#eff4ff] rounded-full transition-colors opacity-90 relative"
              title="Notifikasi"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#c6c6cd] p-4 z-50 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                  <span className="font-bold text-sm text-black">Notifikasi System</span>
                  <span className="text-[#006c49] font-medium cursor-pointer hover:underline">Tandai dibaca</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-[#eff4ff] rounded-lg">
                    <p className="font-semibold text-black">Export Berhasil</p>
                    <p className="text-[#45464d]">Laporan transaksi periode 01-11 Aug telah diunduh.</p>
                    <span className="text-[10px] text-gray-400">10 menit yang lalu</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-black">Setoran BriLink Diterima</p>
                    <p className="text-[#45464d]">Saldo bertambah Rp 1.505.000 dari Budi Santoso.</p>
                    <span className="text-[10px] text-gray-400">1 jam yang lalu</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Center */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHelp(!showHelp);
                setShowNotifications(false);
                setShowProfile(false);
              }}
              className="p-2 hover:bg-[#eff4ff] rounded-full transition-colors opacity-90"
              title="Bantuan"
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </button>

            {showHelp && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#c6c6cd] p-4 z-50 text-xs">
                <h4 className="font-bold text-sm text-black mb-2">Pusat Bantuan Agen</h4>
                <p className="text-[#45464d] mb-3">Butuh bantuan seputar ekspor data atau cetak struk EDC?</p>
                <div className="space-y-1.5">
                  <a href="#help-faq" className="block p-2 bg-[#eff4ff] hover:bg-[#d3e4fe] rounded text-[#006c49] font-medium">
                    📄 Panduan Format CSV / Excel / PDF
                  </a>
                  <a href="#help-cs" className="block p-2 bg-[#eff4ff] hover:bg-[#d3e4fe] rounded text-[#006c49] font-medium">
                    📞 CS Telegram / WhatsApp Makmur Jaya Brilink
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
              setShowHelp(false);
            }}
            className="h-9 w-9 rounded-full bg-[#d3e4fe] overflow-hidden border border-[#c6c6cd] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#006c49] transition-transform active:scale-95"
            title="Profil Agen"
          >
            <img
              src={profileImg}
              alt="Agent Profile Picture"
              className="w-full h-full object-cover"
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#c6c6cd] p-4 z-50">
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                <img
                  src={profileImg}
                  alt="Agent"
                  className="w-10 h-10 rounded-full object-cover border border-[#006c49]"
                />
                <div>
                  <h4 className="font-bold text-sm text-black">{currentUser?.nama || 'Makmur Jaya Brilink'}</h4>
                  <p className="text-xs text-[#45464d]">@{currentUser?.username || 'admin'}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      currentUser?.role === 'admin'
                        ? 'bg-emerald-100 text-[#00714d]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Role: {currentUser?.role || 'Admin'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#45464d]">
                {onNavigateToAkun && (
                  <button
                    onClick={() => {
                      onNavigateToAkun();
                      setShowProfile(false);
                    }}
                    className="w-full text-left py-1.5 px-2 hover:bg-[#eff4ff] rounded transition-colors flex items-center gap-2 font-medium text-black"
                  >
                    <span className="material-symbols-outlined text-sm text-[#006c49]">person</span>
                    Kelola Profil & Password
                  </button>
                )}

                {userAccounts.length > 1 && (
                  <div className="pt-2 border-t border-gray-100 my-1 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2">
                      Ganti Akun Pengguna:
                    </span>
                    {userAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => handleInitiateSwitch(acc)}
                        className={`w-full text-left py-1.5 px-2 rounded transition-colors flex items-center justify-between text-xs ${
                          currentUser?.id === acc.id
                            ? 'bg-[#006c49]/10 text-[#006c49] font-bold'
                            : 'hover:bg-[#eff4ff] text-[#45464d]'
                        }`}
                      >
                        <span className="truncate">{acc.nama}</span>
                        <span className="text-[10px] font-mono-jetbrains uppercase px-1.5 py-0.5 bg-gray-100 rounded">
                          {acc.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 my-1 pt-1"></div>
                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      const otherAcc = userAccounts.find((u) => u.id !== currentUser?.id) || userAccounts[0];
                      if (otherAcc && onSwitchAccount) onSwitchAccount(otherAcc);
                    }
                    setShowProfile(false);
                  }}
                  className="w-full text-left py-1.5 px-2 text-[#ba1a1a] hover:bg-red-50 rounded transition-colors flex items-center gap-2 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Keluar / Logout Aplikasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Switch Account Password Verification Modal */}
      {targetSwitchAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49] text-2xl">lock_person</span>
                <h3 className="font-bold text-lg text-black">Konfirmasi Password Pindah Akun</h3>
              </div>
              <button onClick={() => setTargetSwitchAccount(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
              <img
                src={targetSwitchAccount.avatarUrl || profileImg}
                alt={targetSwitchAccount.nama}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#006c49] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-black truncate">{targetSwitchAccount.nama}</h4>
                <p className="text-xs text-gray-600">@{targetSwitchAccount.username}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#006c49] text-white rounded text-[10px] font-bold uppercase">
                  Role: {targetSwitchAccount.role}
                </span>
              </div>
            </div>

            {switchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{switchError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSwitch} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                  Masukkan Password Akun @{targetSwitchAccount.username}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    key
                  </span>
                  <input
                    type={showSwitchPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Masukkan password akun ini"
                    value={switchPassword}
                    onChange={(e) => {
                      setSwitchPassword(e.target.value);
                      setSwitchError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-[#c6c6cd] rounded-xl text-sm font-medium text-black focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showSwitchPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetSwitchAccount(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold hover:bg-[#006c49]/90 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Verifikasi & Pindah Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
