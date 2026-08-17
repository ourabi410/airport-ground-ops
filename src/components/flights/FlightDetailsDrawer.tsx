import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plane,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Clock,
  Layers,
  MapPin,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Smartphone,
  Battery,
  Wifi,
  Plus,
  Compass,
  Check,
  Send,
  UserCheck,
  Tag,
  Luggage
} from 'lucide-react';
import { Flight, Baggage, MilestoneStatus, TurnaroundMilestone } from '../../types';
import { exportTurnaroundPdf, exportBingosPdf, exportFlightExcel } from '../../lib/exportReports';
import { GpsLocationModal } from '../common/GpsLocationModal';

interface FlightDetailsDrawerProps {
  flight: Flight | null;
  onClose: () => void;
  onEdit: (flight: Flight) => void;
}

export const FlightDetailsDrawer: React.FC<FlightDetailsDrawerProps> = ({
  flight,
  onClose,
  onEdit
}) => {
  const { t, isRtl } = useLanguage();
  const {
    lockFlight,
    unlockFlight,
    baggage,
    turnaroundMilestones,
    agentSessions,
    updateMilestoneStatus,
    startAgentSession,
    setActiveTab,
    setSelectedFlightId,
    currentUser,
    users,
    addFlightComment,
    auditLogs
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'turnaround' | 'baggage' | 'sessions' | 'comments'>('turnaround');
  const [selectedMilestoneForGps, setSelectedMilestoneForGps] = useState<TurnaroundMilestone | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentCat, setNewCommentCat] = useState<'general' | 'discrepancy' | 'security' | 'loading' | 'delay'>('loading');
  const [bagSearchQuery, setBagSearchQuery] = useState('');
  const [bagStatusFilter, setBagStatusFilter] = useState('ALL');

  if (!flight) return null;

  const flightBags = baggage.filter(b => b.flightNbr === flight.flightNbr);
  const loadedCount = flightBags.filter(b => b.status === 'LOADED').length;
  const sortedCount = flightBags.filter(b => b.status === 'SORTED' || b.status === 'LOADED').length;
  const missingCount = flightBags.filter(b => b.status === 'MISSING').length;
  const percent = flight.totalBagsExpected > 0 ? Math.round((loadedCount / flight.totalBagsExpected) * 100) : 0;

  const flightMilestones = turnaroundMilestones.filter(m => m.flightNbr === flight.flightNbr);
  const completedMilestonesCount = flightMilestones.filter(m => m.status === 'COMPLETED').length;
  const flightAgentSessions = agentSessions.filter(s => s.flightNbr === flight.flightNbr);

  const filteredBags = flightBags.filter(b => {
    if (bagStatusFilter !== 'ALL' && b.status !== bagStatusFilter) return false;
    if (bagSearchQuery.trim()) {
      const q = bagSearchQuery.toLowerCase();
      return (
        b.tagNumber.toLowerCase().includes(q) ||
        b.passengerName.toLowerCase().includes(q) ||
        b.seatNumber.toLowerCase().includes(q) ||
        b.holdLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addFlightComment(flight.id, newCommentText.trim(), newCommentCat);
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto p-5 sm:p-7 space-y-5 flex flex-col justify-between"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="space-y-5">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-sm border border-sky-200">
                {flight.companyName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">{flight.flightNbr}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    flight.status === 'Departed' || flight.isLocked
                      ? 'bg-slate-100 text-slate-800 border border-slate-300'
                      : flight.status === 'Reconciled'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : flight.status === 'Loading'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {flight.status}
                  </span>
                  {flight.isLocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <p className="text-xs text-slate-500">
                  {flight.companyName} • {flight.reg} ({flight.acType}) • Gate {flight.gateNbr} • Stand {flight.subplaneAreaZone}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics & Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Baggage Loading</span>
                <span className="font-bold text-sky-900 font-mono">{loadedCount} / {flight.totalBagsExpected} ({percent}%)</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Turnaround Progress</span>
                <span className="font-bold text-emerald-700 font-mono">{completedMilestonesCount} / {flightMilestones.length || 21} Steps</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-print-turnaround-pdf"
                onClick={() => exportTurnaroundPdf(flight, turnaroundMilestones, baggage, agentSessions)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Download Official PDF Turnaround Report"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Print Report</span>
              </button>

              <button
                id="btn-print-bingos-pdf"
                onClick={() => exportBingosPdf(flight, baggage, currentUser)}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Download Official IATA BINGOS Luggage Manifest Sheet"
              >
                <FileText className="w-3.5 h-3.5 text-sky-200" />
                <span>Print BINGOS</span>
              </button>

              <button
                id="btn-export-excel-xlsx"
                onClick={() => exportFlightExcel(flight, turnaroundMilestones, baggage, auditLogs)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Export Multi-Sheet Turnaround Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
            <button
              onClick={() => setActiveSubTab('turnaround')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'turnaround'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Turnaround Milestones ({completedMilestonesCount}/{flightMilestones.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('baggage')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'baggage'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Luggage className="w-4 h-4 text-sky-600" />
              <span>Baggage Manifest & BINGOS ({flightBags.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sessions')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'sessions'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>Active Agent Sessions ({flightAgentSessions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('comments')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'comments'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Notes & Logs ({flight.comments.length})</span>
            </button>
          </div>

          {/* TAB 1: TURNAROUND MILESTONES */}
          {activeSubTab === 'turnaround' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Click milestone button to record completion with exact GPS coordinates & agent timestamp.</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {flightMilestones.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition-all ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-sky-50/50 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                            {m.code}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                            {m.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>Target: <strong className="text-slate-700">{m.scheduledTime}</strong></span>
                          {m.actualTime && (
                            <span className="text-emerald-700 font-bold">
                              Actual: {m.actualTime}
                            </span>
                          )}
                          {m.completedByUserName && (
                            <span>Agent: <strong className="text-slate-700">{m.completedByUserName}</strong></span>
                          )}
                          {m.gpsLatitude && (
                            <button
                              onClick={() => setSelectedMilestoneForGps(m)}
                              className="text-sky-700 hover:text-sky-900 font-mono underline flex items-center gap-1 cursor-pointer"
                              title="Click to view Ramp GPS Map Pin"
                            >
                              <MapPin className="w-3 h-3 text-sky-600" />
                              <span>{m.gpsLatitude.toFixed(4)}°N, {m.gpsLongitude?.toFixed(4)}°E</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Milestone State Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.status !== 'COMPLETED' ? (
                          <>
                            <button
                              onClick={() => updateMilestoneStatus(m.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                            {m.status !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => updateMilestoneStatus(m.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                In Progress
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                            <button
                              onClick={() => updateMilestoneStatus(m.id, 'PENDING')}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BAGGAGE MANIFEST & BINGOS */}
          {activeSubTab === 'baggage' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Search passenger, seat, tag..."
                  value={bagSearchQuery}
                  onChange={(e) => setBagSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-64 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />

                <div className="flex items-center gap-1">
                  {['ALL', 'LOADED', 'SORTED', 'MISSING'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBagStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        bagStatusFilter === st
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Tag Barcode</th>
                      <th className="p-2.5">Passenger</th>
                      <th className="p-2.5">Seat/Dest</th>
                      <th className="p-2.5">Hold Location</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Loading Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredBags.map((bag) => (
                      <tr key={bag.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{bag.tagNumber}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{bag.passengerName}</div>
                          <div className="text-[10px] text-slate-400">{bag.classType} • {bag.weightKg} kg</div>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {bag.seatNumber} ({bag.destination})
                        </td>
                        <td className="p-2.5 font-bold text-sky-800">
                          {bag.holdLocation}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bag.status === 'LOADED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bag.status === 'SORTED'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {bag.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px]">
                          {bag.loadingUser || '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE AGENT SESSIONS */}
          {activeSubTab === 'sessions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Live GPS & device telemetry of agents on this flight</span>
                <button
                  onClick={() => startAgentSession(flight.id, currentUser.id)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join / Start Active Field Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flightAgentSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{session.agentName}</h4>
                          <p className="text-[10px] text-slate-500">{session.agentRole} ({session.badgeId})</p>
                        </div>
                      </div>

                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{session.deviceModel.slice(0, 22)}</span>
                        </span>
                        <span className="font-mono text-emerald-700 font-bold">{session.batteryLevel}% Bat</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="flex items-center gap-1 text-sky-700 font-mono font-semibold">
                          <MapPin className="w-3 h-3" />
                          <span>{session.currentGps.latitude.toFixed(4)}°N, {session.currentGps.longitude.toFixed(4)}°E</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{session.currentGps.zoneName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NOTES & LOGS */}
          {activeSubTab === 'comments' && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <select
                  value={newCommentCat}
                  onChange={(e) => setNewCommentCat(e.target.value as any)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 font-bold bg-slate-50 text-slate-700"
                >
                  <option value="loading">Loading</option>
                  <option value="discrepancy">Discrepancy</option>
                  <option value="security">Security</option>
                  <option value="delay">Delay</option>
                  <option value="general">General</option>
                </select>
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type note / discrepancy / handover log..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {flight.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                      <span>{c.authorName} ({c.authorRole}) • [{c.category.toUpperCase()}]</span>
                      <span>{c.timestamp}</span>
                    </div>
                    <p className="text-slate-800">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedFlightId(flight.id);
              setActiveTab('baggage');
              onClose();
            }}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:from-sky-700 hover:to-blue-800 transition-all cursor-pointer shadow-md shadow-sky-600/20"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Open Dedicated Baggage Reconciliation Screen</span>
          </button>

          <div className="flex items-center gap-2">
            {!flight.isLocked ? (
              <>
                <button
                  onClick={() => {
                    onEdit(flight);
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => lockFlight(flight.id)}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('lockFlight')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => unlockFlight(flight.id)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{t('unlockFlight')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>

      </div>

      {/* GPS Location Pin Modal */}
      {selectedMilestoneForGps && (
        <GpsLocationModal
          isOpen={true}
          onClose={() => setSelectedMilestoneForGps(null)}
          title={`Milestone GPS Telemetry: ${selectedMilestoneForGps.title}`}
          locationName={selectedMilestoneForGps.rampStand || flight.subplaneAreaZone}
          latitude={selectedMilestoneForGps.gpsLatitude || 36.85124}
          longitude={selectedMilestoneForGps.gpsLongitude || 10.22742}
          accuracyMeters={selectedMilestoneForGps.gpsAccuracyMeters || 1.8}
          timestamp={selectedMilestoneForGps.actualTime ? `${flight.date} ${selectedMilestoneForGps.actualTime}` : undefined}
          agentName={selectedMilestoneForGps.completedByUserName || 'Field Agent'}
          flightNbr={flight.flightNbr}
        />
      )}
    </div>
  );
};
