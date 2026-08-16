import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Crosshair, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Plane, 
  Radio, 
  ShieldCheck,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { GpsLocation } from '../../types';
import { GeofenceZone, ScannedBag } from '../../types/baggageScanner';
import { AIRPORT_COORDINATES } from '../../services/gpsService';

interface ApronGeofenceMapProps {
  currentGps: GpsLocation;
  standName: string;
  airportIata?: string;
  scannedBags: ScannedBag[];
  onSimulateMove?: (lat: number, lng: number, zoneName: string) => void;
}

export const ApronGeofenceMap: React.FC<ApronGeofenceMapProps> = ({
  currentGps,
  standName,
  airportIata = 'DOH',
  scannedBags,
  onSimulateMove,
}) => {
  const airport = AIRPORT_COORDINATES[airportIata] || AIRPORT_COORDINATES['DOH'];
  const standCoords = airport.gates[standName] || { lat: airport.lat + 0.002, lng: airport.lng + 0.001 };

  // Calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceToStand = calculateDistance(
    currentGps.latitude,
    currentGps.longitude,
    standCoords.lat,
    standCoords.lng
  );

  let zone: GeofenceZone = 'ON_STAND';
  if (distanceToStand <= 45) {
    zone = 'ON_STAND';
  } else if (distanceToStand <= 150) {
    zone = 'INNER_APRON';
  } else {
    zone = 'SORTING_FACILITY';
  }

  // Pre-configured apron simulation positions
  const simulationPresets = [
    {
      name: `Aircraft Stand ${standName} (On-Stand)`,
      desc: 'Inside 45m loading circle at aircraft hold',
      lat: standCoords.lat + 0.00008,
      lng: standCoords.lng + 0.00008,
      zone: 'ON_STAND',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      name: 'Ramp Service Road (Tug Transit)',
      desc: 'Baggage tractor en route to stand (~95m)',
      lat: standCoords.lat + 0.0007,
      lng: standCoords.lng + 0.0006,
      zone: 'INNER_APRON',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Baggage Sorting Hall / Makeup Facility',
      desc: 'Central baggage sorting carousel (~380m)',
      lat: standCoords.lat + 0.0028,
      lng: standCoords.lng + 0.0025,
      zone: 'SORTING_FACILITY',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      
      {/* Header telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">Zebra TC26 GNSS Apron Radar</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                QUALCOMM GNSS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live airport geofence verification for IATA Resolution 753 baggage tracking
            </p>
          </div>
        </div>

        {/* Geofence Status Badge */}
        <div className="flex items-center space-x-2">
          {zone === 'ON_STAND' ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ON-STAND ({distanceToStand}m) • AUTHORIZED</span>
            </div>
          ) : zone === 'INNER_APRON' ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>INNER APRON ({distanceToStand}m) • TRANSIT</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/50 text-sky-300 text-xs font-semibold">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>SORTING FACILITY ({distanceToStand}m)</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Apron Radar Display */}
      <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        
        {/* Radar Concentric Circles & Grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          {/* 50m Zone Circle */}
          <div className="w-32 h-32 rounded-full border border-emerald-500/50 flex items-center justify-center">
            <span className="text-[9px] font-mono text-emerald-400 absolute top-1">50m Safe Stand Area</span>
          </div>
          {/* 150m Zone Circle */}
          <div className="w-64 h-64 rounded-full border border-dashed border-amber-500/40 flex items-center justify-center">
            <span className="text-[9px] font-mono text-amber-400 absolute top-2">150m Inner Apron</span>
          </div>
          {/* 300m Outer Circle */}
          <div className="w-80 h-80 rounded-full border border-slate-700"></div>
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-slate-800"></div>
          <div className="absolute h-full w-[1px] bg-slate-800"></div>
        </div>

        {/* Center: Aircraft Stand & Airplane Silhouette */}
        <div className="absolute z-10 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Plane className="w-6 h-6 text-emerald-400 transform -rotate-45" />
          </div>
          <div className="mt-1 px-2 py-0.5 bg-slate-900/90 border border-emerald-500/40 rounded text-[10px] font-mono font-bold text-emerald-300">
            STAND {standName} ({airportIata})
          </div>
        </div>

        {/* TC26 Handheld Device Position Marker */}
        {(() => {
          // Calculate relative visual offset on radar (scaled)
          const scale = 0.5; // pixel per meter
          const deltaLat = (currentGps.latitude - standCoords.lat) * 111000;
          const deltaLng = (currentGps.longitude - standCoords.lng) * 111000;
          
          // Clamp to screen bounds
          const posX = Math.max(-130, Math.min(130, deltaLng * scale));
          const posY = Math.max(-120, Math.min(120, -deltaLat * scale));

          return (
            <div 
              className="absolute z-20 transition-all duration-700 flex flex-col items-center"
              style={{
                transform: `translate(${posX}px, ${posY}px)`,
              }}
            >
              {/* Pulsing GPS ring */}
              <div className="relative flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-sky-500/30 animate-ping absolute"></div>
                <div className="w-8 h-8 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center shadow-xl text-white">
                  <Navigation className="w-4 h-4 transform rotate-45" />
                </div>
              </div>
              
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/95 border border-sky-400 text-[10px] font-mono font-bold text-sky-200 shadow-md whitespace-nowrap">
                📱 Zebra TC26 ({distanceToStand}m)
              </div>
            </div>
          );
        })()}

        {/* Baggage Sorting Facility Landmark */}
        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Baggage Sorting Hall (BMF)</span>
        </div>

        {/* North Indicator */}
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center space-x-1">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>N 360°</span>
        </div>

        {/* GPS Accuracy Overlay */}
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-300">
          GNSS Accuracy: <span className="text-emerald-400 font-bold">±{currentGps.accuracy}m</span>
        </div>
      </div>

      {/* GPS Coordinates Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px]">LATITUDE</span>
          <span className="text-slate-200 font-bold">{currentGps.latitude.toFixed(6)}° N</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">LONGITUDE</span>
          <span className="text-slate-200 font-bold">{currentGps.longitude.toFixed(6)}° E</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">STAND DISTANCE</span>
          <span className={`font-bold ${zone === 'ON_STAND' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {distanceToStand} meters
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">IATA RESOLUTION 753</span>
          <span className="text-sky-400 font-bold">GEO-TAGGED ON SCAN</span>
        </div>
      </div>

      {/* Geofence Position Simulator Presets (Convenient for testing TC26 GPS logic) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            GPS Position Simulator (Test Zebra TC26 Apron Movement)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Click to reposition device</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {simulationPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onSimulateMove && onSimulateMove(preset.lat, preset.lng, preset.name)}
              className="flex flex-col text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{preset.name}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${preset.badgeColor}`}>
                  {preset.zone}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
