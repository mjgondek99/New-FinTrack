import React from 'react';
import { NavTab, UserRole } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCetakStruk: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentUserRole?: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCetakStruk,
  mobileOpen,
  setMobileOpen,
  currentUserRole = 'admin',
  onLogout
}) => {
  const allMenuItems: { id: NavTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
    { id: 'laporan', label: 'Laporan Keuangan', icon: 'analytics' },
    { id: 'kasbon', label: 'Kasbon', icon: 'account_balance_wallet' },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: 'payments' },
    { id: 'saldo', label: 'Saldo', icon: 'account_balance' },
    { id: 'platform_jenis', label: 'Platform & Jenis', icon: 'category' },
    { id: 'export_laporan', label: 'Export Data', icon: 'ios_share' },
    { id: 'akun', label: 'Akun', icon: 'person' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
  ];

  const allowedKasirTabs: NavTab[] = ['transaksi', 'pengeluaran', 'saldo', 'pengaturan', 'akun'];

  const menuItems = currentUserRole === 'kasir'
    ? allMenuItems.filter((item) => allowedKasirTabs.includes(item.id))
    : allMenuItems;

  const sidebarContent = (
    <div className="h-full flex flex-col p-4 gap-2 text-[#ffffff]">
      {/* Brand Header */}
      <div className="mb-6 px-2 pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white truncate" title="FinTrack">
            FinTrack
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              currentUserRole === 'admin'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {currentUserRole}
          </span>
        </div>
        <p className="text-xs font-medium text-[#7c839b] mt-1">Makmur Jaya Brilink</p>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          if (item.id === 'export_laporan') {
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#006c49] text-white shadow-sm scale-[0.99]'
                    : 'bg-[#006c49]/80 text-white hover:bg-[#006c49]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#d3e4fe]/15 text-white font-semibold'
                  : 'text-[#7c839b] hover:bg-[#d3e4fe]/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Print & Logout Action */}
      <div className="mt-auto pt-4 border-t border-[#76777d]/30 space-y-2">
        <button
          onClick={() => {
            onOpenCetakStruk();
            setMobileOpen(false);
          }}
          className="w-full bg-[#006c49] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          <span>Cetak Struk</span>
        </button>

        {onLogout && (
          <button
            onClick={() => {
              onLogout();
              setMobileOpen(false);
            }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar Aplikasi</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#131b2e] border-r border-[#c6c6cd]/20 shadow-lg z-50 hidden md:block">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-[#131b2e] shadow-2xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
