import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Search,
  Download,
  Filter,
  Shield,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  Laptop
} from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { auditLogs } = useApp();

  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action Type', 'Entity ID', 'Severity', 'Device', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.module}"`,
      `"${l.actionType}"`,
      `"${l.entityId}"`,
      `"${l.severity}"`,
      `"${l.device}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-logs-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{t('navAuditLogs')}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global system-wide operational logging, barcode telemetry, and user audit trail.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{t('export')}</span>
        </button>
      </div>

      {/* Filter and Log Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              <option value="Baggage">Baggage Workflow</option>
              <option value="Flight">Flight Operations</option>
              <option value="Users">User & Staff</option>
              <option value="Company">Airline Companies</option>
              <option value="Dolly">Dolly Tracking</option>
              <option value="Tasks">Tasks & Milestones</option>
              <option value="Security">Security & Access</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="success">Success</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, tag number, stand..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 rtl:pl-3 rtl:pr-9"
            />
          </div>

        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{t('date')} & {t('time')}</th>
                <th className="py-3 px-4">{t('user')}</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Device & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No activity logs found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      log.severity === 'critical'
                        ? 'bg-rose-50/30'
                        : log.severity === 'warning'
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-600">{log.userRole}</div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono">
                        {log.module}
                      </span>
                    </td>

                    {/* Action Type */}
                    <td className="py-3 px-4 font-bold text-slate-800 font-mono text-[11px]">
                      {log.actionType}
                    </td>

                    {/* Entity ID */}
                    <td className="py-3 px-4 font-mono font-bold text-sky-800">
                      {log.entityId}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : log.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : log.severity === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {log.severity === 'critical' ? (
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                        ) : log.severity === 'warning' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        ) : log.severity === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Info className="w-3 h-3 text-sky-600" />
                        )}
                        <span className="uppercase">{log.severity}</span>
                      </span>
                    </td>

                    {/* Device & Details */}
                    <td className="py-3 px-4 text-slate-600 max-w-md">
                      <div className="font-mono text-[11px] text-slate-800 break-words">{log.details}</div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Laptop className="w-3 h-3 text-slate-600" />
                        <span>{log.device}</span>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
