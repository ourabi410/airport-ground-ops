import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DelayRecord } from '../../types';
import { formatUtcTime, formatUtcShort } from '../../utils/dateUtils';
import {
  Timer,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Clock,
  HelpCircle,
} from 'lucide-react';

const IATA_DELAY_CODES = [
  { code: '81', category: 'Passenger & Baggage', desc: 'Late check-in / transit connecting passenger reconciliation' },
  { code: '12', category: 'Passenger & Baggage', desc: 'Baggage sorting / ULD transport congestion' },
  { code: '14', category: 'Passenger & Baggage', desc: 'Late security hold baggage screening / offload' },
  { code: '21', category: 'Airport & Gate', desc: 'Passenger boarding bridge (PBB) / VDGS malfunction' },
  { code: '31', category: 'Aircraft Services', desc: 'Aircraft cleaning delay / biohazard sanitization' },
  { code: '32', category: 'Aircraft Services', desc: 'Catering delivery / special meal loading delay' },
  { code: '33', category: 'Aircraft Services', desc: 'Refueling hydrant flow delay / fuel bowser late' },
  { code: '41', category: 'Technical & Aircraft', desc: 'Aircraft technical defect / MEL troubleshooting' },
  { code: '42', category: 'Technical & Aircraft', desc: 'Scheduled maintenance / transit tech-log check overrun' },
  { code: '71', category: 'Weather', desc: 'Adverse weather / sandstorm / low visibility ops (LVP)' },
  { code: '89', category: 'Ground Handling', desc: 'Ground support equipment (GSE) breakdown / pushback tug' },
  { code: '93', category: 'Reactionary', desc: 'Late arrival of inbound aircraft on preceding flight leg' },
];

export const DelayManagementModule: React.FC = () => {
  const { selectedFlight, currentUser, refreshAllData } = useApp();

  const [delays, setDelays] = useState<DelayRecord[]>(selectedFlight?.delayReasons || []);
  const [selectedIata, setSelectedIata] = useState(IATA_DELAY_CODES[0]);
  const [delayMinutes, setDelayMinutes] = useState(selectedFlight?.delayMinutes || 12);
  const [delayNotes, setDelayNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!selectedFlight) return null;

  const handleAddDelay = () => {
    const newRecord: DelayRecord = {
      id: `del_${Date.now()}`,
      flightId: selectedFlight.id,
      iataCode: selectedIata.code,
      category: selectedIata.category,
      description: selectedIata.desc,
      delayMinutes: delayMinutes,
      isPrimary: isPrimary,
      notes: delayNotes,
      reportedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setDelays([...delays, newRecord]);
    setDelayNotes('');
  };

  const handleRemoveDelay = (id: string) => {
    setDelays(delays.filter((d) => d.id !== id));
  };

  const totalApportionedMinutes = delays.reduce((acc, d) => acc + d.delayMinutes, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Timer className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-base text-white">Turnaround Delay Management & IATA Codes</h3>
            <p className="text-xs text-slate-400">Apportion minutes, categorize root causes, and prepare official flight delay logs.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">TOTAL VARIANCE:</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold ${selectedFlight.delayMinutes > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
            {selectedFlight.delayMinutes > 0 ? `+${selectedFlight.delayMinutes} MIN DELAY` : 'ON TIME (0m)'}
          </span>
        </div>
      </div>

      {/* Delay Auto Calculator Summary Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h4 className="font-bold text-white text-sm mb-3">Schedule vs Actual Flight Timing Variance</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">SCHEDULED DEPARTURE (STD)</div>
            <div className="text-lg font-bold text-white mt-1">{formatUtcShort(selectedFlight.scheduledDeparture)} UTC</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">ESTIMATED / ACTUAL OFF BLOCK (AOBT)</div>
            <div className="text-lg font-bold text-sky-300 mt-1">
              {formatUtcShort(selectedFlight.actualDeparture || selectedFlight.estimatedDeparture)} UTC
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${selectedFlight.delayMinutes > 0 ? 'bg-rose-950/40 border-rose-600/40' : 'bg-emerald-950/40 border-emerald-600/40'}`}>
            <div className="text-[10px] text-slate-400">CALCULATED TURNAROUND DELAY</div>
            <div className={`text-lg font-bold mt-1 ${selectedFlight.delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {selectedFlight.delayMinutes > 0 ? `+${selectedFlight.delayMinutes} minutes` : '0 minutes (On-Time)'}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Delay Reason Form */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm">Apportion Delay Reason (IATA Standard)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">SELECT IATA DELAY CODE</label>
            <select
              value={selectedIata.code}
              onChange={(e) => {
                const match = IATA_DELAY_CODES.find((c) => c.code === e.target.value);
                if (match) setSelectedIata(match);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
            >
              {IATA_DELAY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  Code {item.code} [{item.category}] - {item.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">DELAY MINUTES TO ATTRIBUTE</label>
            <input
              type="number"
              min="1"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono font-bold text-white"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">DISPATCHER EXPLANATION & ROOT CAUSE</label>
            <input
              type="text"
              placeholder="e.g. 4 transit passengers held at security transfer check from QR832"
              value={delayNotes}
              onChange={(e) => setDelayNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4 md:pt-0">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700"
              />
              <span>Primary Root Cause</span>
            </label>

            <button
              id="btn-add-delay-reason"
              onClick={handleAddDelay}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg font-mono shadow-sm transition-all"
            >
              + ADD DELAY CODE
            </button>
          </div>
        </div>

      </div>

      {/* Apportioned Delays Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm">Apportioned Delay Records</h4>
          <span className="text-xs font-mono text-slate-400">
            Apportioned: <strong className="text-white">{totalApportionedMinutes} min</strong>
          </span>
        </div>

        {delays.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No delay codes logged for this flight.
          </div>
        ) : (
          <div className="space-y-2">
            {delays.map((del) => (
              <div
                key={del.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                    CODE {del.iataCode}
                  </span>
                  <div>
                    <div className="text-white font-bold">{del.category}: {del.description}</div>
                    {del.notes && <div className="text-slate-400 text-[11px] mt-0.5">{del.notes}</div>}
                    <div className="text-slate-500 text-[10px] mt-0.5">Reported by {del.reportedBy} at {formatUtcTime(del.createdAt)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-rose-400 font-bold text-sm">+{del.delayMinutes} min</span>
                  <button
                    onClick={() => handleRemoveDelay(del.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
