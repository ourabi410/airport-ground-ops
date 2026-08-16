import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUtcTime, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  ShieldCheck,
  Search,
  Clock,
  User,
  MapPin,
  Camera,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { events, flights } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredEvents = events.filter((e) => {
    if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.eventTitle.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.gate && e.gate.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-base text-white">Station Operational Audit Trail</h3>
            <p className="text-xs text-slate-400">Append-only audit log meeting ICAO Doc 10121 & IATA Ground Operations standards.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-lg">
          <span>COMPLIANCE LEVEL: LEVEL 4 (TAMPER-EVIDENT)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
          {['ALL', 'ARRIVAL', 'GROUND_SERVICES', 'DEPARTURE', 'SAFETY', 'IRREGULARITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                categoryFilter === cat ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by agent, gate, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Event Timestamp (UTC)</th>
                <th className="py-3 px-4">Milestone Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Operator / Role</th>
                <th className="py-3 px-4">Location / Gate</th>
                <th className="py-3 px-4">GPS Accuracy</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-sky-400 font-bold">
                    {formatUtcTime(evt.eventTimeUtc)}
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {evt.eventTitle}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {evt.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                    {evt.userName} ({evt.userRole})
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    Gate {evt.gate || 'N/A'} {evt.stand ? `(${evt.stand})` : ''}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                    {evt.gps ? `±${evt.gps.accuracy}m` : 'Station Clock'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {evt.isCorrected ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                        SUPERVISOR CORRECTED
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        VERIFIED ORIGINAL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
