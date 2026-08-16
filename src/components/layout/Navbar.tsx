import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUtcTime, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  Plane,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Clock,
  AlertTriangle,
  Zap,
  PlusCircle,
  UserCheck,
  Shield,
  Smartphone,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    isOnline,
    isSimulatedOffline,
    setSimulatedOffline,
    syncStatus,
    pendingCount,
    lastSyncTime,
    clockDifferenceMin,
    triggerManualSync,
    setActiveTab,
    activeTab,
    setQuickEventModalOpen,
    setReportIncidentModalOpen,
  } = useApp();

  const [currentTimeIso, setCurrentTimeIso] = useState<string>(new Date().toISOString());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeIso(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-800 border-b border-slate-700 text-white sticky top-0 z-40 select-none shadow-md h-16 shrink-0">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-16">
        
        {/* Left: Brand & Airport Identifier */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            id="brand-logo"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold italic shadow-md shadow-blue-600/30 text-white">
              AV
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">AERO OPS</span>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">TURNAROUND HUB</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-600 mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Airport</span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 font-mono">DOH | Hamad International</span>
          </div>
        </div>

        {/* Center/Right: Current UTC, Sync Status & User Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          
          {/* Current UTC Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Current UTC</span>
            <span className="text-base sm:text-lg font-mono font-bold leading-none text-white">
              {formatUtcTime(currentTimeIso)}
            </span>
          </div>

          {/* Sync & Connectivity Status Pill */}
          <div
            id="sync-status-indicator"
            onClick={triggerManualSync}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
              !isOnline
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : syncStatus === 'SYNCING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                : pendingCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title="Click to trigger manual server sync"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                !isOnline
                  ? 'bg-red-500'
                  : syncStatus === 'SYNCING' || pendingCount > 0
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-bold font-mono">
              {!isOnline
                ? 'OFFLINE'
                : syncStatus === 'SYNCING'
                ? 'SYNCING...'
                : pendingCount > 0
                ? `QUEUED (${pendingCount})`
                : 'ONLINE · SYNCED'}
            </span>
          </div>

          {/* Offline Simulator Toggle */}
          <button
            id="toggle-offline-simulation"
            onClick={() => setSimulatedOffline(!isSimulatedOffline)}
            className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-colors ${
              isSimulatedOffline
                ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
            }`}
            title="Toggle offline simulator"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[11px]">{isSimulatedOffline ? 'SIM: ON' : 'SIM: OFF'}</span>
          </button>

          {/* User Guide Button (Arabic / English / French) */}
          <button
            id="btn-nav-user-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'guide' || activeTab === 'help' || activeTab === 'user-guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-200 border border-slate-600 hover:bg-slate-600'
            }`}
            title="User Guide & Manual (عربي / English / Français)"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">GUIDE / دليل</span>
          </button>

          {/* Ramp Mode Button */}
          <button
            id="btn-nav-ramp-mode"
            onClick={() => setActiveTab('ramp-mode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              activeTab === 'ramp-mode' || activeTab === 'ramp_mode'
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'bg-slate-700 text-amber-300 border border-amber-500/30 hover:bg-slate-600'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RAMP</span> AGENT
          </button>

          {/* User Profile Avatar with Switcher */}
          <div className="relative">
            <button
              id="user-profile-menu"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 hover:border-slate-500 transition-colors shadow-sm"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <span>{currentUser.avatar || currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
            </button>

            {userDropdownOpen && (
              <div
                id="user-dropdown-list"
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] text-slate-400 font-mono uppercase">SWITCH OPERATIONAL ROLE</p>
                  <p className="text-xs text-slate-200 font-semibold">{currentUser.department}</p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        currentUser.id === u.id ? 'bg-sky-950/70 text-sky-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.role.replace('_', ' ')} • {u.badgeNumber}</div>
                      </div>
                      {currentUser.id === u.id && <UserCheck className="w-4 h-4 text-sky-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
