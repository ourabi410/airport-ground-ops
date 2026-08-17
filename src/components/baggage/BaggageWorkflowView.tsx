import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plane,
  MessageSquare,
  Search,
  Plus,
  X,
  Sparkles,
  Zap,
  Tag,
  Clock,
  Send,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { Baggage, Flight, HoldPosition } from '../../types';
import { ZebraScannerModal } from './ZebraScannerModal';
import { exportBingosPdf, exportFlightExcel } from '../../lib/exportReports';

export const BaggageWorkflowView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const {
    flights,
    selectedFlight,
    setSelectedFlightId,
    baggage,
    turnaroundMilestones,
    auditLogs,
    currentUser,
    addBagComment,
    resolveBagDiscrepancy,
    markBagOffloaded,
    simulateBatchScan,
    addFlightComment
  } = useApp();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerStep, setScannerStep] = useState<1 | 2>(2);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SORTED' | 'LOADED' | 'MISSING' | 'DISCREPANCY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBagForModal, setSelectedBagForModal] = useState<Baggage | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentDiscrepancy, setIsCommentDiscrepancy] = useState(false);
  const [flightCommentInput, setFlightCommentInput] = useState('');
  const [flightCommentCategory, setFlightCommentCategory] = useState<'general' | 'discrepancy' | 'security' | 'loading' | 'delay'>('loading');

  const currentFlight = selectedFlight || flights[0];
  const flightBags = baggage.filter(b => b.flightNbr === currentFlight?.flightNbr);

  // Reconciliation calculations
  const totalChecked = currentFlight?.totalBagsExpected || flightBags.length || 1;
  const sortedCount = flightBags.filter(b => b.status === 'SORTED' || b.status === 'LOADED').length;
  const loadedCount = flightBags.filter(b => b.status === 'LOADED').length;
  const missingBags = flightBags.filter(b => b.status === 'MISSING' || (b.status === 'SORTED' && currentFlight.status === 'Loading'));
  const reconciliationPercent = Math.min(100, Math.round((loadedCount / totalChecked) * 100));

  // Filter bags
  const filteredBags = flightBags.filter(bag => {
    if (statusFilter !== 'ALL' && bag.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        bag.tagNumber.toLowerCase().includes(q) ||
        bag.passengerName.toLowerCase().includes(q) ||
        bag.seatNumber.toLowerCase().includes(q) ||
        bag.holdLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddBagCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBagForModal || !commentInput.trim()) return;
    addBagComment(selectedBagForModal.id, commentInput.trim(), isCommentDiscrepancy);
    setCommentInput('');
    setIsCommentDiscrepancy(false);
    // Refresh modal bag
    const updated = baggage.find(b => b.id === selectedBagForModal.id);
    if (updated) setSelectedBagForModal(updated);
  };

  const handleAddFlightCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFlight || !flightCommentInput.trim()) return;
    addFlightComment(currentFlight.id, flightCommentInput.trim(), flightCommentCategory);
    setFlightCommentInput('');
  };

  return (
    <div id="baggage-workflow-container" className="space-y-6">
      
      {/* Module Title & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <QrCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('zebraTitle')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Two-step handheld barcode/RFID verification workflow with automatic hold reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-baggage-print-bingos"
            onClick={() => exportBingosPdf(currentFlight, baggage, currentUser)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-xs"
            title="Download Official IATA BINGOS Sheet (PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-sky-300" />
            <span>Print BINGOS</span>
          </button>

          <button
            id="btn-baggage-export-excel"
            onClick={() => exportFlightExcel(currentFlight, turnaroundMilestones, baggage, auditLogs)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
            title="Export Manifest Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-open-scanner-step1"
            onClick={() => {
              setScannerStep(1);
              setIsScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Step 1 (Sorting)</span>
          </button>

          <button
            id="btn-open-scanner-step2"
            onClick={() => {
              setScannerStep(2);
              setIsScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Zebra Hold Scanner</span>
          </button>
        </div>
      </div>

      {/* Target Flight Selector & Key Progress Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          
          {/* Flight Selector */}
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('selectFlight')}
              </label>
              <select
                id="workflow-flight-select"
                value={currentFlight?.id}
                onChange={(e) => setSelectedFlightId(e.target.value)}
                className="mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {flights.map((f: Flight) => (
                  <option key={f.id} value={f.id}>
                    {f.flightNbr} • {f.companyName} ({f.reg}) • Gate {f.gateNbr} / Stand {f.subplaneAreaZone}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                currentFlight?.status === 'Reconciled' || currentFlight?.status === 'Departed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentFlight?.status === 'Loading'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentFlight?.status}
              </span>
            </div>
          </div>

          {/* Quick Rapid Test Simulator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Batch Simulator:</span>
            <button
              onClick={() => simulateBatchScan(currentFlight.flightNbr, 1, 3)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer"
            >
              +3 Sorter Scans
            </button>
            <button
              onClick={() => simulateBatchScan(currentFlight.flightNbr, 2, 3)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
            >
              +3 Hold Scans
            </button>
          </div>

        </div>

        {/* 3-Step Visual Lifecycle Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1 Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>{t('step1Title')}</span>
              </span>
              <span className="text-xs font-bold text-slate-700">{sortedCount} / {totalChecked}</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">{t('step1Desc')}</p>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Agent: {currentFlight?.sortingAreaUser || 'Assigned Agent'}</span>
              <span className="text-emerald-600 font-bold">Active Sorter</span>
            </div>
          </div>

          {/* Step 2 Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                <Plane className="w-4 h-4" />
                <span>{t('step2Title')}</span>
              </span>
              <span className="text-xs font-bold text-slate-700">{loadedCount} / {totalChecked}</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">{t('step2Desc')}</p>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Ramp: {currentFlight?.subplaneAreaUser || 'Assigned Crew'}</span>
              <span className="text-sky-600 font-bold">Hold Cargo Door</span>
            </div>
          </div>

          {/* Step 3 Card (Reconciliation Status) */}
          <div className={`p-4 rounded-xl border relative overflow-hidden ${
            reconciliationPercent === 100
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : missingBags.length > 0
              ? 'bg-amber-50/70 border-amber-300 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('step3Title')}</span>
              </span>
              <span className="text-sm font-extrabold">{reconciliationPercent}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2">
              <div
                className={`h-full transition-all duration-500 ${
                  reconciliationPercent === 100 ? 'bg-emerald-500' : 'bg-sky-600'
                }`}
                style={{ width: `${reconciliationPercent}%` }}
              ></div>
            </div>

            <p className="text-xs font-medium">
              {reconciliationPercent === 100
                ? t('readyForDeparture')
                : `${totalChecked - loadedCount} bags pending aircraft hold scan`}
            </p>
          </div>

        </div>

      </div>

      {/* Automatic Reconciliation / Missing Bag Verification Alert Banner */}
      {missingBags.length > 0 && currentFlight.status !== 'Departed' && (
        <div id="missing-bag-alert-banner" className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm text-rose-950">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-extrabold text-sm sm:text-base text-rose-900">
                  {t('alertMissingHeader')} ({missingBags.length} UNLOADED BAGS)
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                  FLIGHT {currentFlight.flightNbr}
                </span>
              </div>
              
              <p className="text-xs text-rose-800 mt-1 font-medium">
                {t('alertMissingSub')}
              </p>

              {/* Missing Tags Pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                {missingBags.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBagForModal(b)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:border-rose-500 text-xs font-mono font-bold text-rose-900 shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <Tag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tag #{b.tagNumber}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">({b.passengerName})</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs">
                <button
                  onClick={() => {
                    setScannerStep(2);
                    setIsScannerOpen(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Scan Missing Bags at Cargo Door
                </button>
                <span className="text-rose-700 font-medium">
                  Click any tag above to add discrepancy notes or mark offloaded.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Baggage Table & Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All Manifest Bags' },
              { key: 'LOADED', label: `Loaded (${loadedCount})` },
              { key: 'SORTED', label: `Sorted (${sortedCount - loadedCount})` },
              { key: 'MISSING', label: `Missing / Alert (${missingBags.length})` }
            ].map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key as typeof statusFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === chip.key
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 rtl:pl-3 rtl:pr-9"
            />
          </div>

        </div>

        {/* Manifest Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{t('tagNumber')}</th>
                <th className="py-3 px-4">{t('passenger')}</th>
                <th className="py-3 px-4">{t('seat')}</th>
                <th className="py-3 px-4">{t('class')}</th>
                <th className="py-3 px-4">{t('weight')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4">Dolly / Zone</th>
                <th className="py-3 px-4">{t('holdLocation')}</th>
                <th className="py-3 px-4">{t('notes')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBags.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No baggage records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredBags.map((bag) => (
                  <tr
                    key={bag.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      bag.status === 'MISSING' ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Tag Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-sky-600" />
                        <span>{bag.tagNumber}</span>
                      </span>
                    </td>

                    {/* Passenger */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {bag.passengerName}
                    </td>

                    {/* Seat */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {bag.seatNumber}
                    </td>

                    {/* Class */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bag.classType === 'Business'
                          ? 'bg-purple-100 text-purple-800'
                          : bag.classType === 'Priority'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {bag.classType}
                      </span>
                    </td>

                    {/* Weight */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {bag.weightKg} kg
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        bag.status === 'LOADED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bag.status === 'SORTED'
                          ? 'bg-sky-100 text-sky-800'
                          : bag.status === 'MISSING'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {bag.status === 'LOADED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {bag.status === 'MISSING' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{bag.status}</span>
                      </span>
                    </td>

                    {/* Dolly / Zone */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{bag.dollyId || 'No Dolly'}</div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[130px]">{bag.sortingZone}</div>
                    </td>

                    {/* Hold Location */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {bag.holdLocation !== 'Unassigned' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {bag.holdLocation}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Pending Load</span>
                      )}
                    </td>

                    {/* Comments indicator */}
                    <td className="py-3 px-4">
                      {bag.comments.length > 0 ? (
                        <button
                          onClick={() => setSelectedBagForModal(bag)}
                          className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold text-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{bag.comments.length}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBagForModal(bag)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {t('details')}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Flight Comments & Loading Session Notes Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Flight {currentFlight.flightNbr} Handling Notes & Discrepancy Log
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {currentFlight.comments.length} records logged
          </span>
        </div>

        {/* Existing Flight Comments List */}
        <div className="space-y-2.5">
          {currentFlight.comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No operational notes logged for this flight session yet.
            </p>
          ) : (
            currentFlight.comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-xl border text-xs ${
                  comment.category === 'discrepancy'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : comment.category === 'security'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{comment.authorName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/80 text-slate-600 border border-slate-200 text-[10px]">
                      {comment.authorRole}
                    </span>
                    <span className="uppercase text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-800">
                      {comment.category}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{comment.timestamp}</span>
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">{comment.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Flight Comment Form */}
        <form onSubmit={handleAddFlightCommentSubmit} className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <select
            value={flightCommentCategory}
            onChange={(e) => setFlightCommentCategory(e.target.value as typeof flightCommentCategory)}
            className="px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="loading">Loading Log</option>
            <option value="discrepancy">Discrepancy</option>
            <option value="security">Security Note</option>
            <option value="delay">Delay Cause</option>
            <option value="general">General</option>
          </select>

          <input
            type="text"
            value={flightCommentInput}
            onChange={(e) => setFlightCommentInput(e.target.value)}
            placeholder="Append note or discrepancy to flight session..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            type="submit"
            disabled={!flightCommentInput.trim()}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('addComment')}</span>
          </button>
        </form>
      </div>

      {/* Individual Bag Detail & Comment Drawer Modal */}
      {selectedBagForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Baggage Tag #{selectedBagForModal.tagNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Flight {selectedBagForModal.flightNbr} • Pax: {selectedBagForModal.passengerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBagForModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bag Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-extrabold text-slate-900">{selectedBagForModal.status}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Weight & Class</span>
                <span className="font-bold text-slate-900">{selectedBagForModal.weightKg} kg • {selectedBagForModal.classType}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Sorting Verification</span>
                <span className="text-slate-800">{selectedBagForModal.sortingUser || 'Pending'} ({selectedBagForModal.sortingTimestamp || '—'})</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Hold Stowage</span>
                <span className="text-slate-800">{selectedBagForModal.holdLocation} ({selectedBagForModal.loadingTimestamp || '—'})</span>
              </div>
            </div>

            {/* Bag Comments Thread */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Operator Notes & Discrepancies
              </h4>
              
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {selectedBagForModal.comments.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-2">No comments for this bag tag.</p>
                ) : (
                  selectedBagForModal.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        c.isDiscrepancy ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-0.5">
                        <span>{c.authorName} ({c.authorRole})</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddBagCommentSubmit} className="pt-2 space-y-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add note for this bag tag..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCommentDiscrepancy}
                      onChange={(e) => setIsCommentDiscrepancy(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-rose-700">Flag as Discrepancy</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>

            {/* Action Bar (Resolve discrepancy, Offload, Close) */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  markBagOffloaded(selectedBagForModal.id, 'Security offload / Passenger no-show');
                  setSelectedBagForModal(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Mark Offloaded
              </button>

              <div className="flex items-center gap-2">
                {selectedBagForModal.status === 'DISCREPANCY' || selectedBagForModal.status === 'MISSING' ? (
                  <button
                    onClick={() => {
                      resolveBagDiscrepancy(selectedBagForModal.id);
                      setSelectedBagForModal(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear Discrepancy
                  </button>
                ) : null}
                <button
                  onClick={() => setSelectedBagForModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {t('close')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Zebra Handheld Scanner Simulation Modal */}
      <ZebraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        defaultStep={scannerStep}
      />

    </div>
  );
};
