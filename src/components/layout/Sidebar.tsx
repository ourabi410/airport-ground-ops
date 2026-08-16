import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  PlaneTakeoff,
  Clock,
  Smartphone,
  Map,
  Luggage,
  Users,
  Fuel,
  AlertOctagon,
  Timer,
  BarChart3,
  RefreshCw,
  FileText,
  ShieldAlert,
  Sparkles,
  MapPin,
  BookOpen,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, selectedFlight, pendingCount, incidents } = useApp();

  const openIncidents = incidents.filter((i) => i.status !== 'RESOLVED').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'flights', label: "Today's Flights", icon: PlaneTakeoff, badge: null },
    { id: 'flight-detail', label: 'Turnaround Timeline', icon: Clock, badge: selectedFlight ? selectedFlight.flightNumber : null },
    { id: 'ramp-mode', label: 'Ramp Quick Agent', icon: Smartphone, highlight: true },
    { id: 'map', label: 'Gate Apron Map', icon: Map, badge: null },
    
    // Core Operational Modules
    { id: 'baggage', label: 'Baggage Handling', icon: Luggage, badge: null },
    { id: 'passengers', label: 'Passenger Boarding', icon: Users, badge: null },
    { id: 'ground-services', label: 'Ground Services & Fuel', icon: Fuel, badge: null },
    { id: 'incidents', label: 'Incidents & Issues', icon: AlertOctagon, badge: openIncidents > 0 ? `${openIncidents}` : null, badgeColor: 'bg-amber-500 text-slate-900' },
    { id: 'delays', label: 'Delay Management', icon: Timer, badge: null },
    
    // Intelligence & Administration
    { id: 'ai-assistant', label: 'AI Turnaround Advisor', icon: Sparkles, badge: 'AI', badgeColor: 'bg-blue-600 text-white' },
    { id: 'kpis', label: 'Performance & KPIs', icon: BarChart3, badge: null },
    { id: 'sync', label: 'Offline Sync Hub', icon: RefreshCw, badge: pendingCount > 0 ? `${pendingCount}` : null, badgeColor: 'bg-amber-500 text-slate-900' },
    { id: 'audit', label: 'Audit Trail & Logs', icon: ShieldAlert, badge: null },
    { id: 'reports', label: 'Turnaround Reports', icon: FileText, badge: null },
    { id: 'guide', label: 'User Guide (دليل / Guide)', icon: BookOpen, badge: '3-LANG', badgeColor: 'bg-emerald-600 text-white' },
  ];

  return (
    <aside className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col shrink-0 hidden md:flex select-none">
      <div className="p-4 space-y-1 overflow-y-auto flex-1">
        
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          FLIGHT OPERATIONS
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'flight-detail' && activeTab === 'flight_detail') ||
            (item.id === 'ramp-mode' && activeTab === 'ramp_mode') ||
            (item.id === 'ground-services' && activeTab === 'ground_services') ||
            (item.id === 'ai-assistant' && activeTab === 'ai_advisor') ||
            (item.id === 'sync' && activeTab === 'sync_center') ||
            (item.id === 'audit' && activeTab === 'audit_trail') ||
            (item.id === 'guide' && (activeTab === 'help' || activeTab === 'user-guide'));

          return (
            <div
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20'
                  : item.highlight
                  ? 'text-amber-400 hover:bg-slate-700/50'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="truncate font-medium">{item.label}</span>

              {item.badge && (
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Info Widget: Device Status */}
      <div className="mt-auto p-4 border-t border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Device Status</span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            GPS ACTIVE
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          <MapPin className="w-3 h-3 text-sky-400" />
          <span>25.2744° N, 51.6081° E</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
          <span>Accuracy: 3.2m</span>
          <span>ID: T78-45</span>
        </div>
      </div>
    </aside>
  );
};

