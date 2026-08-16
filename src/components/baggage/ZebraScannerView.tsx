import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ScannedBag, 
  HoldLocation, 
  BrsScanStatus, 
  BagType, 
  GeofenceZone 
} from '../../types/baggageScanner';
import { GpsLocation } from '../../types';
import { zebraScannerService, AIRLINE_PREFIXES } from '../../services/zebraScannerService';
import { gpsService, AIRPORT_COORDINATES } from '../../services/gpsService';
import { ZebraConfigModal } from './ZebraConfigModal';
import { ApronGeofenceMap } from './ApronGeofenceMap';
import {
  Barcode,
  Smartphone,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  Radio,
  Search,
  Filter,
  Download,
  Volume2,
  VolumeX,
  Vibrate,
  RefreshCw,
  Camera,
  Play,
  Zap,
  Info,
  Trash2,
  Sliders,
  Plane
} from 'lucide-react';

export const ZebraScannerView: React.FC = () => {
  const { selectedFlight, currentUser, selectedBaggage, updateBaggage } = useApp();

  // Hardware & Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedHold, setSelectedHold] = useState<HoldLocation>('FWD_HOLD_1');
  const [selectedUld, setSelectedUld] = useState<string>('AKE10294QR');
  const [scanMode, setScanMode] = useState<'LOAD' | 'OFFLOAD' | 'AUDIT'>('LOAD');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCameraScanning, setIsCameraScanning] = useState(false);

  // GPS Telemetry State
  const [currentGps, setCurrentGps] = useState<GpsLocation>({
    latitude: 25.2635,
    longitude: 51.6142,
    accuracy: 3,
    altitude: 12,
    heading: 240,
    speed: 0,
    timestamp: Date.now(),
    status: 'HIGH_ACCURACY',
  });
  const [standDistance, setStandDistance] = useState<number>(14);
  const [geofenceZone, setGeofenceZone] = useState<GeofenceZone>('ON_STAND');

  // Scanned Bags Storage
  const [scannedBags, setScannedBags] = useState<ScannedBag[]>(() => {
    // Initial sample scanned bags for immediate inspection
    return [
      {
        id: 'scan_init_1',
        barcode: '0157891234',
        iataTag: '0-157-891234',
        airlinePrefix: '157',
        airlineName: 'Qatar Airways (QR)',
        flightId: selectedFlight?.id || 'flt_qr123',
        flightNumber: selectedFlight?.flightNumber || 'QR 123',
        passengerName: 'AL-THANI / MOHAMMED MR',
        pnr: 'QRT998',
        seatNumber: '2A',
        destination: selectedFlight?.destinationIata || 'LHR',
        origin: selectedFlight?.originIata || 'DOH',
        holdLocation: 'FWD_HOLD_1',
        uldId: 'AKE10294QR',
        bagType: 'FIRST_CLASS',
        weightKg: 23.4,
        paxStatus: 'BOARDED',
        brsStatus: 'LOADED_OK',
        statusMessage: 'LOADED INTO FWD HOLD 1 (AKE10294QR) - BRS OK',
        timestampUtc: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        deviceTimestamp: '14:22:10',
        scannedBy: currentUser.name,
        deviceId: 'Zebra-TC26-Ramp04',
        gps: {
          latitude: 25.2635,
          longitude: 51.6142,
          accuracy: 3,
          standDistanceMeters: 12,
          zone: 'ON_STAND',
          geofenceVerified: true,
          standName: selectedFlight?.gate || 'Stand C12',
        },
        scanSource: 'ZEBRA_HARDWARE',
      },
      {
        id: 'scan_init_2',
        barcode: '0157894401',
        iataTag: '0-157-894401',
        airlinePrefix: '157',
        airlineName: 'Qatar Airways (QR)',
        flightId: selectedFlight?.id || 'flt_qr123',
        flightNumber: selectedFlight?.flightNumber || 'QR 123',
        passengerName: 'DUBOIS / JEAN-LUC MR',
        pnr: 'FR8819',
        seatNumber: '14C',
        destination: selectedFlight?.destinationIata || 'LHR',
        origin: selectedFlight?.originIata || 'DOH',
        holdLocation: 'AFT_HOLD_3',
        uldId: 'AKE44921QR',
        bagType: 'STANDARD',
        weightKg: 21.0,
        paxStatus: 'BOARDED',
        brsStatus: 'LOADED_OK',
        statusMessage: 'LOADED INTO AFT HOLD 3 (AKE44921QR) - BRS OK',
        timestampUtc: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        deviceTimestamp: '14:26:45',
        scannedBy: currentUser.name,
        deviceId: 'Zebra-TC26-Ramp04',
        gps: {
          latitude: 25.2636,
          longitude: 51.6143,
          accuracy: 2,
          standDistanceMeters: 15,
          zone: 'ON_STAND',
          geofenceVerified: true,
          standName: selectedFlight?.gate || 'Stand C12',
        },
        scanSource: 'ZEBRA_HARDWARE',
      },
    ];
  });

  const [lastScannedBag, setLastScannedBag] = useState<ScannedBag | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<{
    show: boolean;
    title: string;
    description: string;
    bag?: ScannedBag;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHold, setFilterHold] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeSubView, setActiveSubView] = useState<'SCANNER' | 'RADAR' | 'MANIFEST'>('SCANNER');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Available ULD list from flight
  const uldList = selectedBaggage?.containerUldList || ['AKE10294QR', 'AKE44921QR', 'AKE98122QR', 'BULK_CARTS'];

  // Keep input focused so Zebra TC26 hardware scans are captured instantly
  useEffect(() => {
    const focusScanner = () => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        barcodeInputRef.current?.focus();
      }
    };
    focusScanner();
    const interval = setInterval(focusScanner, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update live GPS coordinates on mount & periodically
  useEffect(() => {
    let isMounted = true;
    const fetchGps = async () => {
      try {
        const loc = await gpsService.getCurrentPosition('DOH', selectedFlight?.gate || 'C12');
        if (isMounted) {
          setCurrentGps(loc);
          // Calculate distance
          const doh = AIRPORT_COORDINATES['DOH'];
          const gate = selectedFlight?.gate || 'C12';
          const stand = doh.gates[gate] || { lat: 25.2635, lng: 51.6142 };
          
          const dLat = (loc.latitude - stand.lat) * 111000;
          const dLng = (loc.longitude - stand.lng) * 111000;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
          setStandDistance(dist);
          setGeofenceZone(dist <= 45 ? 'ON_STAND' : dist <= 150 ? 'INNER_APRON' : 'SORTING_FACILITY');
        }
      } catch {
        // Handled
      }
    };

    fetchGps();
    const timer = setInterval(fetchGps, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedFlight?.gate]);

  // Global Keydown Listener for Zebra TC26 Hardware DataWedge & Scan triggers
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // Check for Zebra Android hardware scan keycodes (293, 10036, Scan)
      if (e.key === 'Scan' || e.code === 'Scan' || (e as unknown as { keyCode: number }).keyCode === 293) {
        barcodeInputRef.current?.focus();
        return;
      }

      // Detect rapid keystroke stream from DataWedge (SE4710 sends characters in <40ms intervals)
      if (e.key === 'Enter') {
        if (keyBuffer.length >= 4) {
          handleExecuteScan(keyBuffer);
          keyBuffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        if (now - lastKeyTime > 150) {
          keyBuffer = e.key;
        } else {
          keyBuffer += e.key;
        }
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHold, selectedUld, scanMode, currentGps, selectedFlight, currentUser]);

  // Execute scan and process BRS reconciliation
  const handleExecuteScan = async (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return;
    const clean = rawCode.trim();

    // Check if user scanned a ULD Container code directly
    if (zebraScannerService.isUldBarcode(clean)) {
      setSelectedUld(clean.toUpperCase());
      zebraScannerService.playSuccessBeep();
      setBarcodeInput('');
      return;
    }

    const { bag, isAlert, alertReason } = await zebraScannerService.processScan({
      rawBarcode: clean,
      flightId: selectedFlight?.id || 'flt_qr123',
      flightNumber: selectedFlight?.flightNumber || 'QR 123',
      currentGateOrStand: selectedFlight?.gate || 'Stand C12',
      selectedHold,
      selectedUld: selectedHold === 'ULD_CONTAINER' ? selectedUld : undefined,
      scanMode,
      userName: currentUser.name,
      deviceId: 'Zebra-TC26-Ramp04',
      currentGps,
    });

    setLastScannedBag(bag);
    setScannedBags((prev) => [bag, ...prev]);
    setBarcodeInput('');

    // Update baggage count in AppContext
    if (selectedFlight && bag.brsStatus === 'LOADED_OK') {
      const currentLoaded = selectedBaggage?.loadedBags || selectedFlight.loadedBaggage || 0;
      updateBaggage(selectedFlight.id, {
        loadedBags: currentLoaded + 1,
      });
    }

    // Trigger Critical Alert modal if passenger is no-show or bag is rejected
    if (isAlert && alertReason) {
      setCriticalAlert({
        show: true,
        title: 'CRITICAL BRS OFFLOAD ALERT',
        description: alertReason,
        bag,
      });
    } else {
      setCriticalAlert(null);
    }
  };

  // Export BRS Manifest as CSV
  const handleExportManifest = () => {
    const headers = [
      'Timestamp UTC',
      'IATA Tag',
      'Raw Barcode',
      'Airline',
      'Passenger Name',
      'Seat',
      'PNR',
      'Destination',
      'Bag Type',
      'Weight (kg)',
      'Hold Location',
      'ULD ID',
      'BRS Status',
      'Pax Status',
      'GPS Lat',
      'GPS Lng',
      'Stand Distance (m)',
      'Geofence Zone',
      'Scanned By',
      'Device ID',
    ];

    const rows = scannedBags.map((b) => [
      b.timestampUtc,
      b.iataTag,
      b.barcode,
      `"${b.airlineName}"`,
      `"${b.passengerName}"`,
      b.seatNumber || '',
      b.pnr,
      b.destination,
      b.bagType,
      b.weightKg,
      b.holdLocation,
      b.uldId || '',
      b.brsStatus,
      b.paxStatus,
      b.gps.latitude,
      b.gps.longitude,
      b.gps.standDistanceMeters,
      b.gps.zone,
      `"${b.scannedBy}"`,
      b.deviceId,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BRS_Manifest_${selectedFlight?.flightNumber || 'FLT'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered bag list
  const filteredBags = scannedBags.filter((b) => {
    const matchesSearch =
      b.iataTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.uldId && b.uldId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHold = filterHold === 'ALL' || b.holdLocation === filterHold;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'OK' && b.brsStatus === 'LOADED_OK') ||
      (filterStatus === 'ALERT' && (b.brsStatus === 'REJECTED_NO_SHOW' || b.brsStatus === 'SECURITY_ALERT'));

    return matchesSearch && matchesHold && matchesStatus;
  });

  // Calculate stats
  const totalScanned = scannedBags.length;
  const loadedOkCount = scannedBags.filter((b) => b.brsStatus === 'LOADED_OK').length;
  const alertCount = scannedBags.filter((b) => b.brsStatus === 'REJECTED_NO_SHOW' || b.brsStatus === 'SECURITY_ALERT').length;
  const totalWeight = scannedBags.reduce((acc, b) => acc + (b.brsStatus === 'LOADED_OK' ? b.weightKg : 0), 0);

  return (
    <div className="space-y-5">
      
      {/* 1. Zebra TC26 Device & Telemetry Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Device & Hardware Profile */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Zebra TC26 Handheld BRS Engine</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  SE4710 ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  DATAWEDGE READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Flight <strong className="text-white">{selectedFlight?.flightNumber || 'QR 123'}</strong> • Stand <strong className="text-white">{selectedFlight?.gate || 'C12'}</strong> • IATA Res 753 Real-Time Reconciliation
              </p>
            </div>
          </div>

          {/* Right: GPS Geofence & Hardware Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* GPS Geofence Pill */}
            <div 
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                geofenceZone === 'ON_STAND'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : geofenceZone === 'INNER_APRON'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-sky-950/60 border-sky-500/50 text-sky-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>
                GNSS ±{currentGps.accuracy}m • {standDistance}m from {selectedFlight?.gate || 'Stand C12'}
              </span>
              <span className="text-[10px] px-1 rounded bg-slate-900/80">
                {geofenceZone === 'ON_STAND' ? 'ON-STAND' : geofenceZone}
              </span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) zebraScannerService.playSuccessBeep();
              }}
              className={`p-2 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-sky-950/60 border-sky-500/50 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={audioEnabled ? 'Ramp Sound Beep Enabled' : 'Muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Haptic Toggle */}
            <button
              onClick={() => {
                setHapticEnabled(!hapticEnabled);
                if (!hapticEnabled) zebraScannerService.vibrate([100]);
              }}
              className={`p-2 rounded-xl border transition-all ${
                hapticEnabled
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={hapticEnabled ? 'Vibration Haptic Active' : 'Haptic Off'}
            >
              <Vibrate className="w-4 h-4" />
            </button>

            {/* Hardware Setup Guide Modal Button */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Zebra TC26 Setup</span>
            </button>

          </div>

        </div>

        {/* View Switcher Sub-tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveSubView('SCANNER')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubView === 'SCANNER'
                ? 'bg-sky-600 text-white font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Live Barcode Scanner</span>
          </button>

          <button
            onClick={() => setActiveSubView('RADAR')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubView === 'RADAR'
                ? 'bg-sky-600 text-white font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Apron GNSS Radar</span>
          </button>

          <button
            onClick={() => setActiveSubView('MANIFEST')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubView === 'MANIFEST'
                ? 'bg-sky-600 text-white font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Scanned Bags Manifest ({totalScanned})</span>
          </button>
        </div>
      </div>

      {/* View 1: Main Barcode Scanner & Hold Loading */}
      {activeSubView === 'SCANNER' && (
        <div className="space-y-5">
          
          {/* Critical BRS Alert Banner (for No-Shows & Rejections) */}
          {criticalAlert && criticalAlert.show && (
            <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-rose-200 text-base flex items-center gap-2">
                      <span>{criticalAlert.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-rose-600 text-white font-mono">
                        DO NOT LOAD
                      </span>
                    </h4>
                    <button
                      onClick={() => setCriticalAlert(null)}
                      className="text-rose-400 hover:text-white text-xs font-mono font-bold"
                    >
                      DISMISS ×
                    </button>
                  </div>
                  <p className="text-xs text-rose-200 mt-1 font-semibold">
                    {criticalAlert.description}
                  </p>
                  {criticalAlert.bag && (
                    <div className="mt-3 p-3 bg-black/40 rounded-xl border border-rose-500/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-rose-200">
                      <div>
                        <span className="text-rose-400 text-[10px] block">IATA TAG</span>
                        <strong>{criticalAlert.bag.iataTag}</strong>
                      </div>
                      <div>
                        <span className="text-rose-400 text-[10px] block">PASSENGER</span>
                        <strong>{criticalAlert.bag.passengerName}</strong>
                      </div>
                      <div>
                        <span className="text-rose-400 text-[10px] block">SEAT / PNR</span>
                        <strong>Seat {criticalAlert.bag.seatNumber || 'N/A'} • {criticalAlert.bag.pnr}</strong>
                      </div>
                      <div>
                        <span className="text-rose-400 text-[10px] block">MANDATORY ACTION</span>
                        <strong className="text-white bg-rose-600 px-1.5 py-0.5 rounded">HOLD & SEGREGATE</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hold & ULD Assignment Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Plane className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white text-sm">Aircraft Cargo Hold Assignment</span>
              </div>

              {/* Mode Toggle: Load / Offload / Audit */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setScanMode('LOAD')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    scanMode === 'LOAD'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  LOAD (OUTBOUND)
                </button>
                <button
                  onClick={() => setScanMode('OFFLOAD')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    scanMode === 'OFFLOAD'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  OFFLOAD (INBOUND)
                </button>
                <button
                  onClick={() => setScanMode('AUDIT')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    scanMode === 'AUDIT'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AUDIT ONLY
                </button>
              </div>
            </div>

            {/* Aircraft Hold Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'FWD_HOLD_1', label: 'FWD Hold 1', sub: 'Forward Compartment' },
                { id: 'FWD_HOLD_2', label: 'FWD Hold 2', sub: 'Forward Lower' },
                { id: 'AFT_HOLD_3', label: 'AFT Hold 3', sub: 'Aft Compartment' },
                { id: 'AFT_HOLD_4', label: 'AFT Hold 4', sub: 'Aft Lower' },
                { id: 'BULK_HOLD_5', label: 'Bulk Hold 5', sub: 'Loose & Heavy' },
                { id: 'ULD_CONTAINER', label: 'ULD / AKE', sub: selectedUld },
              ].map((hold) => (
                <button
                  key={hold.id}
                  onClick={() => setSelectedHold(hold.id as HoldLocation)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedHold === hold.id
                      ? 'bg-sky-600/20 border-sky-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs">{hold.label}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{hold.sub}</span>
                </button>
              ))}
            </div>

            {/* If ULD is selected, show ULD quick switch */}
            {selectedHold === 'ULD_CONTAINER' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Select Active ULD Container:</span>
                {uldList.map((uld) => (
                  <button
                    key={uld}
                    onClick={() => setSelectedUld(uld)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                      selectedUld === uld
                        ? 'bg-emerald-600 text-white border border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {uld}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Barcode Scanner Input Bar & Ingest Box */}
          <div className="bg-slate-900 border-2 border-sky-500/50 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-400">
                  <Barcode className="w-5 h-5" />
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Aim Zebra TC26 & pull yellow trigger (e.g. 0157891234)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleExecuteScan(barcodeInput);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-sky-500/60 rounded-xl text-base text-sky-300 font-mono focus:ring-2 focus:ring-sky-400 focus:outline-none placeholder:text-slate-600"
                  autoFocus
                />
              </div>

              <button
                onClick={() => handleExecuteScan(barcodeInput)}
                className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all shrink-0 font-mono uppercase"
              >
                <Zap className="w-4 h-4" />
                <span>Ingest Scan</span>
              </button>
            </div>

            {/* Quick Demo Scan Buttons for Rapid Field Simulation */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                ⚡ RAPID TEST BARCODES (SIMULATE ZEBRA TC26 TRIGGER):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {zebraScannerService.getSampleDemoBags().map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handleExecuteScan(sample.barcode)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">{sample.barcode}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Last Scanned Bag Visual Card */}
          {lastScannedBag && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    lastScannedBag.brsStatus === 'LOADED_OK'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {lastScannedBag.brsStatus === 'LOADED_OK' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-mono text-slate-400">LAST SCANNED BAGGAGE TAG</span>
                    <h4 className="font-bold text-white text-base font-mono">{lastScannedBag.iataTag}</h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    lastScannedBag.brsStatus === 'LOADED_OK'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  }`}>
                    {lastScannedBag.brsStatus}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-mono mt-1">
                    {lastScannedBag.deviceTimestamp} (UTC)
                  </span>
                </div>
              </div>

              {/* Bag Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">PASSENGER</span>
                  <span className="font-bold text-white truncate block">{lastScannedBag.passengerName}</span>
                  <span className="text-slate-400 text-[10px]">Seat {lastScannedBag.seatNumber || 'N/A'} • PNR: {lastScannedBag.pnr}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">HOLD / ULD</span>
                  <span className="font-bold text-sky-300 block">{lastScannedBag.holdLocation.replace('_', ' ')}</span>
                  <span className="text-slate-400 text-[10px]">{lastScannedBag.uldId || 'BULK CARGO'}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">BAG TYPE & WEIGHT</span>
                  <span className="font-bold text-amber-300 block">{lastScannedBag.bagType}</span>
                  <span className="text-slate-400 text-[10px]">{lastScannedBag.weightKg} kg</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">GPS GEO-STAMP</span>
                  <span className="font-bold text-emerald-300 block">
                    {lastScannedBag.gps.standDistanceMeters}m to Stand
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {lastScannedBag.gps.latitude.toFixed(4)}, {lastScannedBag.gps.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className={`p-3 rounded-xl text-xs font-mono font-bold ${
                lastScannedBag.brsStatus === 'LOADED_OK'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
              }`}>
                {lastScannedBag.statusMessage}
              </div>
            </div>
          )}

          {/* Scanned Bag Counters Meter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400">TOTAL SCANNED</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{totalScanned}</div>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-emerald-400">LOADED (BRS OK)</span>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{loadedOkCount}</div>
            </div>
            <div className="bg-slate-900 border border-rose-500/30 bg-rose-950/10 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-rose-400">ALERTS / NO-SHOW</span>
              <div className="text-2xl font-bold font-mono text-rose-300 mt-1">{alertCount}</div>
            </div>
            <div className="bg-slate-900 border border-sky-500/30 bg-sky-950/10 p-4 rounded-xl">
              <span className="text-[10px] font-mono text-sky-400">TOTAL WEIGHT (KG)</span>
              <div className="text-2xl font-bold font-mono text-sky-300 mt-1">{totalWeight.toFixed(1)} kg</div>
            </div>
          </div>

        </div>
      )}

      {/* View 2: Visual Apron Radar & GPS Geofence */}
      {activeSubView === 'RADAR' && (
        <ApronGeofenceMap
          currentGps={currentGps}
          standName={selectedFlight?.gate || 'C12'}
          airportIata="DOH"
          scannedBags={scannedBags}
          onSimulateMove={(lat, lng) => {
            setCurrentGps((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              timestamp: Date.now(),
            }));
            const doh = AIRPORT_COORDINATES['DOH'];
            const gate = selectedFlight?.gate || 'C12';
            const stand = doh.gates[gate] || { lat: 25.2635, lng: 51.6142 };
            const dLat = (lat - stand.lat) * 111000;
            const dLng = (lng - stand.lng) * 111000;
            const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
            setStandDistance(dist);
            setGeofenceZone(dist <= 45 ? 'ON_STAND' : dist <= 150 ? 'INNER_APRON' : 'SORTING_FACILITY');
          }}
        />
      )}

      {/* View 3: Complete Scanned Manifest & Audit Feed */}
      {activeSubView === 'MANIFEST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-white text-base">Baggage Reconciliation Manifest (BRS)</h4>
              <p className="text-xs text-slate-400">Complete audit log of all scanned bags with GNSS tags and hold locations.</p>
            </div>

            <button
              onClick={handleExportManifest}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BRS CSV</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative flex-1 min-w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tag #, passenger name, PNR, or ULD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
              />
            </div>

            <select
              value={filterHold}
              onChange={(e) => setFilterHold(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
            >
              <option value="ALL">All Holds</option>
              <option value="FWD_HOLD_1">FWD Hold 1</option>
              <option value="FWD_HOLD_2">FWD Hold 2</option>
              <option value="AFT_HOLD_3">AFT Hold 3</option>
              <option value="AFT_HOLD_4">AFT Hold 4</option>
              <option value="BULK_HOLD_5">Bulk Hold 5</option>
              <option value="ULD_CONTAINER">ULD Containers</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="OK">Loaded OK (Reconciled)</option>
              <option value="ALERT">BRS Alerts & Rejections</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">TIME (UTC)</th>
                  <th className="p-3">IATA TAG</th>
                  <th className="p-3">PASSENGER</th>
                  <th className="p-3">DEST</th>
                  <th className="p-3">HOLD / ULD</th>
                  <th className="p-3">TYPE / WT</th>
                  <th className="p-3">GPS & STAND</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBags.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                      No matching baggage records found.
                    </td>
                  </tr>
                ) : (
                  filteredBags.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="p-3 text-slate-400">{b.deviceTimestamp}</td>
                      <td className="p-3 font-bold text-white">{b.iataTag}</td>
                      <td className="p-3">
                        <span className="text-slate-200 block truncate max-w-36">{b.passengerName}</span>
                        <span className="text-slate-500 text-[10px]">Seat {b.seatNumber || 'N/A'} • {b.pnr}</span>
                      </td>
                      <td className="p-3 text-sky-300">{b.destination}</td>
                      <td className="p-3">
                        <span className="text-slate-300 block">{b.holdLocation.replace('_', ' ')}</span>
                        {b.uldId && <span className="text-emerald-400 text-[10px]">{b.uldId}</span>}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-300 block">{b.bagType}</span>
                        <span className="text-slate-500 text-[10px]">{b.weightKg} kg</span>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 block">{b.gps.standDistanceMeters}m to Stand</span>
                        <span className="text-slate-500 text-[10px]">{b.gps.zone}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.brsStatus === 'LOADED_OK'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {b.brsStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Zebra TC26 Configuration & DataWedge Modal */}
      <ZebraConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
};
