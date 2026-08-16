import { GpsLocation } from './index';

export type HoldLocation = 
  | 'FWD_HOLD_1'
  | 'FWD_HOLD_2'
  | 'AFT_HOLD_3'
  | 'AFT_HOLD_4'
  | 'BULK_HOLD_5'
  | 'ULD_CONTAINER';

export type BagType = 
  | 'STANDARD'
  | 'PRIORITY'
  | 'FIRST_CLASS'
  | 'CREW'
  | 'HEAVY'
  | 'FRAGILE'
  | 'STROLLER'
  | 'HOT_TRANSIT'
  | 'RUSH'
  | 'DIPLOMATIC'
  | 'LIVE_ANIMAL';

export type PaxReconciliationStatus = 
  | 'BOARDED'
  | 'CHECKED_IN'
  | 'NO_SHOW'
  | 'SECURITY_HOLD'
  | 'GATE_STANDBY'
  | 'OFFLOAD_REQUESTED';

export type BrsScanStatus = 
  | 'LOADED_OK'
  | 'OFFLOADED_OK'
  | 'REJECTED_NO_SHOW'
  | 'SECURITY_ALERT'
  | 'STAND_MISMATCH'
  | 'DUPLICATE_SCAN'
  | 'UNEXPECTED_BAG';

export type GeofenceZone = 
  | 'ON_STAND'          // < 45m from aircraft parking stand
  | 'INNER_APRON'       // 45m - 150m (taxiway / service road)
  | 'SORTING_FACILITY'  // > 150m (Baggage Makeup Area / BMF)
  | 'REMOTE_AREA';

export interface ScannedBag {
  id: string;
  barcode: string;             // Raw scanned string e.g. "0157891234"
  iataTag: string;             // Formatted "0-157-891234"
  airlinePrefix: string;       // "157" (Qatar Airways), "001" (AA), etc.
  airlineName: string;         // "Qatar Airways"
  flightId: string;
  flightNumber: string;
  passengerName: string;
  pnr: string;
  seatNumber?: string;
  destination: string;         // IATA Airport code e.g. "LHR"
  origin: string;
  holdLocation: HoldLocation;
  uldId?: string;              // e.g. "AKE10294QR"
  bagType: BagType;
  weightKg: number;
  paxStatus: PaxReconciliationStatus;
  brsStatus: BrsScanStatus;
  statusMessage: string;
  timestampUtc: string;
  deviceTimestamp: string;
  scannedBy: string;
  deviceId: string;            // e.g. "Zebra-TC26-Ramp01"
  gps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    standDistanceMeters: number;
    zone: GeofenceZone;
    geofenceVerified: boolean;
    standName: string;
  };
  scanSource: 'ZEBRA_HARDWARE' | 'DATAWEDGE_KEYSTROKE' | 'CAMERA_BARCODE' | 'MANUAL';
  photoUrl?: string;
}

export interface ZebraDeviceState {
  model: 'Zebra TC26' | 'Zebra TC21' | 'Zebra TC5X' | 'Generic Scanner';
  datawedgeActive: boolean;
  keystrokeActive: boolean;
  gpsActive: boolean;
  gpsAccuracyMeters: number;
  currentStand: string;
  standDistanceMeters: number;
  geofenceZone: GeofenceZone;
  audioFeedback: boolean;
  vibrationHaptic: boolean;
  autoHoldAssignment: HoldLocation;
  currentUld: string;
  lastScanTimestamp: number | null;
  totalScansToday: number;
}
