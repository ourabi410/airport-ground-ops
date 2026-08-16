import React from 'react';
import { Flight } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatUtcShort, formatLocalAirportTime, calculateTurnaroundProgress } from '../../utils/dateUtils';
import {
  Plane,
  Clock,
  MapPin,
  Luggage,
  Users,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Timer,
} from 'lucide-react';

interface FlightCardProps {
  flight: Flight;
  onSelect?: () => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect }) => {
  const { setSelectedFlightId, setActiveTab, setQuickEventModalOpen } = useApp();

  const handleOpenDetail = () => {
    setSelectedFlightId(flight.id);
    setActiveTab('flight_detail');
    if (onSelect) onSelect();
  };

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFlightId(flight.id);
    setQuickEventModalOpen(true);
  };

  const { elapsedMin, totalMin, percent } = calculateTurnaroundProgress(
    flight.scheduledArrival,
    flight.scheduledDeparture
  );

  const getStatusBadge = () => {
    switch (flight.status) {
      case 'TURNAROUND':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/40 animate-pulse';
      case 'BOARDING':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/40';
      case 'DELAYED':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'READY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DEPARTED':
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
      case 'ARRIVING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div
      id={`flight-card-${flight.flightNumber.toLowerCase()}`}
      onClick={handleOpenDetail}
      className="bg-slate-800 border border-slate-700 hover:border-blue-500/60 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Header: Airline & Gate */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-600 font-mono">
              {flight.airlineCode}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                  {flight.flightNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {flight.aircraftReg}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{flight.airline}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-700 text-amber-300 border border-amber-500/30">
                GATE {flight.gate}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{flight.stand}</span>
          </div>
        </div>

        {/* Route & Aircraft */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="text-left">
              <span className="font-mono text-base font-bold text-slate-100">{flight.originIata}</span>
              <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{flight.originAirport}</p>
            </div>
            <div className="flex flex-col items-center px-1">
              <Plane className="w-3.5 h-3.5 text-slate-400 rotate-90 my-0.5" />
              <div className="w-12 h-[1px] bg-slate-700"></div>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-slate-100">{flight.destinationIata}</span>
              <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{flight.destinationAirport}</p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[11px] font-mono font-bold px-2 py-1 rounded-md border ${getStatusBadge()}`}>
              {flight.status}
            </span>
            {flight.delayMinutes > 0 && (
              <div className="text-[10px] text-red-400 font-mono font-semibold mt-1">
                +{flight.delayMinutes}m DELAY
              </div>
            )}
          </div>
        </div>

        {/* Times Grid: Scheduled vs Actual / Estimated */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/70 rounded-lg p-2.5 border border-slate-700 text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-400">STA / ATA</div>
            <div className="text-slate-200">
              {formatUtcShort(flight.scheduledArrival)} <span className="text-slate-400">/</span>{' '}
              <span className="text-blue-300 font-semibold">{formatUtcShort(flight.actualArrival || flight.estimatedArrival)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">STD / ETD</div>
            <div className="text-slate-200">
              {formatUtcShort(flight.scheduledDeparture)} <span className="text-slate-400">/</span>{' '}
              <span className={flight.delayMinutes > 0 ? 'text-red-400 font-semibold' : 'text-emerald-300 font-semibold'}>
                {formatUtcShort(flight.estimatedDeparture)}
              </span>
            </div>
          </div>
        </div>

        {/* Turnaround Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>TURNAROUND: {flight.targetTurnaroundMin}m TARGET</span>
            <span className="text-slate-300">{percent}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percent >= 100 ? 'bg-emerald-500' : percent > 75 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>

        {/* Operational Stats: Pax & Bags */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-300 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">
              {flight.boardedPassengers}/{flight.totalPassengers} Pax
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Luggage className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">
              {flight.loadedBaggage}/{flight.totalBaggage} Bags
            </span>
          </div>
          {flight.openIncidentsCount > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-[10px] font-mono font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>{flight.openIncidentsCount} INCIDENT</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={handleQuickLog}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 py-1 px-2 rounded bg-sky-950/50 border border-sky-800/40 hover:bg-sky-900/50 transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>+ Quick Event</span>
        </button>

        <span className="text-xs text-slate-400 group-hover:text-white flex items-center transition-colors">
          View Timeline <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
};
