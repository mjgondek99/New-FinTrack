import React, { useState } from 'react';
import { UserAccount } from '../types';

interface LoginViewProps {
  userAccounts: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onRefreshUsers?: (users: UserAccount[]) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ userAccounts, onLoginSuccess, onRefreshUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check local state first
    let currentList = userAccounts;
    let foundUser = currentList.find(
      (u) =>
        u.username.trim().toLowerCase() === cleanUsername &&
        (u.password.trim() === cleanPassword || u.password === password)
    );

    // 2. If not found, fetch live users from server
    if (!foundUser) {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        const json = await res.json();
        if (json.status === 'ok' && json.data && Array.isArray(json.data.users) && json.data.users.length > 0) {
          currentList = json.data.users;
          if (onRefreshUsers) {
            onRefreshUsers(currentList);
          }
          foundUser = currentList.find(
            (u) =>
              u.username.trim().toLowerCase() === cleanUsername &&
              (u.password.trim() === cleanPassword || u.password === password)
          );
        }
      } catch (err) {
        console.error('Error fetching live users during login:', err);
      }
    }

    setIsLoading(false);

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setErrorMessage('Username atau password yang Anda masukkan salah!');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0b1c30] via-[#131b2e] to-[#004d34] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-[#006c49] to-[#004d34] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-3xl text-emerald-300">point_of_sale</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">FinTrack Agent</h1>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            Sistem Keuangan Kasir & Agen BRILink / PPOB
          </p>
          <div className="inline-block mt-3 px-3 py-1 bg-black/20 rounded-full border border-white/10 text-[11px] font-semibold text-emerald-200">
            🏬 Toko: Makmur Jaya Brilink
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#0b1c30]">Selamat Datang</h2>
            <p className="text-xs text-[#45464d] mt-0.5">Silakan login untuk mengakses sistem keuangan toko</p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-lg shrink-0 text-red-600">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">Username / ID Pengguna</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  person
                </span>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Masukkan username (misal: admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-[#c6c6cd] rounded-xl text-sm font-medium text-black focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-[#c6c6cd] rounded-xl text-sm font-medium text-black focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#45464d] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#006c49] focus:ring-[#006c49]"
                />
                <span>Ingat akun di HP ini</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Silakan hubungi Admin Toko untuk melakukan reset password.')}
                className="text-[#006c49] font-bold hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#006c49] text-white font-bold rounded-xl text-sm hover:bg-[#006c49]/90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Memeriksa Akses...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Masuk ke Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Security badge footer */}
          <div className="pt-2 text-center text-[10px] text-gray-400 space-y-0.5">
            <p className="flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-600">verified_user</span>
              <span>Sistem Terenkripsi & Aman • FinTrack v2.5</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
