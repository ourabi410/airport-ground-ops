export type UserRole =
  | 'admin'
  | 'ops_manager'
  | 'supervisor'
  | 'ground_agent'
  | 'baggage_agent'
  | 'maintenance'
  | 'viewer';

export interface User {
  id: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  department: string;
  email: string;
  avatar?: string;
}

export type FlightStatus =
  | 'SCHEDULED'
  | 'ARRIVING'
  | 'ON_BLOCK'
  | 'TURNAROUND'
  | 'BOARDING'
  | 'READY'
  | 'DEPARTED'
  | 'DELAYED'
  | 'CANCELLED';

export type EventStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'PROBLEM'
  | 'SKIPPED';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export type ProblemSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProblemCategory =
  | 'BAGGAGE'
  | 'PASSENGER'
  | 'AIRCRAFT'
  | 'GATE'
  | 'GROUND_EQUIPMENT'
  | 'FUEL'
  | 'CATERING'
  | 'CLEANING'
  | 'SECURITY'
  | 'BOARDING'
  | 'WEATHER'
  | 'TECHNICAL'
  | 'OTHER';

export type TurnaroundMilestoneType =
  | 'LANDING'
  | 'ON_BLOCK'
  | 'CHOCKS_ON'
  | 'GPU_CONNECTED'
  | 'PCA_CONNECTED'
  | 'DOOR_OPEN'
  | 'DISEMBARK_STARTED'
  | 'DISEMBARK_COMPLETED'
  | 'BAGGAGE_UNLOAD_STARTED'
  | 'BAGGAGE_UNLOAD_COMPLETED'
  | 'CLEANING_STARTED'
  | 'CLEANING_COMPLETED'
  | 'CATERING_STARTED'
  | 'CATERING_COMPLETED'
  | 'FUEL_STARTED'
  | 'FUEL_COMPLETED'
  | 'MAINTENANCE_STARTED'
  | 'MAINTENANCE_COMPLETED'
  | 'WATER_SERVICE_STARTED'
  | 'WATER_SERVICE_COMPLETED'
  | 'LAVATORY_SERVICE_STARTED'
  | 'LAVATORY_SERVICE_COMPLETED'
  | 'CARGO_LOAD_STARTED'
  | 'CARGO_LOAD_COMPLETED'
  | 'BAGGAGE_LOAD_STARTED'
  | 'BAGGAGE_LOAD_COMPLETED'
  | 'BOARDING_STARTED'
  | 'PRIORITY_BOARDING'
  | 'GENERAL_BOARDING'
  | 'BOARDING_COMPLETED'
  | 'PASSENGER_RECONCILIATION'
  | 'FINAL_LOADSHEET_SIGNED'
  | 'DOORS_CLOSED'
  | 'CHOCKS_OFF'
  | 'PUSHBACK'
  | 'OFF_BLOCK'
  | 'AIRBORNE';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  status: 'HIGH_ACCURACY' | 'MEDIUM_ACCURACY' | 'WEAK_ACCURACY' | 'UNAVAILABLE' | 'SIMULATED';
}

export interface OperationalEvent {
  id: string; // UUID (idempotency key)
  flightId: string;
  eventType: TurnaroundMilestoneType | string;
  eventTitle: string;
  category: 'ARRIVAL' | 'GROUND_SERVICES' | 'DEPARTURE' | 'SAFETY' | 'INCIDENT';
  status: EventStatus;
  
  // Timestamps
  eventTimeUtc: string; // ISO String (Authoritative original event time)
  deviceTime: string; // ISO String recorded on client device
  serverReceivedTime?: string; // ISO String stamped by server upon receipt
  syncTime?: string; // ISO String when synced
  airportTimezone: string; // e.g. "Asia/Qatar"
  
  // Location & Context
  gps?: GpsLocation;
  gate?: string;
  stand?: string;
  
  // Agent & Device
  userId: string;
  userName: string;
  userRole: UserRole;
  deviceId: string;
  
  // Payload & Details
  notes?: string;
  photoUrl?: string; // base64 / blob URL / cloud storage URL
  photoId?: string;
  attachments?: string[];
  
  // Synchronization
  syncStatus: SyncStatus;
  retryCount?: number;
  lastSyncError?: string;
  
  // Audit metadata
  isCorrected?: boolean;
  correctionReason?: string;
  correctedBy?: string;
  correctedAt?: string;
  originalEventData?: Partial<OperationalEvent>;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  flightNumber: string; // e.g. "QR123"
  callsign?: string;
  airline: string; // e.g. "Qatar Airways"
  airlineCode: string; // e.g. "QR"
  airlineLogo?: string;
  
  originIata: string; // e.g. "DOH"
  originAirport: string;
  destinationIata: string; // e.g. "LHR"
  destinationAirport: string;
  
  aircraftType: string; // e.g. "A350-1000", "B777-300ER", "A320neo"
  aircraftReg: string; // e.g. "A7-ANE"
  gate: string; // e.g. "C12"
  terminal: string; // e.g. "Terminal 1"
  stand: string; // e.g. "Ramp 42"
  
  status: FlightStatus;
  
  // Schedule vs Actual times (ISO strings)
  scheduledArrival: string;
  actualArrival?: string;
  estimatedArrival?: string;
  
  scheduledDeparture: string;
  estimatedDeparture: string;
  actualDeparture?: string;
  
  // Turnaround metrics
  targetTurnaroundMin: number; // e.g. 60 or 90 mins
  actualTurnaroundMin?: number;
  delayMinutes: number; // positive = delayed, negative = early
  delayReasons?: DelayRecord[];
  
