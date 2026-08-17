import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp, ROLE_PERMISSIONS } from '../../context/AppContext';
import {
  Users,
  Plus,
  Shield,
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  Plane,
  Search,
  UserCheck,
  Building,
  Activity,
  Laptop,
  Send
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { DispatchFlightTaskModal } from '../common/DispatchFlightTaskModal';
import { UserPermissionsModal } from './UserPermissionsModal';

export const UserManagementView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const {
    users,
    addUser,
    updateUser,
    currentUser,
    setCurrentUser,
    sessionLogs
  } = useApp();

  const [activeTab, setActiveTab] = useState<'directory' | 'permissions' | 'sessions'>('directory');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTargetUserId, setDispatchTargetUserId] = useState<string | undefined>(undefined);
  const [selectedPermUser, setSelectedPermUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Form State
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    badgeId: 'SAS-',
    role: 'Sorting Agent' as UserRole,
    department: 'Baggage Makeup Area',
    assignedZone: 'Carousel 02',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift' as const,
    lastLogin: '2026-08-17 13:00'
  });

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) return;

    addUser(newUserData);
    setIsAddUserModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      badgeId: 'SAS-',
      role: 'Sorting Agent',
      department: 'Baggage Makeup Area',
      assignedZone: 'Carousel 02',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'on_shift',
      lastLogin: '2026-08-17 13:00'
    });
  };

  const filteredUsers = users.filter(u => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.badgeId.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleList: UserRole[] = [
    'Administrator',
    'Sorting Agent',
    'Subplane Agent',
    'Ramp/Loading Agent',
    'Auditor'
  ];

  return (
    <div id="user-management-container" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('userMgmtTitle')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('userMgmtSub')}
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnAddUser')}</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 gap-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('tabUsersList')}
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('tabPermissionsMatrix')}
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('tabUserLogs')}
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, badge, role, zone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 rtl:pl-3 rtl:pr-9"
              />
            </div>
            <span className="text-xs text-slate-600 font-semibold">{filteredUsers.length} Staff Members</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">{t('colBadge')}</th>
                  <th className="py-3 px-4">{t('colName')}</th>
                  <th className="py-3 px-4">{t('colRole')}</th>
                  <th className="py-3 px-4">{t('colDepartment')}</th>
                  <th className="py-3 px-4">{t('colAssignedZone')}</th>
                  <th className="py-3 px-4">Assigned Flight</th>
                  <th className="py-3 px-4 text-center">{t('colBagsScanned')}</th>
                  <th className="py-3 px-4 text-center">Permissions</th>
                  <th className="py-3 px-4 text-center">Dispatch Flight</th>
                  <th className="py-3 px-4 text-center">Simulate Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      currentUser.id === user.id ? 'bg-sky-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {user.badgeId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {currentUser.id === user.id && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                Current Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        user.role === 'Administrator'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'Sorting Agent'
                          ? 'bg-sky-100 text-sky-800'
                          : user.role === 'Subplane Agent'
                          ? 'bg-indigo-100 text-indigo-800'
                          : user.role === 'Ramp/Loading Agent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {user.department}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {user.assignedZone}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      {user.assignedFlightNbr ? (
                        <span className="px-2 py-1 bg-sky-50 text-sky-800 rounded-lg border border-sky-200">
                          {user.assignedFlightNbr}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Standby</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-sky-700 font-mono">
                      {user.bagsScannedToday}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedPermUser(user)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        title="Configure Granular Permissions"
                      >
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Security</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setDispatchTargetUserId(user.id);
                          setIsDispatchModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setCurrentUser(user)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentUser.id === user.id
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700'
                        }`}
                      >
                        {currentUser.id === user.id ? 'Active' : 'Switch Role'}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 2: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Role-Based Access Control (RBAC) Permission Matrix
            </h3>
            <span className="text-xs text-slate-600">Enterprise Granular Policy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Permission Scope</th>
                  {roleList.map(r => (
                    <th key={r} className="py-3 px-4 text-center">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { key: 'canCreateFlight', label: 'Create & Register Flights' },
                  { key: 'canEditFlight', label: 'Modify Flight Details & Crews' },
                  { key: 'canLockFlight', label: 'Lock Departed Flights' },
                  { key: 'canScanSorting', label: 'Step 1: Check-in / Sorter Scan' },
                  { key: 'canScanLoading', label: 'Step 2: Aircraft Loading Verification' },
                  { key: 'canManageUsers', label: 'User Directory & RBAC Settings' },
                  { key: 'canManageCompanies', label: 'Airline Partner SLA & Profiles' },
                  { key: 'canManageDollies', label: 'Dolly & Fleet Allocation' },
                  { key: 'canViewAuditLogs', label: 'Access Global Audit Trail' },
                  { key: 'canResolveDiscrepancy', label: 'Clear Baggage Discrepancies' }
                ].map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {perm.label}
                    </td>
                    {roleList.map((role) => {
                      const hasPerm = ROLE_PERMISSIONS[role][perm.key as keyof typeof ROLE_PERMISSIONS[UserRole]];
                      return (
                        <td key={role} className="py-3 px-4 text-center">
                          {hasPerm ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Active Sessions Log */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Active User Sessions & Handheld Telemetry</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {sessionLogs.length} Sessions Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessionLogs.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{s.userName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {s.status}
                  </span>
                </div>
                <p className="text-[11px] text-sky-700 font-semibold">{s.role}</p>
                <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.device}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>IP: {s.ipAddress}</span>
                    <span>Login: {s.loginTime}</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700">
                    {s.actionsPerformed} Operations Scanned & Logged
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Add Ground Staff User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Sami Ben Amor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. s.benamor@soltane-aviation.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge ID</label>
                  <input
                    type="text"
                    value={newUserData.badgeId}
                    onChange={(e) => setNewUserData({ ...newUserData, badgeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">System Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    {roleList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserData.department}
                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Zone</label>
                  <input
                    type="text"
                    value={newUserData.assignedZone}
                    onChange={(e) => setNewUserData({ ...newUserData, assignedZone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                >
                  Save User Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      <DispatchFlightTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        preSelectedUserId={dispatchTargetUserId}
      />

      {/* User Permissions Management Modal */}
      {selectedPermUser && (
        <UserPermissionsModal
          user={selectedPermUser}
          isOpen={!!selectedPermUser}
          onClose={() => setSelectedPermUser(null)}
        />
      )}

    </div>
  );
};
