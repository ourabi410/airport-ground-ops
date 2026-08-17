<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DatabaseService
{
    private static function getDataPath(string $table): string
    {
        $dir = storage_path('app/data');
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        return $dir . '/' . $table . '.json';
    }

    public static function all(string $table): array
    {
        $path = self::getDataPath($table);
        if (!File::exists($path)) {
            $default = self::getDefaultSeed($table);
            self::saveAll($table, $default);
            return $default;
        }

        $content = File::get($path);
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    public static function find(string $table, string $id): ?array
    {
        $items = self::all($table);
        foreach ($items as $item) {
            if (($item['id'] ?? '') === $id || ($item['flightNbr'] ?? '') === $id || ($item['tagNumber'] ?? '') === $id) {
                return $item;
            }
        }
        return null;
    }

    public static function insert(string $table, array $data): array
    {
        $items = self::all($table);
        if (empty($data['id'])) {
            $prefix = strtoupper(substr($table, 0, 3));
            $data['id'] = $prefix . '-' . Str::random(6);
        }
        if (!isset($data['createdAt'])) {
            $data['createdAt'] = now()->toIso8601String();
        }
        $data['updatedAt'] = now()->toIso8601String();

        $items[] = $data;
        self::saveAll($table, $items);
        return $data;
    }

    public static function update(string $table, string $id, array $updates): ?array
    {
        $items = self::all($table);
        $foundIndex = -1;

        foreach ($items as $idx => $item) {
            if (($item['id'] ?? '') === $id || ($item['flightNbr'] ?? '') === $id || ($item['tagNumber'] ?? '') === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === -1) {
            return null;
        }

        $items[$foundIndex] = array_merge($items[$foundIndex], $updates, [
            'updatedAt' => now()->toIso8601String(),
        ]);

        self::saveAll($table, $items);
        return $items[$foundIndex];
    }

    public static function delete(string $table, string $id): bool
    {
        $items = self::all($table);
        $initialCount = count($items);
        $targetItem = self::find($table, $id);

        $filtered = array_values(array_filter($items, function ($item) use ($id) {
            return ($item['id'] ?? '') !== $id && ($item['flightNbr'] ?? '') !== $id && ($item['tagNumber'] ?? '') !== $id;
        }));

        if (count($filtered) !== $initialCount) {
            self::saveAll($table, $filtered);

            // ==========================================
            // FOREIGN KEY CASCADE & REFERENTIAL CLEANUP
            // ==========================================
            if ($table === 'flights' && $targetItem) {
                $flightId = $targetItem['id'] ?? $id;
                $flightNbr = $targetItem['flightNbr'] ?? '';

                // 1. Cascade delete Baggages
                $bags = self::all('baggages');
                $filteredBags = array_values(array_filter($bags, function ($b) use ($flightId, $flightNbr) {
                    return ($b['flightId'] ?? '') !== $flightId && ($b['flightNbr'] ?? '') !== $flightNbr;
                }));
                self::saveAll('baggages', $filteredBags);

                // 2. Cascade delete Turnaround Milestones
                $milestones = self::all('milestones');
                $filteredMilestones = array_values(array_filter($milestones, function ($m) use ($flightId, $flightNbr) {
                    return ($m['flightId'] ?? '') !== $flightId && ($m['flightNbr'] ?? '') !== $flightNbr;
                }));
                self::saveAll('milestones', $filteredMilestones);

                // 3. Cascade delete Flight Tasks
                $tasks = self::all('tasks');
                $filteredTasks = array_values(array_filter($tasks, function ($t) use ($flightId, $flightNbr) {
                    return ($t['flightId'] ?? '') !== $flightId && ($t['flightNbr'] ?? '') !== $flightNbr;
                }));
                self::saveAll('tasks', $filteredTasks);

                // 4. Cascade delete Active Agent Sessions
                $sessions = self::all('sessions');
                $filteredSessions = array_values(array_filter($sessions, function ($s) use ($flightId, $flightNbr) {
                    return ($s['flightId'] ?? '') !== $flightId && ($s['flightNbr'] ?? '') !== $flightNbr;
                }));
                self::saveAll('sessions', $filteredSessions);

                // 5. Free up Dollies assigned to this flight
                if ($flightNbr) {
                    $dollies = self::all('dollies');
                    $updatedDollies = array_map(function ($d) use ($flightNbr) {
                        if (($d['assignedFlightNbr'] ?? '') === $flightNbr) {
                            $d['assignedFlightNbr'] = null;
                            $d['status'] = 'Available';
                            $d['currentBagsCount'] = 0;
                        }
                        return $d;
                    }, $dollies);
                    self::saveAll('dollies', $updatedDollies);
                }
            }

            if ($table === 'users' && $targetItem) {
                $userId = $targetItem['id'] ?? $id;

                // 1. Cascade delete Sessions for this user
                $sessions = self::all('sessions');
                $filteredSessions = array_values(array_filter($sessions, function ($s) use ($userId) {
                    return ($s['userId'] ?? '') !== $userId;
                }));
                self::saveAll('sessions', $filteredSessions);

                // 2. Unassign tasks from deleted user
                $tasks = self::all('tasks');
                $updatedTasks = array_map(function ($t) use ($userId) {
                    if (($t['assignedUserId'] ?? '') === $userId) {
                        $t['assignedUserId'] = null;
                        $t['assignedUserName'] = 'Unassigned';
                    }
                    return $t;
                }, $tasks);
                self::saveAll('tasks', $updatedTasks);
            }

            if ($table === 'dollies' && $targetItem) {
                $dollyId = $targetItem['id'] ?? $id;

                // 1. Unmap baggage on this dolly
                $bags = self::all('baggages');
                $updatedBags = array_map(function ($b) use ($dollyId) {
                    if (($b['dollyId'] ?? '') === $dollyId) {
                        $b['dollyId'] = null;
                    }
                    return $b;
                }, $bags);
                self::saveAll('baggages', $updatedBags);

                // 2. Remove dolly ID from flights dollyIds array
                $flights = self::all('flights');
                $updatedFlights = array_map(function ($f) use ($dollyId) {
                    if (isset($f['dollyIds']) && is_array($f['dollyIds'])) {
                        $f['dollyIds'] = array_values(array_filter($f['dollyIds'], fn ($did) => $did !== $dollyId));
                    }
                    return $f;
                }, $flights);
                self::saveAll('flights', $updatedFlights);
            }

            return true;
        }

        return false;
    }

    public static function saveAll(string $table, array $items): void
    {
        $path = self::getDataPath($table);
        File::put($path, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    // Default Seed Data
    private static function getDefaultSeed(string $table): array
    {
        switch ($table) {
            case 'users':
                return [
                    [
                        'id' => 'USR-001',
                        'name' => 'Slimane Soltane',
                        'email' => 's.soltane@soltane-aviation.com',
                        'password' => '$2y$12$eG1vM.aOaNn88Wf0yL7mDeoH8M8mZ4o4Qh0xJm.9x9F2u8yI3H5.S', // hashed or plain password
                        'badgeId' => 'SAS-A-1001',
                        'role' => 'Administrator',
                        'department' => 'Ground Operations Management',
                        'assignedZone' => 'Central Command & Terminal 1',
                        'avatarUrl' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        'status' => 'on_shift',
                        'lastLogin' => now()->toDateTimeString(),
                        'bagsScannedToday' => 142,
                        'flightsHandled' => 12,
                        'assignedTasksCount' => 4,
                    ],
                    [
                        'id' => 'USR-002',
                        'name' => 'Karim Ben Ali',
                        'email' => 'k.benali@soltane-aviation.com',
                        'password' => '$2y$12$eG1vM.aOaNn88Wf0yL7mDeoH8M8mZ4o4Qh0xJm.9x9F2u8yI3H5.S',
                        'badgeId' => 'SAS-S-2041',
                        'role' => 'Sorting Agent',
                        'department' => 'Baggage Sorting & Makeup Area',
                        'assignedZone' => 'Sorting Carousel 02 & East Makeup',
                        'avatarUrl' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                        'status' => 'on_shift',
                        'lastLogin' => now()->subHours(2)->toDateTimeString(),
                        'bagsScannedToday' => 384,
                        'flightsHandled' => 6,
                        'assignedFlightNbr' => 'TU-720',
                        'assignedTasksCount' => 2,
                    ],
                    [
                        'id' => 'USR-003',
                        'name' => 'Mohamed Dridi',
                        'email' => 'm.dridi@soltane-aviation.com',
                        'password' => '$2y$12$eG1vM.aOaNn88Wf0yL7mDeoH8M8mZ4o4Qh0xJm.9x9F2u8yI3H5.S',
                        'badgeId' => 'SAS-P-3088',
                        'role' => 'Subplane Agent',
                        'department' => 'Subplane & Ramp Loading Operations',
                        'assignedZone' => 'Stand 14 & Stand 16 Apron South',
                        'avatarUrl' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                        'status' => 'on_shift',
                        'lastLogin' => now()->subHours(1)->toDateTimeString(),
                        'bagsScannedToday' => 290,
                        'flightsHandled' => 4,
                        'assignedFlightNbr' => 'TU-720',
                        'assignedTasksCount' => 3,
                    ],
                    [
                        'id' => 'USR-004',
                        'name' => 'Yassine Khelifi',
                        'email' => 'y.khelifi@soltane-aviation.com',
                        'password' => '$2y$12$eG1vM.aOaNn88Wf0yL7mDeoH8M8mZ4o4Qh0xJm.9x9F2u8yI3H5.S',
                        'badgeId' => 'SAS-R-4112',
                        'role' => 'Ramp/Loading Agent',
                        'department' => 'Apron Turnaround & Ramp Marshalling',
                        'assignedZone' => 'Stand 14 - Apron South',
                        'avatarUrl' => 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
                        'status' => 'on_shift',
                        'lastLogin' => now()->subMinutes(45)->toDateTimeString(),
                        'bagsScannedToday' => 195,
                        'flightsHandled' => 3,
                        'assignedFlightNbr' => 'TU-720',
                        'assignedTasksCount' => 5,
                        'assignedMilestones' => ['CHOCKS_ON', 'HOLD_OPEN', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED', 'PUSH_BACK'],
                    ],
                    [
                        'id' => 'USR-005',
                        'name' => 'Amina Mansouri',
                        'email' => 'a.mansouri@soltane-aviation.com',
                        'password' => '$2y$12$eG1vM.aOaNn88Wf0yL7mDeoH8M8mZ4o4Qh0xJm.9x9F2u8yI3H5.S',
                        'badgeId' => 'SAS-Q-5002',
                        'role' => 'Auditor',
                        'department' => 'Quality, Safety & Compliance Audit',
                        'assignedZone' => 'Central IOC & Safety HQ',
                        'avatarUrl' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                        'status' => 'on_shift',
                        'lastLogin' => now()->subHours(3)->toDateTimeString(),
                        'bagsScannedToday' => 0,
                        'flightsHandled' => 15,
                        'assignedTasksCount' => 1,
                    ],
                ];

            case 'companies':
                return [
                    [
                        'id' => 'CMP-001',
                        'name' => 'Tunisair',
                        'abbreviation' => 'TAR',
                        'iata' => 'TU',
                        'icao' => 'TAR',
                        'logo' => 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=150&auto=format&fit=crop&q=80',
                        'hub' => 'TUN (Tunis Carthage)',
                        'contactEmail' => 'ops@tunisair.com.tn',
                        'contactPhone' => '+216 71 888 000',
                        'activeFlightsCount' => 8,
                        'slaComplianceRate' => 98.6,
                    ],
                    [
                        'id' => 'CMP-002',
                        'name' => 'Air France',
                        'abbreviation' => 'AFR',
                        'iata' => 'AF',
                        'icao' => 'AFR',
                        'logo' => 'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=150&auto=format&fit=crop&q=80',
                        'hub' => 'CDG (Paris Charles de Gaulle)',
                        'contactEmail' => 'ground.ops@airfrance.fr',
                        'contactPhone' => '+33 1 41 56 78 00',
                        'activeFlightsCount' => 5,
                        'slaComplianceRate' => 99.2,
                    ],
                    [
                        'id' => 'CMP-003',
                        'name' => 'Lufthansa',
                        'abbreviation' => 'DLH',
                        'iata' => 'LH',
                        'icao' => 'DLH',
                        'logo' => 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=150&auto=format&fit=crop&q=80',
                        'hub' => 'FRA (Frankfurt Main)',
                        'contactEmail' => 'fra.handling@lufthansa.de',
                        'contactPhone' => '+49 69 6960',
                        'activeFlightsCount' => 4,
                        'slaComplianceRate' => 97.9,
                    ],
                    [
                        'id' => 'CMP-004',
                        'name' => 'Emirates',
                        'abbreviation' => 'UAE',
                        'iata' => 'EK',
                        'icao' => 'UAE',
                        'logo' => 'https://images.unsplash.com/photo-1517429128955-68ff563e214e?w=150&auto=format&fit=crop&q=80',
                        'hub' => 'DXB (Dubai International)',
                        'contactEmail' => 'station.ops@emirates.com',
                        'contactPhone' => '+971 4 286 4066',
                        'activeFlightsCount' => 3,
                        'slaComplianceRate' => 99.8,
                    ],
                ];

            case 'flights':
                return [
                    [
                        'id' => 'FLT-001',
                        'date' => date('Y-m-d'),
                        'flightNbr' => 'TU-720',
                        'flightTask' => 'Full Ground Handling & Turnaround',
                        'paxNbrDep' => 164,
                        'paxNbrArr' => 152,
                        'gateNbr' => 'B04',
                        'flightType' => 'Commercial Pax',
                        'acType' => 'A320neo',
                        'checkInStartTime' => '07:30',
                        'sta' => '09:45',
                        'std' => '10:40',
                        'companyName' => 'Tunisair',
                        'reg' => 'TS-IMX',
                        'subplaneAreaZone' => 'Stand 14 - Apron South',
                        'sortingAreaZone' => 'Sorting Carousel 02',
                        'sortingAreaUser' => 'Karim Ben Ali',
                        'subplaneAreaUser' => 'Mohamed Dridi',
                        'assignedRampAgent' => 'Yassine Khelifi',
                        'assignedRampAgentBadge' => 'SAS-R-4112',
                        'createdBy' => 'Slimane Soltane',
                        'status' => 'Loading',
                        'isLocked' => false,
                        'totalBagsExpected' => 148,
                        'bagsSortedCount' => 148,
                        'bagsLoadedCount' => 112,
                        'comments' => [
                            [
                                'id' => 'CMT-101',
                                'authorId' => 'USR-002',
                                'authorName' => 'Karim Ben Ali',
                                'authorRole' => 'Sorting Agent',
                                'timestamp' => date('Y-m-d H:i', strtotime('-30 minutes')),
                                'message' => 'Sorting phase 100% completed. 2 Priority ULD dollies dispatched to Stand 14.',
                                'category' => 'general',
                            ],
                        ],
                        'dollyIds' => ['DLY-101', 'DLY-102', 'DLY-103'],
                    ],
                    [
                        'id' => 'FLT-002',
                        'date' => date('Y-m-d'),
                        'flightNbr' => 'AF-1482',
                        'flightTask' => 'Priority Quick Transfer',
                        'paxNbrDep' => 178,
                        'paxNbrArr' => 160,
                        'gateNbr' => 'A08',
                        'flightType' => 'Commercial Pax',
                        'acType' => 'A321neo',
                        'checkInStartTime' => '08:15',
                        'sta' => '10:30',
                        'std' => '11:25',
                        'companyName' => 'Air France',
                        'reg' => 'F-GKXZ',
                        'subplaneAreaZone' => 'Stand 08 - Terminal North',
                        'sortingAreaZone' => 'Sorting Carousel 01',
                        'sortingAreaUser' => 'Karim Ben Ali',
                        'subplaneAreaUser' => 'Mohamed Dridi',
                        'assignedRampAgent' => 'Yassine Khelifi',
                        'assignedRampAgentBadge' => 'SAS-R-4112',
                        'createdBy' => 'Slimane Soltane',
                        'status' => 'Sorting',
                        'isLocked' => false,
                        'totalBagsExpected' => 162,
                        'bagsSortedCount' => 94,
                        'bagsLoadedCount' => 0,
                        'comments' => [],
                        'dollyIds' => ['DLY-104', 'DLY-105'],
                    ],
                    [
                        'id' => 'FLT-003',
                        'date' => date('Y-m-d'),
                        'flightNbr' => 'LH-1322',
                        'flightTask' => 'Standard Ground Turnaround',
                        'paxNbrDep' => 195,
                        'paxNbrArr' => 180,
                        'gateNbr' => 'C02',
                        'flightType' => 'Commercial Pax',
                        'acType' => 'B737-800',
                        'checkInStartTime' => '09:00',
                        'sta' => '11:15',
                        'std' => '12:10',
                        'companyName' => 'Lufthansa',
                        'reg' => 'D-AIDG',
                        'subplaneAreaZone' => 'Stand 21 - Remote East',
                        'sortingAreaZone' => 'Sorting Carousel 03',
                        'sortingAreaUser' => 'Karim Ben Ali',
                        'subplaneAreaUser' => 'Mohamed Dridi',
                        'assignedRampAgent' => 'Yassine Khelifi',
                        'assignedRampAgentBadge' => 'SAS-R-4112',
                        'createdBy' => 'Slimane Soltane',
                        'status' => 'Scheduled',
                        'isLocked' => false,
                        'totalBagsExpected' => 175,
                        'bagsSortedCount' => 0,
                        'bagsLoadedCount' => 0,
                        'comments' => [],
                        'dollyIds' => ['DLY-106'],
                    ],
                ];

            case 'baggages':
                return [
                    [
                        'id' => 'BAG-001',
                        'tagNumber' => '0057128491',
                        'flightNbr' => 'TU-720',
                        'passengerName' => 'Zied Mansour',
                        'seatNumber' => '12A',
                        'destination' => 'ORY (Paris Orly)',
                        'classType' => 'Business',
                        'weightKg' => 22.5,
                        'status' => 'LOADED',
                        'sortingZone' => 'Carousel 02',
                        'sortingUser' => 'Karim Ben Ali',
                        'sortingTimestamp' => date('Y-m-d H:i:s', strtotime('-40 minutes')),
                        'loadingZone' => 'Stand 14',
                        'loadingUser' => 'Mohamed Dridi',
                        'loadingTimestamp' => date('Y-m-d H:i:s', strtotime('-15 minutes')),
                        'dollyId' => 'DLY-101',
                        'holdLocation' => 'Hold 1 Fwd',
                        'isRush' => false,
                        'isHeavy' => false,
                        'isFragile' => true,
                        'comments' => [],
                    ],
                    [
                        'id' => 'BAG-002',
                        'tagNumber' => '0057128492',
                        'flightNbr' => 'TU-720',
                        'passengerName' => 'Leila Trabelsi',
                        'seatNumber' => '14C',
                        'destination' => 'ORY (Paris Orly)',
                        'classType' => 'Economy',
                        'weightKg' => 28.0,
                        'status' => 'SORTED',
                        'sortingZone' => 'Carousel 02',
                        'sortingUser' => 'Karim Ben Ali',
                        'sortingTimestamp' => date('Y-m-d H:i:s', strtotime('-35 minutes')),
                        'dollyId' => 'DLY-102',
                        'holdLocation' => 'Hold 2 Aft',
                        'isRush' => false,
                        'isHeavy' => true,
                        'isFragile' => false,
                        'comments' => [],
                    ],
                    [
                        'id' => 'BAG-003',
                        'tagNumber' => '0057128493',
                        'flightNbr' => 'TU-720',
                        'passengerName' => 'Nader Ghomrasni',
                        'seatNumber' => '21D',
                        'destination' => 'ORY (Paris Orly)',
                        'classType' => 'Economy',
                        'weightKg' => 18.5,
                        'status' => 'CHECKED_IN',
                        'sortingZone' => 'Carousel 02',
                        'holdLocation' => 'Unassigned',
                        'isRush' => false,
                        'isHeavy' => false,
                        'isFragile' => false,
                        'comments' => [],
                    ],
                ];

            case 'dollies':
                return [
                    [
                        'id' => 'DLY-101',
                        'type' => 'Container AKE',
                        'maxCapacity' => 45,
                        'currentBagsCount' => 40,
                        'assignedFlightNbr' => 'TU-720',
                        'zone' => 'Stand 14 - Apron South',
                        'status' => 'At Aircraft Hold',
                        'lastUpdated' => date('Y-m-d H:i'),
                        'tareWeightKg' => 85,
                        'bags' => ['0057128491'],
                    ],
                    [
                        'id' => 'DLY-102',
                        'type' => 'Open Dolly',
                        'maxCapacity' => 50,
                        'currentBagsCount' => 48,
                        'assignedFlightNbr' => 'TU-720',
                        'zone' => 'Stand 14 - Apron South',
                        'status' => 'Loading',
                        'lastUpdated' => date('Y-m-d H:i'),
                        'tareWeightKg' => 120,
                        'bags' => ['0057128492'],
                    ],
                    [
                        'id' => 'DLY-103',
                        'type' => 'Bulk Cart',
                        'maxCapacity' => 35,
                        'currentBagsCount' => 24,
                        'assignedFlightNbr' => 'TU-720',
                        'zone' => 'Ramp Transfer Bay 03',
                        'status' => 'In Transit',
                        'lastUpdated' => date('Y-m-d H:i'),
                        'tareWeightKg' => 95,
                        'bags' => [],
                    ],
                    [
                        'id' => 'DLY-104',
                        'type' => 'Container AKE',
                        'maxCapacity' => 45,
                        'currentBagsCount' => 0,
                        'assignedFlightNbr' => 'AF-1482',
                        'zone' => 'Sorting Carousel 01',
                        'status' => 'Available',
                        'lastUpdated' => date('Y-m-d H:i'),
                        'tareWeightKg' => 85,
                        'bags' => [],
                    ],
                ];

            case 'milestones':
                return [
                    [
                        'id' => 'MS-001',
                        'flightNbr' => 'TU-720',
                        'code' => 'CHOCKS_ON',
                        'title' => 'Aircraft Arrival & Chocks On',
                        'category' => 'Arrival',
                        'targetOffsetMinutes' => -55,
                        'scheduledTime' => '09:45',
                        'actualTime' => '09:44:12',
                        'timestampExact' => date('Y-m-d\TH:i:s.000\Z', strtotime('-55 minutes')),
                        'status' => 'COMPLETED',
                        'completedByUserId' => 'USR-004',
                        'completedByUserName' => 'Yassine Khelifi',
                        'completedByUserRole' => 'Ramp/Loading Agent',
                        'gpsLatitude' => 36.8512,
                        'gpsLongitude' => 10.2274,
                        'gpsAccuracyMeters' => 2.4,
                        'rampStand' => 'Stand 14 - Apron South',
                        'notes' => 'Chocks positioned within 45 seconds of touchdown.',
                    ],
                    [
                        'id' => 'MS-002',
                        'flightNbr' => 'TU-720',
                        'code' => 'HOLD_OPEN',
                        'title' => 'Cargo Holds Open (Fwd & Aft)',
                        'category' => 'Baggage',
                        'targetOffsetMinutes' => -50,
                        'scheduledTime' => '09:50',
                        'actualTime' => '09:48:30',
                        'timestampExact' => date('Y-m-d\TH:i:s.000\Z', strtotime('-48 minutes')),
                        'status' => 'COMPLETED',
                        'completedByUserId' => 'USR-004',
                        'completedByUserName' => 'Yassine Khelifi',
                        'completedByUserRole' => 'Ramp/Loading Agent',
                        'gpsLatitude' => 36.8514,
                        'gpsLongitude' => 10.2275,
                        'gpsAccuracyMeters' => 1.8,
                        'rampStand' => 'Stand 14 - Apron South',
                        'notes' => 'Hold doors opened, belt loaders aligned.',
                    ],
                    [
                        'id' => 'MS-003',
                        'flightNbr' => 'TU-720',
                        'code' => 'BAG_LOAD_START',
                        'title' => 'Outbound Baggage Loading Commenced',
                        'category' => 'Baggage',
                        'targetOffsetMinutes' => -35,
                        'scheduledTime' => '10:05',
                        'actualTime' => '10:03:15',
                        'timestampExact' => date('Y-m-d\TH:i:s.000\Z', strtotime('-33 minutes')),
                        'status' => 'COMPLETED',
                        'completedByUserId' => 'USR-004',
                        'completedByUserName' => 'Yassine Khelifi',
                        'completedByUserRole' => 'Ramp/Loading Agent',
                        'gpsLatitude' => 36.8513,
                        'gpsLongitude' => 10.2276,
                        'gpsAccuracyMeters' => 2.1,
                        'rampStand' => 'Stand 14 - Apron South',
                        'notes' => 'Dolly DLY-101 and DLY-102 loaded into Hold 1 & Hold 2.',
                    ],
                    [
                        'id' => 'MS-004',
                        'flightNbr' => 'TU-720',
                        'code' => 'BAG_LOAD_END',
                        'title' => 'Baggage Loading Finalized',
                        'category' => 'Baggage',
                        'targetOffsetMinutes' => -12,
                        'scheduledTime' => '10:28',
                        'status' => 'IN_PROGRESS',
                        'rampStand' => 'Stand 14 - Apron South',
                    ],
                    [
                        'id' => 'MS-005',
                        'flightNbr' => 'TU-720',
                        'code' => 'HOLD_CLOSED',
                        'title' => 'Cargo Hold Doors Closed & Latched',
                        'category' => 'Departure',
                        'targetOffsetMinutes' => -8,
                        'scheduledTime' => '10:32',
                        'status' => 'PENDING',
                        'rampStand' => 'Stand 14 - Apron South',
                    ],
                ];

            case 'tasks':
                return [
                    [
                        'id' => 'TSK-001',
                        'flightNbr' => 'TU-720',
                        'taskTitle' => 'Ramp Marshalling & Ground Power Connection',
                        'category' => 'Pre-flight',
                        'assignedRole' => 'Ramp/Loading Agent',
                        'assignedUserId' => 'USR-004',
                        'assignedUserName' => 'Yassine Khelifi',
                        'status' => 'Completed',
                        'priority' => 'Critical',
                        'targetTime' => '09:48',
                        'completedAt' => date('Y-m-d H:i:s', strtotime('-50 minutes')),
                        'checklist' => [
                            ['id' => 'chk-1', 'text' => 'FOD check completed on stand 14', 'done' => true],
                            ['id' => 'chk-2', 'text' => 'GPU 400Hz cable coupled and energized', 'done' => true],
                            ['id' => 'chk-3', 'text' => 'Safety cones placed at wingtips and engines', 'done' => true],
                        ],
                        'notes' => 'All pre-flight safety clearances confirmed.',
                    ],
                    [
                        'id' => 'TSK-002',
                        'flightNbr' => 'TU-720',
                        'taskTitle' => 'Outbound Baggage Reconciliation & Sorter Check',
                        'category' => 'Sorting',
                        'assignedRole' => 'Sorting Agent',
                        'assignedUserId' => 'USR-002',
                        'assignedUserName' => 'Karim Ben Ali',
                        'status' => 'Completed',
                        'priority' => 'High',
                        'targetTime' => '10:15',
                        'completedAt' => date('Y-m-d H:i:s', strtotime('-25 minutes')),
                        'checklist' => [
                            ['id' => 'chk-4', 'text' => '148 expected bags accounted for', 'done' => true],
                            ['id' => 'chk-5', 'text' => 'BTM/BSM telex messages reconciled', 'done' => true],
                            ['id' => 'chk-6', 'text' => 'Priority baggage grouped on Dolly DLY-101', 'done' => true],
                        ],
                    ],
                    [
                        'id' => 'TSK-003',
                        'flightNbr' => 'TU-720',
                        'taskTitle' => 'Final Loadsheet & Hold Verification',
                        'category' => 'Loading',
                        'assignedRole' => 'Ramp/Loading Agent',
                        'assignedUserId' => 'USR-004',
                        'assignedUserName' => 'Yassine Khelifi',
                        'status' => 'In Progress',
                        'priority' => 'Critical',
                        'targetTime' => '10:30',
                        'checklist' => [
                            ['id' => 'chk-7', 'text' => 'Confirm Hold 1 Fwd net secured', 'done' => true],
                            ['id' => 'chk-8', 'text' => 'Confirm Hold 2 Aft net secured', 'done' => false],
                            ['id' => 'chk-9', 'text' => 'NOTOC dangerous goods signed off by Captain', 'done' => false],
                        ],
                    ],
                ];

            case 'audit_logs':
                return [
                    [
                        'id' => 'AUD-001',
                        'timestamp' => date('Y-m-d H:i:s', strtotime('-15 minutes')),
                        'userId' => 'USR-004',
                        'userName' => 'Yassine Khelifi',
                        'userRole' => 'Ramp/Loading Agent',
                        'module' => 'Baggage',
                        'actionType' => 'SCAN_STEP2',
                        'entityId' => '0057128491',
                        'details' => 'Scanned tag #0057128491 for loading onto TU-720 Hold 1 Fwd',
                        'previousState' => 'SORTED',
                        'newState' => 'LOADED',
                        'severity' => 'success',
                        'device' => 'Zebra TC57x Scanner',
                    ],
                    [
                        'id' => 'AUD-002',
                        'timestamp' => date('Y-m-d H:i:s', strtotime('-40 minutes')),
                        'userId' => 'USR-002',
                        'userName' => 'Karim Ben Ali',
                        'userRole' => 'Sorting Agent',
                        'module' => 'Baggage',
                        'actionType' => 'SCAN_STEP1',
                        'entityId' => '0057128491',
                        'details' => 'Scanned tag #0057128491 at Sorting Carousel 02',
                        'previousState' => 'CHECKED_IN',
                        'newState' => 'SORTED',
                        'severity' => 'info',
                        'device' => 'Zebra MC3300 Touch Computer',
                    ],
                ];

            case 'sessions':
                return [
                    [
                        'id' => 'SES-001',
                        'userId' => 'USR-001',
                        'userName' => 'Slimane Soltane',
                        'role' => 'Administrator',
                        'loginTime' => date('Y-m-d H:i:s', strtotime('-3 hours')),
                        'ipAddress' => '127.0.0.1',
                        'device' => 'Desktop Chrome IOC Terminal #01',
                        'actionsPerformed' => 38,
                        'status' => 'active',
                    ],
                ];

            default:
                return [];
        }
    }
}
