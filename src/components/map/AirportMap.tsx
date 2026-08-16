import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flight } from '../../types';
import {
  MapPin,
  Plane,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { calculateTurnaroundProgress } from '../../utils/dateUtils';

interface StandInfo {
  id: string;
  standNumber: string;
  gate: string;
  terminal: string;
  concourse: string;
  maxAircraftSize: 'Code C (A320/B737)' | 'Code E (A350/B777)' | 'Code F (A380)';
  x: number; // percentage coordinate
  y: number; // percentage coordinate
}

const APRON_STANDS: StandInfo[] = [
  { id: 'st-c12', standNumber: 'Ramp Stand 42', gate: 'C12', terminal: 'Terminal 1', concourse: 'Concourse C', maxAircraftSize: 'Code E (A350/B777)', x: 38, y: 32 },
  { id: 'st-b4', standNumber: 'Ramp Stand 28', gate: 'B4', terminal: 'Terminal 1', concourse: 'Concourse B', maxAircraftSize: 'Code E (A350/B777)', x: 22, y: 48 },
  { id: 'st-a8', standNumber: 'Ramp Stand 14', gate: 'A8', terminal: 'Terminal 1', concourse: 'Concourse A', maxAircraftSize: 'Code C (A320/B737)', x: 18, y: 22 },
  { id: 'st-d6', standNumber: 'Ramp Stand 56', gate: 'D6', terminal: 'Terminal 1', concourse: 'Concourse D', maxAircraftSize: 'Code E (A350/B777)', x: 62, y: 28 },
  { id: 'st-e1', standNumber: 'Ramp Stand 71', gate: 'E1', terminal: 'Terminal 1', concourse: 'Concourse E', maxAircraftSize: 'Code F (A380)', x: 78, y: 45 },
  { id: 'st-c20', standNumber: 'Ramp Stand 48', gate: 'C20', terminal: 'Terminal 1', concourse: 'Concourse C', maxAircraftSize: 'Code E (A350/B777)', x: 45, y: 55 },
  { id: 'st-r10', standNumber: 'Remote Stand 10', gate: 'R10', terminal: 'Remote Apron', concourse: 'Remote Stands', maxAircraftSize: 'Code C (A320/B737)', x: 82, y: 78 },
  { id: 'st-r12', standNumber: 'Remote Stand 12', gate: 'R12', terminal: 'Remote Apron', concourse: 'Remote Stands', maxAircraftSize: 'Code C (A320/B737)', x: 65, y: 82 },
];

export const AirportMap: React.FC = () => {
  const { flights, setSelectedFlightId, setActiveTab } = useApp();
  const [selectedStand, setSelectedStand] = useState<StandInfo | null>(APRON_STANDS[0]);
  const [filterConcourse, setFilterConcourse] = useState<string>('ALL');

  // Match flight to stand by gate
  const getFlightAtStand = (gate: string) => {
    return flights.find((f) => f.gate.toLowerCase() === gate.toLowerCase());
  };

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlightId(flight.id);
    setActiveTab('flight-detail');
  };

  const filteredStands = APRON_STANDS.filter((st) => {
    if (filterConcourse !== 'ALL' && st.concourse !== filterConcourse) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">Live Apron & Stand Turnaround Visualizer</h3>
            <p className="text-xs text-slate-400">Real-time gate occupancy, active aircraft positions, and turnaround progression.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          {['ALL', 'Concourse C', 'Concourse B', 'Concourse A', 'Concourse D', 'Remote Stands'].map((c) => (
            <button
              key={c}
              onClick={() => setFilterConcourse(c)}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                filterConcourse === c
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Visual Map Stage + Stand Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Apron Map Canvas */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative min-h-[440px] flex flex-col justify-between overflow-hidden shadow-inner">
          
          {/* Subtle Apron Runway / Taxiway Markings */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-amber-400 border-dashed border-t-2 border-amber-400"></div>
            <div className="absolute top-0 bottom-0 left-1/3 w-[2px] bg-sky-400 border-dashed border-l-2 border-sky-400"></div>
            <div className="absolute top-0 bottom-0 right-1/3 w-[2px] bg-sky-400 border-dashed border-l-2 border-sky-400"></div>
            <div className="absolute bottom-10 left-10 text-6xl font-black font-mono text-slate-800">DOH APRON</div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800 font-bold text-slate-200">
              HAMAD INTL AIRPORT (OTHH/DOH) • APRON SECTOR NORTH
            </span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Turnaround Active</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>Stand Available</span>
              </span>
            </div>
          </div>

          {/* Interactive Gate Markers on Map */}
          <div className="relative w-full h-[320px] my-4">
            {filteredStands.map((stand) => {
              const flight = getFlightAtStand(stand.gate);
              const isSelected = selectedStand?.id === stand.id;
              const isDelayed = flight && (flight.delayMinutes > 0 || flight.status === 'DELAYED');

              return (
                <div
                  key={stand.id}
                  onClick={() => setSelectedStand(stand)}
                  style={{ left: `${stand.x}%`, top: `${stand.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl border-2 shadow-xl flex items-center space-x-2 transition-all ${
                      flight
                        ? isDelayed
                          ? 'bg-rose-950/90 border-rose-500 text-white'
                          : 'bg-slate-900/90 border-sky-500 text-white'
                        : 'bg-slate-950/80 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Plane
                      className={`w-4 h-4 ${
                        flight
                          ? isDelayed
                            ? 'text-rose-400'
                            : 'text-sky-400'
                          : 'text-slate-600'
                      }`}
                    />
                    <div className="text-left font-mono">
                      <div className="text-xs font-black leading-none">{stand.gate}</div>
                      {flight ? (
                        <div className="text-[10px] text-sky-300 font-bold mt-0.5">{flight.flightNumber}</div>
                      ) : (
                        <div className="text-[9px] text-slate-500 mt-0.5">OPEN</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 text-[11px] font-mono text-slate-400 text-center">
            Click any stand marker on the apron to inspect real-time turnaround status
          </div>
        </div>

        {/* Selected Stand Details Panel */}
        {selectedStand ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black font-mono text-white">GATE {selectedStand.gate}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold">
                      {selectedStand.standNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedStand.concourse} • {selectedStand.terminal}
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-400">
                  <span>MAX SIZE:</span>
                  <div className="font-bold text-slate-200">{selectedStand.maxAircraftSize}</div>
                </div>
              </div>

              {/* Parked Flight Status if any */}
              {(() => {
                const flight = getFlightAtStand(selectedStand.gate);
                if (!flight) {
                  return (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      No aircraft currently docked at this stand.
                      <div className="text-emerald-400 font-bold mt-1">STAND AVAILABLE</div>
                    </div>
                  );
                }

                const { percent } = calculateTurnaroundProgress(flight.scheduledArrival, flight.scheduledDeparture);

                return (
                  <div className="space-y-4 pt-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-lg font-black text-white">{flight.flightNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                          {flight.aircraftReg} ({flight.aircraftType})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Route: <strong className="text-slate-200">{flight.originIata} → {flight.destinationIata}</strong>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Status: <strong className="text-amber-400">{flight.status}</strong>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Turnaround Progress</span>
                        <span className="text-sky-400 font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 text-[10px]">PASSENGERS</span>
                        <div className="text-white font-bold">{flight.boardedPassengers}/{flight.totalPassengers}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">BAGGAGE</span>
                        <div className="text-white font-bold">{flight.loadedBaggage}/{flight.totalBaggage}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectFlight(flight)}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <span>OPEN FULL TURNAROUND VIEW</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Ground Power Unit (GPU) & 400Hz Pre-Conditioned Air (PCA) operational.</span>
            </div>
          </div>
        ) : null}

      </div>

    </div>
  );
};
