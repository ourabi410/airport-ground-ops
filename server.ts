import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// In-memory Server-side authoritative storage
const serverFlights: any[] = [];
const serverEvents: Map<string, any> = new Map(); // Keyed by eventId (idempotency key)
const serverIncidents: Map<string, any> = new Map();
const serverAuditLogs: any[] = [];

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini API init error:', e);
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Authoritative Server Time (for clock discrepancy detection)
  app.get('/api/time', (req, res) => {
    res.json({
      serverTimeUtc: new Date().toISOString(),
      timezone: 'UTC',
      epochMs: Date.now(),
    });
  });

  // Flights API
  app.get('/api/flights', (req, res) => {
    res.json(serverFlights);
  });

  app.get('/api/flights/:id', (req, res) => {
    const flight = serverFlights.find((f) => f.id === req.params.id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json(flight);
  });

  // Events API
  app.get('/api/events', (req, res) => {
    const flightId = req.query.flightId as string;
    let events = Array.from(serverEvents.values());
    if (flightId) {
      events = events.filter((e) => e.flightId === flightId);
    }
    res.json(events);
  });

  // Batch Sync Endpoint with IDEMPOTENCY
  app.post('/api/sync/batch', (req, res) => {
    const { batch, clientSyncTimestampUtc } = req.body;
    if (!Array.isArray(batch)) {
      return res.status(400).json({ error: 'Invalid batch format. Expected array.' });
    }

    const serverReceivedTime = new Date().toISOString();
    const processed: string[] = [];
    const duplicates: string[] = [];

    for (const item of batch) {
      const idempotencyKey = item.id;

      if (item.entityType === 'OPERATIONAL_EVENT' || item.entityType === 'CORRECTION') {
        const eventData = item.payload;
        if (serverEvents.has(idempotencyKey) && item.entityType !== 'CORRECTION') {
          duplicates.push(idempotencyKey);
        } else {
          // Stamp server received time WITHOUT modifying authoritative eventTimeUtc
          const enrichedEvent = {
            ...eventData,
            serverReceivedTime: serverReceivedTime,
            syncTime: serverReceivedTime,
            syncStatus: 'SYNCED',
          };
          serverEvents.set(idempotencyKey, enrichedEvent);
          processed.push(idempotencyKey);

          // Add to server audit log
          serverAuditLogs.push({
            id: `srv_aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            entityType: 'EVENT',
            entityId: idempotencyKey,
            action: item.entityType === 'CORRECTION' ? 'CORRECTION' : 'SYNC',
            userId: eventData.userId || 'unknown',
            userName: eventData.userName || 'unknown',
            userRole: eventData.userRole || 'unknown',
            deviceId: eventData.deviceId || 'unknown',
            timestampUtc: serverReceivedTime,
            eventTimeUtc: eventData.eventTimeUtc,
            oldValue: eventData.originalEventData,
            newValue: eventData,
            reason: eventData.correctionReason || 'Batch sync from mobile client',
            clientSyncTimestampUtc,
          });
        }
      } else if (item.entityType === 'INCIDENT') {
        const incidentData = item.payload;
        if (serverIncidents.has(idempotencyKey)) {
          duplicates.push(idempotencyKey);
        } else {
          serverIncidents.set(idempotencyKey, {
            ...incidentData,
            syncStatus: 'SYNCED',
            serverReceivedTime,
          });
          processed.push(idempotencyKey);
        }
      }
    }

    res.json({
      success: true,
      serverReceivedTime,
      processedCount: processed.length,
      duplicateCount: duplicates.length,
      processedIds: processed,
      duplicateIds: duplicates,
    });
  });

  // Incidents API
  app.get('/api/incidents', (req, res) => {
    res.json(Array.from(serverIncidents.values()));
  });

  // Audit Logs API
  app.get('/api/audit-logs', (req, res) => {
    res.json(serverAuditLogs.slice(-100)); // last 100 entries
  });

  // Gemini AI Turnaround Advisory & Anomaly Detection
  app.post('/api/ai/turnaround-assistant', async (req, res) => {
    try {
      const { flight, events, groundServices, baggage, passengers, incidents } = req.body;
      const ai = getAi();

      if (!ai) {
        // High quality fallback heuristic advisor when API key is not present in local test
        const delayRisk = (flight?.delayMinutes || 0) > 10 ? 'HIGH' : (flight?.delayMinutes || 0) > 0 ? 'MEDIUM' : 'LOW';
        const uncompletedBags = (baggage?.totalBags || 0) - (baggage?.loadedBags || 0);
        const unboardedPax = (passengers?.checkedIn || 0) - (passengers?.boarded || 0);

        return res.json({
          analysis: {
            turnaroundHealthScore: Math.max(30, 100 - (flight?.delayMinutes || 0) * 3 - (incidents?.length || 0) * 15),
            riskLevel: delayRisk,
            criticalPathBottleneck: unboardedPax > 50 ? 'Passenger Boarding' : uncompletedBags > 50 ? 'Baggage Loading' : 'Ground Refueling / Final Loadsheet',
            recommendedActions: [
              unboardedPax > 40 ? 'Call Zone B & C boarding immediately and verify gate reader sync.' : 'Prepare final passenger reconciliation manifest.',
              uncompletedBags > 30 ? 'Dispatch backup baggage tug to Aft Cargo door 4.' : 'Secure cargo hold doors and confirm latch pins.',
              'Cross-check NOTOC dangerous goods sign-off with flight crew before door closure.',
            ],
            delayPredictionMin: flight?.delayMinutes || 0,
            summary: `Flight ${flight?.flightNumber || 'QR123'} turnaround is ${flight?.status || 'IN PROGRESS'} with ${flight?.delayMinutes || 0}m projected variance. Ground operations are synchronized.`,
          },
        });
      }

      const prompt = `You are a Senior Airline Airport Ground Operations Dispatcher & Turnaround Specialist at Hamad International Airport (DOH).
Analyze the following live turnaround operational state for flight ${flight?.flightNumber || 'Unknown'}:

Flight Details:
- Aircraft: ${flight?.aircraftType} (Reg: ${flight?.aircraftReg})
- Gate: ${flight?.gate} (Stand: ${flight?.stand})
- Status: ${flight?.status}
- Scheduled Turnaround Target: ${flight?.targetTurnaroundMin} minutes
- Current Delay: ${flight?.delayMinutes} minutes

Ground Services:
- Cleaning: ${groundServices?.cleaning?.status} (Crew: ${groundServices?.cleaning?.crewCount})
- Catering: ${groundServices?.catering?.status} (Meals: ${groundServices?.catering?.mealsLoaded})
- Fueling: ${groundServices?.fueling?.status} (Actual: ${groundServices?.fueling?.actualFuelKg} kg / Planned: ${groundServices?.fueling?.plannedFuelKg} kg)
- Maintenance: ${groundServices?.maintenance?.status} (RTS: ${groundServices?.maintenance?.releaseToService})

Passenger & Baggage:
- Boarding Progress: ${passengers?.boarded} / ${passengers?.checkedIn} checked in
- Baggage Loading: ${baggage?.loadedBags} / ${baggage?.totalBags} bags (Missing: ${baggage?.missingBags}, Damaged: ${baggage?.damagedBags})

Incidents / Bottlenecks:
${JSON.stringify(incidents || [])}

Provide a structured JSON response with:
{
  "turnaroundHealthScore": number (0-100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "criticalPathBottleneck": string,
  "recommendedActions": [string, string, string],
  "delayPredictionMin": number,
  "summary": string
}
Return only valid JSON without markdown fences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json({ analysis: parsed });
    } catch (err: any) {
      console.error('AI turnaround assistant error:', err);
      res.status(500).json({ error: err.message || 'AI turnaround service error' });
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️ AeroTurn Server running on http://localhost:${PORT}`);
  });
}

startServer();
