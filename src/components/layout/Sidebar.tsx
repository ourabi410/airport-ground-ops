import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  QrCode,
  PlaneTakeoff,
  Users,
  Building2,
  Truck,
  CheckSquare,
  FileText,
  AlertCircle,
  Plane,
  Smartphone,
  Lock
} from 'lucide-react';

interface SidebarProps {
  onOpenScanner?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { t } = useLanguage();
  const { activeTab, setActiveTab, baggage, flights, currentUser, userRole } = useApp();

  const isAdmin = userRole === 'Administrator';

  // Missing bags counter
  const missingCount = baggage.filter(b => b.status === 'MISSING' || (b.alerts && b.alerts.length > 0)).length;
  // Active flights in loading or sorting
  const activeFlightsCount = flights.filter(f => f.status === 'Loading' || f.status === 'Sorting').length;

  const operationalNav = [
    {
      id: 'ramp_field',
      label: 'Ramp Field Mode',
      icon: Smartphone,
      badge: 'GLOVE',
      badgeColor: 'bg-[#eab308] text-black font-extrabold shadow-xs',
      highlight: true
    },
    {
      id: 'dashboard',
      label: t('navOverview'),
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'tasks',
      label: t('navFlightTasks'),
      icon: CheckSquare,
      badge: currentUser.assignedFlightNbr ? `${currentUser.assignedFlightNbr}` : null,
      badgeColor: 'bg-emerald-600 text-white font-bold'
    },
    {
      id: 'flights',
      label: t('navFlightManagement'),
      icon: PlaneTakeoff,
      badge: activeFlightsCount > 0 ? `${activeFlightsCount} live` : null,
      badgeColor: 'bg-[#0284C7] text-white'
    },
    {
      id: 'baggage',
      label: t('navBaggageWorkflow'),
      icon: QrCode,
      badge: missingCount > 0 ? `${missingCount} alert` : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'dolly',
      label: t('navDollyManagement'),
      icon: Truck,
      badge: null
    }
  ];

  const adminNav = [
    {
      id: 'users',
      label: t('navUserManagement'),
      icon: Users,
      badge: !isAdmin ? 'Admin' : null,
      locked: !isAdmin
    },
    {
      id: 'companies',
      label: t('navCompanyManagement'),
      icon: Building2,
      badge: !isAdmin ? 'Admin' : null,
      locked: !isAdmin
    },
    {
      id: 'logs',
      label: t('navAuditLogs'),
      icon: FileText,
      badge: null,
      locked: false
    }
  ];

  return (
    <aside
      id="sas-sidebar-nav"
      className="w-60 shrink-0 bg-[#0F172A] text-white flex flex-col justify-between border-r rtl:border-r-0 rtl:border-l border-[#1E293B] select-none"
    >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0284C7] rounded-md flex items-center justify-center font-bold text-white shadow-xs">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm tracking-tight text-white">SOLTANE</p>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-mono">Aviation Services</p>
          </div>
        </div>

        {/* User Scope Banner if Non-Admin */}
        {!isAdmin && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-[#0b1320] border border-amber-500/40 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
              <span>{currentUser.role}</span>
              <span className="font-mono text-[10px] text-slate-300">{currentUser.badgeId}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Flight: <strong className="text-white font-mono">{currentUser.assignedFlightNbr || 'QR123'}</strong>
            </div>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="p-3 space-y-4 overflow-y-auto">
          
          {/* Operational Group */}
          <div>
            <div className="text-[10px] uppercase text-[#64748B] font-semibold tracking-wider mb-2 px-3 flex items-center justify-between">
              <span>Field Operations</span>
            </div>
            <div className="space-y-1">
              {operationalNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'overview');
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? item.id === 'ramp_field'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50'
                          : 'bg-[#1E293B] text-white font-bold'
                        : item.id === 'ramp_field'
                        ? 'text-amber-400/90 hover:bg-[#1E293B] hover:text-amber-300 font-semibold'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? (item.id === 'ramp_field' ? 'text-amber-400' : 'text-[#0284C7]') : item.id === 'ramp_field' ? 'text-amber-400' : 'text-[#64748B]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.badgeColor || 'bg-sky-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Administration Group */}
          <div>
            <div className="text-[10px] uppercase text-[#64748B] font-semibold tracking-wider mb-2 px-3 flex items-center justify-between">
              <span>Administration</span>
              {!isAdmin && <span className="text-[9px] font-mono text-slate-500">Super Admin</span>}
            </div>
            <div className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'logs' && activeTab === 'audit');
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#1E293B] text-white font-bold'
                        : item.locked
                        ? 'text-[#64748B] hover:bg-[#1E293B] hover:text-slate-300'
                        : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0284C7]' : 'text-[#64748B]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.locked ? (
                      <Lock className="w-3 h-3 text-slate-500" />
                    ) : item.badge ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

        </nav>
      </div>

      {/* Footer Status Bar */}
      <div className="space-y-2">
        {missingCount > 0 && (
          <div
            onClick={() => setActiveTab('baggage')}
            className="mx-3 p-2 rounded-md bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 cursor-pointer hover:bg-red-900/60 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <div className="text-[11px] leading-tight truncate">
              <span className="font-bold">{missingCount} Mismatch Alerts</span>
            </div>
          </div>
        )}

        <div className="p-3.5 border-t border-[#1E293B] bg-[#0B1120] text-xs text-[#94A3B8] flex justify-between items-center">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] truncate font-mono">RBAC: <strong className="text-slate-200">{userRole}</strong></span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        </div>
      </div>
    </aside>
  );
};
