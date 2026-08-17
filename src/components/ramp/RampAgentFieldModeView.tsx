import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Plane,
  AlertTriangle,
  Check,
  Clock,
  Radio,
  Battery,
  Wifi,
  MapPin,
  QrCode,
  X,
  Send,
  RefreshCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { TurnaroundMilestone, Flight } from '../../types';
import { soundManager } from '../../utils/audio';

interface RampAgentFieldModeViewProps {
  onOpenScanner?: () => void;
}

// 14 Standard IATA Ramp Turnaround Milestones matching the field standard
interface StandardRampMilestone {
  index: number;
  code: string;
  label: string;
  defaultCategory: string;
  activeColorStyle?: 'orange' | 'blue' | 'teal';
}

const RAMP_14_MILESTONES: StandardRampMilestone[] = [
  { index: 1, code: 'ON_BLOCK', label: 'ON BLOCK (AIBT)', defaultCategory: 'Arrival' },
  { index: 2, code: 'CHOCKS_GPU', label: 'CHOCKS & GPU ON', defaultCategory: 'Arrival' },
  { index: 3, code: 'CABIN_DOOR_OPEN', label: 'CABIN DOOR OPEN', defaultCategory: 'Arrival' },
  { index: 4, code: 'DISEMBARK_START', label: 'DISEMBARK START', defaultCategory: 'Arrival', activeColorStyle: 'blue' },
  { index: 5, code: 'BAG_OFFLOAD_START', label: 'BAG OFFLOAD START', defaultCategory: 'Baggage' },
  { index: 6, code: 'CLEANING_START', label: 'CLEANING START', defaultCategory: 'Cleaning' },
  { index: 7, code: 'CATERING_START', label: 'CATERING START', defaultCategory: 'Servicing' },
  { index: 8, code: 'FUELING_START', label: 'FUELING START', defaultCategory: 'Fueling' },
  { index: 9, code: 'BAG_LOAD_START', label: 'BAG LOAD START', defaultCategory: 'Baggage', activeColorStyle: 'orange' },
  { index: 10, code: 'BOARDING_START', label: 'BOARDING START', defaultCategory: 'Boarding' },
  { index: 11, code: 'BOARDING_DONE', label: 'BOARDING DONE', defaultCategory: 'Boarding', activeColorStyle: 'blue' },
  { index: 12, code: 'LOADSHEET_SIGNED', label: 'LOADSHEET SIGNED', defaultCategory: 'Departure', activeColorStyle: 'teal' },
  { index: 13, code: 'ALL_DOORS_CLOSED', label: 'ALL DOORS CLOSED', defaultCategory: 'Departure' },
  { index: 14, code: 'PUSHBACK_COMMENCE', label: 'PUSHBACK COMMENCE', defaultCategory: 'Departure' },
];

