import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  X,
  Radio,
  Barcode,
  Volume2,
  VolumeX,
  Layers,
  Plane,
  AlertOctagon,
  CheckCircle,
  Zap,
  Sparkles,
  Search
} from 'lucide-react';
import { HoldPosition, Flight } from '../../types';
import { soundManager } from '../../utils/audio';

interface ZebraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStep?: 1 | 2;
}

export const ZebraScannerModal: React.FC<ZebraScannerModalProps> = ({
  isOpen,
  onClose,
  defaultStep = 2
}) => {
  const { t, isRtl } = useLanguage();
  const {
    flights,
    selectedFlight,
    setSelectedFlightId,
    scanBagStep1,
    scanBagStep2,
    baggage,
    simulateBatchScan,
    dollies
  } = useApp();

  const [step, setStep] = useState<1 | 2>(defaultStep);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedHold, setSelectedHold] = useState<HoldPosition>('Hold 1 Fwd');
  const [selectedZone, setSelectedZone] = useState('Carousel 02 - Zone North');
  const [selectedDolly, setSelectedDolly] = useState('DLY-101');
  const [soundOn, setSoundOn] = useState(true);
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'warning';
    title: string;
    details: string;
    tag?: string;
    pax?: string;
    timestamp?: string;
  }>({ status: 'idle', title: '', details: '' });

  if (!isOpen) return null;

  const currentFlight = selectedFlight || flights[0];
  const flightBags = baggage.filter(b => b.flightNbr === currentFlight?.flightNbr);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    soundManager.setSoundEnabled(newState);
  };

  const handleProcessScan = (tagOverride?: string) => {
    const tagToScan = tagOverride || barcodeInput;
    if (!tagToScan.trim() || !currentFlight) return;

    setIsScanningAnimation(true);

    setTimeout(() => {
      setIsScanningAnimation(false);

      if (step === 1) {
        // Step 1: Sorting Scan
        const result = scanBagStep1(tagToScan, currentFlight.flightNbr, selectedZone, selectedDolly);
        if (result.success) {
          setScanResult({
            status: 'success',
            title: 'SORTING VERIFIED',
            details: result.message,
            tag: result.bag?.tagNumber,
            pax: result.bag?.passengerName,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          setScanResult({
            status: 'error',
            title: 'SORTING REJECTED / DISCREPANCY',
            details: result.message,
            tag: tagToScan,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } else {
        // Step 2: Aircraft Loading Verification Scan
        const result = scanBagStep2(tagToScan, currentFlight.flightNbr, selectedHold);
        if (result.success) {
          setScanResult({
            status: 'success',
            title: 'AIRCRAFT HOLD STOWAGE CONFIRMED',
            details: result.message,
            tag: result.bag?.tagNumber,
            pax: result.bag?.passengerName,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (result.isWrongFlight) {
          setScanResult({
            status: 'error',
            title: 'CRITICAL: WRONG FLIGHT TAG!',
            details: result.message,
            tag: tagToScan,
            pax: result.bag?.passengerName,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          setScanResult({
            status: 'warning',
            title: 'UNKNOWN / UNMATCHED TAG',
            details: result.message,
            tag: tagToScan,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }

      setBarcodeInput('');
    }, 250);
  };

  // Quick test tags
  const sampleTags = flightBags.slice(0, 6);

  return (
    <div id="zebra-scanner-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="zebra-device-frame"
        className="relative w-full max-w-xl bg-slate-900 text-white rounded-3xl shadow-2xl border-4 border-slate-700 overflow-hidden flex flex-col"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Zebra Device Top Bar / Rugged Bezel */}
        <div className="bg-slate-950 px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
              ZEBRA TC57x TOUCH COMPUTER
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={soundOn ? 'Sound Feedback ON' : 'Sound Feedback MUTED'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Selector Tabs (Step 1 Sorting vs Step 2 Loading) */}
        <div className="bg-slate-800/80 p-2 border-b border-slate-700 flex gap-2">
          <button
            id="tab-step-1"
            onClick={() => {
              setStep(1);
              setScanResult({ status: 'idle', title: '', details: '' });
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              step === 1
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Step 1: Check-in / Sorter</span>
          </button>

          <button
            id="tab-step-2"
            onClick={() => {
              setStep(2);
              setScanResult({ status: 'idle', title: '', details: '' });
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              step === 2
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Step 2: Hold Loading Scan</span>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Target Flight Selection Header */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('currentSelectedFlight')}
              </label>
              <select
                id="scanner-flight-select"
                value={currentFlight?.id}
                onChange={(e) => setSelectedFlightId(e.target.value)}
                className="mt-1 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                {flights.map((f: Flight) => (
                  <option key={f.id} value={f.id}>
                    {f.flightNbr} - {f.companyName} ({f.reg}) • Stand {f.subplaneAreaZone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px]">Expected</span>
                <span className="font-bold text-white">{currentFlight?.totalBagsExpected} Bags</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sorted</span>
                <span className="font-bold text-sky-400">{currentFlight?.bagsSortedCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Loaded</span>
                <span className="font-bold text-emerald-400">{currentFlight?.bagsLoadedCount}</span>
              </div>
            </div>
          </div>

          {/* Workflow Mode Specific Controls */}
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-3 bg-sky-950/40 p-3 rounded-xl border border-sky-800/60">
              <div>
                <label className="text-[10px] font-bold text-sky-300 uppercase block">Sorting Zone</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-sky-700/60 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="Carousel 02 - Zone North">Carousel 02 (North Makeup)</option>
                  <option value="Carousel 01 - Main">Carousel 01 (Central Sorter)</option>
                  <option value="East Sorter Makeup Carousel 03">East Sorter Bay 03</option>
                  <option value="Widebody Makeup Bay 4">Widebody Bay 4</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-sky-300 uppercase block">Assigned Dolly</label>
                <select
                  value={selectedDolly}
                  onChange={(e) => setSelectedDolly(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-sky-700/60 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {dollies.map(d => (
                    <option key={d.id} value={d.id}>{d.id} ({d.type})</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60">
              <label className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">
                Target Aircraft Cargo Hold Door
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Hold 1 Fwd', 'Hold 2 Aft', 'Hold 3 Bulk'] as HoldPosition[]).map((hold) => (
                  <button
                    key={hold}
                    type="button"
                    onClick={() => setSelectedHold(hold)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedHold === hold
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {hold}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Realistic Virtual Scanner Viewport / Laser Screen */}
          <div className="relative h-36 bg-black rounded-2xl border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center p-4">
            
            {/* Red Laser Sweep Line */}
            <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-laser"></div>
            
            {/* Target Reticle Crosshairs */}
            <div className="absolute inset-6 border border-dashed border-rose-500/40 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-rose-400/80 font-mono tracking-widest uppercase">
                {step === 1 ? 'SORTING RFID/BARCODE' : 'HOLD LOADING VERIFIER'}
              </span>
            </div>

            {/* Live Scan Input inside viewport */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan();
              }} 
              className="relative z-10 w-full max-w-sm flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
                <input
                  id="zebra-tag-input"
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or enter 10-digit tag..."
                  autoFocus
                  className="w-full bg-slate-900/90 border-2 border-sky-500 text-white rounded-xl pl-9 pr-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-500 rtl:pl-3 rtl:pr-9"
                />
              </div>
              <button
                type="submit"
                disabled={isScanningAnimation || !barcodeInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
              >
                {t('triggerScan')}
              </button>
            </form>

            <p className="mt-2 text-[10px] text-slate-400 font-mono">
              Aim barcode scanner or click quick sample tags below
            </p>
          </div>

          {/* Scan Feedback Banner */}
          {scanResult.status !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                scanResult.status === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                  : scanResult.status === 'error'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-100'
                  : 'bg-amber-950/80 border-amber-500 text-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {scanResult.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : scanResult.status === 'error' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                ) : (
                  <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-xs tracking-wide">{scanResult.title}</p>
                    <span className="text-[10px] font-mono opacity-80">{scanResult.timestamp}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">{scanResult.details}</p>
                  {scanResult.tag && (
                    <div className="mt-1 flex items-center gap-3 text-[11px] font-mono">
                      <span>Tag: <strong className="text-white">{scanResult.tag}</strong></span>
                      {scanResult.pax && <span>Pax: <strong className="text-white">{scanResult.pax}</strong></span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Test Bag Tag Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Test Flight Tags ({currentFlight?.flightNbr})</span>
              </span>
              <button
                type="button"
                onClick={() => simulateBatchScan(currentFlight?.flightNbr || 'TU-720', step, 3)}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>{t('batchScanMode')} (3x)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sampleTags.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleProcessScan(b.tagNumber)}
                  className={`p-2 rounded-lg text-left rtl:text-right border transition-all cursor-pointer ${
                    b.status === 'LOADED'
                      ? 'bg-emerald-950/40 border-emerald-700/50 hover:bg-emerald-900/60 text-emerald-200'
                      : b.status === 'SORTED'
                      ? 'bg-sky-950/40 border-sky-700/50 hover:bg-sky-900/60 text-sky-200'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>{b.tagNumber}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900">{b.status}</span>
                  </div>
                  <p className="text-[10px] truncate text-slate-400 mt-0.5">{b.passengerName}</p>
                </button>
              ))}
            </div>

            {/* Test Foreign Wrong-Flight Tag Button */}
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleProcessScan('0099999999')}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Test Wrong/Unknown Bag Tag (0099999999)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Soltane Aviation Services Zebra Engine</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t('close')}
          </button>
        </div>

      </div>
    </div>
  );
};
