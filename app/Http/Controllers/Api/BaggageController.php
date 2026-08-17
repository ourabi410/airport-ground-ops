<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BaggageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $flightNbr = $request->query('flightNbr');
        $baggages = DatabaseService::all('baggages');

        if ($flightNbr) {
            $baggages = array_values(array_filter($baggages, fn($b) => ($b['flightNbr'] ?? '') === $flightNbr));
        }

        return response()->json($baggages);
    }

    public function show(string $id): JsonResponse
    {
        $baggage = DatabaseService::find('baggages', $id);
        if (!$baggage) {
            return response()->json(['error' => 'Baggage tag not found'], 404);
        }
        return response()->json($baggage);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['status'])) {
            $data['status'] = 'CHECKED_IN';
        }
        if (empty($data['holdLocation'])) {
            $data['holdLocation'] = 'Unassigned';
        }
        if (!isset($data['comments'])) {
            $data['comments'] = [];
        }

        $created = DatabaseService::insert('baggages', $data);

        // Update flight total expected bags count
        if (!empty($created['flightNbr'])) {
            $flight = DatabaseService::find('flights', $created['flightNbr']);
            if ($flight) {
                DatabaseService::update('flights', $flight['id'], [
                    'totalBagsExpected' => ($flight['totalBagsExpected'] ?? 0) + 1,
                ]);
            }
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Check-in Agent'),
            'userRole' => 'Sorting Agent',
            'module' => 'Baggage',
            'actionType' => 'CREATE',
            'entityId' => $created['tagNumber'] ?? $created['id'],
            'details' => "Registered new baggage tag: #{$created['tagNumber']} for {$created['passengerName']} ({$created['flightNbr']})",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function scanSorting(Request $request): JsonResponse
    {
        $tagNumber = $request->input('tagNumber');
        $zone = $request->input('zone', 'Carousel 02');
        $user = $request->input('userName', 'Karim Ben Ali');
        $userId = $request->input('userId', 'USR-002');
        $dollyId = $request->input('dollyId');

        $baggage = DatabaseService::find('baggages', $tagNumber);
        if (!$baggage) {
            return response()->json([
                'success' => false,
                'isAlert' => true,
                'message' => "Baggage tag #{$tagNumber} is NOT in the active manifest! Discrepancy logged.",
            ], 404);
        }

        $previousState = $baggage['status'];
        $now = now()->toDateTimeString();

        $updated = DatabaseService::update('baggages', $baggage['id'], [
            'status' => 'SORTED',
            'sortingZone' => $zone,
            'sortingUser' => $user,
            'sortingTimestamp' => $now,
            'dollyId' => $dollyId ?? $baggage['dollyId'] ?? null,
        ]);

        // If dolly specified, add tag to dolly
        if ($dollyId) {
            $dolly = DatabaseService::find('dollies', $dollyId);
            if ($dolly) {
                $bags = $dolly['bags'] ?? [];
                if (!in_array($tagNumber, $bags)) {
                    $bags[] = $tagNumber;
                    DatabaseService::update('dollies', $dolly['id'], [
                        'bags' => $bags,
                        'currentBagsCount' => count($bags),
                        'lastUpdated' => now()->format('Y-m-d H:i'),
                    ]);
                }
            }
        }

        // Update flight sorted count
        $flight = DatabaseService::find('flights', $baggage['flightNbr']);
        if ($flight && $previousState !== 'SORTED' && $previousState !== 'LOADED') {
            DatabaseService::update('flights', $flight['id'], [
                'bagsSortedCount' => ($flight['bagsSortedCount'] ?? 0) + 1,
            ]);
        }

        // Update agent bags scanned count
        $agent = DatabaseService::find('users', $userId);
        if ($agent) {
            DatabaseService::update('users', $agent['id'], [
                'bagsScannedToday' => ($agent['bagsScannedToday'] ?? 0) + 1,
            ]);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => $now,
            'userId' => $userId,
            'userName' => $user,
            'userRole' => 'Sorting Agent',
            'module' => 'Baggage',
            'actionType' => 'SCAN_STEP1',
            'entityId' => $tagNumber,
            'details' => "Scanned Step 1 (Sorting): Tag #{$tagNumber} at {$zone}" . ($dollyId ? " -> Dolly {$dollyId}" : ''),
            'previousState' => $previousState,
            'newState' => 'SORTED',
            'severity' => 'info',
            'device' => 'Zebra Handheld Scanner',
        ]);

        return response()->json([
            'success' => true,
            'baggage' => $updated,
            'message' => "Tag #{$tagNumber} SORTED successfully!",
        ]);
    }

    public function scanLoading(Request $request): JsonResponse
    {
        $tagNumber = $request->input('tagNumber');
        $zone = $request->input('zone', 'Stand 14');
        $user = $request->input('userName', 'Mohamed Dridi');
        $userId = $request->input('userId', 'USR-003');
        $holdLocation = $request->input('holdLocation', 'Hold 1 Fwd');

        $baggage = DatabaseService::find('baggages', $tagNumber);
        if (!$baggage) {
            return response()->json([
                'success' => false,
                'isAlert' => true,
                'message' => "Baggage tag #{$tagNumber} NOT FOUND in manifest! Rejected for loading.",
            ], 404);
        }

        if ($baggage['status'] !== 'SORTED') {
            return response()->json([
                'success' => false,
                'isAlert' => true,
                'message' => "Baggage #{$tagNumber} was NOT sorted in Step 1 (Current status: {$baggage['status']})! Discrepancy logged.",
            ], 422);
        }

        $now = now()->toDateTimeString();
        $updated = DatabaseService::update('baggages', $baggage['id'], [
            'status' => 'LOADED',
            'loadingZone' => $zone,
            'loadingUser' => $user,
            'loadingTimestamp' => $now,
            'holdLocation' => $holdLocation,
        ]);

        // Update flight loaded count
        $flight = DatabaseService::find('flights', $baggage['flightNbr']);
        if ($flight) {
            DatabaseService::update('flights', $flight['id'], [
                'bagsLoadedCount' => ($flight['bagsLoadedCount'] ?? 0) + 1,
            ]);
        }

        // Update agent bags scanned count
        $agent = DatabaseService::find('users', $userId);
        if ($agent) {
            DatabaseService::update('users', $agent['id'], [
                'bagsScannedToday' => ($agent['bagsScannedToday'] ?? 0) + 1,
            ]);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => $now,
            'userId' => $userId,
            'userName' => $user,
            'userRole' => 'Subplane Agent',
            'module' => 'Baggage',
            'actionType' => 'SCAN_STEP2',
            'entityId' => $tagNumber,
            'details' => "Scanned Step 2 (Loading): Tag #{$tagNumber} into {$holdLocation} at {$zone}",
            'previousState' => 'SORTED',
            'newState' => 'LOADED',
            'severity' => 'success',
            'device' => 'Zebra TC57x Scanner',
        ]);

        return response()->json([
            'success' => true,
            'baggage' => $updated,
            'message' => "Tag #{$tagNumber} LOADED successfully into {$holdLocation}!",
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('baggages', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Baggage not found'], 404);
        }
        return response()->json($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $baggage = DatabaseService::find('baggages', $id);
        $deleted = DatabaseService::delete('baggages', $id);
        if (!$deleted) {
            return response()->json(['error' => 'Baggage not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Baggage',
            'actionType' => 'DELETE',
            'entityId' => $id,
            'details' => "Removed baggage tag from manifest: " . ($baggage['tagNumber'] ?? $id),
            'severity' => 'warning',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json(['success' => true, 'message' => 'Baggage record deleted']);
    }
}
