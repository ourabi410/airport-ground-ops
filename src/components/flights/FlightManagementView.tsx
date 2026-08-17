import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  PlaneTakeoff,
  Plus,
  Search,
  Lock,
  Unlock,
  Radio,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';
import { Flight } from '../../types';
import { FlightModal } from './FlightModal';
import { FlightDetailsDrawer } from './FlightDetailsDrawer';

export const FlightManagementView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const {
    flights,
    lockFlight,
    unlockFlight,
    deleteFlight,
    setSelectedFlightId,
    setActiveTab,
    permissions
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [drawerFlight, setDrawerFlight] = useState<Flight | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredFlights = flights.filter(f => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.flightNbr.toLowerCase().includes(q) ||
        f.companyName.toLowerCase().includes(q) ||
        f.reg.toLowerCase().includes(q) ||
        f.sortingAreaUser.toLowerCase().includes(q) ||
        f.subplaneAreaUser.toLowerCase().includes(q) ||
        f.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingFlight(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flight: Flight) => {
    setEditingFlight(flight);
    setIsModalOpen(true);
  };

  return (
    <div id="flight-management-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <PlaneTakeoff className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('flightManagementTitle')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('flightManagementSub')}
          </p>
        </div>

        <button
          id="btn-register-new-flight"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnNewFlight')}</span>
        </button>
      </div>

      {/* Flight Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'Scheduled', 'Sorting', 'Loading', 'Reconciled', 'Departed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All Flights' : status}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flight NBR, airline, agent, REG..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 rtl:pl-3 rtl:pr-9"
            />
          </div>

        </div>

        {/* The Flight Table with ALL required columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">{t('colFlightNbr')}</th>
                <th className="py-3.5 px-4">{t('colDate')}</th>
                <th className="py-3.5 px-4">{t('colCompany')}</th>
                <th className="py-3.5 px-4">{t('colFlightTask')}</th>
                <th className="py-3.5 px-4">{t('colSortingUser')}</th>
                <th className="py-3.5 px-4">{t('colSubplaneUser')}</th>
                <th className="py-3.5 px-4">{t('colCreatedBy')}</th>
                <th className="py-3.5 px-4">{t('colStatus')}</th>
                <th className="py-3.5 px-4 text-center">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No flight records found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredFlights.map((flight) => {
                  const percent = flight.totalBagsExpected > 0 ? Math.round((flight.bagsLoadedCount / flight.totalBagsExpected) * 100) : 0;
                  
                  return (
                    <tr
                      key={flight.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        flight.isLocked ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      {/* 1. Flight NBR */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-mono font-black text-xs shrink-0">
                            {flight.flightNbr.split('-')[0]}
                          </div>
                          <div>
                            <div className="font-extrabold font-mono text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{flight.flightNbr}</span>
                              {flight.isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                            </div>
                            <div className="text-[10px] text-slate-600 font-mono">
                              REG: {flight.reg} ({flight.acType}) • Gate {flight.gateNbr}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          <span>{flight.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                          STA {flight.sta} / STD {flight.std}
                        </div>
                      </td>

                      {/* 3. Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{flight.companyName}</div>
                        <div className="text-[10px] text-slate-600">Pax: {flight.paxNbrDep} Dep</div>
                      </td>

                      {/* 4. Flight TASK */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate" title={flight.flightTask}>
                          {flight.flightTask}
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>Stand {flight.subplaneAreaZone}</span>
                        </div>
                      </td>

                      {/* 5. Sorting Area User */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          <span>{flight.sortingAreaUser}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 truncate max-w-[120px]">
                          {flight.sortingAreaZone}
                        </div>
                      </td>

                      {/* 6. Subplane Area User */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{flight.subplaneAreaUser}</span>
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Apron Stand {flight.subplaneAreaZone}
                        </div>
                      </td>

                      {/* 7. User who created the flight */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {flight.createdBy}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            flight.status === 'Departed' || flight.isLocked
                              ? 'bg-slate-200 text-slate-800'
                              : flight.status === 'Reconciled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : flight.status === 'Loading'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {flight.status === 'Reconciled' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>{flight.status}</span>
                          </span>

                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                            <span>{flight.bagsLoadedCount}/{flight.totalBagsExpected} Bags ({percent}%)</span>
                          </div>
                        </div>
                      </td>

                      {/* 9. Actions (View details, Edit, Lock, Scan status overview) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* View details */}
                          <button
                            id={`btn-view-flight-${flight.id}`}
                            onClick={() => setDrawerFlight(flight)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                            title={t('view')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Scan status overview */}
                          <button
                            id={`btn-scan-flight-${flight.id}`}
                            onClick={() => {
                              setSelectedFlightId(flight.id);
                              setActiveTab('baggage');
                            }}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                            title="Zebra Scanner Overview"
                          >
                            <Radio className="w-4 h-4" />
                          </button>

                          {/* Edit flight */}
                          <button
                            id={`btn-edit-flight-${flight.id}`}
                            onClick={() => handleOpenEdit(flight)}
                            disabled={flight.isLocked}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                            title={flight.isLocked ? 'Flight is locked' : t('edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Lock / Unlock */}
                          <button
                            id={`btn-lock-flight-${flight.id}`}
                            onClick={() => flight.isLocked ? unlockFlight(flight.id) : lockFlight(flight.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              flight.isLocked
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700'
                            }`}
                            title={flight.isLocked ? t('unlockFlight') : t('lockFlight')}
                          >
                            {flight.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Flight Create / Edit Modal */}
      <FlightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        flightToEdit={editingFlight}
      />

      {/* Flight Details Side Drawer */}
      <FlightDetailsDrawer
        flight={drawerFlight}
        onClose={() => setDrawerFlight(null)}
        onEdit={(f) => handleOpenEdit(f)}
      />

    </div>
  );
};
