import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  Radio,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  LogOut
} from 'lucide-react';
import { Language, User } from '../../types';

interface NavbarProps {
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScanner }) => {
  const { language, setLanguage, isRtl, t } = useLanguage();
  const { currentUser, setCurrentUser, users, baggage, setActiveTab, activeTab, logout } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Missing bag alerts count
  const missingBags = baggage.filter(b => b.status === 'MISSING' || (b.alerts && b.alerts.length > 0));

  const getPageTitle = () => {
    switch (activeTab) {
      case 'ramp_field':
        return 'Ramp Agent Field Mode (Glove Friendly)';
      case 'dashboard':
      case 'overview':
        return 'Baggage Control Dashboard';
      case 'flights':
        return 'Flight Management & Turnaround';
      case 'baggage':
        return 'Zebra Scanning & Reconciliation Terminal';
      case 'dolly':
        return 'Dolly Fleet & Container Tracking';
      case 'tasks':
        return 'Turnaround Tasks & SLA Milestones';
      case 'companies':
        return 'Airline Partner Management';
      case 'users':
        return 'User Permissions & RBAC Matrix';
      case 'logs':
      case 'audit':
        return 'Global System Activity & Audit Log';
      default:
        return 'Baggage Control Dashboard';
    }
  };

  return (
    <header
      id="sas-top-navbar"
      className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shrink-0 select-none"
    >
      {/* Left: View Title & Language Switcher Pill */}
      <div className="flex items-center gap-4 sm:gap-6">
        <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight truncate">
          {getPageTitle()}
        </h1>

        {/* Clean Language Switcher Pill matching Technical Dashboard design */}
        <div className="hidden sm:flex bg-[#F1F5F9] rounded-md p-0.5 text-[11px] font-bold border border-slate-200">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-white shadow-xs text-slate-900 font-extrabold'
                : 'text-[#64748B] hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('fr')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              language === 'fr'
                ? 'bg-white shadow-xs text-slate-900 font-extrabold'
                : 'text-[#64748B] hover:text-slate-900'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              language === 'ar'
                ? 'bg-white shadow-xs text-slate-900 font-extrabold'
                : 'text-[#64748B] hover:text-slate-900'
            }`}
          >
            AR (عربي)
          </button>
        </div>
      </div>

      {/* Right: Quick Scanner, Alerts, and Operator Status */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Quick Zebra Scanner Button */}
        <button
          id="btn-quick-zebra-nav"
          onClick={() => {
            if (onOpenScanner) onOpenScanner();
            else setActiveTab('baggage');
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-[#0284C7] hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">{t('quickScanAction')}</span>
          <span className="sm:hidden">Scan</span>
        </button>

        {/* Missing Bag Alerts Bell */}
        <div className="relative">
          <button
            id="btn-alerts-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-md border transition-colors cursor-pointer ${
              missingBags.length > 0
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-slate-100'
            }`}
            title={missingBags.length > 0 ? `${missingBags.length} Missing Bag Alerts` : 'System Alerts'}
          >
            {missingBags.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {missingBags.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {missingBags.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Drawer */}
          {showNotifications && (
            <div
              id="notifications-dropdown"
              className={`absolute mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-3 z-50 ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-slate-800">{t('alertMissingHeader')}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                  {missingBags.length} active
                </span>
              </div>

              {missingBags.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">All checked bags reconciled across all flights.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {missingBags.map((bag) => (
                    <div
                      key={bag.id}
                      onClick={() => {
                        setActiveTab('baggage');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-red-50/60 hover:bg-red-100/60 border border-red-200 text-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-red-900 mb-0.5">
                        <span className="font-mono">Tag #{bag.tagNumber}</span>
                        <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-800 text-[10px]">{bag.flightNbr}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Pax: {bag.passengerName} (Seat {bag.seatNumber})
                      </p>
                      <p className="text-[10px] text-red-600 font-medium mt-1">
                        Not scanned at aircraft hold door ({bag.sortingZone})
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#F1F5F9] mt-2 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => {
                    setActiveTab('baggage');
                    setShowNotifications(false);
                  }}
                  className="text-[#0284C7] font-semibold hover:underline"
                >
                  {t('openVirtualZebra')}
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Identity block with simulation menu */}
        <div className="relative">
          <div
            id="btn-user-profile-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="text-right rtl:text-left hidden sm:block">
              <p className="text-xs font-bold text-[#1E293B] group-hover:text-[#0284C7] transition-colors leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                {currentUser.role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#E2E8F0] border-2 border-white overflow-hidden shadow-xs ring-1 ring-[#E2E8F0]">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {showUserMenu && (
            <div
              id="user-profile-dropdown"
              className={`absolute mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-2 z-50 ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg mb-2 border border-[#E2E8F0]">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-[#64748B]">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-bold">{currentUser.role}</span>
                  <span className="text-[#64748B] font-mono">Badge: {currentUser.badgeId}</span>
                </div>
              </div>

              <div className="px-2 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-[#0284C7]" />
                <span>{t('switchActiveUser')}</span>
              </div>

              <div className="space-y-1 mt-1">
                {users.map((u: User) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left rtl:text-right px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer ${
                      currentUser.id === u.id ? 'bg-sky-50 text-sky-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <p className="font-medium leading-none">{u.name}</p>
                        <p className="text-[10px] text-[#64748B]">{u.role}</p>
                      </div>
                    </div>
                    {currentUser.id === u.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7]" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] mt-2 flex items-center justify-between px-1">
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setShowUserMenu(false);
                  }}
                  className="text-[11px] text-[#0284C7] hover:underline font-bold cursor-pointer"
                >
                  {t('tabPermissionsMatrix')} &rarr;
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Standalone Quick Logout button */}
        <button
          onClick={logout}
          title="Sign Out / Change User"
          className="hidden sm:flex p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>

      </div>
    </header>
  );
};
