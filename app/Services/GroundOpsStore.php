<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class GroundOpsStore
{
    private static function getFlightsData(): array
    {
        $now = time();
        $offsetIso = fn(int $min) => gmdate('Y-m-d\TH:i:s\Z', $now + ($min * 60));

        return [
            [
                'id' => 'flt_qr123',
                'flightNumber' => 'QR123',
                'callsign' => 'QTR123',
                'airline' => 'Qatar Airways',
                'airlineCode' => 'QR',
                'originIata' => 'DOH',
                'originAirport' => 'Hamad International',
                'destinationIata' => 'LHR',
                'destinationAirport' => 'London Heathrow',
                'aircraftType' => 'A350-1000',
                'aircraftReg' => 'A7-ANE',
                'gate' => 'C12',
                'terminal' => 'Terminal 1',
                'stand' => 'Ramp 42',
                'status' => 'TURNAROUND',
                'scheduledArrival' => $offsetIso(-50),
                'actualArrival' => $offsetIso(-45),
                'scheduledDeparture' => $offsetIso(40),
                'estimatedDeparture' => $offsetIso(52),
                'targetTurnaroundMin' => 90,
                'actualTurnaroundMin' => 97,
                'delayMinutes' => 12,
                'totalPassengers' => 287,
                'boardedPassengers' => 142,
                'totalBags' => 312,
                'loadedBags' => 198,
                'transferBags' => 84,
                'priorityBags' => 45,
                'fuelPlannedKg' => 48500,
                'fuelActualKg' => 32000,
                'criticalPath' => 'Baggage Loading Aft Hold',
                'isCritical' => true,
            ],
            [
                'id' => 'flt_ek005',
                'flightNumber' => 'EK005',
                'callsign' => 'UAE005',
                'airline' => 'Emirates',
                'airlineCode' => 'EK',
                'originIata' => 'DXB',
                'originAirport' => 'Dubai International',
                'destinationIata' => 'JFK',
                'destinationAirport' => 'New York JFK',
                'aircraftType' => 'A380-800',
                'aircraftReg' => 'A6-EVM',
                'gate' => 'A04',
                'terminal' => 'Terminal 3',
                'stand' => 'Stand 12',
                'status' => 'BOARDING',
                'scheduledArrival' => $offsetIso(-75),
                'actualArrival' => $offsetIso(-70),
                'scheduledDeparture' => $offsetIso(15),
                'estimatedDeparture' => $offsetIso(15),
                'targetTurnaroundMin' => 90,
                'actualTurnaroundMin' => 85,
                'delayMinutes' => 0,
                'totalPassengers' => 482,
                'boardedPassengers' => 395,
                'totalBags' => 520,
                'loadedBags' => 490,
                'transferBags' => 190,
                'priorityBags' => 78,
                'fuelPlannedKg' => 120000,
                'fuelActualKg' => 120000,
                'criticalPath' => 'Upper Deck Final Boarding',
                'isCritical' => false,
            ],
            [
                'id' => 'flt_ba149',
                'flightNumber' => 'BA149',
                'callsign' => 'BAW149',
                'airline' => 'British Airways',
                'airlineCode' => 'BA',
                'originIata' => 'LHR',
                'originAirport' => 'London Heathrow',
                'destinationIata' => 'BKK',
                'destinationAirport' => 'Bangkok Suvarnabhumi',
                'aircraftType' => 'B777-300ER',
                'aircraftReg' => 'G-STBC',
                'gate' => 'B08',
                'terminal' => 'Terminal 2',
                'stand' => 'Ramp 18',
                'status' => 'DELAYED',
                'scheduledArrival' => $offsetIso(-30),
                'actualArrival' => $offsetIso(-10),
                'scheduledDeparture' => $offsetIso(30),
                'estimatedDeparture' => $offsetIso(65),
                'targetTurnaroundMin' => 60,
                'actualTurnaroundMin' => 75,
                'delayMinutes' => 35,
                'totalPassengers' => 310,
                'boardedPassengers' => 0,
                'totalBags' => 340,
                'loadedBags' => 65,
                'transferBags' => 110,
                'priorityBags' => 52,
                'fuelPlannedKg' => 62000,
                'fuelActualKg' => 15000,
                'criticalPath' => 'Hydraulic Line Inspection',
                'isCritical' => true,
            ],
            [
                'id' => 'flt_lh400',
                'flightNumber' => 'LH400',
                'callsign' => 'DLH400',
                'airline' => 'Lufthansa',
                'airlineCode' => 'LH',
                'originIata' => 'FRA',
                'originAirport' => 'Frankfurt',
                'destinationIata' => 'SIN',
                'destinationAirport' => 'Singapore Changi',
                'aircraftType' => 'B747-8i',
                'aircraftReg' => 'D-ABYA',
                'gate' => 'D02',
                'terminal' => 'Terminal 1',
                'stand' => 'Stand 05',
                'status' => 'FINAL_APPROACH',
                'scheduledArrival' => $offsetIso(10),
                'actualArrival' => null,
                'scheduledDeparture' => $offsetIso(100),
                'estimatedDeparture' => $offsetIso(100),
                'targetTurnaroundMin' => 90,
                'actualTurnaroundMin' => 0,
                'delayMinutes' => 0,
                'totalPassengers' => 364,
                'boardedPassengers' => 0,
                'totalBags' => 390,
                'loadedBags' => 0,
                'transferBags' => 140,
                'priorityBags' => 60,
                'fuelPlannedKg' => 95000,
                'fuelActualKg' => 0,
                'criticalPath' => 'Inbound Aircraft Marshalling',
                'isCritical' => false,
            ],
        ];
    }

    public static function getFlights(): array
    {
        return Cache::remember('aeroturn_flights', 3600, fn() => self::getFlightsData());
    }

    public static function findFlight(string $id): ?array
    {
        $flights = self::getFlights();
        foreach ($flights as $f) {
            if ($f['id'] === $id || strtolower($f['flightNumber']) === strtolower($id)) {
                return $f;
            }
        }
        return null;
    }

    public static function getEvents(?string $flightId = null): array
    {
        $events = Cache::get('aeroturn_events', []);
        if ($flightId) {
            return array_values(array_filter($events, fn($e) => ($e['flightId'] ?? '') === $flightId));
        }
        return array_values($events);
    }

    public static function saveEvent(string $key, array $eventData): void
    {
        $events = Cache::get('aeroturn_events', []);
        $events[$key] = $eventData;
        Cache::put('aeroturn_events', $events, 86400);
    }

    public static function getIncidents(): array
    {
        $incidents = Cache::get('aeroturn_incidents', []);
        return array_values($incidents);
    }

    public static function saveIncident(string $key, array $incidentData): void
    {
        $incidents = Cache::get('aeroturn_incidents', []);
        $incidents[$key] = $incidentData;
        Cache::put('aeroturn_incidents', $incidents, 86400);
    }

    public static function getAuditLogs(): array
    {
        return Cache::get('aeroturn_audit_logs', []);
    }

    public static function addAuditLog(array $log): void
    {
        $logs = Cache::get('aeroturn_audit_logs', []);
        $logs[] = $log;
        if (count($logs) > 200) {
            $logs = array_slice($logs, -200);
        }
        Cache::put('aeroturn_audit_logs', $logs, 86400);
    }
}