export const RampAgentFieldModeView: React.FC<RampAgentFieldModeViewProps> = ({ onOpenScanner }) => {
  const { isRtl, t } = useLanguage();
  const {
    flights,
    selectedFlightId,
    setSelectedFlightId,
    turnaroundMilestones,
    updateMilestoneStatus,
    currentUser,
    agentSessions,
    addFlightComment,
    baggage,
    userRole
  } = useApp();

  // Current selected flight (default to user assigned flight if any, or QR123 / first flight)
  const userAssignedFlight = flights.find(f => f.flightNbr === currentUser.assignedFlightNbr);
  const [activeFlightNbr, setActiveFlightNbr] = useState<string>(
    userAssignedFlight?.flightNbr || 'QR123'
  );

  const activeFlight = flights.find(f => f.flightNbr === activeFlightNbr) || flights[0] || {
    id: 'FLT-QR123',
    flightNbr: 'QR123',
    reg: 'A7-ANE',
    acType: 'A350-1000',
    subplaneAreaZone: 'Ramp 42',
    gateNbr: 'C12',
    companyName: 'Qatar Airways',
    flightTask: 'DOH → LHR Ground Handling',
    status: 'Loading',
    std: '15:15',
    sta: '13:30',
    date: '2026-08-17'
  };

  // Local feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Problem Modal State
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemCategory, setProblemCategory] = useState('Baggage Discrepancy');
  const [problemSeverity, setProblemSeverity] = useState<'low' | 'medium' | 'critical'>('critical');
  const [problemDescription, setProblemDescription] = useState('');
  const [holdDoorPosition, setHoldDoorPosition] = useState('Hold 1 Fwd');

  // GPS Simulation
  const [currentGps, setCurrentGps] = useState({
    lat: 36.85124,
    lng: 10.22742,
    accuracy: 1.8,
    stand: activeFlight.subplaneAreaZone || 'Ramp 42'
  });

  const [batteryLevel, setBatteryLevel] = useState(92);

  useEffect(() => {
    const timer = setInterval(() => {
      // Small realistic GPS jitter for active field lock
      setCurrentGps(prev => ({
        ...prev,
        lat: parseFloat((36.85124 + (Math.random() - 0.5) * 0.0001).toFixed(6)),
        lng: parseFloat((10.22742 + (Math.random() - 0.5) * 0.0001).toFixed(6)),
        accuracy: parseFloat((1.4 + Math.random() * 0.6).toFixed(1))
      }));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stamping action for milestone
  const handleStampMilestone = (item: StandardRampMilestone) => {
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
    const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
    const formattedUtc = `${utcHours}:${utcMins}:${utcSecs} UTC`;

    // Find milestone in state or create matching key
    const milestoneId = `MLS-${activeFlight.flightNbr}-${item.code}`;
    const existing = turnaroundMilestones.find(
      m => m.flightNbr === activeFlight.flightNbr && (m.code === item.code || m.id === milestoneId)
    );

    if (existing) {
      updateMilestoneStatus(existing.id, 'COMPLETED', `Stamped via Glove Mode at Stand ${activeFlight.subplaneAreaZone}`);
    } else {
      // Direct update through standard context update
      updateMilestoneStatus(milestoneId, 'COMPLETED', `Stamped via Glove Mode at Stand ${activeFlight.subplaneAreaZone}`);
    }

    soundManager.playLoadVerifiedBeep();
    showToast(`✓ Stamped ${item.label}: ${formattedUtc} (GPS stand lock verified)`);
  };

  // Submit problem report
  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) return;

    addFlightComment(
      activeFlight.id,
      `[RAMP REPORT - ${problemCategory.toUpperCase()} - ${problemSeverity.toUpperCase()}]: ${problemDescription} (Location: ${holdDoorPosition}, Stand: ${activeFlight.subplaneAreaZone})`,
      problemSeverity === 'critical' ? 'discrepancy' : 'general'
    );

    soundManager.playErrorBuzzer();
    setIsProblemModalOpen(false);
    setProblemDescription('');
    showToast(`⚠️ Ramp problem reported to OCC Control Center!`);
  };

  // Helper to determine milestone display status
  const getMilestoneState = (item: StandardRampMilestone) => {
    const matched = turnaroundMilestones.find(
      m => m.flightNbr === activeFlight.flightNbr && (m.code === item.code || m.id.endsWith(item.code))
    );

    // Initial realistic states if not yet in state
    if (matched) {
      return {
        isCompleted: matched.status === 'COMPLETED',
        stampedTime: matched.actualTime ? `${matched.actualTime} UTC` : (matched.timestampExact ? new Date(matched.timestampExact).toISOString().slice(11, 19) + ' UTC' : null),
        isInProgress: matched.status === 'IN_PROGRESS'
      };
    }

    // Default screenshot simulated defaults for QR123
    const defaultDone = [1, 2, 3, 5, 6, 7, 8, 10, 13, 14].includes(item.index);
    const defaultInProgress = item.index === 9; // BAG LOAD START is orange in screenshot

    const simulatedTimes: Record<number, string> = {
      1: '13:39:12 UTC',
      2: '13:40:12 UTC',
      3: '13:42:12 UTC',
      5: '13:44:12 UTC',
      6: '13:56:12 UTC',
      7: '13:59:12 UTC',
      8: '14:04:12 UTC',
      10: '14:14:12 UTC',
      13: '14:54:12 UTC',
      14: '15:04:12 UTC'
    };

    return {
      isCompleted: defaultDone,
      stampedTime: defaultDone ? simulatedTimes[item.index] : null,
      isInProgress: defaultInProgress
    };
  };

  // Count completed
  const completedCount = RAMP_14_MILESTONES.filter(m => getMilestoneState(m).isCompleted).length;
  const progressPercent = Math.round((completedCount / RAMP_14_MILESTONES.length) * 100);

  return (
    <div id="ramp-agent-field-mode-container" className="space-y-4 max-w-6xl mx-auto select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Card: Ramp Agent Field Mode [GLOVE FRIENDLY] */}
      <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Ramp Agent Field Mode
              </h2>
              <span className="bg-[#eab308] text-black font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-xs">
                GLOVE FRIENDLY
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Extra-large touch targets with automatic UTC & GPS stamping.
            </p>
          </div>
        </div>

        {/* Flight Selector Pill Dropdown */}
        <div className="relative">
          <select
            id="ramp-flight-selector"
            value={activeFlightNbr}
            onChange={(e) => setActiveFlightNbr(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0f1d2d] hover:bg-[#15273c] text-white border border-[#1e3a5f] rounded-xl text-xs font-mono font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10 shadow-sm"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.flightNbr} className="bg-[#0b1320] text-white">
                {f.flightNbr} - Gate {f.gateNbr} ({f.companyName === 'Qatar Airways' ? 'DOH→LHR' : f.companyName === 'Tunisair' ? 'TUN→ORY' : f.companyName === 'Air France' ? 'CDG→TUN' : 'TUN→DXB'})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Flight Header Card */}
      <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/80 flex items-center justify-center text-sky-400 shrink-0">
            <Plane className="w-6 h-6 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
                {activeFlight.flightNbr}
              </h3>
              <span className="bg-[#1e293b] text-sky-300 font-bold px-2.5 py-0.5 rounded-lg text-xs border border-slate-700 font-mono">
                {activeFlight.reg} ({activeFlight.acType})
              </span>
            </div>
            <div className="text-xs text-[#94a3b8] font-mono mt-1 flex items-center gap-2 flex-wrap">
              <span>STAND <strong className="text-slate-200">{activeFlight.subplaneAreaZone}</strong></span>
              <span>•</span>
              <span>GATE <strong className="text-slate-200">{activeFlight.gateNbr}</strong></span>
              <span>•</span>
              <span>{activeFlight.companyName === 'Qatar Airways' ? 'DOH → LHR' : activeFlight.companyName === 'Tunisair' ? 'TUN → ORY' : 'CDG → TUN'}</span>
            </div>
          </div>
        </div>

        {/* Report Ramp Problem Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-report-ramp-problem"
            onClick={() => setIsProblemModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 border border-red-800/80 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>REPORT RAMP PROBLEM</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Progress Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b1320] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[#94a3b8]">Milestones</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{completedCount} / 14 ({progressPercent}%)</span>
        </div>

        <div className="bg-[#0b1320] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span className="text-[#94a3b8]">GPS Lock</span>
          </div>
          <span className="font-mono font-bold text-sky-300">±{currentGps.accuracy}m Stand 42</span>
        </div>

        <div className="bg-[#0b1320] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-[#94a3b8]">Zebra TC57</span>
          </div>
          <span className="font-mono font-bold text-slate-200">{batteryLevel}%</span>
        </div>

        <div className="bg-[#0b1320] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[#94a3b8]">OCC Sync</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">ONLINE</span>
        </div>
      </div>

      {/* 3. 14 Numbered Milestone Cards (2-Column Responsive Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {RAMP_14_MILESTONES.map((item) => {
          const state = getMilestoneState(item);

          // Card Styles depending on status
          let cardBg = 'bg-[#0f1d2d] border-[#1e3a5f] text-white hover:border-sky-500';
          let actionBoxBg = 'bg-[#1e293b] text-slate-400';
          let actionIcon = <Clock className="w-6 h-6" />;
          let subText = 'TAP TO STAMP UTC + GPS';
          let subTextColor = 'text-sky-300';

          if (state.isCompleted) {
            cardBg = 'bg-[#062e24] border-[#059669] text-white';
            actionBoxBg = 'bg-[#10b981] text-slate-950 font-black';
            actionIcon = <Check className="w-6 h-6 stroke-[3]" />;
            subText = `STAMPED: ${state.stampedTime || '13:40:12 UTC'} UTC`;
            subTextColor = 'text-emerald-300 font-mono';
          } else if (item.activeColorStyle === 'orange' || state.isInProgress) {
            // High visibility Orange in-progress card (e.g. 9. BAG LOAD START)
            cardBg = 'bg-[#ea580c] border-[#f97316] text-white shadow-lg shadow-orange-950/30';
            actionBoxBg = 'bg-[#c2410c] text-white';
            actionIcon = <Clock className="w-6 h-6 animate-pulse" />;
            subText = 'TAP TO STAMP UTC + GPS';
            subTextColor = 'text-orange-100 font-semibold';
          } else if (item.activeColorStyle === 'blue') {
            // Blue Active Target (e.g. 4. DISEMBARK START or 11. BOARDING DONE)
            cardBg = 'bg-[#0369a1] border-[#0284c7] text-white';
            actionBoxBg = 'bg-[#075985] text-white';
            actionIcon = <Clock className="w-6 h-6" />;
            subText = 'TAP TO STAMP UTC + GPS';
            subTextColor = 'text-sky-100 font-semibold';
          } else if (item.activeColorStyle === 'teal') {
            // Teal Active Target (e.g. 12. LOADSHEET SIGNED)
            cardBg = 'bg-[#0d9488] border-[#14b8a6] text-white';
            actionBoxBg = 'bg-[#115e59] text-white';
            actionIcon = <Clock className="w-6 h-6" />;
            subText = 'TAP TO STAMP UTC + GPS';
            subTextColor = 'text-teal-100 font-semibold';
          }

          return (
            <button
              key={item.index}
              id={`ramp-milestone-btn-${item.index}`}
              onClick={() => handleStampMilestone(item)}
              className={`w-full text-left rtl:text-right p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-md min-h-[76px] sm:min-h-[84px] ${cardBg}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm sm:text-base tracking-wide uppercase truncate">
                  {item.index}. {item.label}
                </h4>
                <p className={`text-xs sm:text-sm mt-1 tracking-wider uppercase font-mono ${subTextColor}`}>
                  {subText}
                </p>
              </div>

              {/* Extra-large glove-friendly touch button */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-90 ${actionBoxBg}`}>
                {actionIcon}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Quick Tools Bar */}
      <div className="bg-[#0b1320] border border-[#1e293b] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Logged as: {currentUser.name} ({currentUser.role})
          </span>
          <span>•</span>
          <span>Badge: <strong className="font-mono text-white">{currentUser.badgeId}</strong></span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-ramp-open-scanner"
            onClick={() => {
              if (onOpenScanner) onOpenScanner();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0284c7] hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Hold Baggage Scanner (Step 2)</span>
          </button>
        </div>
      </div>

      {/* Report Ramp Problem Modal */}
      {isProblemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1320] border border-red-800/80 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Report Ramp Problem (OCC Immediate Alert)</h3>
              </div>
              <button
                onClick={() => setIsProblemModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-bold mb-1">Flight Number</label>
                  <input
                    type="text"
                    readOnly
                    value={`${activeFlight.flightNbr} (${activeFlight.subplaneAreaZone})`}
                    className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] font-bold mb-1">Hold Position</label>
                  <select
                    value={holdDoorPosition}
                    onChange={(e) => setHoldDoorPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-white"
                  >
                    <option value="Hold 1 Fwd">Hold 1 Fwd Cargo Door</option>
                    <option value="Hold 2 Aft">Hold 2 Aft Cargo Door</option>
                    <option value="Hold 3 Bulk">Hold 3 Bulk Compartment</option>
                    <option value="Subplane Apron">Subplane Apron Area</option>
                    <option value="Passenger Bridge">Passenger Bridge / Stairs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-bold mb-1">Problem Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Baggage Discrepancy (Missing/Damaged)',
                    'Hold Latch / Netting Jammed',
                    'GSE Belt Loader Breakdown',
                    'Fueling Delay / Spill Alert',
                    'Loadsheet Weight Mismatch',
                    'Late Passenger / Gate Delay'
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProblemCategory(cat)}
                      className={`p-2.5 rounded-xl border text-left rtl:text-right transition-colors cursor-pointer ${
                        problemCategory === cat
                          ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                          : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-bold mb-1">Severity Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setProblemSeverity(sev)}
                      className={`flex-1 py-2 rounded-xl border uppercase font-bold text-center transition-colors cursor-pointer ${
                        problemSeverity === sev
                          ? sev === 'critical'
                            ? 'bg-red-600 text-white border-red-500'
                            : sev === 'medium'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-sky-600 text-white border-sky-500'
                          : 'bg-[#1e293b] border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] font-bold mb-1">Details & Operator Notes</label>
                <textarea
                  required
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe the apron incident, affected tag numbers, or delay reason..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="px-4 py-2 bg-[#1e293b] text-slate-300 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Alert to OCC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
