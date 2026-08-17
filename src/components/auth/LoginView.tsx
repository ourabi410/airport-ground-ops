import React, { useState, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Plane,
  Shield,
  Lock,
  User as UserIcon,
  Key,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Globe,
  HardHat,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { t, language, setLanguage, isRtl } = useLanguage();
  const { users, login } = useApp();

  const [selectedUser, setSelectedUser] = useState<User | null>(() => users[0] || null);
  const [identifier, setIdentifier] = useState(users[0]?.badgeId || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIdentifier(user.badgeId);
    setPassword('');
    setErrorMessage(null);
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const handleFillDemoPassword = () => {
    setPassword('admin123');
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please select or enter your Badge ID / Email.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Password is required. (Default password: admin123)');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(identifier, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-600 selection:text-white relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Ambient Glow & Aviation Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">SOLTANE</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase">
                AeroOps
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">
              Airport Ground Turnaround Control
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            aria-label="Language selection"
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="en">English (EN)</option>
            <option value="fr">Français (FR)</option>
            <option value="ar">العربية (AR)</option>
          </select>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Form: Select User & Enter Password */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected Ground Ops Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Staff Authentication
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Select your user account and enter your password to access the dispatch console.
              </p>
            </div>

            {/* Currently Selected User Card */}
            {selectedUser && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-sky-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-sky-500/50"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                        {selectedUser.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Badge: <span className="text-sky-400 font-bold">{selectedUser.badgeId}</span> &bull; {selectedUser.department}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  Ready
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Badge ID / Staff Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      const matched = users.find(u =>
                        u.badgeId.toLowerCase() === e.target.value.toLowerCase() ||
                        u.email.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (matched) setSelectedUser(matched);
                    }}
                    placeholder="Enter Badge ID or Email"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemoPassword}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <span>Use default:</span>
                    <span className="font-mono bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-200 border border-sky-500/30">
                      admin123
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (admin123)"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 rtl:pl-10 rtl:pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3.5 rtl:pr-0 rtl:pl-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Password & Enter Dispatch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Password-Protected RBAC</span>
              </span>
              <span className="font-mono text-[11px]">Default Password: admin123</span>
            </div>
          </div>

          {/* Right: Select Staff Profile */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Staff User</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">Requires Password</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click any staff member to select their profile, then enter password <span className="text-sky-300 font-mono font-bold">admin123</span>:
              </p>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const roleBadgeColors: Record<UserRole, string> = {
                    'Administrator': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                    'Sorting Agent': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                    'Subplane Agent': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                    'Ramp/Loading Agent': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                    'Auditor': 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  };

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all group text-left rtl:text-right cursor-pointer ${
                        isSelected
                          ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className={`w-8 h-8 rounded-full object-cover ring-1 ${
                            isSelected ? 'ring-sky-400' : 'ring-slate-700'
                          }`}
                        />
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                            {u.name}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{u.badgeId}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeColors[u.role]}`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terminal Info Badge */}
            <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/30 text-sky-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Station: Carthage Airport (TUN / DTTA)</span>
              </div>
              <p className="text-[11px] text-sky-200/70">
                All staff accounts are secured with password authentication (<code className="bg-sky-900/60 px-1 rounded text-white">admin123</code>).
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-3 text-center text-xs text-slate-600 border-t border-slate-900 bg-slate-950/90">
        Soltane Aviation Services &copy; {new Date().getFullYear()} &bull; Ground Turnaround Operations & Flight Safety System
      </footer>
    </div>
  );
};
