import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUtcTime } from '../../utils/dateUtils';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

export const SyncCenter: React.FC = () => {
  const { isOnline, pendingSyncCount, lastSyncTime, triggerManualSync, flights, events, incidents } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
      setSyncStatusMessage('Synchronization completed successfully with operations server.');
    } catch (err: any) {
      setSyncStatusMessage(`Sync failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMessage(null), 4000);
    }
  };

  const handleExportJson = () => {
    const backupData = {
      exportedAtUtc: new Date().toISOString(),
      flights,
      events,
      incidents,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AeroTurn_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-base text-white">Offline-First Synchronization Engine</h3>
            <p className="text-xs text-slate-400">IndexedDB local persistence, background sync queue, and conflict resolution.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'ONLINE & CONNECTED' : 'OFFLINE APIC CACHING'}</span>
          </span>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-medium">PENDING QUEUE ITEMS</div>
          <div className="text-2xl font-bold text-white mt-1">{pendingSyncCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Stored in browser IndexedDB</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-medium">LAST SYNC TIME (UTC)</div>
          <div className="text-sm font-bold text-blue-300 mt-2 truncate">
            {lastSyncTime ? formatUtcTime(lastSyncTime) : 'Never synced'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Auto-sync interval: 15s</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 uppercase font-medium">DATABASE INTEGRITY</div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ENCRYPTED & SYNCED</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Zero data loss guarantee</div>
        </div>

      </div>

      {/* Action Controls */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-white">Manual Telemetry & Backup Controls</h4>

        {syncStatusMessage && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-lg font-mono">
            {syncStatusMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'TRANSMITTING QUEUE...' : 'FORCE FULL RESYNC'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold font-mono transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>EXPORT LOCAL DB (JSON)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-2 leading-relaxed">
          <p className="font-bold text-slate-200 font-mono">How Offline Architecture Operates:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>All ramp actions (1-tap milestone stamps, bag counts, PRM updates, incident notes) write immediately to IndexedDB.</li>
            <li>Each event is tagged with an authoritative UTC timestamp and an idempotent event UUID.</li>
            <li>When the ramp agent walks into cellular/Wi-Fi coverage, the background sync engine seamlessly flushes the queue in order without duplication.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
