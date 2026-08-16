import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUtcTime } from '../../utils/dateUtils';
import { Wifi, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isOnline, lastSyncTime, pendingCount, deviceId } = useApp();
  const [currentUtc, setCurrentUtc] = useState(formatUtcTime(new Date().toISOString()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtc(formatUtcTime(new Date().toISOString()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 select-none z-30 font-mono text-[10px]">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-bold text-slate-400 uppercase tracking-wide">
            {isOnline ? 'Network Stable' : 'Offline Buffer Mode'}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800 hidden sm:block" />

        <div className="text-slate-400 hidden sm:block">
          Last sync: <span className="text-slate-300 font-semibold">{lastSyncTime ? formatUtcTime(lastSyncTime) : currentUtc}</span>
          {pendingCount > 0 && (
            <span className="ml-1.5 text-amber-400 font-bold">({pendingCount} queued)</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 text-slate-400">
        <span className="hidden md:inline">ID: {deviceId}</span>
        <span className="text-slate-400 font-bold tracking-wider">v2.4.1-STABLE // SYSTEM READY</span>
      </div>
    </footer>
  );
};
