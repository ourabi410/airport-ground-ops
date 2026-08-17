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
  PlayCircle
} from 'lucide-react';
import {
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
    turnaroundMilestones,
    updateMilestoneStatus,
    assignMilestoneAgent,
    agentSessions,
    startAgentSession,
    pingAgentSessionGps,
    endAgentSession,
    flights,
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
    targetTime: '14:15',
    status: 'Pending' as TaskStatus,
    checklist: [
      { id: 'c1', text: 'Verify aircraft hold door open and cleared', done: false },
      { id: 'c2', text: 'Ensure handheld Zebra scanner in Hold Loading mode', done: false },
      { id: 'c3', text: 'Verify hold netting and secure barrier', done: false }
    ]
  });

  const selectedFlightObj = flights.find(f => f.flightNbr === selectedFlightNbr) || flights[0];

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

    setIsModalOpen(false);
  };

  return (
    <div id="task-management-container" className="space-y-6">
      
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
                Ground Handling Turnaround Milestones, Agent Field Sessions & GPS Telemetry
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
            onClick={() => exportTurnaroundPdf(selectedFlightObj, turnaroundMilestones, baggage, agentSessions)}
            className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Download PDF Turnaround Report for selected flight"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Turnaround PDF</span>
          </button>

          <button
            id="btn-quick-export-excel"
            onClick={() => exportFlightExcel(selectedFlightObj, turnaroundMilestones, baggage, auditLogs)}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Download Excel Report for selected flight"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            id="btn-dispatch-turnaround-toolbar"
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Dispatch Turnaround Flight and Milestones to Field Agent"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Dispatch to Ramp Agent</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Task</span>
          </button>
        </div>
      </div>

      {/* Primary KPI & Flight Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Flight Selector */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Plane className="w-3.5 h-3.5 text-sky-600" />
            Active Turnaround Flight
          </span>
          <select
            id="select-turnaround-flight"
            value={selectedFlightNbr}
            onChange={(e) => setSelectedFlightNbr(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">All Active Flights ({flights.length})</option>
            {flights.map(f => (
              <option key={f.id} value={f.flightNbr}>
                {f.flightNbr} • {f.companyName} • Gate {f.gateNbr}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 mt-2">
            Stand: <strong className="text-slate-800">{selectedFlightObj.subplaneAreaZone}</strong> • Reg: <strong className="text-slate-800">{selectedFlightObj.reg}</strong>
          </div>
        </div>

        {/* Turnaround Progress KPI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Milestones Completed
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{completedCount} <span className="text-sm font-semibold text-slate-400">/ {totalFlightMilestones}</span></span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Active Agents On-Ramp */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            Active Field Agents
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{activeFlightSessions.length}</span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live GPS Lock
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {activeFlightSessions.map(s => s.agentName.split(' ')[0]).join(', ') || 'No active session'}
          </div>
        </div>

        {/* Action Button: Start Field Session */}
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-4 rounded-2xl text-white shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">Field Agent Tools</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Start Apron Field Session</h4>
          </div>
          <button
            onClick={() => startAgentSession(selectedFlightObj.id, currentUser.id)}
            className="w-full mt-2 py-2 bg-white text-sky-900 hover:bg-sky-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-sky-600" />
            <span>Join Turnaround Session</span>
          </button>
        </div>

      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('turnaround')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'turnaround'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Turnaround Milestones Matrix ({filteredMilestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Active Agent Field Sessions ({activeFlightSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customTasks')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'customTasks'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Ad-Hoc Flight Tasks ({tasks.length})</span>
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

      {/* TAB 3: AD-HOC CUSTOM FLIGHT TASKS */}
      {activeTab === 'customTasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white p-5 rounded-2xl border shadow-xs space-y-3 transition-all ${
                  task.status === 'Completed' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                    {task.flightNbr}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{task.taskTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned to: <strong>{task.assignedUserName}</strong> ({task.assignedRole})</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
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

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <span>Target: {task.targetTime}</span>
                  {task.completedAt && <span className="text-emerald-700 font-bold">Done: {task.completedAt}</span>}
                </div>
              </div>
            ))}
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
              <h3 className="font-bold text-slate-900 text-base">Create Flight Turnaround Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                      <option key={f.id} value={f.flightNbr}>{f.flightNbr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Agent</label>
                  <select
                    value={formData.assignedUserName}
                    onChange={(e) => setFormData({ ...formData, assignedUserName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Task
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
