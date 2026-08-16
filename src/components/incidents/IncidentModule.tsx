import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IncidentRecord, ProblemCategory, ProblemSeverity } from '../../types';
import { formatUtcTime } from '../../utils/dateUtils';
import { compressImage } from '../../utils/photoUtils';
import {
  AlertOctagon,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  User,
  ShieldAlert,
  X,
  Search,
  Filter,
} from 'lucide-react';

export const IncidentModule: React.FC = () => {
  const { incidents, reportIncident, selectedFlight, currentUser, setReportIncidentModalOpen } = useApp();

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick report state
  const [isReporting, setIsReporting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProblemCategory>('BAGGAGE');
  const [newSeverity, setNewSeverity] = useState<ProblemSeverity>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState(selectedFlight ? `Gate ${selectedFlight.gate}` : 'Ramp Apron');
  const [newDepartment, setNewDepartment] = useState('Ramp Operations');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAttachedPhoto(compressed);
    } catch (err) {
      console.warn('Failed to compress incident photo', err);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    await reportIncident({
      flightId: selectedFlight?.id,
      flightNumber: selectedFlight?.flightNumber,
      category: newCategory,
      severity: newSeverity,
      title: newTitle,
      description: newDescription,
      location: newLocation,
      gate: selectedFlight?.gate,
      assignedDepartment: newDepartment,
      photoUrl: attachedPhoto || undefined,
    });

    setIsReporting(false);
    setNewTitle('');
    setNewDescription('');
    setAttachedPhoto(null);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && inc.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.flightNumber && inc.flightNumber.toLowerCase().includes(q)) ||
        inc.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getSeverityPill = (sev: ProblemSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'HIGH':
        return 'bg-rose-950 text-rose-300 border border-rose-600';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border border-amber-600';
      case 'LOW':
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 border border-slate-700 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="font-bold text-base text-white">Problems & Ramp Safety Incidents</h3>
            <p className="text-xs text-slate-400">Log bottlenecks, equipment faults, baggage irregularities, and dispatch alerts.</p>
          </div>
        </div>

        <button
          id="btn-report-incident-top"
          onClick={() => setIsReporting(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Report Problem / Incident</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-800 border border-slate-700 p-3 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 text-[11px] uppercase font-medium">SEVERITY:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                filterSeverity === s ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident notes or flight..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-200 font-semibold text-base">No active incidents matching filters</p>
          <p className="text-xs text-slate-400 mt-1">Ground turnaround operations proceeding normally.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getSeverityPill(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      {inc.category}
                    </span>
                    {inc.flightNumber && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 border border-slate-600 font-bold">
                        {inc.flightNumber}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      inc.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>

                <h4 className="font-bold text-white text-base mt-2">{inc.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{inc.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span>{inc.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatUtcTime(inc.reportedAtUtc)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Assigned: <strong className="text-slate-300">{inc.assignedDepartment}</strong></span>
                  <span>Reported by: <strong className="text-slate-300">{inc.reportedBy}</strong></span>
                </div>

                {inc.photos && inc.photos.length > 0 && (
                  <div className="flex items-center space-x-2 pt-1">
                    {inc.photos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Incident Evidence"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700 shadow"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Incident Modal */}
      {isReporting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-white text-base">Report Problem / Ground Incident</h3>
              </div>
              <button onClick={() => setIsReporting(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">INCIDENT TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belt loader mechanical stall at Aft Door 3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProblemCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  >
                    <option value="BAGGAGE">BAGGAGE</option>
                    <option value="PASSENGER">PASSENGER</option>
                    <option value="AIRCRAFT">AIRCRAFT</option>
                    <option value="GATE">GATE</option>
                    <option value="GROUND_EQUIPMENT">GROUND EQUIPMENT</option>
                    <option value="FUEL">FUEL</option>
                    <option value="CATERING">CATERING</option>
                    <option value="CLEANING">CLEANING</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="BOARDING">BOARDING</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">SEVERITY LEVEL</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as ProblemSeverity)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">LOCATION / GATE</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">ASSIGNED DEPARTMENT</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">DESCRIPTION & IMMEDIATE ACTION *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail operational impact, flight delay risk, and required backup resources..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700">
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span>{attachedPhoto ? 'Photo Attached (Replace)' : 'Capture Ramp Photo Evidence'}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {attachedPhoto && (
                  <div className="mt-2">
                    <img src={attachedPhoto} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReporting(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
                >
                  Submit & Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
