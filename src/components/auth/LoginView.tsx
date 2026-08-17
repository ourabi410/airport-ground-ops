import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Plane,
  Shield,
  Lock,
  User,
  Key,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Globe,
  HardHat,
  Cpu
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { t, language, setLanguage, isRtl } = useLanguage();
  const { users, login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Badge ID or Email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(identifier, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (userBadge: string) => {
    setIdentifier(userBadge);
    setPassword('••••••••');
    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(userBadge);
    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.message || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-600 selection:text-white relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Ambient Glow & Grid Lines */}
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

      {/* Center Auth Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Main Login Form */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                <span>Authorized Ground Staff Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sign in to AeroTurn
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Enter your Airline Badge ID or Staff Email to access the operational dispatch system.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
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
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. SAS-A-1001 or s.soltane@soltane-aviation.com"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    PIN / Password
                  </label>
                  <span className="text-[11px] text-slate-500">Default: any PIN / password</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Enter Dispatch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted RBAC Security</span>
              </span>
              <span>ICAO / IATA Ground Standard</span>
            </div>
          </div>

          {/* Right / 1-Click Fast Profile Switcher */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Test Logins</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Access</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Select any field role below to test their live permissions & dashboard:
              </p>

              <div className="space-y-2">
                {users.slice(0, 5).map((u) => {
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
                      onClick={() => handleQuickLogin(u.badgeId)}
                      className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/40 flex items-center justify-between transition-all group text-left rtl:text-right cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-sky-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                            <span>{u.name}</span>
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
                Connected to Laravel 12 Ground Operations Engine with dynamic database synchronization.
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
