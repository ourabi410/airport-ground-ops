import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GroundServicesData, EventStatus } from '../../types';
import { formatUtcTime } from '../../utils/dateUtils';
import {
  Sparkles,
  Utensils,
  Fuel,
  Wrench,
  Package,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  Droplets,
  Truck,
  FileCheck,
} from 'lucide-react';

export const GroundServicesModule: React.FC = () => {
  const { selectedFlight, selectedGroundServices, updateGroundServices, currentUser } = useApp();

  const [servicesData, setServicesData] = useState<GroundServicesData>(
    selectedGroundServices || {
      id: `srv_${selectedFlight?.id || 'temp'}`,
      flightId: selectedFlight?.id || 'temp',
      cleaning: {
        crewCount: 12,
        cleaningType: 'TRANSIT_QUICK',
        inspectionPassed: true,
        status: 'COMPLETED',
        problemNotes: 'Lavatory forward 1 refreshed.',
      },
      catering: {
        truckCount: 2,
        mealsLoaded: 287,
        specialMealsCount: 38,
        barCartsLoaded: 16,
        securitySealNumbers: ['QACC-88192A', 'QACC-88192B'],
        supplierName: 'Qatar Aviation Catering Company (QACC)',
        status: 'COMPLETED',
      },
      fueling: {
        plannedFuelKg: 68000,
        actualFuelKg: 52000,
        fuelDensity: 0.804,
        truckId: 'HYD-DOH-24',
        supplier: 'WOQOD Aviation Fueling',
        safetyBondingConfirmed: true,
        waterCheckPassed: true,
        meterBeforeLiters: 1420800,
        meterAfterLiters: 1485500,
        status: 'IN_PROGRESS',
        notes: 'Pumping rate: 1,800 L/min.',
      },
      maintenance: {
        required: false,
        releaseToService: true,
        technicianName: 'Elena Rostova',
        technicianLicense: 'EASA-B1-99214',
        status: 'COMPLETED',
        notes: 'Walk-around inspection complete. Tire pressures and brake wear in limits.',
      },
      cargo: {
        cargoWeightKg: 14200,
        mailWeightKg: 850,
        uldLoadedCount: 12,
        uldUnloadedCount: 14,
        dgrNotocSigned: true,
        liveAnimalsOnBoard: false,
        perishableCargo: true,
        status: 'IN_PROGRESS',
      },
      updatedAt: new Date().toISOString(),
    }
  );

  const [activeTab, setActiveTab] = useState<'fuel' | 'cleaning' | 'catering' | 'maintenance' | 'cargo'>('fuel');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!selectedFlight) return;
    setIsSaving(true);
    await updateGroundServices(selectedFlight.id, servicesData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Truck className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">Ground Turnaround Service Units</h3>
            <p className="text-xs text-slate-400">Refueling, catering, cabin grooming, line maintenance tech-log and cargo loading.</p>
          </div>
        </div>

        <button
          id="btn-save-ground-services"
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
              <span>{isSaving ? 'Saving...' : 'Save Services State'}</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-Service Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'fuel', label: 'Refueling', icon: Fuel, status: servicesData.fueling.status },
          { id: 'cleaning', label: 'Cabin Cleaning', icon: Sparkles, status: servicesData.cleaning.status },
          { id: 'catering', label: 'Catering', icon: Utensils, status: servicesData.catering.status },
          { id: 'maintenance', label: 'Line Maintenance', icon: Wrench, status: servicesData.maintenance.status },
          { id: 'cargo', label: 'Cargo & Mail', icon: Package, status: servicesData.cargo.status },
        ].map((srv) => {
          const Icon = srv.icon;
          const isSelected = activeTab === srv.id;
          return (
            <button
              key={srv.id}
              onClick={() => setActiveTab(srv.id as any)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-sky-950 border-sky-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    srv.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : srv.status === 'IN_PROGRESS'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {srv.status}
                </span>
              </div>
              <span className="font-bold text-xs text-slate-100 mt-2">{srv.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- 1. REFUELING --- */}
      {activeTab === 'fuel' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Fuel className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-base">Aviation Fueling Operations (Jet A-1)</h4>
            </div>
            <select
              value={servicesData.fueling.status}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  fueling: { ...servicesData.fueling, status: e.target.value as EventStatus },
                })
              }
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">PLANNED UPLIFT (KG)</label>
              <input
                type="number"
                value={servicesData.fueling.plannedFuelKg}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    fueling: { ...servicesData.fueling, plannedFuelKg: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ACTUAL DELIVERED (KG)</label>
              <input
                type="number"
                value={servicesData.fueling.actualFuelKg}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    fueling: { ...servicesData.fueling, actualFuelKg: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">FUEL DENSITY (KG/L)</label>
              <input
                type="number"
                step="0.001"
                value={servicesData.fueling.fuelDensity}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    fueling: { ...servicesData.fueling, fuelDensity: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-sky-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">HYDRANT / BOWSER TRUCK ID</label>
              <input
                type="text"
                value={servicesData.fueling.truckId}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    fueling: { ...servicesData.fueling, truckId: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">FUEL SUPPLIER</label>
              <input
                type="text"
                value={servicesData.fueling.supplier}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    fueling: { ...servicesData.fueling, supplier: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Safety & Quality Verification Checks */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-mono text-xs text-slate-400 font-bold uppercase">MANDATORY RAMP SAFETY CHECKS</span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={servicesData.fueling.safetyBondingConfirmed}
                  onChange={(e) =>
                    setServicesData({
                      ...servicesData,
                      fueling: { ...servicesData.fueling, safetyBondingConfirmed: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">Aircraft-to-Truck Ground Bonding Cable Connected</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={servicesData.fueling.waterCheckPassed}
                  onChange={(e) =>
                    setServicesData({
                      ...servicesData,
                      fueling: { ...servicesData.fueling, waterCheckPassed: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">Clear & Bright Water Chemical Capsule Test Passed</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. CABIN CLEANING --- */}
      {activeTab === 'cleaning' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-base">Cabin Cleaning & Sanitization</h4>
            </div>
            <select
              value={servicesData.cleaning.status}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  cleaning: { ...servicesData.cleaning, status: e.target.value as EventStatus },
                })
              }
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CLEANING SERVICE TYPE</label>
              <select
                value={servicesData.cleaning.cleaningType}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cleaning: { ...servicesData.cleaning, cleaningType: e.target.value as any },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
              >
                <option value="TRANSIT_QUICK">Transit Quick Turnaround (15-20 min)</option>
                <option value="FULL_DEEP">Full Deep Cabin Clean & Disinfection</option>
                <option value="NIGHT_STOP">Night Stop Layover Grooming</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CLEANING CREW SIZE</label>
              <input
                type="number"
                value={servicesData.cleaning.crewCount}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cleaning: { ...servicesData.cleaning, crewCount: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={servicesData.cleaning.inspectionPassed}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cleaning: { ...servicesData.cleaning, inspectionPassed: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-200 font-semibold">
                Cabin Crew / Supervisor Quality & Security Inspection Passed (No left baggage in seat pockets)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* --- 3. CATERING --- */}
      {activeTab === 'catering' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-base">In-Flight Catering & Galley Provisioning</h4>
            </div>
            <select
              value={servicesData.catering.status}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  catering: { ...servicesData.catering, status: e.target.value as EventStatus },
                })
              }
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block text-xs text-slate-400 mb-1">TOTAL MEALS LOADED</label>
              <input
                type="number"
                value={servicesData.catering.mealsLoaded}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    catering: { ...servicesData.catering, mealsLoaded: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SPECIAL MEALS (SPML)</label>
              <input
                type="number"
                value={servicesData.catering.specialMealsCount}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    catering: { ...servicesData.catering, specialMealsCount: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-amber-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">BAR & BEVERAGE CARTS</label>
              <input
                type="number"
                value={servicesData.catering.barCartsLoaded}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    catering: { ...servicesData.catering, barCartsLoaded: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- 4. LINE MAINTENANCE --- */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-base">Line Maintenance & Aircraft Technical Log</h4>
            </div>
            <select
              value={servicesData.maintenance.status}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  maintenance: { ...servicesData.maintenance, status: e.target.value as EventStatus },
                })
              }
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CERTIFYING ENGINEER</label>
              <input
                type="text"
                value={servicesData.maintenance.technicianName || ''}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    maintenance: { ...servicesData.maintenance, technicianName: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">LICENSE NUMBER</label>
              <input
                type="text"
                value={servicesData.maintenance.technicianLicense || ''}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    maintenance: { ...servicesData.maintenance, technicianLicense: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-950 p-4 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={servicesData.maintenance.releaseToService}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  maintenance: { ...servicesData.maintenance, releaseToService: e.target.checked },
                })
              }
              className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
            />
            <span className="text-xs text-slate-200 font-semibold">
              CERTIFICATE OF RELEASE TO SERVICE (CRS) SIGNED FOR DEPARTURE
            </span>
          </label>
        </div>
      )}

      {/* --- 5. CARGO & ULD --- */}
      {activeTab === 'cargo' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-white text-base">Cargo & Mail Manifest (NOTOC)</h4>
            </div>
            <select
              value={servicesData.cargo.status}
              onChange={(e) =>
                setServicesData({
                  ...servicesData,
                  cargo: { ...servicesData.cargo, status: e.target.value as EventStatus },
                })
              }
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-mono"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block text-xs text-slate-400 mb-1">CARGO WEIGHT (KG)</label>
              <input
                type="number"
                value={servicesData.cargo.cargoWeightKg}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cargo: { ...servicesData.cargo, cargoWeightKg: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">MAIL WEIGHT (KG)</label>
              <input
                type="number"
                value={servicesData.cargo.mailWeightKg}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cargo: { ...servicesData.cargo, mailWeightKg: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-sky-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">ULDs LOADED</label>
              <input
                type="number"
                value={servicesData.cargo.uldLoadedCount}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cargo: { ...servicesData.cargo, uldLoadedCount: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={servicesData.cargo.dgrNotocSigned}
                onChange={(e) =>
                  setServicesData({
                    ...servicesData,
                    cargo: { ...servicesData.cargo, dgrNotocSigned: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-200 font-semibold">
                DGR / NOTOC (Dangerous Goods Notification to Captain) Verified & Signed
              </span>
            </label>
          </div>
        </div>
      )}

    </div>
  );
};
