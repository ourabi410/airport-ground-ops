import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FlightCard } from '../flights/FlightCard';
import { FlightStatus } from '../../types';
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Plus,
  BarChart2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const OperationsDashboard: React.FC = () => {
  const { flights, incidents, setActiveTab, setQuickEventModalOpen } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Top Metrics Calculation
  const totalFlights = flights.length;
  const activeTurnarounds = flights.filter((f) => f.status === 'TURNAROUND' || f.status === 'BOARDING').length;
  const delayedFlights = flights.filter((f) => f.delayMinutes > 0 || f.status === 'DELAYED').length;
  const totalDelayMinutes = flights.reduce((acc, f) => acc + (f.delayMinutes || 0), 0);
  const avgDelay = totalFlights > 0 ? Math.round(totalDelayMinutes / totalFlights) : 0;
  const onTimePercent = totalFlights > 0 ? Math.round(((totalFlights - delayedFlights) / totalFlights) * 100) : 100;
  const openProblems = incidents.filter((i) => i.status !== 'RESOLVED').length;

  // Filtered flights
  const filteredFlights = flights.filter((flight) => {
    // Status filter
    if (statusFilter === 'ARRIVING' && flight.status !== 'ARRIVING') return false;
    if (statusFilter === 'TURNAROUND' && flight.status !== 'TURNAROUND') return false;
    if (statusFilter === 'BOARDING' && flight.status !== 'BOARDING') return false;
    if (statusFilter === 'DELAYED' && flight.status !== 'DELAYED' && flight.delayMinutes <= 0) return false;
    if (statusFilter === 'READY' && flight.status !== 'READY') return false;
    if (statusFilter === 'DEPARTED' && flight.status !== 'DEPARTED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        flight.flightNumber.toLowerCase().includes(q) ||
        flight.airline.toLowerCase().includes(q) ||
        flight.gate.toLowerCase().includes(q) ||
        flight.aircraftReg.toLowerCase().includes(q) ||
        flight.destinationAirport.toLowerCase().includes(q) ||
        flight.originIata.toLowerCase().includes(q) ||
        flight.destinationIata.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Operational Status Ticker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-xl font-bold text-white tracking-tight">Hamad International Ground Operations</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-700 text-blue-400 border border-slate-600">
              HUB DOH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aircraft turnaround monitoring, ramp milestone tracking & offline-first synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-new-event-dash"
            onClick={() => setQuickEventModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Ramp Event</span>
          </button>
          <button
            id="btn-goto-map"
            onClick={() => setActiveTab('map')}
            className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors"
          >
            Apron Map
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-medium">FLIGHTS TODAY</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalFlights}</div>
          <div className="text-[10px] text-slate-400 mt-1">Scheduled movements</div>
        </div>

        <div className="bg-slate-800 border border-amber-500/30 bg-amber-500/5 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-amber-400 uppercase font-medium flex items-center justify-between">
            <span>ACTIVE TURNAROUNDS</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{activeTurnarounds}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Currently on ramp</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-medium">DELAYED FLIGHTS</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{delayedFlights}</div>
          <div className="text-[10px] text-slate-400 mt-1">Schedule variance</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-medium">AVERAGE DELAY</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{avgDelay} <span className="text-xs text-slate-400 font-normal">min</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Per movement</div>
        </div>

        <div className="bg-slate-800 border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-emerald-400 uppercase font-medium flex items-center justify-between">
            <span>ON-TIME (OTP)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{onTimePercent}%</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Target ≥ 90%</div>
        </div>

        <div className="bg-slate-800 border border-red-500/30 bg-red-500/5 rounded-xl p-3.5">
          <div className="text-[11px] font-mono text-red-400 uppercase font-medium flex items-center justify-between">
            <span>OPEN INCIDENTS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-300 mt-1">{openProblems}</div>
          <div className="text-[10px] text-red-400/80 mt-1">Requiring action</div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-800 border border-slate-700 p-3 rounded-xl">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium no-scrollbar">
          {[
            { id: 'ALL', label: "All Flights", count: flights.length },
            { id: 'ARRIVING', label: 'Arriving', count: flights.filter((f) => f.status === 'ARRIVING').length },
            { id: 'TURNAROUND', label: 'On Ground', count: flights.filter((f) => f.status === 'TURNAROUND').length },
            { id: 'BOARDING', label: 'Boarding', count: flights.filter((f) => f.status === 'BOARDING').length },
            { id: 'DELAYED', label: 'Delayed', count: delayedFlights },
            { id: 'READY', label: 'Ready', count: flights.filter((f) => f.status === 'READY').length },
            { id: 'DEPARTED', label: 'Departed', count: flights.filter((f) => f.status === 'DEPARTED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-mono transition-all flex items-center gap-1.5 text-xs ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${statusFilter === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="flight-search-input"
            type="text"
            placeholder="Search flight, aircraft, gate, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* Flight Cards Grid */}
      {filteredFlights.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold text-base">No flights matching criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different filter tab or clear search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}

    </div>
  );
};
