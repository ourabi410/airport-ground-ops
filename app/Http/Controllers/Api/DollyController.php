<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DollyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DatabaseService::all('dollies'));
    }

    public function show(string $id): JsonResponse
    {
        $dolly = DatabaseService::find('dollies', $id);
        if (!$dolly) {
            return response()->json(['error' => 'Dolly not found'], 404);
        }
        return response()->json($dolly);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['id'])) {
            $count = count(DatabaseService::all('dollies')) + 101;
            $data['id'] = 'DLY-' . $count;
        }
        if (!isset($data['currentBagsCount'])) {
            $data['currentBagsCount'] = 0;
        }
        if (!isset($data['bags'])) {
            $data['bags'] = [];
        }
        if (empty($data['status'])) {
            $data['status'] = 'Available';
        }
        $data['lastUpdated'] = now()->format('Y-m-d H:i');

        $created = DatabaseService::insert('dollies', $data);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Supervisor'),
            'userRole' => 'Administrator',
            'module' => 'Dolly',
            'actionType' => 'CREATE',
            'entityId' => $created['id'],
            'details' => "Added ramp equipment dolly/container: {$created['id']} ({$created['type']})",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->all();
        $data['lastUpdated'] = now()->format('Y-m-d H:i');

        $updated = DatabaseService::update('dollies', $id, $data);
        if (!$updated) {
            return response()->json(['error' => 'Dolly not found'], 404);
        }
        return response()->json($updated);
    }

    public function assignBags(Request $request, string $id): JsonResponse
    {
        $dolly = DatabaseService::find('dollies', $id);
        if (!$dolly) {
            return response()->json(['error' => 'Dolly not found'], 404);
        }

        $tagNumbers = $request->input('tagNumbers', []);
        $bags = array_unique(array_merge($dolly['bags'] ?? [], $tagNumbers));

        $updated = DatabaseService::update('dollies', $id, [
            'bags' => array_values($bags),
            'currentBagsCount' => count($bags),
            'lastUpdated' => now()->format('Y-m-d H:i'),
        ]);

        // Update baggage records to point to this dolly
        foreach ($tagNumbers as $tag) {
            $bag = DatabaseService::find('baggages', $tag);
            if ($bag) {
                DatabaseService::update('baggages', $bag['id'], ['dollyId' => $id]);
            }
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Sorting Agent'),
            'userRole' => 'Sorting Agent',
            'module' => 'Dolly',
            'actionType' => 'DOLLY_ASSIGN',
            'entityId' => $id,
            'details' => "Assigned " . count($tagNumbers) . " baggage items to Dolly {$id}",
            'severity' => 'info',
            'device' => 'Zebra Terminal',
        ]);

        return response()->json($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $dolly = DatabaseService::find('dollies', $id);
        $deleted = DatabaseService::delete('dollies', $id);
        if (!$deleted) {
            return response()->json(['error' => 'Dolly not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Dolly',
            'actionType' => 'DELETE',
            'entityId' => $id,
            'details' => "Decommissioned dolly / container: " . ($dolly['id'] ?? $id),
            'severity' => 'warning',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json(['success' => true, 'message' => 'Dolly deleted successfully']);
    }
}
