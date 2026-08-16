import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BaggageData, GpsLocation } from '../../types';
import { compressImage } from '../../utils/photoUtils';
import { gpsService } from '../../services/gpsService';
import { ZebraScannerView } from './ZebraScannerView';
import { ApronGeofenceMap } from './ApronGeofenceMap';
import {
  Luggage,
  Plus,
  Minus,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Package,
  Layers,
  Save,
  Barcode,
  Smartphone,
  Radio,
  Sliders,
} from 'lucide-react';

export const BaggageModule: React.FC = () => {
  const { selectedFlight, selectedBaggage, updateBaggage, currentUser } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'ZEBRA_SCANNER' | 'COUNTERS_ULD' | 'RADAR' | 'DAMAGE_LOG'>('ZEBRA_SCANNER');
  const [radarGps, setRadarGps] = useState<GpsLocation>({
    latitude: 25.2635,
    longitude: 51.6142,
    accuracy: 3,
    timestamp: Date.now(),
    status: 'HIGH_ACCURACY',
  });

  useEffect(() => {
    let mounted = true;
    gpsService.getCurrentPosition('DOH', selectedFlight?.gate || 'C12').then((loc) => {
      if (mounted) setRadarGps(loc);
    });
    return () => { mounted = false; };
  }, [selectedFlight]);

  const handleSimulateMove = (lat: number, lng: number) => {
    setRadarGps({
      latitude: lat,
      longitude: lng,
      accuracy: 3,
      timestamp: Date.now(),
      status: 'HIGH_ACCURACY',
    });
  };

  const [bagData, setBagData] = useState<BaggageData>(
    selectedBaggage || {
      id: `bag_${selectedFlight?.id || 'temp'}`,
      flightId: selectedFlight?.id || 'temp',
      totalBags: selectedFlight?.totalBaggage || 240,
      loadedBags: selectedFlight?.loadedBaggage || 180,
      unloadedBags: selectedFlight?.unloadedBaggage || 240,
      missingBags: 1,
      damagedBags: 2,
      lateBags: 4,
      specialBags: 14,
      transferBags: 68,
      containerUldList: ['AKE10294QR', 'AKE44921QR', 'AKE98122QR'],
      damageReportNotes: 'Two hard-shell bags reported with handle scuffs during transit offload.',
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    }
  );

  const [newUld, setNewUld] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateField = (field: keyof BaggageData, delta: number) => {
    setBagData((prev) => {
      const currentVal = (prev[field] as number) || 0;
      const newVal = Math.max(0, currentVal + delta);
      return { ...prev, [field]: newVal };
    });
  };

  const handleAddUld = () => {
    if (!newUld.trim()) return;
    setBagData((prev) => ({
      ...prev,
      containerUldList: [...prev.containerUldList, newUld.trim().toUpperCase()],
    }));
    setNewUld('');
  };

  const handleRemoveUld = (index: number) => {
    setBagData((prev) => ({
      ...prev,
      containerUldList: prev.containerUldList.filter((_, i) => i !== index),
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setBagData((prev) => ({
        ...prev,
        damagePhotos: [...(prev.damagePhotos || []), compressed],
      }));
    } catch (err) {
      console.warn('Failed to compress image', err);
    }
  };

  const handleSave = async () => {
    if (!selectedFlight) return;
    setIsSaving(true);
    await updateBaggage(selectedFlight.id, bagData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const progressPercent =
    bagData.totalBags > 0 ? Math.min(100, Math.round((bagData.loadedBags / bagData.totalBags) * 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Luggage className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-white">Baggage Handling & Zebra TC26 Integration</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                BRS & GNSS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Flight {selectedFlight?.flightNumber || 'QR 123'} • Barcode scanning, hold assignment, and IATA Res 753 geofencing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-save-baggage"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved & Queued</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Baggage State'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ZEBRA_SCANNER')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl transition-all ${
            activeSubTab === 'ZEBRA_SCANNER'
              ? 'bg-sky-600 text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Barcode className="w-4 h-4 text-sky-300" />
          <span>Zebra TC26 BRS Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COUNTERS_ULD')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl transition-all ${
            activeSubTab === 'COUNTERS_ULD'
              ? 'bg-sky-600 text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-300" />
          <span>Hold Counts & ULDs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('RADAR')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl transition-all ${
            activeSubTab === 'RADAR'
              ? 'bg-sky-600 text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-sky-300" />
          <span>Apron GNSS Geofence</span>
        </button>

        <button
          onClick={() => setActiveSubTab('DAMAGE_LOG')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl transition-all ${
            activeSubTab === 'DAMAGE_LOG'
              ? 'bg-sky-600 text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Damage Log & Photos</span>
        </button>
      </div>

      {/* TAB 1: Zebra TC26 Live Barcode Scanner & BRS */}
      {activeSubTab === 'ZEBRA_SCANNER' && (
        <ZebraScannerView />
      )}

      {/* TAB 2: Hold Counters & ULD Management */}
      {activeSubTab === 'COUNTERS_ULD' && (
        <div className="space-y-6">
          {/* Main Loading Meter */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="font-bold text-sm">Outbound Baggage Loading Progress</span>
              <span className="text-sky-400 font-bold text-base">{bagData.loadedBags} / {bagData.totalBags} Bags ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Bag Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Expected Bags */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-slate-400">TOTAL BAGS EXPECTED</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-white">{bagData.totalBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('totalBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('totalBags', 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loaded Bags */}
            <div className="bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-emerald-400">LOADED BAGS (OUTBOUND)</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-300">{bagData.loadedBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('loadedBags', -5)}
                    className="px-1.5 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleUpdateField('loadedBags', 1)}
                    className="w-7 h-7 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('loadedBags', 5)}
                    className="px-1.5 h-7 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* Unloaded Bags */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-slate-400">UNLOADED BAGS (INBOUND)</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-white">{bagData.unloadedBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('unloadedBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('unloadedBags', 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Transfer Bags */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-slate-400">TRANSFER / CONNECTING BAGS</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-sky-300">{bagData.transferBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('transferBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('transferBags', 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Special / Fragile / VIP Bags */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-slate-400">SPECIAL / FRAGILE / VIP</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-amber-300">{bagData.specialBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('specialBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('specialBags', 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Missing Bags */}
            <div className="bg-slate-900 border border-rose-500/30 bg-rose-950/10 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-rose-400">MISSING / SHORT-SHIPPED</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-rose-300">{bagData.missingBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('missingBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('missingBags', 1)}
                    className="w-7 h-7 rounded bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Damaged Bags */}
            <div className="bg-slate-900 border border-rose-500/30 bg-rose-950/10 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-rose-400">DAMAGED BAGS</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-rose-300">{bagData.damagedBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('damagedBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('damagedBags', 1)}
                    className="w-7 h-7 rounded bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Late Bags */}
            <div className="bg-slate-900 border border-amber-500/30 bg-amber-950/10 p-4 rounded-xl">
              <div className="text-[11px] font-mono text-amber-400">LATE / RUSH BAGS</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold font-mono text-amber-300">{bagData.lateBags}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateField('lateBags', -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateField('lateBags', 1)}
                    className="w-7 h-7 rounded bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ULD / Container Management */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-sm">Assigned ULD / AKE Containers</h4>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. AKE12948QR"
                value={newUld}
                onChange={(e) => setNewUld(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              />
              <button
                onClick={handleAddUld}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg font-mono"
              >
                + ADD ULD
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {bagData.containerUldList.map((uld, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200"
                >
                  <Package className="w-3.5 h-3.5 text-sky-400" />
                  <span>{uld}</span>
                  <button
                    onClick={() => handleRemoveUld(i)}
                    className="text-slate-500 hover:text-rose-400 text-xs ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Apron Radar */}
      {activeSubTab === 'RADAR' && (
        <ApronGeofenceMap
          currentGps={radarGps}
          standName={selectedFlight?.gate || 'C12'}
          airportIata="DOH"
          scannedBags={[]}
          onSimulateMove={handleSimulateMove}
        />
      )}

      {/* TAB 4: Damage Log & Photos */}
      {activeSubTab === 'DAMAGE_LOG' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white text-sm">Baggage Damage / Irregularity Notes</h4>
          </div>

          <textarea
            rows={4}
            placeholder="Record tag numbers, bag description and damage specifics..."
            value={bagData.damageReportNotes || ''}
            onChange={(e) => setBagData({ ...bagData, damageReportNotes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200"
          />

          <div>
            <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Attach Damage Photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {bagData.damagePhotos && bagData.damagePhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {bagData.damagePhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Damage evidence ${index}`}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-700 shadow"
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

