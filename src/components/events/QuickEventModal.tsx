import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TurnaroundMilestoneType, OperationalEvent } from '../../types';
import { compressImage } from '../../utils/photoUtils';
import { formatUtcTime, formatLocalAirportTime } from '../../utils/dateUtils';
import {
  Clock,
  MapPin,
  Camera,
  X,
  Plus,
  PlayCircle,
  CheckCircle2,
  Plane,
} from 'lucide-react';

const COMMON_MILESTONES: { type: TurnaroundMilestoneType; title: string; category: OperationalEvent['category'] }[] = [
  { type: 'ON_BLOCK', title: 'On Block (AIBT)', category: 'ARRIVAL' },
  { type: 'CHOCKS_ON', title: 'Chocks Placed & GPU Connected', category: 'ARRIVAL' },
  { type: 'DOOR_OPEN', title: 'Door 1L Open & Jetbridge Docked', category: 'ARRIVAL' },
  { type: 'DISEMBARK_STARTED', title: 'Disembarkation Started', category: 'ARRIVAL' },
  { type: 'BAGGAGE_UNLOAD_STARTED', title: 'Baggage Offload Started', category: 'GROUND_SERVICES' },
  { type: 'CLEANING_STARTED', title: 'Cabin Cleaning Started', category: 'GROUND_SERVICES' },
  { type: 'CATERING_STARTED', title: 'Catering Hi-Lift Docked', category: 'GROUND_SERVICES' },
  { type: 'FUEL_STARTED', title: 'Refueling Started', category: 'GROUND_SERVICES' },
  { type: 'BOARDING_STARTED', title: 'Passenger Boarding Started', category: 'DEPARTURE' },
  { type: 'DOORS_CLOSED', title: 'All Cabin Doors Closed & Armed', category: 'DEPARTURE' },
  { type: 'PUSHBACK', title: 'Pushback Authorized & Commenced', category: 'DEPARTURE' },
  { type: 'OFF_BLOCK', title: 'Off Block (AOBT)', category: 'DEPARTURE' },
];

export const QuickEventModal: React.FC = () => {
  const {
    isQuickEventModalOpen,
    setQuickEventModalOpen,
    flights,
    selectedFlight,
    recordMilestoneEvent,
    currentUser,
  } = useApp();

  const [flightId, setFlightId] = useState<string>(selectedFlight?.id || flights[0]?.id || '');
  const [selectedMilestone, setSelectedMilestone] = useState(COMMON_MILESTONES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isQuickEventModalOpen) return null;

  const currentFlight = flights.find((f) => f.id === flightId) || flights[0];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAttachedPhoto(compressed);
    } catch (err) {
      console.warn('Failed to compress event photo', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFlight) return;

    setIsSubmitting(true);
    await recordMilestoneEvent({
      flightId: currentFlight.id,
      eventType: selectedMilestone.type,
      eventTitle: customTitle.trim() || selectedMilestone.title,
      category: selectedMilestone.category,
      status: 'COMPLETED',
      notes: notes.trim() || undefined,
      gate: currentFlight.gate,
      stand: currentFlight.stand,
      photoUrl: attachedPhoto || undefined,
    });

    setIsSubmitting(false);
    setQuickEventModalOpen(false);
    setNotes('');
    setAttachedPhoto(null);
    setCustomTitle('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Record Operational Turnaround Milestone</h3>
          </div>
          <button
            onClick={() => setQuickEventModalOpen(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Time Banner */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-medium">AUTHORITATIVE UTC TIME:</span>
            <div className="text-blue-400 font-bold text-sm">{formatUtcTime(new Date().toISOString())}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-medium">LOCAL DOH TIME (+3):</span>
            <div className="text-slate-200 font-bold text-sm">{formatLocalAirportTime(new Date().toISOString(), 3)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Flight Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">SELECT AIRCRAFT / FLIGHT *</label>
            <select
              value={flightId}
              onChange={(e) => setFlightId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono font-bold focus:outline-none focus:border-blue-500"
            >
              {flights.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flightNumber} ({f.aircraftType} / {f.aircraftReg}) · Gate {f.gate} ({f.stand})
                </option>
              ))}
            </select>
          </div>

          {/* Standard Milestone Picker */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">STANDARD MILESTONE EVENT *</label>
            <select
              value={selectedMilestone.type}
              onChange={(e) => {
                const match = COMMON_MILESTONES.find((m) => m.type === e.target.value);
                if (match) setSelectedMilestone(match);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              {COMMON_MILESTONES.map((m) => (
                <option key={m.type} value={m.type}>
                  [{m.category}] {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">OPERATIONAL OBSERVATION / NOTES</label>
            <textarea
              rows={2}
              placeholder="e.g. All 4 cargo nets secured, forward belly sealed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Photo Evidence */}
          <div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-600 transition-colors">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>{attachedPhoto ? 'Photo Attached (Replace)' : 'Capture Ramp Evidence Photo'}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            </label>

            {attachedPhoto && (
              <div className="mt-2">
                <img src={attachedPhoto} alt="Ramp evidence preview" className="w-20 h-16 object-cover rounded-lg border border-slate-700" />
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setQuickEventModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono shadow-md flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Stamping...' : 'STAMP & QUEUE EVENT'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
