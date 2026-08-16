import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TurnaroundTimeline } from './TurnaroundTimeline';
import { BaggageModule } from '../baggage/BaggageModule';
import { PassengerBoardingModule } from '../passengers/PassengerBoardingModule';
import { GroundServicesModule } from '../ground-services/GroundServicesModule';
import { DelayManagementModule } from '../delays/DelayManagementModule';
import { IncidentModule } from '../incidents/IncidentModule';
import { formatUtcShort, formatUtcTime, formatLocalAirportTime, calculateTurnaroundProgress } from '../../utils/dateUtils';
import {
  Plane,
  Clock,
  MapPin,
  Luggage,
  Users,
  Fuel,
  AlertTriangle,
  Timer,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const FlightDetailPage: React.FC = () => {
  const { selectedFlight, flights, setSelectedFlightId, setActiveTab } = useApp();
  const [subTab, setSubTab] = useState<'timeline' | 'baggage' | 'passengers' | 'ground_services' | 'delays' | 'incidents'>('timeline');

  if (!selectedFlight) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <p className="text-slate-300 font-semibold">No flight selected</p>
        <button
          onClick={() => setActiveTab('flights')}
          className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
        >
          View All Flights
        </button>
      </div>
    );
  }

  const { elapsedMin, totalMin, percent } = calculateTurnaroundProgress(
    selectedFlight.scheduledArrival,
    selectedFlight.scheduledDeparture
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Flight Operational Header Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        
        {/* Top Control: Back button & Flight Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('flights')}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              title="Back to Flights"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                {selectedFlight.originIata} → {selectedFlight.destinationIata}
              </span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded font-mono">
                {selectedFlight.flightNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-700/80 text-amber-300 border border-amber-500/30">
                GATE {selectedFlight.gate} · STAND {selectedFlight.stand}
              </span>
            </div>
            <div className="px-4 py-1.5 bg-amber-500 text-slate-900 rounded-md font-black text-xs uppercase tracking-wide">
              {selectedFlight.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Middle Route & Turnaround Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 items-center">
          
          {/* Aircraft & Operator Info */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-slate-400 font-medium">AIRCRAFT & REGISTRATION</div>
            <div className="text-lg font-bold text-white">
              {selectedFlight.airline} · {selectedFlight.aircraftType}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Registration: <span className="text-slate-200 font-semibold">{selectedFlight.aircraftReg}</span>
            </div>
          </div>

          {/* Turnaround Progress Meter */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span>TURNAROUND PROGRESS</span>
              <span className="text-blue-400 font-bold">{percent}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden my-1">
              <div
                className={`h-full transition-all duration-500 ${
                  percent >= 100 ? 'bg-emerald-500' : percent > 75 ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <span>STA: {formatUtcShort(selectedFlight.scheduledArrival)}Z</span>
              <span>STD: {formatUtcShort(selectedFlight.scheduledDeparture)}Z</span>
              {selectedFlight.delayMinutes > 0 ? (
                <span className="text-amber-400 font-bold">+{selectedFlight.delayMinutes}m DELAY</span>
              ) : (
                <span className="text-emerald-400 font-bold">ON TIME</span>
              )}
            </div>
          </div>

          {/* Supervisor & Crew Focus */}
          <div className="flex flex-col justify-center space-y-1.5 text-xs font-mono bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400">
              <span>LEAD SUPERVISOR:</span>
              <span className="text-slate-200 font-semibold">{selectedFlight.assignedSupervisor || 'Sarah Jenkins'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>RAMP LEAD AGENT:</span>
              <span className="text-slate-200 font-semibold">{selectedFlight.assignedAgent || 'Tariq Al-Mansoor'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>LOAD TELEMETRY:</span>
              <span className="text-blue-400 font-bold">
                {selectedFlight.boardedPassengers}/{selectedFlight.totalPassengers} Pax · {selectedFlight.loadedBaggage}/{selectedFlight.totalBaggage} Bags
              </span>
            </div>
          </div>

        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-700 text-xs font-medium no-scrollbar">
          {[
            { id: 'timeline', label: 'Turnaround Timeline', icon: Clock },
            { id: 'baggage', label: 'Baggage Handling', icon: Luggage },
            { id: 'passengers', label: 'Passenger Boarding', icon: Users },
            { id: 'ground_services', label: 'Ground Services & Fuel', icon: Fuel },
            { id: 'delays', label: 'Delay Management', icon: Timer },
            { id: 'incidents', label: 'Incidents & Safety', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
                  isTabActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Sub-Tab Content View */}
      {subTab === 'timeline' && <TurnaroundTimeline flight={selectedFlight} />}
      {subTab === 'baggage' && <BaggageModule />}
      {subTab === 'passengers' && <PassengerBoardingModule />}
      {subTab === 'ground_services' && <GroundServicesModule />}
      {subTab === 'delays' && <DelayManagementModule />}
      {subTab === 'incidents' && <IncidentModule />}

    </div>
  );
};
