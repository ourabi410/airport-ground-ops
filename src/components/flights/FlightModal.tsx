import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { X, Plane, Save } from 'lucide-react';
import { Flight, FlightType, FlightStatus } from '../../types';

interface FlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightToEdit?: Flight | null;
}

export const FlightModal: React.FC<FlightModalProps> = ({
  isOpen,
  onClose,
  flightToEdit
}) => {
  const { t, isRtl } = useLanguage();
  const { addFlight, updateFlight, companies, users, currentUser } = useApp();

  const isEditing = !!flightToEdit;

  // Form State with all required fields from prompt:
  // Date*, Flight NBR*, Flight Task*, Pax NBR DEP, Pax NBR ARR, Gate NBR, Flight Type*, A/C Type*, Check IN Start time*, STA*, STD*, Company Name*, REG, Subplane Area Zone*, Sorting Area Zone
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    flightNbr: '',
    flightTask: 'Full Turnaround & Baggage Sorting/Loading',
    paxNbrDep: 140,
    paxNbrArr: 130,
    gateNbr: 'A04',
    flightType: 'Commercial Pax' as FlightType,
    acType: 'A320neo',
    checkInStartTime: '12:00',
    sta: '13:30',
    std: '14:45',
    companyName: 'Tunisair',
    reg: 'TS-IMU',
    subplaneAreaZone: 'Stand 14',
    sortingAreaZone: 'Carousel 02 - Zone North',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    totalBagsExpected: 25,
    status: 'Scheduled' as FlightStatus
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (flightToEdit) {
      setFormData({
        date: flightToEdit.date,
        flightNbr: flightToEdit.flightNbr,
        flightTask: flightToEdit.flightTask,
        paxNbrDep: flightToEdit.paxNbrDep,
        paxNbrArr: flightToEdit.paxNbrArr,
        gateNbr: flightToEdit.gateNbr,
        flightType: flightToEdit.flightType,
        acType: flightToEdit.acType,
        checkInStartTime: flightToEdit.checkInStartTime,
        sta: flightToEdit.sta,
        std: flightToEdit.std,
        companyName: flightToEdit.companyName,
        reg: flightToEdit.reg,
        subplaneAreaZone: flightToEdit.subplaneAreaZone,
        sortingAreaZone: flightToEdit.sortingAreaZone,
        sortingAreaUser: flightToEdit.sortingAreaUser,
        subplaneAreaUser: flightToEdit.subplaneAreaUser,
        totalBagsExpected: flightToEdit.totalBagsExpected,
        status: flightToEdit.status
      });
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        flightNbr: 'TU-',
        flightTask: 'Full Turnaround & Baggage Sorting/Loading',
        paxNbrDep: 140,
        paxNbrArr: 130,
        gateNbr: 'A04',
        flightType: 'Commercial Pax',
        acType: 'A320neo',
        checkInStartTime: '12:00',
        sta: '13:30',
        std: '14:45',
        companyName: companies[0]?.name || 'Tunisair',
        reg: 'TS-IMU',
        subplaneAreaZone: 'Stand 14',
        sortingAreaZone: 'Carousel 02 - Zone North',
        sortingAreaUser: users.find(u => u.role === 'Sorting Agent')?.name || 'Karim Ben Ali',
        subplaneAreaUser: users.find(u => u.role === 'Subplane Agent')?.name || 'Mehdi Mansour',
        totalBagsExpected: 25,
        status: 'Scheduled'
      });
    }
  }, [flightToEdit, isOpen, companies, users]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.date) errs.date = 'Date is required *';
    if (!formData.flightNbr.trim() || formData.flightNbr === 'TU-') errs.flightNbr = 'Flight NBR is required *';
    if (!formData.flightTask.trim()) errs.flightTask = 'Flight Task is required *';
    if (!formData.flightType) errs.flightType = 'Flight Type is required *';
    if (!formData.acType.trim()) errs.acType = 'A/C Type is required *';
    if (!formData.checkInStartTime) errs.checkInStartTime = 'Check IN Start time is required *';
    if (!formData.sta) errs.sta = 'STA is required *';
    if (!formData.std) errs.std = 'STD is required *';
    if (!formData.companyName) errs.companyName = 'Company Name is required *';
    if (!formData.subplaneAreaZone.trim()) errs.subplaneAreaZone = 'Subplane Area Zone is required *';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedCompany = companies.find(c => c.name === formData.companyName);

    if (isEditing && flightToEdit) {
      updateFlight(flightToEdit.id, {
        ...formData,
        companyLogo: matchedCompany?.logo || flightToEdit.companyLogo
      });
    } else {
      addFlight({
        ...formData,
        createdBy: currentUser.name,
        companyLogo: matchedCompany?.logo
      });
    }

    onClose();
  };

  return (
    <div id="flight-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="flight-form-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 my-8"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? t('modalEditFlightTitle') : t('modalNewFlightTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                Soltane Aviation Services (SAS) Flight Handling Registry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Date*, Flight NBR*, Company Name* */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldDate')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.date && <p className="text-[10px] text-rose-600 mt-0.5">{errors.date}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldFlightNbr')}
              </label>
              <input
                type="text"
                value={formData.flightNbr}
                placeholder="e.g. TU-720, AF-1482"
                onChange={(e) => setFormData({ ...formData, flightNbr: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.flightNbr && <p className="text-[10px] text-rose-600 mt-0.5">{errors.flightNbr}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldCompanyName')}
              </label>
              <select
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.abbreviation})</option>
                ))}
              </select>
              {errors.companyName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.companyName}</p>}
            </div>
          </div>

          {/* Row 2: Flight Task*, Flight Type*, A/C Type* */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldFlightTask')}
              </label>
              <input
                type="text"
                value={formData.flightTask}
                placeholder="e.g. Full Ground Handling & Quick Transfer"
                onChange={(e) => setFormData({ ...formData, flightTask: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.flightTask && <p className="text-[10px] text-rose-600 mt-0.5">{errors.flightTask}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldFlightType')}
              </label>
              <select
                value={formData.flightType}
                onChange={(e) => setFormData({ ...formData, flightType: e.target.value as FlightType })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Commercial Pax">Commercial Passenger</option>
                <option value="Cargo">Cargo Freighter</option>
                <option value="VIP/Charter">VIP / Charter</option>
                <option value="Tech Stop">Technical Stop</option>
              </select>
              {errors.flightType && <p className="text-[10px] text-rose-600 mt-0.5">{errors.flightType}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldAcType')}
              </label>
              <input
                type="text"
                value={formData.acType}
                placeholder="e.g. A320neo, B737-800, B777"
                onChange={(e) => setFormData({ ...formData, acType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.acType && <p className="text-[10px] text-rose-600 mt-0.5">{errors.acType}</p>}
            </div>
          </div>

          {/* Row 3: Timings (Check IN Start time*, STA*, STD*) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldCheckInStart')}
              </label>
              <input
                type="time"
                value={formData.checkInStartTime}
                onChange={(e) => setFormData({ ...formData, checkInStartTime: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.checkInStartTime && <p className="text-[10px] text-rose-600 mt-0.5">{errors.checkInStartTime}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSTA')}
              </label>
              <input
                type="time"
                value={formData.sta}
                onChange={(e) => setFormData({ ...formData, sta: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.sta && <p className="text-[10px] text-rose-600 mt-0.5">{errors.sta}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSTD')}
              </label>
              <input
                type="time"
                value={formData.std}
                onChange={(e) => setFormData({ ...formData, std: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.std && <p className="text-[10px] text-rose-600 mt-0.5">{errors.std}</p>}
            </div>
          </div>

          {/* Row 4: Pax NBR DEP, Pax NBR ARR, Gate NBR, REG */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldPaxDep')}
              </label>
              <input
                type="number"
                min={0}
                value={formData.paxNbrDep}
                onChange={(e) => setFormData({ ...formData, paxNbrDep: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldPaxArr')}
              </label>
              <input
                type="number"
                min={0}
                value={formData.paxNbrArr}
                onChange={(e) => setFormData({ ...formData, paxNbrArr: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldGateNbr')}
              </label>
              <input
                type="text"
                value={formData.gateNbr}
                placeholder="e.g. A04, B12"
                onChange={(e) => setFormData({ ...formData, gateNbr: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldREG')}
              </label>
              <input
                type="text"
                value={formData.reg}
                placeholder="e.g. TS-IMU, F-GTAU"
                onChange={(e) => setFormData({ ...formData, reg: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Row 5: Subplane Area Zone*, Sorting Area Zone, Expected Bags Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSubplaneZone')}
              </label>
              <input
                type="text"
                value={formData.subplaneAreaZone}
                placeholder="e.g. Stand 14, Remote R3"
                onChange={(e) => setFormData({ ...formData, subplaneAreaZone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {errors.subplaneAreaZone && <p className="text-[10px] text-rose-600 mt-0.5">{errors.subplaneAreaZone}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSortingZone')}
              </label>
              <input
                type="text"
                value={formData.sortingAreaZone}
                placeholder="e.g. Carousel 02, Sorter East"
                onChange={(e) => setFormData({ ...formData, sortingAreaZone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldTotalBagsExpected')}
              </label>
              <input
                type="number"
                min={0}
                value={formData.totalBagsExpected}
                onChange={(e) => setFormData({ ...formData, totalBagsExpected: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold text-sky-700"
              />
            </div>
          </div>

          {/* Row 6: User Assignments (Sorting Area User, Subplane Area User) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSelectSortingUser')}
              </label>
              <select
                value={formData.sortingAreaUser}
                onChange={(e) => setFormData({ ...formData, sortingAreaUser: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('fieldSelectSubplaneUser')}
              </label>
              <select
                value={formData.subplaneAreaUser}
                onChange={(e) => setFormData({ ...formData, subplaneAreaUser: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t('modalSaveBtn')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
