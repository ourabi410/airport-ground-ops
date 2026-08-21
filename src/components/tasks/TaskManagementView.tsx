import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plane,
  X,
  ListTodo,
  Check,
  MapPin,
  Smartphone,
  Battery,
  Wifi,
  Radio,
  FileSpreadsheet,
  Printer,
  FileText,
  UserCheck,
  Filter,
  RefreshCw,
  Search,
  Compass,
  PlayCircle,
  Mail,
  Building2,
  Bell,
  Send
} from 'lucide-react';
import {
  Flight,
  FlightTaskItem,
  TaskStatus,
  TaskPriority,
  UserRole,
  TurnaroundMilestone,
  MilestoneStatus,
  MilestoneCategory
} from '../../types';
import { exportTurnaroundPdf, exportFlightExcel, exportBingosPdf } from '../../lib/exportReports';
import { GpsLocationModal } from '../common/GpsLocationModal';
import { DispatchFlightTaskModal } from '../common/DispatchFlightTaskModal';

export const TaskManagementView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const {
    tasks,
    addTask,
    updateTaskStatus,
    toggleTaskChecklist,
    sendTaskReminder,
    checkTaskReminders,
    turnaroundMilestones,
    updateMilestoneStatus,
    assignMilestoneAgent,
    agentSessions,
    startAgentSession,
    pingAgentSessionGps,
    endAgentSession,
    flights,
    companies,
    baggage,
    users,
    currentUser,
    auditLogs,
    setActiveTab: setGlobalActiveTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'turnaround' | 'sessions' | 'customTasks'>('turnaround');
  const [selectedFlightNbr, setSelectedFlightNbr] = useState<string>('TU-720');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMilestoneForGps, setSelectedMilestoneForGps] = useState<TurnaroundMilestone | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  // Email Reminder feedback state
  const [sendingReminderTaskId, setSendingReminderTaskId] = useState<string | null>(null);
  const [reminderNotification, setReminderNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    taskTitle: '',
    flightNbr: 'TU-720',
    category: 'Loading' as FlightTaskItem['category'],
    assignedRole: 'Ramp/Loading Agent' as UserRole,
    assignedUserId: users[0]?.id || 'USR-001',
    assignedUserName: users[0]?.name || 'Slimane Soltane',
    priority: 'High' as TaskPriority,
    targetTime: '10:34',
    status: 'Pending' as TaskStatus,
    checklist: [
      { id: 'c1', text: 'Verify aircraft hold door open and cleared', done: false },
      { id: 'c2', text: 'Ensure handheld Zebra scanner in Hold Loading mode', done: false },
      { id: 'c3', text: 'Verify hold netting and secure barrier', done: false }
    ]
  });

  const defaultFlight: Flight = {
    id: 'FLT-001',
    date: new Date().toISOString().slice(0, 10),
    flightNbr: 'TU-720',
    flightTask: 'Ground Turnaround & Rapid Loading',
    paxNbrDep: 142,
    paxNbrArr: 138,
    gateNbr: '14',
    flightType: 'Commercial Pax',
    acType: 'A320neo',
    checkInStartTime: '12:00',
    sta: '13:30',
    std: '14:25',
    companyName: 'Tunisair',
    reg: 'TS-IMU',
    subplaneAreaZone: 'Stand 14',
    sortingAreaZone: 'Carousel 02',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mohamed Dridi',
    createdBy: 'Slimane Soltane',
    status: 'Loading',
    isLocked: false,
    totalBagsExpected: 140,
    bagsSortedCount: 140,
    bagsLoadedCount: 95,
    comments: [],
    dollyIds: []
  };

  const selectedFlightObj: Flight = flights.find(f => f.flightNbr === selectedFlightNbr) || flights[0] || defaultFlight;

  const filteredMilestones = turnaroundMilestones.filter(m => {
    if (selectedFlightNbr !== 'ALL' && m.flightNbr !== selectedFlightNbr) return false;
    if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.completedByUserName && m.completedByUserName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeFlightSessions = agentSessions.filter(s =>
    selectedFlightNbr === 'ALL' ? s.isActive : (s.flightNbr === selectedFlightNbr && s.isActive)
  );

  const completedCount = turnaroundMilestones.filter(m => 
    (selectedFlightNbr === 'ALL' || m.flightNbr === selectedFlightNbr) && m.status === 'COMPLETED'
  ).length;

  const totalFlightMilestones = turnaroundMilestones.filter(m => 
    selectedFlightNbr === 'ALL' || m.flightNbr === selectedFlightNbr
  ).length;

  const progressPercent = totalFlightMilestones > 0 ? Math.round((completedCount / totalFlightMilestones) * 100) : 0;

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskTitle.trim()) return;

    const matchedUser = users.find(u => u.name === formData.assignedUserName) || users[0];

    addTask({
      ...formData,
      assignedUserId: matchedUser.id,
      assignedUserName: matchedUser.name,
      assignedRole: matchedUser.role
    });

    setReminderNotification({
      message: `✓ Task "${formData.taskTitle}" created! Scheduled due at ${formData.targetTime}. Email alert sent to ${matchedUser.email}.`,
      type: 'success'
    });
    setTimeout(() => setReminderNotification(null), 5000);

    setIsModalOpen(false);
  };

  const handleSendReminder = async (taskId: string) => {
    setSendingReminderTaskId(taskId);
    try {
      const res = await sendTaskReminder(taskId);
      if (res.success) {
        setReminderNotification({ message: `✓ ${res.message} (${res.recipient || ''})`, type: 'success' });
      } else {
        setReminderNotification({ message: `⚠️ ${res.message}`, type: 'error' });
      }
    } catch (e) {
      setReminderNotification({ message: 'Failed to send reminder email', type: 'error' });
    } finally {
      setSendingReminderTaskId(null);
      setTimeout(() => setReminderNotification(null), 5000);
    }
  };

  const handleTriggerAllReminders = async () => {
    try {
      await checkTaskReminders(true);
      setReminderNotification({ message: '✓ All due scheduled task reminders checked and dispatched via email!', type: 'success' });
      setTimeout(() => setReminderNotification(null), 5000);
    } catch (e) {
      setReminderNotification({ message: 'Failed to dispatch reminders', type: 'error' });
    }
  };

  return (
    <div id="task-management-container" className="space-y-6">
      
      {/* Reminder Notification Toast */}
      {reminderNotification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
          reminderNotification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : 'bg-rose-900/90 border-rose-500/50 text-rose-100'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>{reminderNotification.message}</span>
          </div>
          <button onClick={() => setReminderNotification(null)} className="text-slate-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <CheckSquare className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t('taskTitle')}</h1>
              <p className="text-xs text-slate-500">
                Ground Handling Turnaround Milestones, Agent Field Sessions & Dynamic Customer Tasks
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-open-ramp-glove-mode-banner"
            onClick={() => setGlobalActiveTab('ramp_field')}
            className="px-3 py-2 bg-[#0b1320] hover:bg-black text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Open Large Touch Ramp Agent Field Mode"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Ramp Glove Mode</span>
          </button>

          <button
            id="btn-quick-export-turnaround"
            onClick={() => exportTurnaroundPdf(selectedFlightObj, turnaroundMilestones, baggage)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download PDF Turnaround Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('btnPrintReport')}</span>
          </button>

          <button
            id="btn-quick-export-excel"
            onClick={() => exportFlightExcel(selectedFlightObj, turnaroundMilestones, baggage, users)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export XLSX Turnaround Audit"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('btnExportExcel')}</span>
          </button>

          <button
            id="btn-open-dispatch-modal"
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch Tasks</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('turnaround')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'turnaround'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Turnaround Milestones Matrix ({filteredMilestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Active Agent Field Sessions ({activeFlightSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customTasks')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'customTasks'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Ad-Hoc Flight Tasks & Reminders ({tasks.length})</span>
        </button>
      </div>

      {/* TAB 1: TURNAROUND MILESTONES MATRIX */}
      {activeTab === 'turnaround' && (
        <div className="space-y-4">
          
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search milestone code, title, agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">Category:</span>
              {['ALL', 'Arrival', 'Servicing', 'Baggage', 'Fueling', 'Cleaning', 'Boarding', 'Departure'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Milestones Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Code & Milestone</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Scheduled / Target</th>
                    <th className="p-3.5">Actual Time</th>
                    <th className="p-3.5">Handling Agent & GPS Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredMilestones.map((milestone) => (
                    <tr
                      key={milestone.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        milestone.status === 'COMPLETED' ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Code & Title */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {milestone.code}
                          </span>
                          <span className="font-bold text-slate-900">{milestone.title}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          milestone.category === 'Baggage'
                            ? 'bg-sky-100 text-sky-800'
                            : milestone.category === 'Arrival'
                            ? 'bg-indigo-100 text-indigo-800'
                            : milestone.category === 'Departure'
                            ? 'bg-purple-100 text-purple-800'
                            : milestone.category === 'Fueling'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {milestone.category}
                        </span>
                      </td>

                      {/* Scheduled */}
                      <td className="p-3.5 font-mono text-slate-600">
                        {milestone.scheduledTime} <span className="text-[10px] text-slate-400">({milestone.targetOffsetMinutes > 0 ? `+${milestone.targetOffsetMinutes}` : milestone.targetOffsetMinutes}m)</span>
                      </td>

                      {/* Actual */}
                      <td className="p-3.5">
                        {milestone.actualTime ? (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {milestone.actualTime}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">--:--:--</span>
                        )}
                      </td>

                      {/* Agent & GPS */}
                      <td className="p-3.5">
                        {milestone.completedByUserName ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                              <span>{milestone.completedByUserName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({milestone.completedByUserRole})</span>
                            </div>
                            {milestone.gpsLatitude && (
                              <button
                                onClick={() => setSelectedMilestoneForGps(milestone)}
                                className="text-[11px] text-sky-700 hover:text-sky-900 font-mono underline flex items-center gap-1 cursor-pointer"
                                title="View exact GPS Ramp Map Pin"
                              >
                                <MapPin className="w-3 h-3 text-sky-600" />
                                <span>{milestone.gpsLatitude.toFixed(5)}°N, {milestone.gpsLongitude?.toFixed(5)}°E</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={milestone.completedByUserId || ''}
                              onChange={(e) => assignMilestoneAgent(milestone.id, e.target.value)}
                              className="text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                              <option value="">Assign Agent...</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                          milestone.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {milestone.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{milestone.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {milestone.status !== 'COMPLETED' ? (
                            <>
                              <button
                                onClick={() => updateMilestoneStatus(milestone.id, 'COMPLETED')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                                title="Mark Completed (Captures GPS & Timestamp)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                              {milestone.status !== 'IN_PROGRESS' && (
                                <button
                                  onClick={() => updateMilestoneStatus(milestone.id, 'IN_PROGRESS')}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold border border-sky-200 transition-colors cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => updateMilestoneStatus(milestone.id, 'PENDING')}
                              className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE AGENT FIELD SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Ground Handling Field Sessions</h3>
              <p className="text-xs text-slate-500">Live telemetry, battery levels, and GPS tracking of field agents on apron</p>
            </div>

            <button
              onClick={() => startAgentSession(selectedFlightObj.id, currentUser.id)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Field Agent Device</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFlightSessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold border border-sky-200">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{session.agentName}</h4>
                      <p className="text-xs text-slate-500">{session.agentRole} ({session.badgeId})</p>
                    </div>
                  </div>

                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{session.deviceModel}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Battery: <strong className="text-slate-800">{session.batteryLevel}%</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-sky-600" />
                      <span>{session.signalStrength}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1 text-sky-700 font-mono font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{session.currentGps.latitude.toFixed(5)}°N, {session.currentGps.longitude.toFixed(5)}°E</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{session.currentGps.zoneName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">Last ping: {session.lastPingAt.slice(-8)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => pingAgentSessionGps(session.sessionId)}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 cursor-pointer"
                      title="Simulate GPS Ping"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => endAgentSession(session.sessionId)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 cursor-pointer"
                    >
                      Close Session
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AD-HOC CUSTOM FLIGHT TASKS & REMINDERS */}
      {activeTab === 'customTasks' && (
        <div className="space-y-4">
          {/* Action Header for Tasks */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Ad-Hoc Flight Tasks, Checklists & Email Reminders</span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] rounded-full font-bold">
                  {tasks.length} Active Tasks
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Customer airline location & stand updates propagate dynamically in real-time. Automated email reminders trigger on target schedules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerAllReminders}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Send Reminder Emails for all tasks due now"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>Check & Trigger Reminders</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Task</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const flight = flights.find(f => f.flightNbr === task.flightNbr);
              const company = companies.find(c => 
                c.name === (task.customerName || flight?.companyName) ||
                c.abbreviation === (task.customerName || flight?.companyName) ||
                c.iata === (task.customerName || flight?.companyName)
              );
              const dynamicCustomerName = company?.name || task.customerName || flight?.companyName || 'Airline Partner';
              const dynamicCustomerHub = company?.hub || task.customerHub || flight?.companyHub || 'Main Hub (TUN)';
              const dynamicStand = flight?.subplaneAreaZone || task.standZone || 'Apron Stand';
              const dynamicGate = flight?.gateNbr || task.gateNbr || '';
              const matchedUser = users.find(u => u.id === task.assignedUserId || u.name === task.assignedUserName);

              return (
                <div
                  key={task.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs space-y-3 transition-all ${
                    task.status === 'Completed' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* Top Bar: Flight Nbr + Customer + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white font-mono">
                        {task.flightNbr}
                      </span>
                      {company?.iata && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 font-mono">
                          {company.iata}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'Critical' ? 'bg-purple-100 text-purple-800' :
                        task.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  {/* Task Title & Assignee */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{task.taskTitle}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned: <strong className="text-slate-800">{task.assignedUserName}</strong> ({task.assignedRole})
                    </p>
                  </div>

                  {/* Dynamic Location & Customer Information Box */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer:</span>
                      </span>
                      <strong className="text-slate-900 truncate max-w-[170px]" title={dynamicCustomerName}>
                        {dynamicCustomerName}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        <span>Customer Hub:</span>
                      </span>
                      <span className="font-bold text-sky-700 truncate max-w-[170px]" title={dynamicCustomerHub}>
                        📍 {dynamicCustomerHub}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Plane className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ramp Stand:</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {dynamicStand} {dynamicGate ? `• Gate ${dynamicGate}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    {task.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleTaskChecklist(task.id, item.id)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Schedule Target Time & Email Dispatcher */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>Target: {task.targetTime}</span>
                      </span>

                      {task.completedAt ? (
                        <span className="text-emerald-700 font-bold">Done: {task.completedAt}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Due Today</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={matchedUser?.email}>
                        {task.lastReminderSentAt ? `Sent: ${task.lastReminderSentAt}` : (matchedUser?.email || 'Email configured')}
                      </span>

                      <button
                        onClick={() => handleSendReminder(task.id)}
                        disabled={sendingReminderTaskId === task.id}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        title={`Send Email reminder to ${matchedUser?.email || 'assigned staff'}`}
                      >
                        <Mail className={`w-3.5 h-3.5 ${sendingReminderTaskId === task.id ? 'animate-spin' : ''}`} />
                        <span>{sendingReminderTaskId === task.id ? 'Sending...' : 'Email Alert'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GPS Location Pin Modal */}
      {selectedMilestoneForGps && (
        <GpsLocationModal
          isOpen={true}
          onClose={() => setSelectedMilestoneForGps(null)}
          title={`Milestone GPS Telemetry: ${selectedMilestoneForGps.title}`}
          locationName={selectedMilestoneForGps.rampStand || selectedFlightObj.subplaneAreaZone}
          latitude={selectedMilestoneForGps.gpsLatitude || 36.85124}
          longitude={selectedMilestoneForGps.gpsLongitude || 10.22742}
          accuracyMeters={selectedMilestoneForGps.gpsAccuracyMeters || 1.8}
          timestamp={selectedMilestoneForGps.actualTime ? `${selectedFlightObj.date} ${selectedMilestoneForGps.actualTime}` : undefined}
          agentName={selectedMilestoneForGps.completedByUserName || 'Field Agent'}
          flightNbr={selectedMilestoneForGps.flightNbr}
        />
      )}

      {/* Create Custom Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <ListTodo className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Create Flight Turnaround Task & Email Todo</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  placeholder="e.g. Hold 2 Netting Inspection & Captain Sign-off"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Flight</label>
                  <select
                    value={formData.flightNbr}
                    onChange={(e) => setFormData({ ...formData, flightNbr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {flights.map(f => (
                      <option key={f.id} value={f.flightNbr}>{f.flightNbr} ({f.companyName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Time</label>
                  <input
                    type="time"
                    required
                    value={formData.targetTime}
                    onChange={(e) => setFormData({ ...formData, targetTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Flight & Customer Location Preview */}
              {(() => {
                const previewFlight = flights.find(f => f.flightNbr === formData.flightNbr);
                const previewCompany = companies.find(c => c.name === previewFlight?.companyName);
                return (
                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1 text-slate-700">
                    <div className="text-[11px] font-bold text-sky-900">Dynamic Customer Location Preview:</div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Customer Airline:</span>
                      <strong className="text-slate-900">{previewCompany?.name || previewFlight?.companyName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Customer Hub / Location:</span>
                      <span className="font-bold text-sky-700">📍 {previewCompany?.hub || previewFlight?.companyHub || 'Tunis-Carthage (TUN)'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Stand / Gate:</span>
                      <span>Stand {previewFlight?.subplaneAreaZone || 'Stand 14'}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Agent</label>
                  <select
                    value={formData.assignedUserName}
                    onChange={(e) => {
                      const u = users.find(usr => usr.name === e.target.value);
                      setFormData({
                        ...formData,
                        assignedUserName: e.target.value,
                        assignedUserId: u?.id || formData.assignedUserId,
                        assignedRole: u?.role || formData.assignedRole
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Create Task & Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Turnaround Flight Modal */}
      <DispatchFlightTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        preSelectedFlightId={selectedFlightObj?.id}
      />

    </div>
  );
};
