import React from 'react';
import { ShieldAlert, ArrowRight, Smartphone, CheckSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccessRestrictedNoticeProps {
  requiredPermission: string;
}

export const AccessRestrictedNotice: React.FC<AccessRestrictedNoticeProps> = ({ requiredPermission }) => {
  const { currentUser, setActiveTab } = useApp();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 my-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
          Access Restricted • Role-Based Policy
        </span>
        <h2 className="text-xl font-bold text-slate-900">
          Administrator Privileges Required
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          You are currently operating under role <strong className="text-slate-800">{currentUser.role}</strong> ({currentUser.name}). 
          This administrative configuration area requires elevated permissions (<span className="font-mono text-xs">{requiredPermission}</span>).
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left rtl:text-right text-xs space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-800">Your Current Assigned Scope:</div>
        <div>• Badge ID: <strong className="font-mono text-slate-900">{currentUser.badgeId}</strong></div>
        <div>• Assigned Stand/Zone: <strong className="text-slate-900">{currentUser.assignedZone}</strong></div>
        <div>• Active Flight: <strong className="font-mono text-sky-700">{currentUser.assignedFlightNbr || 'QR123 / TU-720'}</strong></div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setActiveTab('ramp_field')}
          className="w-full sm:w-auto px-6 py-3 bg-[#0b1320] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Open Ramp Agent Field Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className="w-full sm:w-auto px-5 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          <span>My Flight Tasks</span>
        </button>
      </div>
    </div>
  );
};
