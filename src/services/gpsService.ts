import { GpsLocation } from '../types';

export interface AirportCoordinate {
  iata: string;
  name: string;
  lat: number;
  lng: number;
  gates: Record<string, { lat: number; lng: number }>;
}

export const AIRPORT_COORDINATES: Record<string, AirportCoordinate> = {
  DOH: {
    iata: 'DOH',
    name: 'Hamad International Airport (Doha)',
    lat: 25.2609,
    lng: 51.6138,
    gates: {
      'C12': { lat: 25.2635, lng: 51.6142 },
      'C14': { lat: 25.2638, lng: 51.6148 },
      'A4': { lat: 25.2680, lng: 51.6110 },
      'B8': { lat: 25.2655, lng: 51.6190 },
      'D2': { lat: 25.2570, lng: 51.6175 },
      'E1': { lat: 25.2540, lng: 51.6120 },
      'Ramp 42': { lat: 25.2610, lng: 51.6210 },
      'Ramp 18': { lat: 25.2590, lng: 51.6230 },
    },
  },
  DXB: {
    iata: 'DXB',
    name: 'Dubai International Airport',
    lat: 25.2532,
    lng: 55.3657,
    gates: {
      'B21': { lat: 25.2545, lng: 55.3680 },
      'A12': { lat: 25.2510, lng: 55.3610 },
      'C3': { lat: 25.2560, lng: 55.3720 },
    },
  },
  LHR: {
    iata: 'LHR',
    name: 'London Heathrow Airport',
    lat: 51.4700,
    lng: -0.4543,
    gates: {
      'T5-A10': { lat: 51.4715, lng: -0.4870 },
      'T2-B34': { lat: 51.4690, lng: -0.4500 },
      'T3-22': { lat: 51.4720, lng: -0.4600 },
    },
  },
  JFK: {
    iata: 'JFK',
    name: 'John F. Kennedy International Airport',
    lat: 40.6413,
    lng: -73.7781,
    gates: {
      'T4-B28': { lat: 40.6440, lng: -73.7820 },
      'T8-14': { lat: 40.6480, lng: -73.7910 },
    },
  },
};

export class GpsService {
  private lastKnownLocation: GpsLocation | null = null;
  private watchId: number | null = null;

  public async getCurrentPosition(airportIata = 'DOH', gate?: string): Promise<GpsLocation> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(this.getFallbackLocation(airportIata, gate, 'UNAVAILABLE'));
        return;
      }

      const timeoutId = window.setTimeout(() => {
        // Fallback if browser takes too long (e.g. inside concrete ramp building or simulator)
        if (this.lastKnownLocation) {
          resolve(this.lastKnownLocation);
        } else {
          resolve(this.getFallbackLocation(airportIata, gate, 'SIMULATED'));
        }
      }, 3500);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.clearTimeout(timeoutId);
          const acc = pos.coords.accuracy;
          let status: GpsLocation['status'] = 'HIGH_ACCURACY';
          if (acc > 50) status = 'WEAK_ACCURACY';
          else if (acc > 15) status = 'MEDIUM_ACCURACY';

          const loc: GpsLocation = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(acc),
            altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
            heading: pos.coords.heading ? Math.round(pos.coords.heading) : null,
            speed: pos.coords.speed ? Number(pos.coords.speed.toFixed(1)) : null,
            timestamp: pos.timestamp || Date.now(),
            status,
          };
          this.lastKnownLocation = loc;
          resolve(loc);
        },
        (err) => {
          window.clearTimeout(timeoutId);
          console.warn('Geolocation failed or permission denied:', err.message);
          resolve(this.getFallbackLocation(airportIata, gate, 'SIMULATED'));
        },
        {
          enableHighAccuracy: true,
          timeout: 3000,
          maximumAge: 15000,
        }
      );
    });
  }

  public getFallbackLocation(airportIata = 'DOH', gate?: string, status: GpsLocation['status'] = 'SIMULATED'): GpsLocation {
    const airport = AIRPORT_COORDINATES[airportIata] || AIRPORT_COORDINATES['DOH'];
    let lat = airport.lat;
    let lng = airport.lng;

    if (gate && airport.gates[gate]) {
      lat = airport.gates[gate].lat;
      lng = airport.gates[gate].lng;
    } else {
      // Add slight realistic jitter on ramp
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;
    }

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      accuracy: status === 'UNAVAILABLE' ? 0 : 8,
      altitude: 12,
      heading: 240,
      speed: 0,
      timestamp: Date.now(),
      status,
    };
  }
}

export const gpsService = new GpsService();
