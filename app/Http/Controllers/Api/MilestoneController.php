<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $flightNbr = $request->query('flightNbr');
        $milestones = DatabaseService::all('milestones');

        if ($flightNbr) {
            $milestones = array_values(array_filter($milestones, fn($m) => ($m['flightNbr'] ?? '') === $flightNbr));
        }

        return response()->json($milestones);
    }

    public function show(string $id): JsonResponse
    {
        $milestone = DatabaseService::find('milestones', $id);
        if (!$milestone) {
            return response()->json(['error' => 'Milestone not found'], 404);
        }
        return response()->json($milestone);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['status'])) {
            $data['status'] = 'PENDING';
        }
        $created = DatabaseService::insert('milestones', $data);
        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('milestones', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Milestone not found'], 404);
        }
        return response()->json($updated);
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $milestone = DatabaseService::find('milestones', $id);
        if (!$milestone) {
            return response()->json(['error' => 'Milestone not found'], 404);
        }

        $now = now();
        $updates = [
            'status' => 'COMPLETED',
            'actualTime' => $now->format('H:i:s'),
            'timestampExact' => $now->toIso8601String(),
            'completedByUserId' => $request->input('userId', 'USR-004'),
            'completedByUserName' => $request->input('userName', 'Ramp Agent'),
            'completedByUserRole' => $request->input('userRole', 'Ramp/Loading Agent'),
            'gpsLatitude' => $request->input('gpsLatitude', 36.8512),
            'gpsLongitude' => $request->input('gpsLongitude', 10.2274),
            'gpsAccuracyMeters' => $request->input('gpsAccuracy', 2.0),
            'notes' => $request->input('notes', $milestone['notes'] ?? null),
        ];

        $updated = DatabaseService::update('milestones', $id, $updates);

        DatabaseService::insert('audit_logs', [
            'timestamp' => $now->toDateTimeString(),
            'userId' => $updates['completedByUserId'],
            'userName' => $updates['completedByUserName'],
            'userRole' => $updates['completedByUserRole'],
            'module' => 'Flight',
            'actionType' => 'UPDATE',
            'entityId' => $milestone['flightNbr'],
            'details' => "Turnaround milestone completed: {$milestone['title']} ({$milestone['code']}) on {$milestone['flightNbr']} with GPS verification",
            'severity' => 'success',
            'device' => 'Zebra Mobile Field App',
        ]);

        return response()->json($updated);
    }

    public function destroy(string $id): JsonResponse
    {
        DatabaseService::delete('milestones', $id);
        return response()->json(['success' => true]);
    }
}
