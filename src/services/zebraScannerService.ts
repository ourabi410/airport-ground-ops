import { 
  ScannedBag, 
  HoldLocation, 
  BrsScanStatus, 
  BagType, 
  PaxReconciliationStatus,
  GeofenceZone
} from '../types/baggageScanner';
import { GpsLocation } from '../types';
import { AIRPORT_COORDINATES, gpsService } from './gpsService';

// Known IATA Airline Barcode 3-digit prefixes
export const AIRLINE_PREFIXES: Record<string, { code: string; name: string }> = {
  '157': { code: 'QR', name: 'Qatar Airways' },
  '176': { code: 'EK', name: 'Emirates' },
  '125': { code: 'BA', name: 'British Airways' },
  '220': { code: 'LH', name: 'Lufthansa' },
  '057': { code: 'AF', name: 'Air France' },
  '001': { code: 'AA', name: 'American Airlines' },
  '016': { code: 'UA', name: 'United Airlines' },
  '006': { code: 'DL', name: 'Delta Air Lines' },
  '607': { code: 'EY', name: 'Etihad Airways' },
  '074': { code: 'KL', name: 'KLM Royal Dutch Airlines' },
  '098': { code: 'AI', name: 'Air India' },
  '065': { code: 'SV', name: 'Saudia' },
  '235': { code: 'TK', name: 'Turkish Airlines' },
};

// Seed simulated baggage database for flight reconciliation
const MANIFEST_DATABASE: Record<string, {
  paxName: string;
  pnr: string;
  seat: string;
  dest: string;
  origin: string;
  type: BagType;
  weight: number;
  paxStatus: PaxReconciliationStatus;
  suggestedHold: HoldLocation;
  suggestedUld?: string;
}> = {
  '0157891234': {
    paxName: 'AL-THANI / MOHAMMED MR',
    pnr: 'QRT998',
    seat: '2A',
    dest: 'LHR',
    origin: 'DOH',
    type: 'FIRST_CLASS',
    weight: 23.4,
    paxStatus: 'BOARDED',
    suggestedHold: 'FWD_HOLD_1',
    suggestedUld: 'AKE10294QR',
  },
  '0157891235': {
    paxName: 'SMITH / ELEANOR MRS',
    pnr: 'QRT998',
    seat: '2B',
    dest: 'LHR',
    origin: 'DOH',
    type: 'PRIORITY',
    weight: 19.8,
    paxStatus: 'BOARDED',
    suggestedHold: 'FWD_HOLD_1',
    suggestedUld: 'AKE10294QR',
  },
  '0157894401': {
    paxName: 'DUBOIS / JEAN-LUC MR',
    pnr: 'FR8819',
    seat: '14C',
    dest: 'LHR',
    origin: 'DOH',
    type: 'STANDARD',
    weight: 21.0,
    paxStatus: 'BOARDED',
    suggestedHold: 'AFT_HOLD_3',
    suggestedUld: 'AKE44921QR',
  },
  '0157894402': {
    paxName: 'MARTINEZ / SOFIA MS',
    pnr: 'ES4490',
    seat: '18A',
    dest: 'LHR',
    origin: 'DOH',
    type: 'HOT_TRANSIT',
    weight: 17.5,
    paxStatus: 'BOARDED',
    suggestedHold: 'BULK_HOLD_5',
  },
  '0157999888': {
    paxName: 'HASSAN / KHALED MR',
    pnr: 'QRX102',
    seat: '32F',
    dest: 'LHR',
    origin: 'DOH',
    type: 'STANDARD',
    weight: 24.2,
    paxStatus: 'NO_SHOW', // ALERT: Passenger did not board!
    suggestedHold: 'AFT_HOLD_4',
  },
  '0157777111': {
    paxName: 'DIPLOMATIC POUCH / EMBASSY',
    pnr: 'DIP001',
    seat: 'COCKPIT',
    dest: 'LHR',
    origin: 'DOH',
    type: 'DIPLOMATIC',
    weight: 12.0,
    paxStatus: 'BOARDED',
    suggestedHold: 'FWD_HOLD_1',
  },
  '0157666222': {
    paxName: 'WILLIAMS / MARK MR',
    pnr: 'UK9912',
    seat: '28D',
    dest: 'LHR',
    origin: 'DOH',
    type: 'HEAVY',
    weight: 31.8, // Heavy bag >32kg tag
    paxStatus: 'BOARDED',
    suggestedHold: 'BULK_HOLD_5',
  },
  '0176882211': {
    paxName: 'AL-MAKTOUM / RASHID MR',
    pnr: 'EK7701',
    seat: '1K',
    dest: 'DXB',
    origin: 'DOH',
    type: 'FIRST_CLASS',
    weight: 22.0,
    paxStatus: 'BOARDED',
    suggestedHold: 'FWD_HOLD_1',
    suggestedUld: 'AKE98122QR',
  },
  '0125443322': {
    paxName: 'JOHNSON / ARTHUR MR',
    pnr: 'BA4401',
    seat: '10E',
    dest: 'LHR',
    origin: 'DOH',
    type: 'STANDARD',
    weight: 18.2,
    paxStatus: 'BOARDED',
    suggestedHold: 'AFT_HOLD_3',
  },
};

