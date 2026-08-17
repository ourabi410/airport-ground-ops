import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Radio,
  Clock,
  ArrowRight,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Truck,
  Users,
  Send,
  FileText,
  FileSpreadsheet,
  MapPin,
  Smartphone,
  Battery,
  Wifi,
  Shield,
  Activity,
  PlayCircle,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Baggage, Flight, User, TurnaroundMilestone } from '../../types';
import { DispatchFlightTaskModal } from '../common/DispatchFlightTaskModal';
import { exportTurnaroundPdf, exportFlightExcel } from '../../lib/exportReports';

interface OverviewDashboardProps {
  onOpenScanner: (step: 1 | 2) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onOpenScanner }) => {
  const { t, isRtl } = useLanguage();
  const {
    flights,
    baggage,
    dollies,
    users,
    turnaroundMilestones,
    agentSessions,
    auditLogs,
    setActiveTab,
    setSelectedFlightId,
    selectedFlight,
    currentUser,
    updateMilestoneStatus,
    resolveBagDiscrepancy
  } = useApp();

  // Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTargetUserId, setDispatchTargetUserId] = useState<string | undefined>(undefined);
  const [dispatchTargetFlightId, setDispatchTargetFlightId] = useState<string | undefined>(undefined);

  // Live Station Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [bagFilter, setBagFilter] = useState<'ALL' | 'LOADED' | 'SORTED' | 'DISCREPANCY'>('ALL');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentFlight = selectedFlight || flights[0];
  const flightBags = baggage.filter(b => b.flightNbr === currentFlight?.flightNbr);
  
  const totalBagsForFlight = flightBags.length > 0 ? flightBags.length : (currentFlight?.totalBagsExpected || 30);
  const loadedBagsForFlight = flightBags.filter(b => b.status === 'LOADED').length;
  const sortedBagsForFlight = flightBags.filter(b => b.status === 'SORTED').length;
  const missingBagsForFlight = flightBags.filter(b => b.status === 'MISSING' || b.status === 'DISCREPANCY').length;
  const reconcilePercent = totalBagsForFlight > 0 ? Math.round((loadedBagsForFlight / totalBagsForFlight) * 100) : 0;

  // System-wide global metrics
  const totalMissingGlobal = baggage.filter(b => b.status === 'MISSING' || b.status === 'DISCREPANCY').length;
  const totalBagsGlobal = baggage.length;
  const totalLoadedGlobal = baggage.filter(b => b.status === 'LOADED').length;
  const globalReconciliationRate = totalBagsGlobal > 0 ? Math.round((totalLoadedGlobal / totalBagsGlobal) * 100) : 92;
  const activeRampAgents = users.filter(u => u.role === 'Ramp/Loading Agent' || u.role === 'Subplane Agent');
  const dolliesInUse = dollies.filter(d => d.status !== 'Available').length;

  // Filtered bags for active flight table
  const filteredBags = flightBags.filter(b => {
    if (bagFilter === 'LOADED') return b.status === 'LOADED';
    if (bagFilter === 'SORTED') return b.status === 'SORTED';
    if (bagFilter === 'DISCREPANCY') return b.status === 'MISSING' || b.status === 'DISCREPANCY';
    return true;
  });

  // Milestones for current flight
  const flightMilestones = turnaroundMilestones.filter(m => m.flightNbr === currentFlight?.flightNbr);
  const completedMilestonesCount = flightMilestones.filter(m => m.status === 'COMPLETED').length;
  const turnaroundProgress = flightMilestones.length > 0
    ? Math.round((completedMilestonesCount / flightMilestones.length) * 100)
    : 45;

  const handleOpenDispatch = (userId?: string, flightId?: string) => {
    setDispatchTargetUserId(userId);
    setDispatchTargetFlightId(flightId || currentFlight?.id);
    setIsDispatchModalOpen(true);
  };

  return (
    <div id="super-admin-overview-dashboard" className="space-y-6">
      
      {/* 1. OCC Super Admin Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    Station Operational Control Center (OCC)
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                    Super Admin Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Real-time ramp turnaround dispatch, Zebra cargo hold reconciliation & apron telemetry • Station TUN / DTTA
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Station Clocks & Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live UTC & Local Clock */}
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono flex items-center gap-3 shadow-inner">
              <div className="flex items-center gap-1.5 text-sky-300">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-bold">{currentTime.toTimeString().slice(0, 8)} LT</span>
              </div>
              <span className="text-slate-500">|</span>
              <div className="text-slate-300">
                <span>{currentTime.toISOString().slice(11, 19)} UTC</span>
              </div>
            </div>

            {/* Quick Action: Dispatch Flight to Ramp Agent */}
            <button
              id="btn-quick-dispatch-flight"
              onClick={() => handleOpenDispatch(undefined, currentFlight?.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch to Ramp Agent</span>
            </button>

            {/* Quick Action: Hold Scanner */}
            <button
              id="btn-quick-step2-scanner"
              onClick={() => onOpenScanner(2)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Hold Scanner</span>
            </button>

            {/* Print Station Summary PDF */}
            <button
              id="btn-print-station-pdf"
              onClick={() => exportTurnaroundPdf(currentFlight, turnaroundMilestones, baggage, agentSessions)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Download PDF Turnaround Summary"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>

            {/* Export Full Operations Excel */}
            <button
              id="btn-export-station-excel"
              onClick={() => exportFlightExcel(currentFlight, turnaroundMilestones, baggage, auditLogs)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
              title="Export Multi-Sheet Operations Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. 4 Technical KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Turnaround Flights Queue */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">
              Turnaround Fleet
            </p>
            <Badge variant="outline" className="text-sky-700 bg-sky-50 border-sky-200 font-mono">
              {flights.length} Active Flights
            </Badge>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            {flights.filter(f => f.status === 'Loading' || f.status === 'Sorting').length} <span className="text-xs font-normal text-slate-500">In Turnaround</span>
          </p>
          <div className="mt-2">
            <Progress value={turnaroundProgress} max={100} indicatorClassName="bg-sky-600" />
          </div>
          <p className="text-[10px] mt-2 text-sky-700 font-bold flex items-center justify-between">
            <span>On-Time SLA: 98.4%</span>
            <span>Avg Turnaround: 38m</span>
          </p>
        </motion.div>

        {/* Card 2: Hold Loading Reconciliation */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Hold Reconciliation
            </p>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-mono">
              {reconcilePercent}% Done
            </Badge>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600 font-mono">
            {loadedBagsForFlight} <span className="text-xs font-normal text-slate-500">/ {totalBagsForFlight} Bags</span>
          </p>
          <div className="mt-2">
            <Progress value={reconcilePercent} max={100} indicatorClassName="bg-emerald-600" />
          </div>
          <p className="text-[10px] mt-2 text-slate-500 flex items-center justify-between">
            <span>Sorted: {sortedBagsForFlight}</span>
            <span className="text-emerald-600 font-bold">Step 2 Verified</span>
          </p>
        </motion.div>

        {/* Card 3: Ramp Agents On Apron */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Field Ramp Agents
            </p>
            <Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200 font-mono">
              {activeRampAgents.length} On Duty
            </Badge>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            {agentSessions.filter(s => s.isActive).length} <span className="text-xs font-normal text-slate-500">Zebra Scanners Online</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
            <Wifi className="w-3 h-3" />
            <span>Apron Private Wi-Fi / LTE Synced</span>
          </div>
          <p className="text-[10px] mt-2 text-slate-500 flex items-center justify-between">
            <span>Stand 14 & Stand 18 Locked</span>
            <span className="text-indigo-600 font-bold cursor-pointer hover:underline" onClick={() => setActiveTab('users')}>
              Manage Staff →
            </span>
          </p>
        </motion.div>

        {/* Card 4: Discrepancies / Missing */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            missingBagsForFlight > 0 || totalMissingGlobal > 0
              ? 'bg-red-50/50 border-red-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-red-700 uppercase font-bold tracking-wider">
              Security Discrepancies
            </p>
            {totalMissingGlobal > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-800 animate-pulse">
                ACTION REQ
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                100% CLEAR
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600 font-mono">
            {String(missingBagsForFlight > 0 ? missingBagsForFlight : totalMissingGlobal).padStart(2, '0')}
          </p>
          <div className="mt-2 text-[10px] text-red-600 font-bold flex items-center justify-between">
            <span>{missingBagsForFlight > 0 ? 'Hold Door Mismatch' : 'Zero Active Alerts'}</span>
            <button
              onClick={() => setActiveTab('baggage')}
              className="text-red-700 hover:underline font-bold text-[10px] cursor-pointer"
            >
              Reconcile →
            </button>
          </div>
          <p className="text-[9px] mt-2 text-slate-400">
            Automated IATA Resolution Protocol
          </p>
        </motion.div>

      </div>

      {/* 3. Active Turnaround Flights Monitor & Quick Dispatch Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-600" />
              <span>Active Turnaround Flights & Ramp Crew Dispatch</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live aircraft handling state, assigned ramp crews, cargo stands, and milestone progress
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Target Flight:</span>
            <select
              value={currentFlight?.id}
              onChange={(e) => setSelectedFlightId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {flights.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flightNbr} • {f.companyName} (Gate {f.gateNbr} / Stand {f.subplaneAreaZone}) - STD {f.std}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Flight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flights.map((flight) => {
            const isSelected = flight.id === currentFlight?.id;
            const fMilestones = turnaroundMilestones.filter(m => m.flightNbr === flight.flightNbr);
            const fDone = fMilestones.filter(m => m.status === 'COMPLETED').length;
            const fProgress = fMilestones.length > 0 ? Math.round((fDone / fMilestones.length) * 100) : 35;
            const fLoaded = baggage.filter(b => b.flightNbr === flight.flightNbr && b.status === 'LOADED').length;

            return (
              <div
                key={flight.id}
                onClick={() => setSelectedFlightId(flight.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/50 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Flight Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-slate-900">{flight.flightNbr}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {flight.companyName}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    flight.status === 'Loading'
                      ? 'bg-emerald-100 text-emerald-800'
                      : flight.status === 'Sorting'
                      ? 'bg-sky-100 text-sky-800'
                      : flight.status === 'Reconciled'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {flight.status}
                  </span>
                </div>

                {/* Aircraft & Stand Zone */}
                <div className="text-[11px] text-slate-600 font-mono mt-2 flex items-center justify-between">
                  <span>AC: {flight.acType} ({flight.reg})</span>
                  <span className="text-emerald-700 font-bold">Stand: {flight.subplaneAreaZone}</span>
                </div>

                {/* Assigned Ramp Personnel */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Assigned Ramp Dispatch:
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-600" />
                      <span>{flight.assignedRampAgent || flight.subplaneAreaUser || 'Unassigned'}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDispatch(undefined, flight.id);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      Dispatch Agent
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Turnaround: {fProgress}%</span>
                    <span>Hold Loaded: {fLoaded}/{flight.totalBagsExpected}</span>
                  </div>
                  <Progress value={fProgress} max={100} indicatorClassName="bg-sky-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Ramp Field Agents Telemetry Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Live Ramp Field Agents & Zebra Handheld Telemetry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active field sessions, handheld battery levels, GPS stand coordinates, and quick task delegation
            </p>
          </div>

          <button
            onClick={() => setActiveTab('users')}
            className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
          >
            Open Staff Directory ({users.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {users.map((user) => {
            const userSession = agentSessions.find(s => s.agentId === user.id);
            const isRampOrSubplane = user.role === 'Ramp/Loading Agent' || user.role === 'Subplane Agent';
            const assignedFlight = user.assignedFlightNbr || (userSession ? userSession.flightNbr : 'Standby');

            return (
              <div
                key={user.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-xs transition-all space-y-2.5"
              >
                {/* Agent Header */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      user.role === 'Administrator'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'Ramp/Loading Agent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : user.role === 'Subplane Agent'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Assigned Flight & Zone */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Flight:</span>
                    <span className="font-bold text-sky-700">{assignedFlight}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Zone:</span>
                    <span className="truncate max-w-[120px]">{user.assignedZone}</span>
                  </div>
                </div>

                {/* Zebra Telemetry */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-sky-600" />
                    <span>{userSession ? 'Online' : 'Zebra TC57'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Battery className="w-3 h-3" />
                    <span>{userSession ? `${userSession.batteryLevel}%` : '92%'}</span>
                  </span>
                </div>

                {/* Dispatch Button */}
                <button
                  onClick={() => handleOpenDispatch(user.id, currentFlight?.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-sky-600 hover:text-white text-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Assign Flight / Task</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Main Split: Real-Time Baggage Reconciliation Table & System Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Real-Time Zebra Reconciliation Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[440px]">
          
          {/* Panel Header with Filter Tabs */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <h2 className="text-sm font-bold text-slate-900">
                Zebra Workflow: Real-Time Baggage Reconciliation
              </h2>
              <Badge variant="default" className="bg-sky-700">
                {currentFlight?.flightNbr || 'TU-720'}
              </Badge>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setBagFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  bagFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({flightBags.length})
              </button>
              <button
                onClick={() => setBagFilter('LOADED')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  bagFilter === 'LOADED' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Loaded ({loadedBagsForFlight})
              </button>
              <button
                onClick={() => setBagFilter('SORTED')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  bagFilter === 'SORTED' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sorting ({sortedBagsForFlight})
              </button>
              <button
                onClick={() => setBagFilter('DISCREPANCY')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  bagFilter === 'DISCREPANCY' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Alerts ({missingBagsForFlight})
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead className="bg-white sticky top-0 text-[10px] uppercase text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Tag NBR</th>
                  <th className="px-4 py-3 font-bold">Passenger</th>
                  <th className="px-4 py-3 font-bold">Sorting Scan (Step 1)</th>
                  <th className="px-4 py-3 font-bold">Hold Load (Step 2)</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {filteredBags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No baggage matching current filter for flight {currentFlight?.flightNbr}.
                    </td>
                  </tr>
                ) : (
                  filteredBags.slice(0, 8).map((bag) => {
                    const isMissing = bag.status === 'MISSING' || bag.status === 'DISCREPANCY';
                    const isLoaded = bag.status === 'LOADED';

                    return (
                      <tr
                        key={bag.id}
                        className={isMissing ? 'bg-red-50/50' : 'hover:bg-slate-50/60 transition-colors'}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {bag.tagNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {bag.passengerName} <span className="text-[10px] text-slate-400 font-mono">({bag.seatNumber})</span>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-medium font-mono text-[11px]">
                          {bag.sortingTimestamp ? bag.sortingTimestamp.slice(11, 16) : '14:32'} - {bag.sortingZone || 'Zone A'}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-mono">
                          {isLoaded ? (
                            <span className="text-green-600 font-semibold">
                              {bag.loadingTimestamp ? bag.loadingTimestamp.slice(11, 16) : '15:01'} - {bag.holdLocation}
                            </span>
                          ) : isMissing ? (
                            <span className="text-red-600 font-bold">NOT SEEN AT HOLD</span>
                          ) : (
                            <span className="text-slate-400">In Transit ({bag.dollyId || 'DLY-101'})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isLoaded ? (
                            <Badge variant="success">RECONCILED</Badge>
                          ) : isMissing ? (
                            <Badge variant="destructive">ALERT</Badge>
                          ) : (
                            <Badge variant="warning">WAITING</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isMissing ? (
                            <button
                              onClick={() => resolveBagDiscrepancy(bag.id)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">{bag.weightKg}kg</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Showing {Math.min(8, filteredBags.length)} of {flightBags.length} manifest items
            </span>
            <button
              onClick={() => setActiveTab('baggage')}
              className="text-sky-600 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Reconciliation Terminal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* Right 1 Col: OCC System Activity & Turnaround Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[440px]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <span className="text-base">📜</span> Real-Time Station Event Stream
            </h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              LIVE OCC
            </span>
          </div>

          {/* Activity Item List */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[340px]">
            {auditLogs.slice(0, 6).map((log) => {
              const isAlert = log.severity === 'critical';
              const isSuccess = log.severity === 'success';
              const isWarn = log.severity === 'warning';

              return (
                <div key={log.id} className="flex gap-2.5 items-start">
                  <div
                    className={`w-1.5 rounded-full h-8 shrink-0 mt-0.5 ${
                      isAlert
                        ? 'bg-red-500 ring-2 ring-red-200'
                        : isSuccess
                        ? 'bg-green-500'
                        : isWarn
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                  ></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {log.details}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{log.timestamp.slice(11, 16)}</span>
                      <span>•</span>
                      <span>{log.module}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold">{log.userName}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Audit Trail Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('logs')}
              className="w-full py-2 bg-white border border-slate-300 text-[10px] uppercase font-bold tracking-widest text-slate-700 hover:bg-slate-100 transition-colors rounded-xl cursor-pointer"
            >
              View Full OCC Audit Log
            </button>
          </div>

        </div>

      </div>

      {/* Dispatch Modal Component */}
      <DispatchFlightTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        preSelectedUserId={dispatchTargetUserId}
        preSelectedFlightId={dispatchTargetFlightId}
      />

    </div>
  );
};
