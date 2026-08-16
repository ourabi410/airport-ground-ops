import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Luggage,
  Fuel,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';

export const KpiDashboard: React.FC = () => {
  const { flights, incidents, events } = useApp();

  const totalFlights = flights.length;
  const delayedFlights = flights.filter((f) => f.delayMinutes > 0 || f.status === 'DELAYED').length;
  const onTimePercentage = totalFlights > 0 ? Math.round(((totalFlights - delayedFlights) / totalFlights) * 100) : 100;
  const totalDelayMin = flights.reduce((acc, f) => acc + (f.delayMinutes || 0), 0);
  const avgDelay = totalFlights > 0 ? Math.round(totalDelayMin / totalFlights) : 0;

  // Turnaround phase benchmark metrics
  const phaseBenchmarks = [
    { name: 'Deboarding', avgMinutes: 18, targetMinutes: 15, onTarget: false, icon: Users },
    { name: 'Baggage Offload', avgMinutes: 22, targetMinutes: 25, onTarget: true, icon: Luggage },
    { name: 'Cabin Cleaning', avgMinutes: 24, targetMinutes: 25, onTarget: true, icon: Sparkles },
    { name: 'Aviation Fueling', avgMinutes: 29, targetMinutes: 30, onTarget: true, icon: Fuel },
    { name: 'Baggage Loading', avgMinutes: 26, targetMinutes: 25, onTarget: false, icon: Luggage },
    { name: 'Boarding Gate', avgMinutes: 28, targetMinutes: 25, onTarget: false, icon: Users },
  ];

  // Top Delay Categories
  const delayCategories = [
    { code: '81', name: 'Late Transit / Passenger Reconciliation', sharePct: 35, minutes: 84 },
    { code: '12', name: 'Baggage Congestion / Rush Bag Handling', sharePct: 25, minutes: 60 },
    { code: '41', name: 'Line Maintenance MEL Clearance', sharePct: 20, minutes: 48 },
    { code: '33', name: 'Fuel Hydrant Flow Pressure Variance', sharePct: 12, minutes: 28 },
    { code: '21', name: 'Passenger Boarding Bridge (PBB) Docking', sharePct: 8, minutes: 20 },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">Airport Ground Operations & KPI Analytics</h3>
            <p className="text-xs text-slate-400">On-Time Performance (OTP), milestone durations, critical path and delay drivers.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>CURRENT SHIFT (06:00 - 18:00 UTC)</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        <div className="bg-slate-900 border border-emerald-500/40 bg-emerald-950/10 p-5 rounded-2xl">
          <div className="text-xs text-emerald-400 uppercase flex items-center justify-between">
            <span>ON-TIME PERFORMANCE (OTP)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-300 mt-2">{onTimePercentage}%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Target SLA ≥ 90.0%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase flex items-center justify-between">
            <span>AVG TURNAROUND TIME</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">64 <span className="text-sm font-normal text-slate-400">min</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled SLA: 60-90 min</div>
        </div>

        <div className="bg-slate-900 border border-rose-500/40 bg-rose-950/10 p-5 rounded-2xl">
          <div className="text-xs text-rose-400 uppercase flex items-center justify-between">
            <span>AVERAGE FLIGHT DELAY</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-300 mt-2">{avgDelay} <span className="text-sm font-normal text-slate-400">min</span></div>
          <div className="text-[11px] text-rose-400/80 mt-1">Across all scheduled flights</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase flex items-center justify-between">
            <span>RECORDED RAMP EVENTS</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-sky-300 mt-2">{events.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Authoritative timestamps today</div>
        </div>

      </div>

      {/* Turnaround Milestone Duration Benchmarks */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-sm">Turnaround Phase Durations (Actual vs Standard SLA)</h4>
            <p className="text-xs text-slate-400">Target service times for Widebody A350/B777 turnarounds.</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Tolerance: ±3 min</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phaseBenchmarks.map((phase) => {
            const Icon = phase.icon;
            return (
              <div
                key={phase.name}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-slate-200">{phase.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      phase.onTarget
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {phase.onTarget ? 'ON TARGET' : 'OVERRUN'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono pt-1">
                  <div>
                    <span className="text-xl font-bold text-white">{phase.avgMinutes}</span>
                    <span className="text-xs text-slate-400"> min actual</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Target: <strong className="text-slate-300">{phase.targetMinutes}m</strong>
                  </div>
                </div>

                {/* Micro visual bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${phase.onTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (phase.avgMinutes / phase.targetMinutes) * 80)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Delay Drivers Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm">Top Ground Delay Contributors (IATA Code Distribution)</h4>

        <div className="space-y-3">
          {delayCategories.map((item) => (
            <div key={item.code} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                    IATA {item.code}
                  </span>
                  <span className="text-slate-200 font-bold">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-rose-400 font-bold">{item.minutes} min</span>
                  <span className="text-slate-500 ml-2">({item.sharePct}%)</span>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: `${item.sharePct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
