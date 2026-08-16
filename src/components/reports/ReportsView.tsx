import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUtcTime, formatUtcShort, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Plane,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { flights, events, incidents, selectedFlight } = useApp();
  const [reportFlightId, setReportFlightId] = useState<string>(selectedFlight?.id || flights[0]?.id || '');

  const activeFlight = flights.find((f) => f.id === reportFlightId) || flights[0];
  const flightEvents = events.filter((e) => e.flightId === activeFlight?.id);
  const flightIncidents = incidents.filter((i) => i.flightId === activeFlight?.id || i.flightNumber === activeFlight?.flightNumber);

  const handleExportCsv = () => {
    const headers = [
      'Event ID',
      'Flight Number',
      'Aircraft Reg',
      'Milestone Type',
      'Event Title',
      'Timestamp UTC',
      'User Name',
      'User Role',
      'Gate',
      'GPS Lat',
      'GPS Lng',
      'Status',
      'Notes',
    ];

    const rows = events.map((e) => [
      e.id,
      e.flightId,
      'A350-1000',
      e.eventType,
      `"${e.eventTitle.replace(/"/g, '""')}"`,
      e.eventTimeUtc,
      e.userName,
      e.userRole,
      e.gate || '',
      e.gps?.latitude || '',
      e.gps?.longitude || '',
      e.status,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Turnaround_Events_DOH_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">IATA Ground Operations Turnaround Report</h3>
            <p className="text-xs text-slate-400">Standard airline post-departure summary document (AHM 560 & SGHA compliant).</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 font-mono transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold font-mono shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Flight Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <span className="text-xs font-mono text-slate-300 font-bold uppercase">SELECT FLIGHT FOR REPORT:</span>
        <select
          value={activeFlight?.id}
          onChange={(e) => setReportFlightId(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 font-mono font-bold"
        >
          {flights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.flightNumber} ({f.originIata}→{f.destinationIata}) • Gate {f.gate}
            </option>
          ))}
        </select>
      </div>

      {/* Printable IATA Document Container */}
      {activeFlight && (
        <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6 font-mono text-xs border border-slate-300">
          
          {/* Official Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-lg font-black tracking-tight text-slate-950 uppercase">
                AEROTURN GROUND HANDLING SERVICES
              </div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                HAMAD INTERNATIONAL AIRPORT (OTHH / DOH) • RAMP CONTROL DISPATCH
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                STANDARD GROUND HANDLING AGREEMENT (SGHA) COMPLIANT REPORT
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-sky-800">IATA TURNAROUND SUMMARY</div>
              <div className="text-[10px] text-slate-600">Generated: {formatUtcTime(new Date().toISOString())} UTC</div>
            </div>
          </div>

          {/* Flight Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">FLIGHT NUMBER</div>
              <div className="text-base font-black text-slate-900">{activeFlight.flightNumber}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">AIRCRAFT / REG</div>
              <div className="text-sm font-bold text-slate-900">{activeFlight.aircraftType} ({activeFlight.aircraftReg})</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">STAND & GATE</div>
              <div className="text-sm font-bold text-slate-900">{activeFlight.stand} / GATE {activeFlight.gate}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">ROUTE</div>
              <div className="text-sm font-bold text-slate-900">{activeFlight.originIata} ➔ {activeFlight.destinationIata}</div>
            </div>
          </div>

          {/* Load Figures Grid */}
          <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">PASSENGER HEADCOUNT</div>
              <div className="text-sm font-bold text-slate-800">
                {activeFlight.boardedPassengers} Boarded / {activeFlight.totalPassengers} Booked
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">BAGGAGE PIECES</div>
              <div className="text-sm font-bold text-slate-800">
                {activeFlight.loadedBaggage} Loaded / {activeFlight.totalBaggage} Total
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">SCHEDULE VARIANCE</div>
              <div className={`text-sm font-bold ${activeFlight.delayMinutes > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {activeFlight.delayMinutes > 0 ? `+${activeFlight.delayMinutes} min delay` : 'ON-TIME DEPARTURE'}
              </div>
            </div>
          </div>

          {/* Recorded Milestones Timeline Table */}
          <div>
            <div className="text-xs font-bold text-slate-950 uppercase mb-2 border-b border-slate-300 pb-1">
              Authoritative Operational Milestones (UTC Timeline)
            </div>

            <table className="w-full text-left text-[11px]">
              <thead className="text-[10px] text-slate-600 border-b border-slate-300">
                <tr>
                  <th className="py-1">Milestone Event</th>
                  <th className="py-1">UTC Time</th>
                  <th className="py-1">Local Time</th>
                  <th className="py-1">Ramp Agent</th>
                  <th className="py-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {flightEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td className="py-1.5 font-bold text-slate-800">{evt.eventTitle}</td>
                    <td className="py-1.5 font-bold text-sky-900">{formatUtcTime(evt.eventTimeUtc)}</td>
                    <td className="py-1.5 text-slate-600">{formatLocalAirportTime(evt.eventTimeUtc, 3)}</td>
                    <td className="py-1.5 text-slate-600">{evt.userName}</td>
                    <td className="py-1.5 text-right font-bold text-slate-700">{evt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delay Codes Log if any */}
          {activeFlight.delayReasons && activeFlight.delayReasons.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1">
              <div className="text-[10px] font-bold text-amber-900 uppercase">IATA Delay Code Breakdown:</div>
              {activeFlight.delayReasons.map((d) => (
                <div key={d.id} className="text-[11px] text-amber-950 flex justify-between">
                  <span>Code {d.iataCode} [{d.category}]: {d.description}</span>
                  <span className="font-bold">+{d.delayMinutes} min</span>
                </div>
              ))}
            </div>
          )}

          {/* Incident / Problem log if any */}
          {flightIncidents.length > 0 && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 space-y-1">
              <div className="text-[10px] font-bold text-rose-900 uppercase">Logged Ramp Irregularities:</div>
              {flightIncidents.map((i) => (
                <div key={i.id} className="text-[11px] text-rose-950">
                  • [{i.severity}] {i.title}: {i.description}
                </div>
              ))}
            </div>
          )}

          {/* Signatures Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-[11px] text-slate-700 border-t border-slate-300">
            <div>
              <div className="text-slate-500 text-[9px] uppercase">RAMP DUTY SUPERVISOR</div>
              <div className="mt-6 border-b border-slate-400 pb-1 font-bold">
                {activeFlight.assignedSupervisor || 'Sarah Jenkins'} (EASA-OPS-9104)
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[9px] uppercase">AIRCRAFT COMMANDER / CAPTAIN</div>
              <div className="mt-6 border-b border-slate-400 pb-1 font-bold">
                Capt. M. Al-Kuwari (ATPL-88219)
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
