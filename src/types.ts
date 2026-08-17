export type Language = 'en' | 'fr' | 'ar';

export type UserRole = 
  | 'Administrator'
  | 'Sorting Agent'
  | 'Subplane Agent'
  | 'Ramp/Loading Agent'
  | 'Auditor';

export interface UserPermission {
  canCreateFlight: boolean;
  canEditFlight: boolean;
  canLockFlight: boolean;
  canScanSorting: boolean;
  canScanLoading: boolean;
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageDollies: boolean;
  canViewAuditLogs: boolean;
  canResolveDiscrepancy: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  badgeId: string;
  role: UserRole;
  department: string;
  assignedZone: string;
  avatarUrl: string;
  status: 'active' | 'on_shift' | 'off_duty';
  lastLogin: string;
  bagsScannedToday: number;
  flightsHandled: number;
  assignedFlightNbr?: string;
  assignedTasksCount?: number;
  assignedMilestones?: string[];
  customPermissions?: Partial<UserPermission>;
}

export interface UserSessionLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  device: string;
  actionsPerformed: number;
  status: 'active' | 'closed';
}

export type FlightType = 'Commercial Pax' | 'Cargo' | 'VIP/Charter' | 'Tech Stop';
export type FlightStatus = 'Scheduled' | 'Sorting' | 'Loading' | 'Reconciled' | 'Departed' | 'Delayed' | 'Locked';

export interface FlightComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  message: string;
  category: 'general' | 'discrepancy' | 'security' | 'loading' | 'delay';
}

export interface Flight {
  id: string;
  date: string; // YYYY-MM-DD
  flightNbr: string; // e.g. TU-720, AF-1482
  flightTask: string; // e.g. "Full Ground Handling & Fast Transfer"
  paxNbrDep: number;
  paxNbrArr: number;
  gateNbr: string;
  flightType: FlightType;
  acType: string; // e.g. A320neo, B737-800, A330-300
  checkInStartTime: string; // HH:mm
  sta: string; // Scheduled Time of Arrival (HH:mm)
  std: string; // Scheduled Time of Departure (HH:mm)
  companyName: string;
  companyLogo?: string;
  reg: string; // Aircraft registration e.g. TS-IMU, F-GKXZ
  subplaneAreaZone: string; // e.g. Stand 14, Remote R2
  sortingAreaZone: string; // e.g. Make-up Carousel 02, Sorter East B3
  sortingAreaUser: string;
  subplaneAreaUser: string;
  assignedRampAgent?: string;
  assignedRampAgentBadge?: string;
  createdBy: string;
  status: FlightStatus;
  isLocked: boolean;
  totalBagsExpected: number;
  bagsSortedCount: number;
  bagsLoadedCount: number;
  comments: FlightComment[];
  dollyIds: string[];
}

export type BagStatus = 
  | 'CHECKED_IN'
  | 'SORTED'
  | 'LOADED'
  | 'MISSING'
  | 'OFFLOADED'
  | 'DISCREPANCY';

export type HoldPosition = 'Hold 1 Fwd' | 'Hold 2 Aft' | 'Hold 3 Bulk' | 'Unassigned';

export interface BagComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  text: string;
  isDiscrepancy: boolean;
}

export interface Baggage {
  id: string;
  tagNumber: string; // 10-digit IATA barcode e.g. 0057128491
  flightNbr: string;
  passengerName: string;
  seatNumber: string;
  destination: string;
  classType: 'Economy' | 'Business' | 'Priority' | 'Crew';
  weightKg: number;
  status: BagStatus;
  sortingZone: string;
  sortingUser?: string;
  sortingTimestamp?: string;
  loadingZone?: string;
  loadingUser?: string;
  loadingTimestamp?: string;
  dollyId?: string;
  holdLocation: HoldPosition;
  isRush: boolean;
  isHeavy: boolean;
  isFragile: boolean;
  comments: BagComment[];
  alerts?: string[];
}

