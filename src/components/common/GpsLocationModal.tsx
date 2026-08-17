import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  X,
  MapPin,
  Navigation,
  Radio,
  Cpu,
  Wifi,
  Battery,
  ShieldCheck,
  Plane,
  Compass,
  Layers
} from 'lucide-react';

interface GpsLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  timestamp?: string;
  agentName?: string;
  deviceModel?: string;
  flightNbr?: string;
}

export const GpsLocationModal: React.FC<GpsLocationModalProps> = ({
  isOpen,
  onClose,
  title,
  locationName,
  latitude,
  longitude,
  accuracyMeters = 2.4,
  timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '),
  agentName = 'Yassine Trabelsi',
  deviceModel = 'Zebra TC57x Rugged Scanner (SN: ZEB-7890)',
  flightNbr = 'TU-720'
}) => {
  const { isRtl } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-sky-300 font-mono">
                {flightNbr} • {locationName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Airport Ramp Apron Interactive SVG Map */}
        <div className="relative bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-center overflow-hidden">
          
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px]"></div>
          
          <svg className="w-full h-48 max-w-md" viewBox="0 0 400 200" fill="none">
            {/* Apron Taxiway & Stand lines */}
            <path d="M 20 180 L 380 180" stroke="#334155" strokeWidth="2" strokeDasharray="6 4" />
            <path d="M 200 20 L 200 180" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
            
            {/* Stand Safety Circle */}
            <circle cx="200" cy="100" r="70" stroke="#eab308" strokeWidth="1.5" strokeDasharray="5 5" fill="#eab308" fillOpacity="0.03" />
            <circle cx="200" cy="100" r="90" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />

            {/* Aircraft Blueprint Outline (A320/B737 silhouette) */}
            <g transform="translate(170, 45) scale(0.6)" opacity="0.85">
              {/* Fuselage */}
              <path d="M 50 10 C 40 30 40 120 40 150 C 40 170 60 170 60 150 C 60 120 60 30 50 10 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              {/* Wings */}
              <path d="M 45 60 L -40 110 L -40 125 L 45 90 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <path d="M 55 60 L 140 110 L 140 125 L 55 90 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              {/* Tail plane */}
              <path d="M 45 140 L 10 160 L 10 168 L 45 152 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M 55 140 L 90 160 L 90 168 L 55 152 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              {/* Engines */}
              <rect x="0" y="80" width="12" height="24" rx="4" fill="#0369a1" stroke="#38bdf8" />
              <rect x="88" y="80" width="12" height="24" rx="4" fill="#0369a1" stroke="#38bdf8" />
            </g>

            {/* Service Equipment / Dolly Train representation */}
            <rect x="250" y="115" width="22" height="14" rx="2" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" />
            <text x="252" y="125" fill="#7dd3fc" fontSize="6" fontFamily="monospace">DLY-101</text>

            <rect x="250" y="133" width="22" height="14" rx="2" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" />
            <text x="252" y="143" fill="#7dd3fc" fontSize="6" fontFamily="monospace">DLY-102</text>

            {/* GPS Pin with pulsing radar wave */}
            <g transform="translate(235, 110)">
              <circle cx="0" cy="0" r="14" fill="#38bdf8" fillOpacity="0.2" className="animate-ping" />
              <circle cx="0" cy="0" r="8" fill="#0284c7" fillOpacity="0.5" />
              <circle cx="0" cy="0" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              
              {/* Tooltip on SVG */}
              <rect x="10" y="-18" width="85" height="18" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
              <text x="14" y="-6" fill="#38bdf8" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                AGENT GPS LOCK
              </text>
            </g>

            {/* Stand Label */}
            <text x="30" y="40" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">STAND 14</text>
            <text x="30" y="54" fill="#0284c7" fontSize="8" fontFamily="sans-serif">APRON SOUTH • GATE A04</text>
          </svg>

          {/* Live GPS Lock Indicator */}
          <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-500/50 rounded-full px-2.5 py-0.5 text-[10px] text-emerald-300 flex items-center gap-1.5 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold">GPS LOCKED (±{accuracyMeters}m)</span>
          </div>

          <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
            {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
          </div>
        </div>

        {/* Telemetry Detail Rows */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-600" />
                Latitude
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {latitude.toFixed(6)}° N
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-600" />
                Longitude
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {longitude.toFixed(6)}° E
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3 text-emerald-600" />
                GPS Accuracy
              </span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                ±{accuracyMeters} meters
              </span>
            </div>

          </div>

          {/* Agent & Hardware Telemetry */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                Logged Field Agent: {agentName}
              </span>
              <span className="text-[11px] text-sky-700 font-mono">{timestamp}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-sky-200/60">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Device: <strong className="text-slate-800">{deviceModel}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Network: <strong className="text-slate-800">Airport Private LTE / Apron AP-04</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Map Pin
          </button>
        </div>

      </div>
    </div>
  );
};
