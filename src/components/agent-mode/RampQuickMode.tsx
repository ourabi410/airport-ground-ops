import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TurnaroundMilestoneType, OperationalEvent } from '../../types';
import { formatUtcTime, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  Smartphone,
  Check,
  Clock,
  MapPin,
  Camera,
  Plane,
  AlertTriangle,
  ChevronDown,
  Layers,
} from 'lucide-react';

const QUICK_STAMP_BUTTONS: {
  type: TurnaroundMilestoneType;
  label: string;
  category: OperationalEvent['category'];
  color: string;
}[] = [
  { type: 'ON_BLOCK', label: '1. ON BLOCK (AIBT)', category: 'ARRIVAL', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { type: 'CHOCKS_ON', label: '2. CHOCKS & GPU ON', category: 'ARRIVAL', color: 'bg-sky-600 hover:bg-sky-500' },
  { type: 'DOOR_OPEN', label: '3. CABIN DOOR OPEN', category: 'ARRIVAL', color: 'bg-sky-600 hover:bg-sky-500' },
  { type: 'DISEMBARK_STARTED', label: '4. DISEMBARK START', category: 'ARRIVAL', color: 'bg-sky-700 hover:bg-sky-600' },
  { type: 'BAGGAGE_UNLOAD_STARTED', label: '5. BAG OFFLOAD START', category: 'GROUND_SERVICES', color: 'bg-amber-600 hover:bg-amber-500' },
  { type: 'CLEANING_STARTED', label: '6. CLEANING START', category: 'GROUND_SERVICES', color: 'bg-indigo-600 hover:bg-indigo-500' },
  { type: 'CATERING_STARTED', label: '7. CATERING START', category: 'GROUND_SERVICES', color: 'bg-purple-600 hover:bg-purple-500' },
  { type: 'FUEL_STARTED', label: '8. FUELING START', category: 'GROUND_SERVICES', color: 'bg-cyan-600 hover:bg-cyan-500' },
  { type: 'BAGGAGE_LOAD_STARTED', label: '9. BAG LOAD START', category: 'GROUND_SERVICES', color: 'bg-amber-600 hover:bg-amber-500' },
  { type: 'BOARDING_STARTED', label: '10. BOARDING START', category: 'DEPARTURE', color: 'bg-blue-600 hover:bg-blue-500' },
  { type: 'BOARDING_COMPLETED', label: '11. BOARDING DONE', category: 'DEPARTURE', color: 'bg-blue-700 hover:bg-blue-600' },
  { type: 'FINAL_LOADSHEET_SIGNED', label: '12. LOADSHEET SIGNED', category: 'DEPARTURE', color: 'bg-teal-600 hover:bg-teal-500' },
  { type: 'DOORS_CLOSED', label: '13. ALL DOORS CLOSED', category: 'DEPARTURE', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { type: 'PUSHBACK', label: '14. PUSHBACK COMMENCE', category: 'DEPARTURE', color: 'bg-emerald-700 hover:bg-emerald-600' },
];

export const RampQuickMode: React.FC = () => {
  const {
    flights,
    selectedFlight,
    setSelectedFlightId,
    recordMilestoneEvent,
    events,
    currentUser,
    setReportIncidentModalOpen,
  } = useApp();

  const [lastStampedMessage, setLastStampedMessage] = useState<string | null>(null);

  const activeFlight = selectedFlight || flights[0];
  const flightEvents = events.filter((e) => e.flightId === activeFlight?.id);

  const handle1TapStamp = async (item: (typeof QUICK_STAMP_BUTTONS)[0]) => {
    if (!activeFlight) return;
    const recorded = await recordMilestoneEvent({
      flightId: activeFlight.id,
      eventType: item.type,
      eventTitle: item.label,
      category: item.category,
      status: 'COMPLETED',
      notes: `Glove quick stamped by ${currentUser.name}`,
      gate: activeFlight.gate,
      stand: activeFlight.stand,
    });

    setLastStampedMessage(`Stamped: ${item.label} at ${formatUtcTime(recorded.eventTimeUtc)} UTC`);
    setTimeout(() => setLastStampedMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Top Glove Mode Banner */}
      <div className="bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Ramp Agent Field Mode</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-900 font-bold">
                GLOVE FRIENDLY
              </span>
            </div>
            <p className="text-xs text-slate-400">Extra-large touch targets with automatic UTC & GPS stamping.</p>
          </div>
        </div>

        {/* Flight Selector */}
        <div className="flex items-center gap-2">
          <select
            value={activeFlight?.id}
            onChange={(e) => setSelectedFlightId(e.target.value)}
            className="bg-slate-900 border-2 border-blue-500 rounded-lg px-4 py-2 text-sm font-mono font-bold text-white focus:outline-none"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.flightNumber} - Gate {f.gate} ({f.originIata}→{f.destinationIata})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Flight Card Banner */}
      {activeFlight && (
        <div className="bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Plane className="w-8 h-8 text-blue-400 rotate-45" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono text-white">{activeFlight.flightNumber}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-blue-300 font-bold">
                  {activeFlight.aircraftReg} ({activeFlight.aircraftType})
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                STAND {activeFlight.stand} · GATE {activeFlight.gate} · {activeFlight.originIata} → {activeFlight.destinationIata}
              </div>
            </div>
          </div>

          <button
            onClick={() => setReportIncidentModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 border border-red-500/40 hover:bg-red-600/20 text-red-400 rounded-xl font-mono text-xs font-bold transition-colors"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>REPORT RAMP PROBLEM</span>
          </button>
        </div>
      )}

      {/* Real-time Confirmation Toast */}
      {lastStampedMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl font-mono text-sm font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span>{lastStampedMessage}</span>
        </div>
      )}

      {/* Large 1-Tap Milestone Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {QUICK_STAMP_BUTTONS.map((btn) => {
          const alreadyRecorded = flightEvents.find((e) => e.eventType === btn.type);

          return (
            <button
              key={btn.type}
              id={`ramp-stamp-${btn.type.toLowerCase()}`}
              onClick={() => handle1TapStamp(btn)}
              className={`p-5 rounded-xl text-left flex items-center justify-between transition-all active:scale-95 shadow-md border ${
                alreadyRecorded
                  ? 'bg-slate-800/90 border-emerald-500/80 text-slate-100'
                  : `${btn.color} border-slate-700 text-white`
              }`}
            >
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-black tracking-tight font-mono">{btn.label}</div>
                <div className="text-xs opacity-80 font-mono">
                  {alreadyRecorded
                    ? `STAMPED: ${formatUtcTime(alreadyRecorded.eventTimeUtc)} UTC`
                    : 'TAP TO STAMP UTC + GPS'}
                </div>
              </div>

              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  alreadyRecorded ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-black/20 text-white'
                }`}
              >
                {alreadyRecorded ? <Check className="w-6 h-6 stroke-[3]" /> : <Clock className="w-6 h-6" />}
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
