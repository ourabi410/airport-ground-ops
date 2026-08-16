import React, { useState } from 'react';
import { 
  Smartphone, 
  Settings, 
  Barcode, 
  Volume2, 
  Vibrate, 
  MapPin, 
  CheckCircle2, 
  X, 
  Copy, 
  ExternalLink,
  Zap,
  Shield,
  HelpCircle,
  Play
} from 'lucide-react';
import { zebraScannerService } from '../../services/zebraScannerService';

interface ZebraConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZebraConfigModal: React.FC<ZebraConfigModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DATAWEDGE' | 'TEST_PAD' | 'GPS_CONFIG' | 'AUDIO_HAPTIC'>('DATAWEDGE');
  const [testBarcode, setTestBarcode] = useState('');
  const [testLogs, setTestLogs] = useState<Array<{ text: string; time: string; type: string }>>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestScan = (code: string) => {
    zebraScannerService.playSuccessBeep();
    const now = new Date().toLocaleTimeString();
    setTestLogs((prev) => [
      { text: code, time: now, type: zebraScannerService.isUldBarcode(code) ? 'ULD CONTAINER' : 'IATA BAGGAGE' },
      ...prev.slice(0, 7),
    ]);
  };

  const handleTestErrorBuzzer = () => {
    zebraScannerService.playErrorBuzzer();
    const now = new Date().toLocaleTimeString();
    setTestLogs((prev) => [
      { text: '0157999888 (REJECTED_NO_SHOW)', time: now, type: 'ALERT BUZZER' },
      ...prev.slice(0, 7),
    ]);
  };

  const copyConfigInstructions = () => {
    const text = `Zebra TC26 DataWedge Setup for Ramp Operations:
1. Open DataWedge app on Zebra TC26
2. Create Profile: "Turnaround_BRS"
3. Associate App: com.android.chrome (or Enterprise Browser)
4. Keystroke Output -> Enabled (Checked)
5. Basic Data Formatting -> Send ENTER key (Checked)
6. Scanner Selection -> Internal 1D/2D Imager (SE4710)
7. Hardware Trigger -> Left & Right Yellow Keys enabled`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Zebra TC26 Enterprise Configuration</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SE4710 / GNSS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hardware imager, DataWedge keystroke integration, GPS geofencing & haptics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('DATAWEDGE')}
            className={`px-4 py-3 border-b-2 transition-all ${
              activeTab === 'DATAWEDGE'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. DataWedge Setup
          </button>
          <button
            onClick={() => setActiveTab('TEST_PAD')}
            className={`px-4 py-3 border-b-2 transition-all ${
              activeTab === 'TEST_PAD'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Barcode Test Pad
          </button>
          <button
            onClick={() => setActiveTab('GPS_CONFIG')}
            className={`px-4 py-3 border-b-2 transition-all ${
              activeTab === 'GPS_CONFIG'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. GNSS / GPS Setup
          </button>
          <button
            onClick={() => setActiveTab('AUDIO_HAPTIC')}
            className={`px-4 py-3 border-b-2 transition-all ${
              activeTab === 'AUDIO_HAPTIC'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Sound & Haptic Test
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          
          {activeTab === 'DATAWEDGE' && (
            <div className="space-y-4">
              <div className="bg-sky-950/30 border border-sky-500/30 p-3.5 rounded-xl text-sky-200">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  Zero-Latency Keystroke Wedge Integration
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  The app automatically detects rapid barcode streams from Zebra SE4710 hardware triggers.
                  When you pull the side yellow trigger, the barcode is ingested instantly without needing to touch or click any input box!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  Step-by-Step DataWedge Configuration on Zebra TC26:
                </h4>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Open Zebra DataWedge App</strong>
                      <p className="text-slate-400">Swipe up on home screen and tap the pre-installed <strong>DataWedge</strong> icon.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Create Profile: "Turnaround_BRS"</strong>
                      <p className="text-slate-400">Tap 3 dots (Menu) &gt; New profile &gt; Name it <strong>Turnaround_BRS</strong>.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Associate with Browser / Web App</strong>
                      <p className="text-slate-400">Under <em>Associated Apps</em>, tap <strong>com.android.chrome</strong> (or Zebra Enterprise Browser) with activity <strong>*</strong>.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </span>
                    <div>
                      <strong className="text-white">Enable Keystroke Output & Enter Suffix</strong>
                      <p className="text-slate-400">Check <strong>Keystroke output (Enabled)</strong> &gt; <em>Basic data formatting</em> &gt; Check <strong>Send ENTER key</strong>.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                      5
                    </span>
                    <div>
                      <strong className="text-white">Verify Barcode Decoders</strong>
                      <p className="text-slate-400">Ensure <strong>Code 128</strong>, <strong>Interleaved 2 of 5 (IATA Baggage Standard)</strong>, and <strong>QR Code / DataMatrix</strong> are checked.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={copyConfigInstructions}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SOP Instructions'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'TEST_PAD' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  🎯 Hardware Scanner Benchmark (Pull Zebra TC26 trigger while focused here):
                </label>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Aim Zebra TC26 & pull yellow scan button..."
                    value={testBarcode}
                    onChange={(e) => setTestBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && testBarcode.trim()) {
                        handleTestScan(testBarcode.trim());
                        setTestBarcode('');
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-sky-500/50 rounded-lg px-3 py-2 text-sm text-sky-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (testBarcode.trim()) {
                        handleTestScan(testBarcode.trim());
                        setTestBarcode('');
                      }
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs"
                  >
                    Test Ingest
                  </button>
                </div>
              </div>

              {/* Sample test triggers */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-2">QUICK TEST BARCODES:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleTestScan('0157891234')}
                    className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left font-mono text-[11px]"
                  >
                    <span className="text-sky-300 block font-bold">0157891234</span>
                    <span className="text-slate-400 text-[10px]">VIP 1st Class (QR)</span>
                  </button>
                  <button
                    onClick={() => handleTestScan('0157894401')}
                    className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left font-mono text-[11px]"
                  >
                    <span className="text-slate-200 block font-bold">0157894401</span>
                    <span className="text-slate-400 text-[10px]">Economy Std (QR)</span>
                  </button>
                  <button
                    onClick={() => handleTestScan('AKE10294QR')}
                    className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left font-mono text-[11px]"
                  >
                    <span className="text-emerald-400 block font-bold">AKE10294QR</span>
                    <span className="text-slate-400 text-[10px]">ULD Container</span>
                  </button>
                </div>
              </div>

              {/* Log stream */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono text-slate-400 block">REAL-TIME INGEST STREAM:</span>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 min-h-24 max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {testLogs.length === 0 ? (
                    <span className="text-slate-600 italic">No barcodes scanned yet. Pull the Zebra scanner trigger...</span>
                  ) : (
                    testLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-300 border-b border-slate-900 pb-1">
                        <span className="text-sky-300 font-bold">{log.text}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{log.type}</span>
                          <span className="text-slate-500 text-[10px]">{log.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'GPS_CONFIG' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  High-Precision GNSS Positioning on Zebra TC26
                </h4>
                <p className="text-xs text-slate-300">
                  The Zebra TC26 features an integrated Qualcomm multi-constellation GNSS receiver supporting 
                  <strong> GPS (USA)</strong>, <strong>GLONASS (Russia)</strong>, <strong>Galileo (Europe)</strong>, and <strong>Beidou (China)</strong>.
                </p>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Android Location Mode:</span>
                    <span className="text-emerald-400 font-bold font-mono">High Accuracy (GPS + Wi-Fi + Cellular)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Apron Stand Radius:</span>
                    <span className="text-sky-300 font-bold font-mono">45 meters (Aircraft Loading Zone)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IATA Standard:</span>
                    <span className="text-purple-300 font-bold font-mono">Resolution 753 Compliant Geo-tag</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
                <strong>💡 Ramp Tip for Best GPS Accuracy:</strong> Ensure the top antenna portion of the Zebra TC26 is not blocked when standing under heavy aircraft wings or widebody belly holds.
              </div>
            </div>
          )}

          {activeTab === 'AUDIO_HAPTIC' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  Ramp Audio & Haptic Feedback Calibration
                </h4>
                <p className="text-xs text-slate-300">
                  In loud tarmac environments with hearing protection (ear defenders), audio pitch and tactile vibration are essential to prevent loading errors.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => zebraScannerService.playSuccessBeep()}
                    className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 text-xs">Test Success Beep (1760 Hz)</span>
                      <Play className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Short crisp high tone + 70ms haptic pulse</span>
                  </button>

                  <button
                    onClick={() => handleTestErrorBuzzer()}
                    className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/40 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 text-xs">Test Alert Buzzer (240 Hz)</span>
                      <Play className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Double low buzzer + urgent vibration</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            DEVICE MODEL: ZEBRA TC26 (ANDROID 11/13 TOUCH COMPUTER)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
