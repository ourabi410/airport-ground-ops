import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Flight,
  OperationalEvent,
  IncidentRecord,
  GroundServicesData,
  BaggageData,
  PassengerData,
  AuditLogEntry,
  User,
  UserRole,
  EventStatus,
} from '../types';
import { dbManager } from '../db/indexedDB';
import { syncEngine } from '../services/syncEngine';
import { DEMO_USERS } from '../services/demoData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
  
  // Data
  flights: Flight[];
  selectedFlight: Flight | null;
  events: OperationalEvent[];
  selectedFlightEvents: OperationalEvent[];
  incidents: IncidentRecord[];
  auditLogs: AuditLogEntry[];
  
  // Sub-modules for selected flight
  selectedBaggage: BaggageData | null;
  selectedPassengers: PassengerData | null;
  selectedGroundServices: GroundServicesData | null;
  
  // Sync & Network
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (offline: boolean) => void;
  syncStatus: 'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE' | 'ERROR';
  pendingCount: number;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  clockDifferenceMin: number;
  triggerManualSync: () => Promise<void>;
  
  // Operational Actions
  recordMilestoneEvent: (params: {
    flightId: string;
    eventType: string;
    eventTitle: string;
    category: OperationalEvent['category'];
    status: EventStatus;
    notes?: string;
    photoUrl?: string;
    customTimeUtc?: string;
    gate?: string;
    stand?: string;
  }) => Promise<OperationalEvent>;
  
  reportIncident: (params: {
    flightId?: string;
    flightNumber?: string;
    category: IncidentRecord['category'];
    severity: IncidentRecord['severity'];
    title: string;
    description: string;
    location: string;
    gate?: string;
    assignedDepartment: string;
    photoUrl?: string;
  }) => Promise<IncidentRecord>;
  
  correctOperationalEvent: (params: {
    eventId: string;
    newStatus: EventStatus;
    newNotes: string;
    reason: string;
  }) => Promise<void>;
  
  updateBaggage: (flightId: string, data: Partial<BaggageData>) => Promise<void>;
  updatePassengers: (flightId: string, data: Partial<PassengerData>) => Promise<void>;
  updateGroundServices: (flightId: string, data: Partial<GroundServicesData>) => Promise<void>;
  
  refreshAllData: () => Promise<void>;
  deviceId: string;
  
  // Quick Agent Modal State
  quickEventModalOpen: boolean;
  isQuickEventModalOpen: boolean;
  setQuickEventModalOpen: (open: boolean) => void;
  reportIncidentModalOpen: boolean;
  isReportIncidentModalOpen: boolean;
  setReportIncidentModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default: Tariq (Ground Agent)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>('flt_qr123');
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  const [selectedBaggage, setSelectedBaggage] = useState<BaggageData | null>(null);
  const [selectedPassengers, setSelectedPassengers] = useState<PassengerData | null>(null);
  const [selectedGroundServices, setSelectedGroundServices] = useState<GroundServicesData | null>(null);
  
  // Network & Sync State
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'PENDING' | 'OFFLINE' | 'ERROR'>('SYNCED');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [clockDifferenceMin, setClockDifferenceMin] = useState(0);
  
  const [quickEventModalOpen, setQuickEventModalOpen] = useState(false);
  const [reportIncidentModalOpen, setReportIncidentModalOpen] = useState(false);
  
  const deviceId = 'RuggedTab-DOH-88';

  // Load all local data from IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      const flts = await dbManager.getAllFlights();
      const evts = await dbManager.getAllEvents();
      const incs = await dbManager.getAllIncidents();
      const auds = await dbManager.getAuditLogs();
      
      setFlights(flts);
      setEvents(evts);
      setIncidents(incs);
      setAuditLogs(auds);
      
      if (selectedFlightId) {
        const bag = await dbManager.getBaggageData(selectedFlightId);
        const pax = await dbManager.getPassengerData(selectedFlightId);
        const srv = await dbManager.getGroundServices(selectedFlightId);
        setSelectedBaggage(bag || null);
        setSelectedPassengers(pax || null);
        setSelectedGroundServices(srv || null);
      }
    } catch (e) {
      console.warn('Error refreshing IndexedDB data:', e);
    }
  }, [selectedFlightId]);

  // Initialize sync engine & DB
  useEffect(() => {
    syncEngine.initialize().then(() => {
      refreshAllData();
    });

    const unsubscribe = syncEngine.subscribe((state) => {
      setIsOnline(state.isOnline);
      setIsSimulatedOfflineState(state.isSimulatedOffline);
      setSyncStatus(state.syncStatus);
      setPendingCount(state.pendingCount);
      setLastSyncTime(state.lastSyncTime);
      setClockDifferenceMin(state.clockDifferenceMin);
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAllData]);

  // Update selected sub-modules when selectedFlightId changes
  useEffect(() => {
    if (selectedFlightId) {
      dbManager.getBaggageData(selectedFlightId).then((b) => setSelectedBaggage(b || null));
      dbManager.getPassengerData(selectedFlightId).then((p) => setSelectedPassengers(p || null));
      dbManager.getGroundServices(selectedFlightId).then((s) => setSelectedGroundServices(s || null));
    }
  }, [selectedFlightId]);

  const setSimulatedOffline = (offline: boolean) => {
    syncEngine.setSimulatedOffline(offline);
  };

  const triggerManualSync = async () => {
    await syncEngine.syncPendingBatch();
    await refreshAllData();
  };

  // Record milestone event
  const recordMilestoneEvent = async (params: {
    flightId: string;
    eventType: string;
    eventTitle: string;
    category: OperationalEvent['category'];
    status: EventStatus;
    notes?: string;
    photoUrl?: string;
    customTimeUtc?: string;
    gate?: string;
    stand?: string;
  }): Promise<OperationalEvent> => {
    const createdEvent = await syncEngine.recordEvent({
      ...params,
      user: currentUser,
      deviceId,
    });
    await refreshAllData();
    return createdEvent;
  };

  // Report incident
  const reportIncident = async (params: {
    flightId?: string;
    flightNumber?: string;
    category: IncidentRecord['category'];
    severity: IncidentRecord['severity'];
    title: string;
    description: string;
    location: string;
    gate?: string;
    assignedDepartment: string;
    photoUrl?: string;
  }): Promise<IncidentRecord> => {
    const inc = await syncEngine.recordIncident({
      ...params,
      user: currentUser,
      deviceId,
    });
    await refreshAllData();
    return inc;
  };

  // Supervisory correction
  const correctOperationalEvent = async (params: {
    eventId: string;
    newStatus: EventStatus;
    newNotes: string;
    reason: string;
  }) => {
    await syncEngine.correctEvent({
      ...params,
      user: currentUser,
      deviceId,
    });
    await refreshAllData();
  };

  // Sub-module update helpers
  const updateBaggage = async (flightId: string, data: Partial<BaggageData>) => {
    const existing = (await dbManager.getBaggageData(flightId)) || {
      id: `bag_${flightId}`,
      flightId,
      totalBags: 0,
      loadedBags: 0,
      unloadedBags: 0,
      missingBags: 0,
      damagedBags: 0,
      lateBags: 0,
      specialBags: 0,
      transferBags: 0,
      containerUldList: [],
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };

    const merged: BaggageData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await dbManager.saveBaggageData(merged);
    setSelectedBaggage(merged);
    
    // Update flight summary
    const flight = await dbManager.getFlightById(flightId);
    if (flight) {
      flight.totalBaggage = merged.totalBags;
      flight.loadedBaggage = merged.loadedBags;
      flight.unloadedBaggage = merged.unloadedBags;
      await dbManager.saveFlight(flight);
    }
    await refreshAllData();
  };

  const updatePassengers = async (flightId: string, data: Partial<PassengerData>) => {
    const existing = (await dbManager.getPassengerData(flightId)) || {
      id: `pax_${flightId}`,
      flightId,
      booked: 0,
      checkedIn: 0,
      boarded: 0,
      noShow: 0,
      transit: 0,
      specialAssistance: { wheelchair: 0, unaccompaniedMinor: 0, medical: 0, infants: 0, vip: 0 },
      boardingZones: {
        zone1: { name: 'Priority', boarded: 0, total: 0, open: false },
        zone2: { name: 'Zone A', boarded: 0, total: 0, open: false },
        zone3: { name: 'Zone B', boarded: 0, total: 0, open: false },
        zone4: { name: 'Zone C', boarded: 0, total: 0, open: false },
      },
      reconciliationStatus: 'NOT_STARTED',
      gateStatus: 'CLOSED',
      updatedAt: new Date().toISOString(),
    };

    const merged: PassengerData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await dbManager.savePassengerData(merged);
    setSelectedPassengers(merged);

    const flight = await dbManager.getFlightById(flightId);
    if (flight) {
      flight.totalPassengers = merged.checkedIn || merged.booked;
      flight.boardedPassengers = merged.boarded;
      await dbManager.saveFlight(flight);
    }
    await refreshAllData();
  };

  const updateGroundServices = async (flightId: string, data: Partial<GroundServicesData>) => {
    const existing = (await dbManager.getGroundServices(flightId)) || {
      id: `srv_${flightId}`,
      flightId,
      cleaning: { crewCount: 0, cleaningType: 'TRANSIT_QUICK', inspectionPassed: false, status: 'PENDING' },
      catering: { truckCount: 0, mealsLoaded: 0, specialMealsCount: 0, barCartsLoaded: 0, securitySealNumbers: [], supplierName: '', status: 'PENDING' },
      fueling: { plannedFuelKg: 0, actualFuelKg: 0, fuelDensity: 0.804, truckId: '', supplier: '', safetyBondingConfirmed: false, waterCheckPassed: false, meterBeforeLiters: 0, meterAfterLiters: 0, status: 'PENDING' },
      maintenance: { required: false, releaseToService: true, status: 'COMPLETED' },
      cargo: { cargoWeightKg: 0, mailWeightKg: 0, uldLoadedCount: 0, uldUnloadedCount: 0, dgrNotocSigned: true, liveAnimalsOnBoard: false, perishableCargo: false, status: 'PENDING' },
      updatedAt: new Date().toISOString(),
    };

    const merged: GroundServicesData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await dbManager.saveGroundServices(merged);
    setSelectedGroundServices(merged);
    await refreshAllData();
  };

  const selectedFlight = flights.find((f) => f.id === selectedFlightId) || flights[0] || null;
  const selectedFlightEvents = events.filter((e) => e.flightId === selectedFlightId);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users: DEMO_USERS,
        activeTab,
        setActiveTab,
        selectedFlightId,
        setSelectedFlightId,
        flights,
        selectedFlight,
        events,
        selectedFlightEvents,
        incidents,
        auditLogs,
        selectedBaggage,
        selectedPassengers,
        selectedGroundServices,
        isOnline,
        isSimulatedOffline,
        setSimulatedOffline,
        syncStatus,
        pendingCount,
        pendingSyncCount: pendingCount,
        lastSyncTime,
        clockDifferenceMin,
        triggerManualSync,
        recordMilestoneEvent,
        reportIncident,
        correctOperationalEvent,
        updateBaggage,
        updatePassengers,
        updateGroundServices,
        refreshAllData,
        deviceId,
        quickEventModalOpen,
        isQuickEventModalOpen: quickEventModalOpen,
        setQuickEventModalOpen,
        reportIncidentModalOpen,
        isReportIncidentModalOpen: reportIncidentModalOpen,
        setReportIncidentModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
