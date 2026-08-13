import React from 'react';
import { NavTab, UserRole } from '../types';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
  onOpenCetakStruk: () => void;
  currentUserRole?: UserRole;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenCetakStruk,
  currentUserRole = 'admin',
}) => {
  const adminNavs: { id: NavTab | 'cetak' | 'menu'; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
    { id: 'kasbon', label: 'Kasbon', icon: 'account_balance_wallet' },
    { id: 'saldo', label: 'Saldo', icon: 'account_balance' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
  ];

  const kasirNavs: { id: NavTab | 'cetak' | 'menu'; label: string; icon: string }[] = [
    { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: 'payments' },
    { id: 'saldo', label: 'Saldo', icon: 'account_balance' },
    { id: 'akun', label: 'Akun', icon: 'person' },
    { id: 'menu', label: 'Menu', icon: 'menu' },
  ];

  const navs = currentUserRole === 'kasir' ? kasirNavs : adminNavs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#131b2e] border-t border-[#76777d]/30 shadow-2xl px-2 py-1.5 flex justify-around items-center text-white backdrop-blur-md">
      {navs.map((nav) => {
        const isActive = activeTab === nav.id;

        if (nav.id === 'menu') {
          return (
            <button
              key={nav.id}
              onClick={onOpenMobileMenu}
              className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[#7c839b] hover:text-white transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[22px]">{nav.icon}</span>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{nav.label}</span>
            </button>
          );
        }

        if (nav.id === 'cetak') {
          return (
            <button
              key={nav.id}
              onClick={onOpenCetakStruk}
              className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[#d3e4fe] hover:text-white transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[22px]">{nav.icon}</span>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{nav.label}</span>
            </button>
          );
        }

        return (
          <button
            key={nav.id}
            onClick={() => setActiveTab(nav.id as NavTab)}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all active:scale-90 ${
              isActive
                ? 'text-[#000000] font-bold'
                : 'text-[#7c839b] hover:text-white'
            }`}
          >
            <div
              className={`p-1.5 rounded-full transition-colors ${
                isActive ? 'bg-[#006c49] text-white' : 'bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{nav.icon}</span>
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isActive ? 'text-emerald-400 font-bold' : 'text-[#7c839b]'
              }`}
            >
              {nav.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
