import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plane,
  UserCheck,
  CheckSquare,
  Clock,
  AlertTriangle,
  Send,
  Radio,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
  Battery,
  Wifi
} from 'lucide-react';
import { User, Flight, TaskPriority } from '../../types';

interface DispatchFlightTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedUserId?: string;
  preSelectedFlightId?: string;
}

export const DispatchFlightTaskModal: React.FC<DispatchFlightTaskModalProps> = ({
  isOpen,
  onClose,
  preSelectedUserId,
  preSelectedFlightId
}) => {
  const { t, isRtl } = useLanguage();
  const {
    users,
    flights,
    selectedFlight,
    dispatchFlightToRampAgent,
    turnaroundMilestones
  } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(preSelectedUserId || users[3]?.id || users[0]?.id);
  const [selectedFlightId, setSelectedFlightId] = useState<string>(preSelectedFlightId || selectedFlight?.id || flights[0]?.id);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [targetTime, setTargetTime] = useState<string>('14:20');
  const [notes, setNotes] = useState<string>('');
  const [selectedMilestoneCodes, setSelectedMilestoneCodes] = useState<string[]>([
    'HOLD_OPEN',
    'BAG_OFFLOAD_START',
    'BAG_LOAD_START',
    'BAG_LOAD_END',
    'HOLD_CLOSED'
  ]);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  const targetUser = users.find(u => u.id === selectedUserId) || users[0];
  const targetFlight = flights.find(f => f.id === selectedFlightId) || flights[0];

  // Available milestones for the target flight
  const flightMilestones = turnaroundMilestones.filter(m => m.flightNbr === targetFlight?.flightNbr);

  useEffect(() => {
    if (preSelectedUserId) setSelectedUserId(preSelectedUserId);
  }, [preSelectedUserId]);

  useEffect(() => {
    if (preSelectedFlightId) setSelectedFlightId(preSelectedFlightId);
  }, [preSelectedFlightId]);

  useEffect(() => {
    if (targetFlight && targetUser) {
      setTaskTitle(`Turnaround Ramp Handling & Hold Loading: ${targetFlight.flightNbr} (${targetFlight.companyName})`);
      setTargetTime(targetFlight.std || '14:30');
    }
  }, [selectedFlightId, selectedUserId]);

  if (!isOpen) return null;

  const toggleMilestone = (code: string) => {
    setSelectedMilestoneCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const applyPreset = (preset: 'ramp' | 'subplane' | 'sorting' | 'all') => {
    if (preset === 'ramp') {
      setSelectedMilestoneCodes(['HOLD_OPEN', 'BAG_OFFLOAD_START', 'BAG_OFFLOAD_END', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED']);
    } else if (preset === 'subplane') {
      setSelectedMilestoneCodes(['ATA', 'CHOCKS_ON', 'STAIRS_ON', 'GPU_ON', 'CLEAN_START', 'CLEAN_END', 'PUSH_BACK', 'ATD']);
    } else if (preset === 'sorting') {
      setSelectedMilestoneCodes(['BAG_OFFLOAD_START', 'BAG_LOAD_START']);
    } else {
      setSelectedMilestoneCodes(flightMilestones.map(m => m.code));
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !targetFlight) return;

    dispatchFlightToRampAgent({
      userId: targetUser.id,
      flightId: targetFlight.id,
      milestoneCodes: selectedMilestoneCodes,
      taskTitle: taskTitle || `Turnaround Ramp Dispatch: ${targetFlight.flightNbr}`,
      priority,
      targetTime,
      notes
    });

    setIsSuccessFeedback(true);
    setTimeout(() => {
      setIsSuccessFeedback(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="dispatch-flight-task-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Dispatch Flight & Turnaround Tasks</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-sky-400/20 text-sky-200 border border-sky-300/30">
                  OCC Super Admin
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Assign turnaround flight operations, cargo holds, and IATA milestones to ramp field agents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDispatch} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1 & 2: User and Flight Selection Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Agent Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>1. Select Ramp / Field Agent:</span>
              </label>

              <select
                id="select-dispatch-agent"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) • {u.badgeId}
                  </option>
                ))}
              </select>

              {targetUser && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                  <img
                    src={targetUser.avatarUrl}
                    alt={targetUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{targetUser.name}</div>
                    <div className="text-[11px] text-sky-700 font-semibold">{targetUser.role}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>Badge: {targetUser.badgeId}</span>
                      <span>•</span>
                      <span>Zone: {targetUser.assignedZone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Flight Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-sky-600" />
                <span>2. Target Turnaround Flight:</span>
              </label>

              <select
                id="select-dispatch-flight"
                value={selectedFlightId}
                onChange={(e) => setSelectedFlightId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              >
                {flights.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.flightNbr} • {f.companyName} (Gate {f.gateNbr} / Stand {f.subplaneAreaZone}) • STD {f.std}
                  </option>
                ))}
              </select>

              {targetFlight && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-slate-900">{targetFlight.flightNbr}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                      {targetFlight.companyName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono">
                    <span>AC: {targetFlight.acType} ({targetFlight.reg})</span>
                    <span className="text-emerald-700 font-bold">Stand: {targetFlight.subplaneAreaZone}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>STA {targetFlight.sta} → STD {targetFlight.std}</span>
                    <span>Expected Bags: {targetFlight.totalBagsExpected}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Step 3: Turnaround Milestones Checklist Selection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>3. Assign IATA Turnaround Milestones ({selectedMilestoneCodes.length} selected):</span>
              </label>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('ramp')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 cursor-pointer"
                >
                  Ramp Loading
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('subplane')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 cursor-pointer"
                >
                  Subplane Coord
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('sorting')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 cursor-pointer"
                >
                  Sorting Makeup
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-200 cursor-pointer"
                >
                  Select All
                </button>
              </div>
            </div>

            {/* Milestones Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {flightMilestones.map(m => {
                const isSelected = selectedMilestoneCodes.includes(m.code);
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-300 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMilestone(m.code)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] font-mono text-sky-800">{m.code}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.scheduledTime}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-800 truncate">{m.title}</div>
                      <div className="text-[9px] text-slate-400">{m.category}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 4: Priority, Deadline and Task Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Priority:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Normal">Normal Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical (SLA Watch)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Deadline:
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Field Telemetry:
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Zebra TC57x</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Battery className="w-3.5 h-3.5" />
                  <span>88%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              OCC Dispatch Instructions / Ramp Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority bags in Hold 1 Fwd. Ensure quick turnaround within 35 minutes."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Session will auto-sync with agent's handheld Zebra terminal</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="btn-confirm-dispatch-flight"
                disabled={isSuccessFeedback}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  isSuccessFeedback
                    ? 'bg-emerald-600 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 shadow-sky-600/20 active:scale-98'
                }`}
              >
                {isSuccessFeedback ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Dispatched Successfully!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Flight & Tasks to Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
