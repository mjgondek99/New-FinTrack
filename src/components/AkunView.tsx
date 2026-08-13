import React, { useState } from 'react';
import { UserAccount, LoginLogItem } from '../types';

interface AkunViewProps {
  currentUser: UserAccount;
  userAccounts: UserAccount[];
  loginLogs: LoginLogItem[];
  onSwitchAccount: (account: UserAccount) => void;
  onUpdateUserAccount: (updatedAccount: UserAccount) => void;
  onAddUserAccount: (newAccount: UserAccount) => void;
  onDeleteUserAccount: (accountId: string) => void;
  onLogout?: () => void;
}

export const AkunView: React.FC<AkunViewProps> = ({
  currentUser,
  userAccounts,
  loginLogs,
  onSwitchAccount,
  onUpdateUserAccount,
  onAddUserAccount,
  onDeleteUserAccount,
  onLogout
}) => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Switch account with password verification state
  const [targetSwitchAccount, setTargetSwitchAccount] = useState<UserAccount | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Add new cashier state (Admin only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'kasir'>('kasir');
  const [newPass, setNewPass] = useState('123456');

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDF9U4CSCjhOmmHyRpV9fMEoHdq7v_PLRO2pfrC-LsrdAZFiD2XaUCCsq5yxLY8CA6VOXTFHVukJKAvhFXaJ3M8UEOwB7it6tJ5ONKSQBMOFSeSs473lpc5bLS7oZZhkRcDEne5XMObGJpccu5jKdHLjkTj-5C9vWEBvC9pXU25wXemoNICJSumtgVh070E-VvEy80BJP5-pUt-mwFc8RLCE8eviNEirOnAanA_RrWm9_U37Gz7Jfkw';

  const handleInitiateSwitch = (acc: UserAccount) => {
    if (acc.id === currentUser.id) return;
    setTargetSwitchAccount(acc);
    setSwitchPassword('');
    setSwitchError(null);
    setShowSwitchPassword(false);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSwitchAccount) return;

    const expectedPass = targetSwitchAccount.password || '123';
    if (switchPassword === expectedPass) {
      onSwitchAccount(targetSwitchAccount);
      setTargetSwitchAccount(null);
      setSwitchPassword('');
      setSwitchError(null);
    } else {
      setSwitchError(`Password yang Anda masukkan salah untuk akun @${targetSwitchAccount.username}!`);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 4) {
      setPasswordError('Password baru minimal 4 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok');
      return;
    }

    onUpdateUserAccount({
      ...currentUser,
      password: newPassword
    });

    setPasswordSuccess('Password berhasil diperbarui!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => setPasswordSuccess(null), 3000);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newNama.trim()) return;

    if (userAccounts.some((u) => u.username.toLowerCase() === newUsername.toLowerCase())) {
      alert('Username sudah digunakan');
      return;
    }

    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim(),
      nama: newNama.trim(),
      role: newRole,
      password: newPass || '123456',
      avatarUrl: defaultAvatar
    };

    onAddUserAccount(created);
    setShowAddModal(false);
    setNewUsername('');
    setNewNama('');
    setNewPass('123456');
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentUser.role === 'admin'
                  ? 'bg-emerald-100 text-[#00714d]'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Role: {currentUser.role === 'admin' ? 'Administrator (Full Access)' : 'Kasir (Akses Terbatas)'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black">Profil & Keamanan Akun</h2>
          <p className="text-sm text-[#45464d] mt-0.5">
            {currentUser.role === 'admin'
              ? 'Kelola profil Anda, tambah pengguna kasir baru, ganti password, atau switch role.'
              : 'Profil pengguna kasir. Anda dapat mengganti password dan keluar / ganti akun.'}
          </p>
        </div>

        {/* Quick Switch Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold hidden sm:inline">Pindah Akun:</span>
          {userAccounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => handleInitiateSwitch(acc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                currentUser.id === acc.id
                  ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs'
                  : 'bg-[#f8f9ff] text-[#0b1c30] border-[#c6c6cd] hover:bg-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {acc.role === 'admin' ? 'admin_panel_settings' : 'badge'}
              </span>
              {acc.nama} ({acc.role})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
          <div className="text-center space-y-3">
            <img
              src={currentUser.avatarUrl || defaultAvatar}
              alt={currentUser.nama}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#006c49] shadow-md"
            />
            <div>
              <h3 className="font-bold text-lg text-black">{currentUser.nama}</h3>
              <p className="text-xs text-[#45464d]">@{currentUser.username}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-[#00714d]'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentUser.role === 'admin' ? '🛡️ Administrator' : '💼 Kasir Shift'}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">ID Pengguna</span>
              <span className="font-bold font-mono-jetbrains text-black">{currentUser.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Username Login</span>
              <span className="font-bold text-black">{currentUser.username}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Hak Akses</span>
              <span className="font-bold text-[#006c49]">
                {currentUser.role === 'admin' ? 'Semua Menu' : 'Transaksi, Saldo, Pengeluaran, Pengaturan'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                onSwitchAccount(userAccounts.find((u) => u.id !== currentUser.id) || userAccounts[0]);
              }
            }}
            className="w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Keluar / Logout Aplikasi
          </button>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-lg text-black">Ganti Password / PIN Akun</h3>
            <p className="text-xs text-[#45464d]">
              Perbarui kata sandi keamanan untuk login akun {currentUser.nama}
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#00714d] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
              />
            </div>

            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#006c49] text-white rounded-xl font-bold text-xs hover:bg-[#006c49]/90 transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                Simpan Password Baru
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Manage Users (Admin only) or Login History (for Kasir) */}
        {currentUser.role === 'admin' ? (
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-black">Kelola Akun Kasir & Admin</h3>
                <p className="text-xs text-[#45464d]">Daftar akun pengguna agen yang terdaftar</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-[#006c49] text-white rounded-xl text-xs font-bold hover:bg-[#006c49]/90 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Tambah
              </button>
            </div>

            <div className="space-y-3">
              {userAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 bg-[#f8f9ff] border border-[#c6c6cd]/60 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        acc.role === 'admin' ? 'bg-[#006c49] text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {acc.nama.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-black text-xs block">{acc.nama}</span>
                      <span className="text-[10px] text-[#45464d]">
                        @{acc.username} | Role: <strong className="uppercase">{acc.role}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {acc.id !== currentUser.id && userAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteUserAccount(acc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus Akun"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-black">Akses & Hak Istimewa Kasir</h3>
              <p className="text-xs text-[#45464d]">Ringkasan batasan fitur akun Anda</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[18px]">check_circle</span>
                <div>
                  <span className="font-bold text-emerald-900 block">Dapat Membuat & Edit Transaksi</span>
                  <span className="text-emerald-800">Mencatat transaksi pelanggan, melakukan edit rincian transaksi.</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[18px]">block</span>
                <div>
                  <span className="font-bold text-amber-900 block">Tidak Dapat Menghapus Histori</span>
                  <span className="text-amber-800">Tombol hapus histori transaksi dan saldo dinonaktifkan untuk role Kasir.</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-gray-700 text-[18px]">lock</span>
                <div>
                  <span className="font-bold text-gray-900 block">Menu Laporan & Kasbon Dikunci</span>
                  <span className="text-gray-700">Laporan Keuangan dan Rekap Kasbon hanya dapat diakses oleh Admin.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-black">Tambah Pengguna Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Rina (Kasir Shift 2)"
                  className="w-full p-2 border border-[#c6c6cd] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: kasir2"
                  className="w-full p-2 border border-[#c6c6cd] rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Role Akun</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 border border-[#c6c6cd] rounded-lg text-sm bg-white"
                >
                  <option value="kasir">Kasir (Akses Terbatas)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Password Awal</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full p-2 border border-[#c6c6cd] rounded-lg text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-xl text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Account Password Verification Modal */}
      {targetSwitchAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
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
                src={targetSwitchAccount.avatarUrl || defaultAvatar}
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
    </div>
  );
};
