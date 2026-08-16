import {
  Flight,
  OperationalEvent,
  IncidentRecord,
  GroundServicesData,
  BaggageData,
  PassengerData,
  AuditLogEntry,
  SyncQueueItem,
} from '../types';

const DB_NAME = 'AeroTurnDB_v1';
const DB_VERSION = 1;

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  public async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      // If indexedDB is not available (e.g., SSR or restricted iframe), handle gracefully
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB is not supported in this environment. Falling back to in-memory.');
        return reject(new Error('IndexedDB not supported'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Stores
        if (!db.objectStoreNames.contains('flights')) {
          const store = db.createObjectStore('flights', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('gate', 'gate', { unique: false });
        }

        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'id' });
          store.createIndex('flightId', 'flightId', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('eventTimeUtc', 'eventTimeUtc', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('incidents')) {
          const store = db.createObjectStore('incidents', { keyPath: 'id' });
          store.createIndex('flightId', 'flightId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
        }

        if (!db.objectStoreNames.contains('ground_services')) {
          db.createObjectStore('ground_services', { keyPath: 'flightId' });
        }

        if (!db.objectStoreNames.contains('baggage')) {
          db.createObjectStore('baggage', { keyPath: 'flightId' });
        }

        if (!db.objectStoreNames.contains('passengers')) {
          db.createObjectStore('passengers', { keyPath: 'flightId' });
        }

        if (!db.objectStoreNames.contains('audit_logs')) {
          const store = db.createObjectStore('audit_logs', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('timestampUtc', 'timestampUtc', { unique: false });
        }

        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- FLIGHTS ---
  public async getAllFlights(): Promise<Flight[]> {
    try {
      const store = await this.getStore('flights', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async getFlightById(id: string): Promise<Flight | undefined> {
    try {
      const store = await this.getStore('flights', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return undefined;
    }
  }

  public async saveFlight(flight: Flight): Promise<void> {
    const store = await this.getStore('flights', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(flight);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async saveFlightsBatch(flights: Flight[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('flights', 'readwrite');
    const store = tx.objectStore('flights');
    for (const flight of flights) {
      store.put(flight);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- EVENTS ---
  public async getEventsForFlight(flightId: string): Promise<OperationalEvent[]> {
    try {
      const store = await this.getStore('events', 'readonly');
      const index = store.index('flightId');
      return new Promise((resolve, reject) => {
        const request = index.getAll(flightId);
        request.onsuccess = () => {
          const events: OperationalEvent[] = request.result || [];
          // Sort chronologically by authoritative UTC event time
          events.sort((a, b) => new Date(a.eventTimeUtc).getTime() - new Date(b.eventTimeUtc).getTime());
          resolve(events);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async getAllEvents(): Promise<OperationalEvent[]> {
    try {
      const store = await this.getStore('events', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async saveEvent(event: OperationalEvent): Promise<void> {
    const store = await this.getStore('events', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async saveEventsBatch(events: OperationalEvent[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('events', 'readwrite');
    const store = tx.objectStore('events');
    for (const evt of events) {
      store.put(evt);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- SYNC QUEUE (Offline Queue) ---
  public async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const store = await this.getStore('sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const store = await this.getStore('sync_queue', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const items: SyncQueueItem[] = (request.result || []).filter(
            (i: SyncQueueItem) => i.syncStatus === 'PENDING' || i.syncStatus === 'FAILED'
          );
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const store = await this.getStore('sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async removeFromSyncQueue(id: string): Promise<void> {
    const store = await this.getStore('sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearCompletedSyncQueue(): Promise<void> {
    try {
      const store = await this.getStore('sync_queue', 'readwrite');
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        for (const item of items) {
          if (item.syncStatus === 'SYNCED') {
            store.delete(item.id);
          }
        }
      };
    } catch (e) {
      console.warn('Error clearing completed sync queue', e);
    }
  }

  // --- INCIDENTS ---
  public async getAllIncidents(): Promise<IncidentRecord[]> {
    try {
      const store = await this.getStore('incidents', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async saveIncident(incident: IncidentRecord): Promise<void> {
    const store = await this.getStore('incidents', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(incident);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- GROUND SERVICES ---
  public async getGroundServices(flightId: string): Promise<GroundServicesData | undefined> {
    try {
      const store = await this.getStore('ground_services', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(flightId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return undefined;
    }
  }

  public async saveGroundServices(data: GroundServicesData): Promise<void> {
    const store = await this.getStore('ground_services', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- BAGGAGE ---
  public async getBaggageData(flightId: string): Promise<BaggageData | undefined> {
    try {
      const store = await this.getStore('baggage', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(flightId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return undefined;
    }
  }

  public async saveBaggageData(data: BaggageData): Promise<void> {
    const store = await this.getStore('baggage', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- PASSENGERS ---
  public async getPassengerData(flightId: string): Promise<PassengerData | undefined> {
    try {
      const store = await this.getStore('passengers', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(flightId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return undefined;
    }
  }

  public async savePassengerData(data: PassengerData): Promise<void> {
    const store = await this.getStore('passengers', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const store = await this.getStore('audit_logs', 'readonly');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const logs: AuditLogEntry[] = request.result || [];
          logs.sort((a, b) => new Date(b.timestampUtc).getTime() - new Date(a.timestampUtc).getTime());
          resolve(logs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  public async saveAuditLog(log: AuditLogEntry): Promise<void> {
    const store = await this.getStore('audit_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- EXPORT / IMPORT BACKUP ---
  public async exportAllData(): Promise<string> {
    const flights = await this.getAllFlights();
    const events = await this.getAllEvents();
    const incidents = await this.getAllIncidents();
    const auditLogs = await this.getAuditLogs();
    const pendingQueue = await this.getPendingSyncQueue();

    const backup = {
      version: DB_VERSION,
      exportedAtUtc: new Date().toISOString(),
      flights,
      events,
      incidents,
      auditLogs,
      pendingQueue,
    };

    return JSON.stringify(backup, null, 2);
  }

  public async clearAll(): Promise<void> {
    const db = await this.initDB();
    const stores = ['flights', 'events', 'sync_queue', 'incidents', 'ground_services', 'baggage', 'passengers', 'audit_logs'];
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
    }
  }
}

export const dbManager = new IndexedDBManager();