// Calculate Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

class ZebraScannerService {
  private audioContext: AudioContext | null = null;

  // Initialize Web Audio synthesizer
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * High-pitch confirmation beep for Zebra TC26 (1760Hz - Airport standard)
   */
  public playSuccessBeep() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note - crisp and clear on ramp

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio autoplay policy fallback
    }

    // Trigger haptic vibration on Zebra TC26
    this.vibrate([70]);
  }

  /**
   * Low double buzzer for BRS Mismatch, No-Show passenger, or security hold (240Hz)
   */
  public playErrorBuzzer() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(240, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Pulse 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(180, now + 0.2);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.4);
    } catch {
      // Audio fallback
    }

    // Urgent double vibration pattern on Zebra TC26
    this.vibrate([150, 80, 250]);
  }

  /**
   * Vibrate the Zebra TC26 device
   */
  public vibrate(pattern: number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Clean raw barcode string (remove trailing CR/LF from Zebra DataWedge)
   */
  public sanitizeBarcode(rawInput: string): string {
    return rawInput.trim().replace(/[\r\n\t]/g, '').toUpperCase();
  }

  /**
   * Check if scanned string is a ULD container (e.g. AKE12345QR, PMC90211BA)
   */
  public isUldBarcode(barcode: string): boolean {
    const uldRegex = /^[A-Z]{3}\s?[0-9]{4,5}\s?[A-Z0-9]{2,3}$/i;
    return uldRegex.test(barcode);
  }

  /**
   * Parse IATA 10-digit / 6-digit baggage tag
   * Format: 0-AAA-NNNNNN (e.g. 0157891234 -> Prefix 157 = Qatar Airways, Bag # 891234)
   */
  public parseIataTag(rawBarcode: string): {
    cleanBarcode: string;
    formattedIata: string;
    airlinePrefix: string;
    airlineName: string;
    bagNumber: string;
    isIataStandard: boolean;
  } {
    const clean = this.sanitizeBarcode(rawBarcode);
    
    // Check 10-digit IATA license plate barcode
    if (/^\d{10}$/.test(clean)) {
      const prefix = clean.substring(1, 4);
      const bagNum = clean.substring(4);
      const airline = AIRLINE_PREFIXES[prefix] || { code: 'AIR', name: `Airline Prefix ${prefix}` };
      
      return {
        cleanBarcode: clean,
        formattedIata: `${clean[0]}-${prefix}-${bagNum}`,
        airlinePrefix: prefix,
        airlineName: `${airline.name} (${airline.code})`,
        bagNumber: bagNum,
        isIataStandard: true,
      };
    }

    // Check 6-digit or other length
    if (/^\d{6,9}$/.test(clean)) {
      return {
        cleanBarcode: clean,
        formattedIata: `TAG-${clean}`,
        airlinePrefix: '157',
        airlineName: 'Qatar Airways (QR)',
        bagNumber: clean,
        isIataStandard: true,
      };
    }

    return {
      cleanBarcode: clean,
      formattedIata: clean,
      airlinePrefix: '157',
      airlineName: 'Qatar Airways (QR)',
      bagNumber: clean,
      isIataStandard: false,
    };
  }

  /**
   * Process a scanned barcode from Zebra TC26 DataWedge or camera
   */
  public async processScan(params: {
    rawBarcode: string;
    flightId: string;
    flightNumber: string;
    currentGateOrStand: string;
    selectedHold: HoldLocation;
    selectedUld?: string;
    scanMode: 'LOAD' | 'OFFLOAD' | 'AUDIT';
    userName: string;
    deviceId: string;
    currentGps?: GpsLocation | null;
  }): Promise<{ bag: ScannedBag; isAlert: boolean; alertReason?: string }> {
    const { cleanBarcode, formattedIata, airlinePrefix, airlineName, isIataStandard } = this.parseIataTag(params.rawBarcode);

    // 1. Get GPS coordinates & calculate stand geofence
    const gpsLoc = params.currentGps || await gpsService.getCurrentPosition('DOH', params.currentGateOrStand);
    
    // Look up stand coordinates
    const dohAir = AIRPORT_COORDINATES['DOH'];
    const standCoords = (dohAir && params.currentGateOrStand && dohAir.gates[params.currentGateOrStand])
      ? dohAir.gates[params.currentGateOrStand]
      : { lat: dohAir?.lat || 25.2609, lng: dohAir?.lng || 51.6138 };

    const distanceMeters = calculateDistanceMeters(
      gpsLoc.latitude,
      gpsLoc.longitude,
      standCoords.lat,
      standCoords.lng
    );

    let zone: GeofenceZone = 'ON_STAND';
    if (distanceMeters <= 50) {
      zone = 'ON_STAND';
    } else if (distanceMeters <= 160) {
      zone = 'INNER_APRON';
    } else {
      zone = 'SORTING_FACILITY';
    }

    // 2. Check Flight Manifest Database for reconciliation
    const knownBag = MANIFEST_DATABASE[cleanBarcode];

    let passengerName = 'PASSENGER / RECONCILED';
    let pnr = `QR${Math.floor(1000 + Math.random() * 9000)}`;
    let seatNumber = `${Math.floor(1 + Math.random() * 38)}${['A','B','C','D','E','F'][Math.floor(Math.random() * 6)]}`;
    let destination = 'LHR';
    let origin = 'DOH';
    let bagType: BagType = 'STANDARD';
    let weightKg = Number((18 + Math.random() * 8).toFixed(1));
    let paxStatus: PaxReconciliationStatus = 'BOARDED';
    let brsStatus: BrsScanStatus = 'LOADED_OK';
    let statusMessage = 'BRS RECONCILED - VALIDATED FOR LOADING';
    let isAlert = false;
    let alertReason: string | undefined;

    if (knownBag) {
      passengerName = knownBag.paxName;
      pnr = knownBag.pnr;
      seatNumber = knownBag.seat;
      destination = knownBag.dest;
      origin = knownBag.origin;
      bagType = knownBag.type;
      weightKg = knownBag.weight;
      paxStatus = knownBag.paxStatus;
    } else {
      // Dynamic deterministic generation for any barcode
      if (cleanBarcode.endsWith('99') || cleanBarcode.includes('NOSHOW')) {
        paxStatus = 'NO_SHOW';
      } else if (cleanBarcode.endsWith('77') || cleanBarcode.includes('VIP')) {
        bagType = 'FIRST_CLASS';
      } else if (cleanBarcode.endsWith('88') || cleanBarcode.includes('HVY')) {
        bagType = 'HEAVY';
        weightKg = 32.5;
      } else if (cleanBarcode.endsWith('55') || cleanBarcode.includes('HOT')) {
        bagType = 'HOT_TRANSIT';
      }
    }

    // 3. Evaluate BRS Security Rules
    if (paxStatus === 'NO_SHOW') {
      brsStatus = 'REJECTED_NO_SHOW';
      statusMessage = '⚠️ CRITICAL BRS ALERT: PASSENGER NOT BOARDED (NO-SHOW). DO NOT LOAD!';
      isAlert = true;
      alertReason = `Passenger ${passengerName} (Seat ${seatNumber}) has not boarded flight ${params.flightNumber}. Under IATA security regulations, unaccompanied baggage must be segregated!`;
    } else if (paxStatus === 'SECURITY_HOLD') {
      brsStatus = 'SECURITY_ALERT';
      statusMessage = '⚠️ SECURITY HOLD: CUSTOMS / SCREENING RE-INSPECTION REQUIRED';
      isAlert = true;
      alertReason = `Bag flagged by airport security authority for physical swab. Transfer to Security Station 4.`;
    } else if (params.scanMode === 'OFFLOAD') {
      brsStatus = 'OFFLOADED_OK';
      statusMessage = 'INBOUND BAG OFFLOADED & SCANNED TO ARRIVAL BELT';
    } else {
      brsStatus = 'LOADED_OK';
      statusMessage = `LOADED INTO ${params.selectedHold.replace('_', ' ')} ${params.selectedUld ? `(${params.selectedUld})` : ''} - BRS OK`;
    }

    // Play Audio and Haptic feedback
    if (isAlert) {
      this.playErrorBuzzer();
    } else {
      this.playSuccessBeep();
    }

    const now = new Date();

    const scannedBag: ScannedBag = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      barcode: cleanBarcode,
      iataTag: formattedIata,
      airlinePrefix,
      airlineName,
      flightId: params.flightId,
      flightNumber: params.flightNumber,
      passengerName,
      pnr,
      seatNumber,
      destination,
      origin,
      holdLocation: params.selectedHold,
      uldId: params.selectedUld || (knownBag?.suggestedUld) || undefined,
      bagType,
      weightKg,
      paxStatus,
      brsStatus,
      statusMessage,
      timestampUtc: now.toISOString(),
      deviceTimestamp: now.toLocaleTimeString('en-US', { hour12: false }),
      scannedBy: params.userName,
      deviceId: params.deviceId || 'Zebra-TC26-Ramp',
      gps: {
        latitude: gpsLoc.latitude,
        longitude: gpsLoc.longitude,
        accuracy: gpsLoc.accuracy,
        standDistanceMeters: distanceMeters,
        zone,
        geofenceVerified: zone === 'ON_STAND',
        standName: params.currentGateOrStand || 'Stand C12',
      },
      scanSource: 'ZEBRA_HARDWARE',
    };

    return {
      bag: scannedBag,
      isAlert,
      alertReason,
    };
  }

  /**
   * Sample demonstration baggage tags for rapid testing with TC26
   */
  public getSampleDemoBags() {
    return [
      {
        barcode: '0157891234',
        label: 'VIP First Class (Boarded)',
        badge: 'FIRST CLASS',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        pax: 'AL-THANI / M.',
      },
      {
        barcode: '0157894401',
        label: 'Economy Standard (Boarded)',
        badge: 'STANDARD',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        pax: 'DUBOIS / J.',
      },
      {
        barcode: '0157999888',
        label: '⚠️ No-Show Passenger Alert',
        badge: 'NO-SHOW / REJECT',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        pax: 'HASSAN / K. (No-Show)',
      },
      {
        barcode: '0157894402',
        label: 'Hot Transit (<45min Transfer)',
        badge: 'RUSH TRANSIT',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        pax: 'MARTINEZ / S.',
      },
      {
        barcode: '0157666222',
        label: 'Heavy Baggage (31.8 kg)',
        badge: 'HEAVY >23KG',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        pax: 'WILLIAMS / M.',
      },
      {
        barcode: 'AKE10294QR',
        label: 'ULD Container Tag (AKE)',
        badge: 'ULD CONTAINER',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        pax: 'CONTAINER ID',
      },
    ];
  }
}

export const zebraScannerService = new ZebraScannerService();
