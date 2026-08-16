import {
  OperationalEvent,
  IncidentRecord,
  Flight,
  BaggageData,
  PassengerData,
  GroundServicesData,
  AuditLogEntry,
  SyncQueueItem,
  User,
  GpsLocation,
  EventStatus,
} from '../types';
import { dbManager } from '../db/indexedDB';
import {
  INITIAL_FLIGHTS,
  INITIAL_EVENTS,
  INITIAL_BAGGAGE,
  INITIAL_PASSENGERS,
  INITIAL_GROUND_SERVICES,
  INITIAL_INCIDENTS,
  DEMO_USERS,
} from './demoData';
import { gpsService } from './gpsService';

type SyncListener = (state: {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  syncStatus: 'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE' | 'ERROR';
  pendingCount: number;
  lastSyncTime: string | null;
  clockDifferenceMin: number;
}) => void;

class SyncEngine {
  private isOnline = true;
  private isSimulatedOffline = false;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private pendingCount = 0;
  private clockDifferenceMin = 0;
  private syncInterval: number | null = null;

  constructor() {
    this.initNetworkListeners();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        if (!this.isSimulatedOffline) {
          this.syncPendingBatch();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Periodic check every 10s if online
      this.syncInterval = window.setInterval(() => {
        if (this.canSync()) {
          this.syncPendingBatch();
        }
        this.checkServerClock();
      }, 10000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.emitState(listener);
    return () => this.listeners.delete(listener);
  }

  private emitState(listener: SyncListener) {
    const activeOnline = this.isOnline && !this.isSimulatedOffline;
    let status: 'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE' | 'ERROR' = 'SYNCED';

    if (!activeOnline) {
      status = 'OFFLINE';
    } else if (this.isSyncing) {
      status = 'SYNCING';
    } else if (this.pendingCount > 0) {
      status = 'PENDING';
    }

    listener({
      isOnline: activeOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      syncStatus: status,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      clockDifferenceMin: this.clockDifferenceMin,
    });
  }

  private notify() {
    this.listeners.forEach((l) => this.emitState(l));
  }

  public canSync(): boolean {
    return this.isOnline && !this.isSimulatedOffline && !this.isSyncing;
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.notify();
    if (!offline && this.isOnline) {
      this.syncPendingBatch();
    }
  }

  public async initialize(): Promise<void> {
    try {
      await dbManager.initDB();
      const existingFlights = await dbManager.getAllFlights();
      if (existingFlights.length === 0) {
        // Seed initial mock dataset
        await dbManager.saveFlightsBatch(INITIAL_FLIGHTS);
        await dbManager.saveEventsBatch(INITIAL_EVENTS);
        for (const inc of INITIAL_INCIDENTS) {
          await dbManager.saveIncident(inc);
        }
        for (const [fId, bag] of Object.entries(INITIAL_BAGGAGE)) {
          await dbManager.saveBaggageData(bag);
        }
        for (const [fId, pax] of Object.entries(INITIAL_PASSENGERS)) {
          await dbManager.savePassengerData(pax);
        }
        for (const [fId, srv] of Object.entries(INITIAL_GROUND_SERVICES)) {
          await dbManager.saveGroundServices(srv);
        }
      }

      await this.refreshPendingCount();
      await this.checkServerClock();
    } catch (e) {
      console.warn('Sync engine initialization warning:', e);
    }
  }

  public async refreshPendingCount(): Promise<number> {
    const queue = await dbManager.getPendingSyncQueue();
    this.pendingCount = queue.length;
    this.notify();
    return this.pendingCount;
  }

  public async checkServerClock(): Promise<void> {
    if (!this.isOnline || this.isSimulatedOffline) return;
    try {
      const start = Date.now();
      const res = await fetch('/api/time', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const latency = (Date.now() - start) / 2;
        const serverTime = new Date(data.serverTimeUtc).getTime() + latency;
        const localTime = Date.now();
        const diffMinutes = Math.round((localTime - serverTime) / 60000);
        this.clockDifferenceMin = diffMinutes;
        this.notify();
      }
    } catch (e) {
      // Ignored if server unreachable
    }
  }

  // --- RECORD EVENT (OFFLINE-FIRST) ---
  public async recordEvent(params: {
    flightId: string;
    eventType: string;
    eventTitle: string;
    category: OperationalEvent['category'];
    status: EventStatus;
    user: User;
    deviceId: string;
    notes?: string;
    photoUrl?: string;
    customTimeUtc?: string; // Optional user override, otherwise now
    gate?: string;
    stand?: string;
  }): Promise<OperationalEvent> {
    const nowUtc = params.customTimeUtc || new Date().toISOString();
    const deviceTime = new Date().toISOString();

    // Auto-capture GPS
    const flight = await dbManager.getFlightById(params.flightId);
    const airportIata = flight?.originIata === 'DOH' ? 'DOH' : flight?.destinationIata || 'DOH';
    const gps = await gpsService.getCurrentPosition(airportIata, params.gate || flight?.gate);

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const event: OperationalEvent = {
      id: eventId, // UUID / Idempotency Key
      flightId: params.flightId,
      eventType: params.eventType,
      eventTitle: params.eventTitle,
      category: params.category,
      status: params.status,
      eventTimeUtc: nowUtc, // Authoritative immutable event time
      deviceTime: deviceTime,
      airportTimezone: 'Asia/Qatar',
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      deviceId: params.deviceId,
      notes: params.notes,
      photoUrl: params.photoUrl,
      gate: params.gate || flight?.gate,
      stand: params.stand || flight?.stand,
      gps,
      syncStatus: 'PENDING',
      createdAt: nowUtc,
      updatedAt: nowUtc,
    };

    // 1. Save to local IndexedDB events store
    await dbManager.saveEvent(event);

    // 2. Add to sync queue
    const queueItem: SyncQueueItem = {
      id: eventId,
      entityType: 'OPERATIONAL_EVENT',
      action: 'CREATE',
      payload: event,
      createdAt: nowUtc,
      retryCount: 0,
      syncStatus: 'PENDING',
    };
    await dbManager.addToSyncQueue(queueItem);

    // 3. Add to immutable audit log
    const auditLog: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType: 'EVENT',
      entityId: eventId,
      action: 'CREATE',
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      deviceId: params.deviceId,
      timestampUtc: nowUtc,
      newValue: {
        eventType: params.eventType,
        title: params.eventTitle,
        status: params.status,
        notes: params.notes,
      },
      gps,
    };
    await dbManager.saveAuditLog(auditLog);

    // 4. Update flight status / milestones if applicable
    if (flight) {
      let updatedStatus = flight.status;
      if (params.eventType === 'ON_BLOCK') updatedStatus = 'TURNAROUND';
      if (params.eventType === 'BOARDING_STARTED') updatedStatus = 'BOARDING';
      if (params.eventType === 'DOORS_CLOSED' || params.eventType === 'CHOCKS_OFF') updatedStatus = 'READY';
      if (params.eventType === 'PUSHBACK' || params.eventType === 'OFF_BLOCK') updatedStatus = 'DEPARTED';

      flight.status = updatedStatus;
      flight.updatedAt = nowUtc;
      await dbManager.saveFlight(flight);
    }

    await this.refreshPendingCount();

    // 5. Attempt background sync if online
    if (this.canSync()) {
      this.syncPendingBatch();
    }

    return event;
  }

  // --- RECORD INCIDENT (OFFLINE-FIRST) ---
  public async recordIncident(params: {
    flightId?: string;
    flightNumber?: string;
    category: IncidentRecord['category'];
    severity: IncidentRecord['severity'];
    title: string;
    description: string;
    location: string;
    gate?: string;
    assignedDepartment: string;
    user: User;
    deviceId: string;
    photoUrl?: string;
  }): Promise<IncidentRecord> {
    const nowUtc = new Date().toISOString();
    const gps = await gpsService.getCurrentPosition('DOH', params.gate);
    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const incident: IncidentRecord = {
      id: incidentId,
      flightId: params.flightId,
      flightNumber: params.flightNumber,
      category: params.category,
      severity: params.severity,
      title: params.title,
      description: params.description,
      location: params.location,
      gate: params.gate,
      reportedBy: params.user.name,
      reportedByUserId: params.user.id,
      assignedDepartment: params.assignedDepartment,
      reportedAtUtc: nowUtc,
      status: 'OPEN',
      syncStatus: 'PENDING',
      photos: params.photoUrl ? [params.photoUrl] : [],
      gps,
    };

    await dbManager.saveIncident(incident);

    const queueItem: SyncQueueItem = {
      id: incidentId,
      entityType: 'INCIDENT',
      action: 'CREATE',
      payload: incident,
      createdAt: nowUtc,
      retryCount: 0,
      syncStatus: 'PENDING',
    };
    await dbManager.addToSyncQueue(queueItem);

    if (params.flightId) {
      const flight = await dbManager.getFlightById(params.flightId);
      if (flight) {
        flight.openIncidentsCount = (flight.openIncidentsCount || 0) + 1;
        await dbManager.saveFlight(flight);
      }
    }

    await this.refreshPendingCount();
    if (this.canSync()) {
      this.syncPendingBatch();
    }

    return incident;
  }

  // --- RECORD SUPERVISORY CORRECTION (APPEND-ONLY AUDIT TRAIL) ---
  public async correctEvent(params: {
    eventId: string;
    newStatus: EventStatus;
    newNotes: string;
    reason: string;
    user: User;
    deviceId: string;
  }): Promise<OperationalEvent | null> {
    const events = await dbManager.getAllEvents();
    const event = events.find((e) => e.id === params.eventId);
    if (!event) return null;

    const nowUtc = new Date().toISOString();
    const oldSnapshot = { ...event };

    event.isCorrected = true;
    event.correctionReason = params.reason;
    event.correctedBy = params.user.name;
    event.correctedAt = nowUtc;
    event.originalEventData = {
      status: oldSnapshot.status,
      notes: oldSnapshot.notes,
    };
    event.status = params.newStatus;
    event.notes = params.newNotes;
    event.syncStatus = 'PENDING';
    event.updatedAt = nowUtc;

    await dbManager.saveEvent(event);

    // Queue update
    const queueItem: SyncQueueItem = {
      id: `corr_${event.id}_${Date.now()}`,
      entityType: 'CORRECTION',
      action: 'UPDATE',
      payload: event,
      createdAt: nowUtc,
      retryCount: 0,
      syncStatus: 'PENDING',
    };
    await dbManager.addToSyncQueue(queueItem);

    // Audit log entry
    const auditLog: AuditLogEntry = {
      id: `aud_corr_${Date.now()}`,
      entityType: 'EVENT',
      entityId: event.id,
      action: 'CORRECTION',
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      deviceId: params.deviceId,
      timestampUtc: nowUtc,
      oldValue: oldSnapshot,
      newValue: event,
      reason: params.reason,
    };
    await dbManager.saveAuditLog(auditLog);

    await this.refreshPendingCount();
    if (this.canSync()) {
      this.syncPendingBatch();
    }

    return event;
  }

  // --- CORE BATCH SYNCHRONIZATION ---
  public async syncPendingBatch(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (!this.canSync()) {
      return { success: false, syncedCount: 0, errors: ['Offline or sync in progress'] };
    }

    this.isSyncing = true;
    this.notify();

    const pendingItems = await dbManager.getPendingSyncQueue();
    if (pendingItems.length === 0) {
      this.isSyncing = false;
      this.lastSyncTime = new Date().toISOString();
      this.notify();
      return { success: true, syncedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let syncedCount = 0;

    try {
      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: pendingItems,
          clientSyncTimestampUtc: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const serverSyncTime = result.serverReceivedTime || new Date().toISOString();

        for (const item of pendingItems) {
          // Update item in sync queue to SYNCED
          item.syncStatus = 'SYNCED';
          await dbManager.removeFromSyncQueue(item.id);

          // If it was an operational event, stamp its syncTime and syncStatus locally
          if (item.entityType === 'OPERATIONAL_EVENT' || item.entityType === 'CORRECTION') {
            const eventPayload = item.payload as OperationalEvent;
            eventPayload.syncStatus = 'SYNCED';
            eventPayload.syncTime = serverSyncTime;
            await dbManager.saveEvent(eventPayload);
          } else if (item.entityType === 'INCIDENT') {
            const inc = item.payload as IncidentRecord;
            inc.syncStatus = 'SYNCED';
            await dbManager.saveIncident(inc);
          }

          syncedCount++;
        }

        this.lastSyncTime = serverSyncTime;
      } else {
        errors.push(`Server returned HTTP ${response.status}`);
        for (const item of pendingItems) {
          item.retryCount = (item.retryCount || 0) + 1;
          item.syncStatus = 'FAILED';
          item.error = `HTTP ${response.status}`;
          item.lastAttempt = new Date().toISOString();
          await dbManager.updateSyncQueueItem(item);
        }
      }
    } catch (err: any) {
      errors.push(err.message || 'Network error during sync');
      for (const item of pendingItems) {
        item.retryCount = (item.retryCount || 0) + 1;
        item.syncStatus = 'FAILED';
        item.error = err.message || 'Network unreachable';
        item.lastAttempt = new Date().toISOString();
        await dbManager.updateSyncQueueItem(item);
      }
    } finally {
      this.isSyncing = false;
      await this.refreshPendingCount();
    }

    return { success: errors.length === 0, syncedCount, errors };
  }
}

export const syncEngine = new SyncEngine();
