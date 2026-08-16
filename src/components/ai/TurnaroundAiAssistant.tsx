import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Send,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const TurnaroundAiAssistant: React.FC = () => {
  const { selectedFlight, flights, events, incidents } = useApp();
  const [selectedFlightId, setSelectedFlightId] = useState<string>(selectedFlight?.id || flights[0]?.id || '');
  const [promptQuery, setPromptQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorAnalysis, setAdvisorAnalysis] = useState<string | null>(null);

  const activeFlight = flights.find((f) => f.id === selectedFlightId) || flights[0];
  const flightEvents = events.filter((e) => e.flightId === activeFlight?.id);
  const flightIncidents = incidents.filter((i) => i.flightId === activeFlight?.id || i.flightNumber === activeFlight?.flightNumber);

  const handleRunAdvisor = async () => {
    if (!activeFlight) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/turnaround-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightData: activeFlight,
          events: flightEvents,
          incidents: flightIncidents,
          query: promptQuery || 'Analyze critical path bottlenecks, delay cascade probability, and provide immediate ground operations recommendations.',
        }),
      });

      const data = await response.json();
      setAdvisorAnalysis(data.analysis || data.error || 'No analysis generated.');
    } catch (err: any) {
      setAdvisorAnalysis(`AI Dispatcher error: ${err.message}. Please check connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-base text-white">AI Turnaround Advisor & Critical Path Predictor</h3>
            <p className="text-xs text-slate-400">Powered by Gemini 2.5 — Ramp milestone bottleneck detection and OTP preservation.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-sky-400 bg-sky-950/60 border border-sky-800/60 px-3 py-1.5 rounded-lg">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>REAL-TIME OPS REASONING</span>
        </div>
      </div>

      {/* Flight Selector & Query Input */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-mono text-slate-300 font-bold uppercase">TARGET AIRCRAFT TURNAROUND:</label>
          <select
            value={selectedFlightId}
            onChange={(e) => setSelectedFlightId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
          >
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.flightNumber} ({f.aircraftType}) • Gate {f.gate} [{f.status}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">SPECIFIC DISPATCH INQUIRY (OPTIONAL)</label>
          <input
            type="text"
            placeholder="e.g. Can we recover 8 minutes delay if fueling completes in 15 minutes with concurrent boarding?"
            value={promptQuery}
            onChange={(e) => setPromptQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200"
          />
        </div>

        <button
          id="btn-run-turnaround-advisor"
          onClick={handleRunAdvisor}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-mono text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Critical Path & Ramp Dependencies...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span>RUN AI TURNAROUND BOTTLENECK ANALYSIS</span>
            </>
          )}
        </button>
      </div>

      {/* Advisor Analysis Output */}
      {advisorAnalysis && (
        <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Gemini Turnaround Assessment for {activeFlight?.flightNumber}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">EASA/ICAO Ground Protocol</span>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800">
            {advisorAnalysis}
          </div>
        </div>
      )}

    </div>
  );
};
