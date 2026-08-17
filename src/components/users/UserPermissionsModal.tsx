import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp, ROLE_PERMISSIONS } from '../../context/AppContext';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  User,
  Key,
  Lock,
  Sparkles
} from 'lucide-react';
import { User as UserType, UserPermission, UserRole } from '../../types';

interface UserPermissionsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
}

const PERMISSION_CONFIGS: { key: keyof UserPermission; label: string; description: string }[] = [
  {
    key: 'canCreateFlight',
    label: 'Create & Register Flights',
    description: 'Add new turnaround flights, schedules, and aircraft gate allocations.',
  },
  {
    key: 'canEditFlight',
    label: 'Modify Flight Details & Schedules',
    description: 'Update STA/STD, registration, assigned ramp agents, and zones.',
  },
  {
    key: 'canLockFlight',
    label: 'Lock & Finalize Departed Flights',
    description: 'Freeze manifest and flight records after aircraft pushback.',
  },
  {
    key: 'canScanSorting',
    label: 'Step 1: Check-in / Sorter Area Scan',
    description: 'Perform outbound baggage sorting scans and assign bags to ULD dollies.',
  },
  {
    key: 'canScanLoading',
    label: 'Step 2: Aircraft Hold Loading Verification',
    description: 'Verify and scan baggage into aircraft cargo holds (Hold 1 Fwd / 2 Aft / 3 Bulk).',
  },
  {
    key: 'canManageUsers',
    label: 'User Directory & RBAC Permissions',
    description: 'Add or modify staff accounts, roles, and assign security capabilities.',
  },
  {
    key: 'canManageCompanies',
    label: 'Airline Partner SLA & Profiles',
    description: 'Manage handling contracts, airline IATA/ICAO codes, and logos.',
  },
  {
    key: 'canManageDollies',
    label: 'Dolly & Fleet Equipment Allocation',
    description: 'Add, update, and attach ULD containers and open carts to flights.',
  },
  {
    key: 'canViewAuditLogs',
    label: 'Global Security & Audit Trail',
    description: 'View immutable system audit logs, user sessions, and compliance reports.',
  },
  {
    key: 'canResolveDiscrepancy',
    label: 'Clear Baggage Discrepancies & Offload',
    description: 'Resolve missing bag alerts, wrong flight tags, or authorize baggage offloads.',
  },
];

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const { isRtl } = useLanguage();
  const { updateUserPermissions } = useApp();

  const defaultRolePerms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Ramp/Loading Agent'];

  const [permissions, setPermissions] = useState<UserPermission>(() => {
    return {
      ...defaultRolePerms,
      ...(user.customPermissions || {}),
    };
  });

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof UserPermission) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsSaved(false);
  };

  const handleResetToRoleDefault = () => {
    setPermissions({ ...defaultRolePerms });
    setIsSaved(false);
  };

  const handleSave = () => {
    updateUserPermissions(user.id, permissions);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">{user.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Badge: {user.badgeId} &bull; {user.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Modal Body: Permissions List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Granular Security Capabilities
              </h4>
              <p className="text-xs text-slate-600">
                Toggle capabilities granted to this staff member:
              </p>
            </div>

            <button
              onClick={handleResetToRoleDefault}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Role Default</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {PERMISSION_CONFIGS.map((item) => {
              const isEnabled = permissions[item.key];

              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isEnabled
                      ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="space-y-0.5 pr-3 rtl:pr-0 rtl:pl-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isEnabled ? 'text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                        isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-600" />
            <span>Changes persist immediately to Laravel database.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Permissions Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save User Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
