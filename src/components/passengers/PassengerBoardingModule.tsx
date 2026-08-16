import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PassengerData } from '../../types';
import {
  Users,
  UserCheck,
  UserX,
  Accessibility,
  Heart,
  Baby,
  Crown,
  CheckCircle2,
  AlertCircle,
  Save,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';

export const PassengerBoardingModule: React.FC = () => {
  const { selectedFlight, selectedPassengers, updatePassengers } = useApp();

  const [paxData, setPaxData] = useState<PassengerData>(
    selectedPassengers || {
      id: `pax_${selectedFlight?.id || 'temp'}`,
      flightId: selectedFlight?.id || 'temp',
      booked: selectedFlight?.totalPassengers || 291,
      checkedIn: selectedFlight?.totalPassengers || 287,
      boarded: selectedFlight?.boardedPassengers || 142,
      noShow: 4,
      transit: 165,
      specialAssistance: {
        wheelchair: 8,
        unaccompaniedMinor: 2,
        medical: 1,
        infants: 6,
        vip: 4,
      },
      boardingZones: {
        zone1: { name: 'First & Business / Priority', boarded: 42, total: 46, open: true },
        zone2: { name: 'Zone A (Rows 10-24)', boarded: 58, total: 80, open: true },
        zone3: { name: 'Zone B (Rows 25-40)', boarded: 32, total: 85, open: false },
        zone4: { name: 'Zone C (Rows 41-55)', boarded: 10, total: 80, open: false },
      },
      reconciliationStatus: 'IN_PROGRESS',
      gateStatus: 'OPEN',
      updatedAt: new Date().toISOString(),
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateField = (field: keyof PassengerData, delta: number) => {
    setPaxData((prev) => {
      const currentVal = (prev[field] as number) || 0;
      const newVal = Math.max(0, currentVal + delta);
      return { ...prev, [field]: newVal };
    });
  };

  const handleUpdateSpecial = (type: keyof PassengerData['specialAssistance'], delta: number) => {
    setPaxData((prev) => ({
      ...prev,
      specialAssistance: {
        ...prev.specialAssistance,
        [type]: Math.max(0, prev.specialAssistance[type] + delta),
      },
    }));
  };

  const handleToggleZone = (zoneKey: keyof PassengerData['boardingZones']) => {
    setPaxData((prev) => ({
      ...prev,
      boardingZones: {
        ...prev.boardingZones,
        [zoneKey]: {
          ...prev.boardingZones[zoneKey],
          open: !prev.boardingZones[zoneKey].open,
        },
      },
    }));
  };

  const handleZoneBoard = (zoneKey: keyof PassengerData['boardingZones'], delta: number) => {
    setPaxData((prev) => {
      const zone = prev.boardingZones[zoneKey];
      const newBoarded = Math.min(zone.total, Math.max(0, zone.boarded + delta));
      const totalBoarded =
        (zoneKey === 'zone1' ? newBoarded : prev.boardingZones.zone1.boarded) +
        (zoneKey === 'zone2' ? newBoarded : prev.boardingZones.zone2.boarded) +
        (zoneKey === 'zone3' ? newBoarded : prev.boardingZones.zone3.boarded) +
        (zoneKey === 'zone4' ? newBoarded : prev.boardingZones.zone4.boarded);

      return {
        ...prev,
        boarded: totalBoarded,
        boardingZones: {
          ...prev.boardingZones,
          [zoneKey]: { ...zone, boarded: newBoarded },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!selectedFlight) return;
    setIsSaving(true);
    await updatePassengers(selectedFlight.id, paxData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const boardedPercent =
    paxData.checkedIn > 0 ? Math.min(100, Math.round((paxData.boarded / paxData.checkedIn) * 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">Passenger Manifest & Boarding Management</h3>
            <p className="text-xs text-slate-400">Boarding zones, special assistance (PRM/WCHR), transit numbers and headcounts.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={paxData.gateStatus}
            onChange={(e) => setPaxData({ ...paxData, gateStatus: e.target.value as any })}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
          >
            <option value="CLOSED">GATE CLOSED</option>
            <option value="OPEN">GATE OPEN (BOARDING)</option>
            <option value="FINAL_CALL">FINAL CALL</option>
            <option value="GATE_CLOSED">FLIGHT CLOSED</option>
          </select>

          <button
            id="btn-save-passengers"
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
                <span>{isSaving ? 'Saving...' : 'Save Passenger State'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Boarding Progress Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 mb-2 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base text-white">Passenger Headcount Reconciliation</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                paxData.reconciliationStatus === 'RECONCILED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}
            >
              {paxData.reconciliationStatus}
            </span>
          </div>
          <span className="text-sky-400 font-bold text-base">
            {paxData.boarded} / {paxData.checkedIn} Boarded ({boardedPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              boardedPercent === 100 ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
            style={{ width: `${boardedPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Primary Passenger Figures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase">BOOKED PASSENGERS</div>
          <div className="text-2xl font-bold text-white mt-1">{paxData.booked}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase">CHECKED-IN (ACCEPTED)</div>
          <div className="text-2xl font-bold text-sky-300 mt-1">{paxData.checkedIn}</div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 p-4 rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase">BOARDED PASSENGERS</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{paxData.boarded}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase">TRANSIT CONNECTING</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{paxData.transit}</div>
        </div>
      </div>

      {/* Boarding Zones Control */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm">Zone-Based Boarding Execution</h4>
          <span className="text-xs text-slate-400 font-mono">Tap zone buttons to board passengers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['zone1', 'zone2', 'zone3', 'zone4'] as const).map((zKey) => {
            const zone = paxData.boardingZones[zKey];
            const zonePct = zone.total > 0 ? Math.round((zone.boarded / zone.total) * 100) : 0;

            return (
              <div
                key={zKey}
                className={`p-4 rounded-xl border transition-all ${
                  zone.open
                    ? 'bg-slate-950 border-sky-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-100">{zone.name}</span>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {zone.boarded} / {zone.total} Boarded ({zonePct}%)
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleZone(zKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      zone.open
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {zone.open ? 'ZONE OPEN' : 'CALL ZONE'}
                  </button>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${zonePct}%` }}></div>
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleZoneBoard(zKey, -1)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleZoneBoard(zKey, 1)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold rounded shadow-sm"
                  >
                    +1 Scan
                  </button>
                  <button
                    onClick={() => handleZoneBoard(zKey, 5)}
                    className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white text-xs font-mono font-bold rounded"
                  >
                    +5 Batch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Assistance Manifest (PRM / WCHR) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm">Special Passenger Handling Manifest (SSR / PRM)</h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-sky-400 font-semibold">
              <Accessibility className="w-4 h-4" />
              <span>WHEELCHAIR (WCHR)</span>
            </div>
            <div className="text-xl font-bold text-white mt-2">{paxData.specialAssistance.wheelchair}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold">
              <Users className="w-4 h-4" />
              <span>UNACCOMP. MINOR (UMNR)</span>
            </div>
            <div className="text-xl font-bold text-white mt-2">{paxData.specialAssistance.unaccompaniedMinor}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold">
              <Heart className="w-4 h-4" />
              <span>MEDICAL (MEDA)</span>
            </div>
            <div className="text-xl font-bold text-white mt-2">{paxData.specialAssistance.medical}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-purple-400 font-semibold">
              <Baby className="w-4 h-4" />
              <span>INFANTS (INF)</span>
            </div>
            <div className="text-xl font-bold text-white mt-2">{paxData.specialAssistance.infants}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-semibold">
              <Crown className="w-4 h-4" />
              <span>VIP / CIP</span>
            </div>
            <div className="text-xl font-bold text-white mt-2">{paxData.specialAssistance.vip}</div>
          </div>

        </div>
      </div>

    </div>
  );
};