export type DollyStatus = 'Available' | 'Loading' | 'In Transit' | 'At Aircraft Hold' | 'Maintenance';
export type DollyType = 'Container AKE' | 'Open Dolly' | 'Bulk Cart' | 'Pallet Trailer';

export interface Dolly {
  id: string; // DLY-101
  type: DollyType;
  maxCapacity: number;
  currentBagsCount: number;
  assignedFlightNbr?: string;
  zone: string;
  status: DollyStatus;
  lastUpdated: string;
  tareWeightKg: number;
  bags: string[]; // bag tag numbers
}

export type MilestoneCategory = 
  | 'Arrival'
  | 'Servicing'
  | 'Baggage'
  | 'Cleaning'
  | 'Fueling'
  | 'Boarding'
  | 'Departure';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'DELAYED';

export interface TurnaroundMilestone {
  id: string;
  flightNbr: string;
  code: string; // e.g. ATA, CHOCKS_ON, STAIRS_ON, DISEMBARK_START, DISEMBARK_END, GPU_ON, HOLD_OPEN, BAG_OFFLOAD_START, BAG_OFFLOAD_END, CLEAN_START, CLEAN_END, WATER_LAV, FUEL_START, FUEL_END, CATERING, BAG_LOAD_START, BAG_LOAD_END, BOARD_START, BOARD_END, HOLD_CLOSED, PUSH_BACK, ATD
  title: string;
  category: MilestoneCategory;
  targetOffsetMinutes: number; // relative to STA/STD (e.g. -45 for ATA, 0 for on-time departure)
  scheduledTime: string; // HH:mm
  actualTime?: string; // HH:mm:ss
  timestampExact?: string; // ISO 8601 with milliseconds
  status: MilestoneStatus;
  completedByUserId?: string;
  completedByUserName?: string;
  completedByUserRole?: UserRole;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyMeters?: number;
  rampStand?: string; // e.g. "Stand 14 - Apron South"
  notes?: string;
}

export interface AgentSession {
  sessionId: string;
  flightId: string;
  flightNbr: string;
  agentId: string;
  agentName: string;
  agentRole: UserRole;
  badgeId: string;
  startedAt: string;
  lastPingAt: string;
  deviceModel: string; // e.g. "Zebra TC57x Handheld Scanner", "Zebra MC3300 Touch Computer"
  batteryLevel: number; // 0-100
  signalStrength: 'Strong' | 'Good' | 'Weak';
  currentGps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    zoneName: string;
  };
  isActive: boolean;
  assignedMilestones: string[]; // Milestone codes
}

export interface Company {
  id: string;
  name: string;
  abbreviation: string;
  iata: string;
  icao: string;
  logo: string;
  hub: string;
  contactEmail: string;
  contactPhone: string;
  activeFlightsCount: number;
  slaComplianceRate: number; // percentage e.g. 98.4
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
export type TaskPriority = 'Normal' | 'High' | 'Critical';

export interface FlightTaskItem {
  id: string;
  flightNbr: string;
  taskTitle: string;
  category: 'Pre-flight' | 'Sorting' | 'Subplane' | 'Loading' | 'Reconciliation' | 'Departure';
  assignedRole: UserRole;
  assignedUserId: string;
  assignedUserName: string;
  status: TaskStatus;
  priority: TaskPriority;
  targetTime: string;
  completedAt?: string;
  checklist: { id: string; text: string; done: boolean }[];
  notes?: string;
}

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';
export type AuditActionType = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SCAN_STEP1'
  | 'SCAN_STEP2'
  | 'RECONCILE_ALERT'
  | 'RECONCILE_SUCCESS'
  | 'LOCK'
  | 'UNLOCK'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'COMMENT_ADD'
  | 'DOLLY_ASSIGN';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  module: 'Baggage' | 'Flight' | 'Users' | 'Company' | 'Dolly' | 'Tasks' | 'Security';
  actionType: AuditActionType;
  entityId: string; // e.g. Flight NBR, Bag Tag, User ID
  details: string;
  previousState?: string;
  newState?: string;
  severity: AuditSeverity;
  device: string; // e.g. "Zebra TC57 Handheld", "Desktop Terminal #04"
}
