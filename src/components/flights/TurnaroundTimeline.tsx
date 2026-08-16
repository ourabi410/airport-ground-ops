import React, { useState } from 'react';
import { Flight, OperationalEvent, TurnaroundMilestoneType, EventStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatUtcTime, formatUtcShort, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  MapPin,
  Camera,
  User,
  Shield,
  Smartphone,
  Edit3,
  Check,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface TurnaroundTimelineProps {
  flight: Flight;
}

const STANDARD_MILESTONES: {
  type: TurnaroundMilestoneType;
  title: string;
  category: OperationalEvent['category'];
  defaultTargetOffsetMin: number; // minutes from on-block
}[] = [
  { type: 'LANDING', title: 'Aircraft Touchdown', category: 'ARRIVAL', defaultTargetOffsetMin: -5 },
  { type: 'ON_BLOCK', title: 'On Block (AIBT)', category: 'ARRIVAL', defaultTargetOffsetMin: 0 },
  { type: 'CHOCKS_ON', title: 'Chocks Placed & GPU Connected', category: 'ARRIVAL', defaultTargetOffsetMin: 2 },
  { type: 'DOOR_OPEN', title: 'Door 1L Open & Jetbridge Docked', category: 'ARRIVAL', defaultTargetOffsetMin: 3 },
  { type: 'DISEMBARK_STARTED', title: 'Disembarkation Started', category: 'ARRIVAL', defaultTargetOffsetMin: 5 },
  { type: 'BAGGAGE_UNLOAD_STARTED', title: 'Baggage Offload Started', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 7 },
  { type: 'DISEMBARK_COMPLETED', title: 'Disembarkation Completed', category: 'ARRIVAL', defaultTargetOffsetMin: 20 },
  { type: 'BAGGAGE_UNLOAD_COMPLETED', title: 'Baggage Offload Completed', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 25 },
  { type: 'CLEANING_STARTED', title: 'Cabin Cleaning Started', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 22 },
  { type: 'CATERING_STARTED', title: 'Catering Hi-Lift Docked', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 25 },
  { type: 'CLEANING_COMPLETED', title: 'Cleaning & Security Check Done', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 45 },
  { type: 'CATERING_COMPLETED', title: 'Catering Loading Completed', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 48 },
  { type: 'FUEL_STARTED', title: 'Refueling Started', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 30 },
  { type: 'FUEL_COMPLETED', title: 'Refueling Completed', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 55 },
  { type: 'BAGGAGE_LOAD_STARTED', title: 'Outbound Baggage Loading Started', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 40 },
  { type: 'BAGGAGE_LOAD_COMPLETED', title: 'Outbound Baggage Loading Completed', category: 'GROUND_SERVICES', defaultTargetOffsetMin: 65 },
  { type: 'BOARDING_STARTED', title: 'Passenger Boarding Started', category: 'DEPARTURE', defaultTargetOffsetMin: 50 },
  { type: 'BOARDING_COMPLETED', title: 'Boarding Completed & Reconciled', category: 'DEPARTURE', defaultTargetOffsetMin: 75 },
  { type: 'FINAL_LOADSHEET_SIGNED', title: 'Final Loadsheet (EDP) Accepted', category: 'DEPARTURE', defaultTargetOffsetMin: 80 },
  { type: 'DOORS_CLOSED', title: 'All Cabin Doors Closed & Armed', category: 'DEPARTURE', defaultTargetOffsetMin: 82 },
  { type: 'CHOCKS_OFF', title: 'Chocks Removed & Tug Connected', category: 'DEPARTURE', defaultTargetOffsetMin: 88 },
  { type: 'PUSHBACK', title: 'Pushback Authorized & Commenced', category: 'DEPARTURE', defaultTargetOffsetMin: 90 },
  { type: 'OFF_BLOCK', title: 'Off Block (AOBT)', category: 'DEPARTURE', defaultTargetOffsetMin: 90 },
];

export const TurnaroundTimeline: React.FC<TurnaroundTimelineProps> = ({ flight }) => {
  const {
    events,
    currentUser,
    recordMilestoneEvent,
    correctOperationalEvent,
    setQuickEventModalOpen,
  } = useApp();

  const flightEvents = events.filter((e) => e.flightId === flight.id);

  // Selected event for correction modal
  const [editingEvent, setEditingEvent] = useState<OperationalEvent | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<EventStatus>('COMPLETED');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Quick 1-tap stamp
  const handleQuickStamp = async (milestone: (typeof STANDARD_MILESTONES)[0]) => {
    await recordMilestoneEvent({
      flightId: flight.id,
      eventType: milestone.type,
      eventTitle: milestone.title,
      category: milestone.category,
      status: 'COMPLETED',
      notes: `Recorded at Gate ${flight.gate} by ${currentUser.name}`,
      gate: flight.gate,
      stand: flight.stand,
    });
  };

  const handleSaveCorrection = async () => {
    if (!editingEvent || !correctionReason.trim()) return;
    await correctOperationalEvent({
      eventId: editingEvent.id,
      newStatus: correctionStatus,
      newNotes: correctionNotes,
      reason: correctionReason,
    });
    setEditingEvent(null);
    setCorrectionReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Authoritative Turnaround Timeline</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only operational milestone log stamped with UTC & GPS coordinates.
          </p>
        </div>

        <button
          onClick={() => setQuickEventModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          <span>+ Custom Event</span>
        </button>
      </div>

      {/* Interactive Timeline List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-700 space-y-4">
          
          {STANDARD_MILESTONES.map((m) => {
            const recorded = flightEvents.find((e) => e.eventType === m.type);
            const isCompleted = recorded?.status === 'COMPLETED';
            const isInProgress = recorded?.status === 'IN_PROGRESS';
            const isProblem = recorded?.status === 'PROBLEM' || recorded?.status === 'DELAYED';

            return (
              <div key={m.type} className="relative group">
                
                {/* Node Dot / Status Icon */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-2.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-slate-900 text-white shadow-sm'
                      : isInProgress
                      ? 'bg-amber-400 border-slate-900 text-slate-950 animate-pulse shadow-sm'
                      : isProblem
                      ? 'bg-red-500 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-700 border-slate-900 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isInProgress ? (
                    <Clock className="w-3 h-3 animate-spin" />
                  ) : isProblem ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  )}
                </div>

                {/* Milestone Card */}
                <div
                  className={`p-3.5 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-slate-900/70 border-slate-700 hover:border-slate-600'
                      : isInProgress
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : isProblem
                      ? 'bg-red-500/10 border-red-500/40'
                      : 'bg-slate-900/40 border-slate-700/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Left: Milestone Title & Category */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{m.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 border border-slate-600">
                          {m.category}
                        </span>
                        {recorded?.isCorrected && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300">
                            CORRECTED
                          </span>
                        )}
                      </div>

                      {/* Timestamps: UTC Authoritative + Local Airport Time */}
                      {recorded ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs font-mono">
                          <span className="text-blue-400 font-bold">
                            {formatUtcTime(recorded.eventTimeUtc)}
                          </span>
                          <span className="text-slate-400">
                            Local: {formatLocalAirportTime(recorded.eventTimeUtc, 3)}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{recorded.userName} ({recorded.userRole})</span>
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          Target offset: T+{m.defaultTargetOffsetMin}m · Pending stamp
                        </div>
                      )}
                    </div>

                    {/* Right: Actions & Status Pills */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {recorded ? (
                        <>
                          {/* Sync Status Badge */}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              recorded.syncStatus === 'SYNCED'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                            }`}
                          >
                            {recorded.syncStatus}
                          </span>

                          {/* GPS Badge */}
                          {recorded.gps && (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 border border-slate-600 text-slate-300 flex items-center gap-1"
                              title={`Lat: ${recorded.gps.latitude}, Lng: ${recorded.gps.longitude} (±${recorded.gps.accuracy}m)`}
                            >
                              <MapPin className="w-3 h-3 text-blue-400" />
                              <span>±{recorded.gps.accuracy}m</span>
                            </span>
                          )}

                          {/* Supervisory Correction Button */}
                          {(currentUser.role === 'supervisor' || currentUser.role === 'ops_manager' || currentUser.role === 'admin') && (
                            <button
                              onClick={() => {
                                setEditingEvent(recorded);
                                setCorrectionNotes(recorded.notes || '');
                                setCorrectionStatus(recorded.status);
                              }}
                              className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                              title="Supervisory correction"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          id={`stamp-btn-${m.type.toLowerCase()}`}
                          onClick={() => handleQuickStamp(m)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>1-TAP STAMP</span>
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Notes & Evidence Thumbnail if present */}
                  {recorded?.notes && (
                    <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-mono text-[10px] uppercase">Notes: </span>
                      {recorded.notes}
                    </div>
                  )}

                  {recorded?.photoUrl && (
                    <div className="mt-2 flex items-center space-x-2">
                      <img
                        src={recorded.photoUrl}
                        alt="Ramp Evidence"
                        onClick={() => setSelectedPhoto(recorded.photoUrl!)}
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <span className="text-[11px] text-sky-400 font-mono flex items-center space-x-1">
                        <Camera className="w-3 h-3" />
                        <span>Ramp Photo Attached</span>
                      </span>
                    </div>
                  )}

                  {/* Correction History Banner */}
                  {recorded?.isCorrected && (
                    <div className="mt-2 text-[11px] bg-purple-950/30 border border-purple-800/40 p-2 rounded-lg text-purple-300 font-mono">
                      <div className="flex items-center space-x-1 font-semibold">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Audit Note: Corrected by {recorded.correctedBy} at {formatUtcTime(recorded.correctedAt)}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">Reason: {recorded.correctionReason}</div>
                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Supervisory Correction Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Supervisory Event Correction</h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div>Event: <span className="text-sky-400 font-bold">{editingEvent.eventTitle}</span></div>
              <div>Authoritative UTC: <span className="text-slate-200">{formatUtcTime(editingEvent.eventTimeUtc)}</span></div>
              <div>Original Agent: <span className="text-slate-200">{editingEvent.userName}</span></div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">NEW STATUS</label>
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value as EventStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="PROBLEM">PROBLEM</option>
                <option value="DELAYED">DELAYED</option>
                <option value="SKIPPED">SKIPPED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">MANDATORY CORRECTION REASON *</label>
              <input
                type="text"
                required
                placeholder="e.g. Corrected gate bridge docking time after CCTV audit verification"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">UPDATED OPERATIONAL NOTES</label>
              <textarea
                rows={2}
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={!correctionReason.trim()}
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
              >
                Sign & Save Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] bg-slate-900 p-2 rounded-xl border border-slate-800">
            <img src={selectedPhoto} alt="Ramp Evidence Large" className="max-h-[75vh] w-auto rounded-lg" />
            <div className="p-2 text-center text-xs text-slate-400 font-mono">
              Click anywhere to close evidence view
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