  // Sub-modules summary
  totalPassengers: number;
  boardedPassengers: number;
  totalBaggage: number;
  loadedBaggage: number;
  unloadedBaggage: number;
  
  assignedSupervisor?: string;
  assignedAgent?: string;
  openIncidentsCount: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface BaggageData {
  id: string;
  flightId: string;
  totalBags: number;
  loadedBags: number;
  unloadedBags: number;
  missingBags: number;
  damagedBags: number;
  lateBags: number;
  specialBags: number; // Fragile, VIP, Crew, Heavy, Strollers
  transferBags: number;
  containerUldList: string[]; // e.g. ["AKE12345QR", "AKE67890QR"]
  damageReportNotes?: string;
  damagePhotos?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  updatedAt: string;
}

export interface PassengerData {
  id: string;
  flightId: string;
  booked: number;
  checkedIn: number;
  boarded: number;
  noShow: number;
  transit: number;
  specialAssistance: {
    wheelchair: number; // WCHR / WCHS / WCHC
    unaccompaniedMinor: number; // UMNR
    medical: number; // MEDA
    infants: number; // INF
    vip: number;
  };
  boardingZones: {
    zone1: { name: string; boarded: number; total: number; open: boolean };
    zone2: { name: string; boarded: number; total: number; open: boolean };
    zone3: { name: string; boarded: number; total: number; open: boolean };
    zone4: { name: string; boarded: number; total: number; open: boolean };
  };
  reconciliationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'RECONCILED' | 'MISMATCH';
  gateStatus: 'CLOSED' | 'OPEN' | 'FINAL_CALL' | 'GATE_CLOSED';
  updatedAt: string;
}

export interface GroundServicesData {
  id: string;
  flightId: string;
  
  // Cleaning
  cleaning: {
    startedAt?: string;
    completedAt?: string;
    crewCount: number;
    cleaningType: 'TRANSIT_QUICK' | 'FULL_DEEP' | 'NIGHT_STOP';
    inspectedBy?: string;
    inspectionPassed: boolean;
    problemNotes?: string;
    status: EventStatus;
  };
  
  // Catering
  catering: {
    startedAt?: string;
    completedAt?: string;
    truckCount: number;
    mealsLoaded: number;
    specialMealsCount: number; // VGML, KSML, MOML, etc.
    barCartsLoaded: number;
    securitySealNumbers: string[];
    supplierName: string;
    status: EventStatus;
    notes?: string;
  };
  
  // Fuel
  fueling: {
    startedAt?: string;
    completedAt?: string;
    plannedFuelKg: number;
    actualFuelKg: number;
    fuelDensity: number; // kg/L (e.g. 0.802)
    truckId: string;
    supplier: string;
    safetyBondingConfirmed: boolean;
    waterCheckPassed: boolean;
    meterBeforeLiters: number;
    meterAfterLiters: number;
    status: EventStatus;
    notes?: string;
  };
  
  // Maintenance / Tech Log
  maintenance: {
    required: boolean;
    startedAt?: string;
    completedAt?: string;
    defectDescription?: string;
    workOrderNumber?: string;
    melItemCode?: string; // Minimum Equipment List
    technicianName?: string;
    technicianLicense?: string;
    releaseToService: boolean;
    status: EventStatus;
    notes?: string;
  };
  
  // Cargo & ULD
  cargo: {
    cargoWeightKg: number;
    mailWeightKg: number;
    uldLoadedCount: number;
    uldUnloadedCount: number;
    dgrNotocSigned: boolean; // Dangerous Goods Notice to Captain
    liveAnimalsOnBoard: boolean; // AVI
    perishableCargo: boolean; // PER/COLD
    status: EventStatus;
    notes?: string;
  };

  updatedAt: string;
}

export interface IncidentRecord {
  id: string;
  flightId?: string;
  flightNumber?: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  title: string;
  description: string;
  location: string;
  gate?: string;
  reportedBy: string;
  reportedByUserId: string;
  assignedDepartment: string;
  reportedAtUtc: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  photos?: string[];
  gps?: GpsLocation;
  syncStatus: SyncStatus;
}

export interface DelayRecord {
  id: string;
  flightId: string;
  iataCode: string; // e.g. "81" (Passenger), "12" (Baggage), "41" (Aircraft Defect), "36" (Cleaning), "37" (Fuel), "71" (Weather)
  category: string;
  description: string;
  delayMinutes: number;
  isPrimary: boolean;
  notes?: string;
  reportedBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: 'EVENT' | 'FLIGHT' | 'BAGGAGE' | 'PASSENGER' | 'INCIDENT' | 'SERVICES';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'CORRECTION' | 'SYNC' | 'DELETE';
  userId: string;
  userName: string;
  userRole: string;
  deviceId: string;
  timestampUtc: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  gps?: GpsLocation;
}

export interface TurnaroundKpis {
  totalFlightsToday: number;
  activeTurnarounds: number;
  onTimeDeparturePercent: number; // e.g. 92.4%
  averageTurnaroundMin: number; // e.g. 74 min
  averageDelayMin: number; // e.g. 8.2 min
  delayedFlightsCount: number;
  openIncidentsCount: number;
  averageBaggageUnloadMin: number;
  averageBoardingMin: number;
  averageCleaningMin: number;
  averageFuelingMin: number;
}

export interface SyncQueueItem {
  id: string; // Idempotency key
  entityType: 'OPERATIONAL_EVENT' | 'INCIDENT' | 'GROUND_SERVICES' | 'BAGGAGE' | 'PASSENGERS' | 'CORRECTION';
  action: 'CREATE' | 'UPDATE';
  payload: any;
  createdAt: string;
  retryCount: number;
  syncStatus: SyncStatus;
  lastAttempt?: string;
  error?: string;
}
