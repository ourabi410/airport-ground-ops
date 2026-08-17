import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Plus,
  Search,
  Package,
  Layers,
  Plane,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { Dolly, DollyType, DollyStatus } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const DollyManagementView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { dollies, addDolly, updateDolly, deleteDolly, assignDollyFlight, flights, baggage, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDollyForBags, setSelectedDollyForBags] = useState<Dolly | null>(null);
  const [deleteTargetDolly, setDeleteTargetDolly] = useState<Dolly | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    type: 'Container AKE' as DollyType,
    maxCapacity: 45,
    assignedFlightNbr: 'TU-720',
    zone: 'Sorting Carousel 02',
    status: 'Available' as DollyStatus,
    tareWeightKg: 85
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDolly({
      ...formData,
      assignedFlightNbr: formData.status === 'Available' ? undefined : formData.assignedFlightNbr
    });
    setIsModalOpen(false);
  };

  const filteredDollies = dollies.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.zone.toLowerCase().includes(q) ||
        (d.assignedFlightNbr && d.assignedFlightNbr.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id="dolly-management-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('dollyTitle')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('dollySub')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnAddDolly')}</span>
        </button>
      </div>

      {/* Filter and Dolly Fleet Cards Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'Available', 'Loading', 'In Transit', 'At Aircraft Hold', 'Maintenance'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All Units' : status}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Dolly ID, zone, flight..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 rtl:pl-3 rtl:pr-9"
            />
          </div>
        </div>

        {/* Fleet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDollies.map((dolly) => {
            const loadPercent = Math.round((dolly.currentBagsCount / dolly.maxCapacity) * 100);
            
            return (
              <div
                key={dolly.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs font-mono">
                      {dolly.id.split('-')[1]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm font-mono">{dolly.id}</h4>
                      <p className="text-xs text-slate-500">{dolly.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dolly.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dolly.status === 'Loading'
                        ? 'bg-sky-100 text-sky-800'
                        : dolly.status === 'In Transit'
                        ? 'bg-indigo-100 text-indigo-800'
                        : dolly.status === 'At Aircraft Hold'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dolly.status}
                    </span>

                    {currentUser?.role === 'Administrator' && (
                      <button
                        onClick={() => setDeleteTargetDolly(dolly)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Dolly Equipment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Load Capacity</span>
                    <span className="font-mono">{dolly.currentBagsCount} / {dolly.maxCapacity} Bags ({loadPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        loadPercent > 90 ? 'bg-rose-500' : loadPercent > 50 ? 'bg-sky-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Flight</span>
                    <span className="font-bold text-slate-800 font-mono">{dolly.assignedFlightNbr || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Current Zone</span>
                    <span className="font-bold text-slate-800 truncate block">{dolly.zone}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedDollyForBags(dolly)}
                    className="text-sky-600 hover:text-sky-800 font-bold"
                  >
                    View Bags ({dolly.bags.length})
                  </button>

                  <select
                    value={dolly.status}
                    onChange={(e) => updateDolly(dolly.id, { status: e.target.value as DollyStatus })}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <option value="Available">Available</option>
                    <option value="Loading">Loading</option>
                    <option value="In Transit">In Transit</option>
                    <option value="At Aircraft Hold">At Hold</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Register New Dolly Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">{t('btnAddDolly')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('colDollyType')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DollyType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Container AKE">Container AKE (LD3)</option>
                    <option value="Open Dolly">Open Baggage Dolly</option>
                    <option value="Bulk Cart">Bulk Baggage Cart</option>
                    <option value="Pallet Trailer">Pallet Cargo Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('colDollyCapacity')}</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ramp Station Zone *</label>
                <input
                  type="text"
                  required
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g. Sorter 02 East Makeup"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('colAssignedFlight')}</label>
                  <select
                    value={formData.assignedFlightNbr}
                    onChange={(e) => setFormData({ ...formData, assignedFlightNbr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  >
                    <option value="">None (Available pool)</option>
                    {flights.map(f => (
                      <option key={f.id} value={f.flightNbr}>{f.flightNbr} ({f.companyName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t('colTareWeight')} (kg)</label>
                  <input
                    type="number"
                    value={formData.tareWeightKg}
                    onChange={(e) => setFormData({ ...formData, tareWeightKg: parseInt(e.target.value) || 80 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                >
                  Register Dolly
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Contained Bags Inspector Modal */}
      {selectedDollyForBags && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">
                Bags Contained in {selectedDollyForBags.id} ({selectedDollyForBags.assignedFlightNbr || 'Unassigned'})
              </h4>
              <button onClick={() => setSelectedDollyForBags(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {baggage.filter(b => b.dollyId === selectedDollyForBags.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No bags currently mapped to this dolly container.
                </p>
              ) : (
                baggage.filter(b => b.dollyId === selectedDollyForBags.id).map(bag => (
                  <div key={bag.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">Tag #{bag.tagNumber}</span>
                      <p className="text-[10px] text-slate-500">{bag.passengerName} (Seat {bag.seatNumber})</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bag.status === 'LOADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {bag.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDollyForBags(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dolly Modal */}
      {deleteTargetDolly && (
        <ConfirmDeleteModal
          isOpen={!!deleteTargetDolly}
          onClose={() => setDeleteTargetDolly(null)}
          onConfirm={() => {
            if (deleteTargetDolly) {
              deleteDolly(deleteTargetDolly.id);
              setDeleteTargetDolly(null);
            }
          }}
          title="Delete Dolly Equipment"
          itemName={`Dolly #${deleteTargetDolly.id} (${deleteTargetDolly.type})`}
          itemType="dolly equipment"
          warningMessage="This will permanently delete this dolly cart/container from the fleet registry."
        />
      )}

    </div>
  );
};
