<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FlightController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DatabaseService::all('flights'));
    }

    public function show(string $id): JsonResponse
    {
        $flight = DatabaseService::find('flights', $id);
        if (!$flight) {
            return response()->json(['error' => 'Flight not found'], 404);
        }
        return response()->json($flight);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['date'])) {
            $data['date'] = date('Y-m-d');
        }
        if (empty($data['status'])) {
            $data['status'] = 'Scheduled';
        }
        if (!isset($data['isLocked'])) {
            $data['isLocked'] = false;
        }
        if (!isset($data['bagsSortedCount'])) {
            $data['bagsSortedCount'] = 0;
        }
        if (!isset($data['bagsLoadedCount'])) {
            $data['bagsLoadedCount'] = 0;
        }
        if (!isset($data['comments'])) {
            $data['comments'] = [];
        }
        if (!isset($data['dollyIds'])) {
            $data['dollyIds'] = [];
        }

        $created = DatabaseService::insert('flights', $data);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Flight',
            'actionType' => 'CREATE',
            'entityId' => $created['flightNbr'] ?? $created['id'],
            'details' => "Created turnaround flight schedule: {$created['flightNbr']} ({$created['companyName']}) Gate: {$created['gateNbr']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('flights', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Flight not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Flight',
            'actionType' => 'UPDATE',
            'entityId' => $updated['flightNbr'] ?? $id,
            'details' => "Updated flight parameters & ground schedule for {$updated['flightNbr']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($updated);
    }

    public function lock(Request $request, string $id): JsonResponse
    {
        $flight = DatabaseService::find('flights', $id);
        if (!$flight) {
            return response()->json(['error' => 'Flight not found'], 404);
        }

        $isLocked = $request->input('isLocked', !$flight['isLocked']);
        $newStatus = $isLocked ? 'Locked' : 'Reconciled';

        $updated = DatabaseService::update('flights', $id, [
            'isLocked' => $isLocked,
            'status' => $newStatus,
        ]);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Supervisor'),
            'userRole' => $request->input('authorRole', 'Administrator'),
            'module' => 'Flight',
            'actionType' => $isLocked ? 'LOCK' : 'UNLOCK',
            'entityId' => $flight['flightNbr'] ?? $id,
            'details' => ($isLocked ? "LOCKED & Finalized flight: " : "UNLOCKED flight: ") . ($flight['flightNbr'] ?? $id),
            'severity' => $isLocked ? 'warning' : 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($updated);
    }

    public function addComment(Request $request, string $id): JsonResponse
    {
        $flight = DatabaseService::find('flights', $id);
        if (!$flight) {
            return response()->json(['error' => 'Flight not found'], 404);
        }

        $comment = [
            'id' => 'CMT-' . Str::random(6),
            'authorId' => $request->input('authorId', 'USR-001'),
            'authorName' => $request->input('authorName', 'Administrator'),
            'authorRole' => $request->input('authorRole', 'Administrator'),
            'timestamp' => now()->format('Y-m-d H:i'),
            'message' => $request->input('message', ''),
            'category' => $request->input('category', 'general'),
        ];

        $comments = $flight['comments'] ?? [];
        $comments[] = $comment;

        $updated = DatabaseService::update('flights', $id, ['comments' => $comments]);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $comment['authorId'],
            'userName' => $comment['authorName'],
            'userRole' => $comment['authorRole'],
            'module' => 'Flight',
            'actionType' => 'COMMENT_ADD',
            'entityId' => $flight['flightNbr'] ?? $id,
            'details' => "Added operational note on flight {$flight['flightNbr']}: {$comment['message']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($comment, 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $flight = DatabaseService::find('flights', $id);
        $deleted = DatabaseService::delete('flights', $id);
        if (!$deleted) {
            return response()->json(['error' => 'Flight not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Flight',
            'actionType' => 'DELETE',
            'entityId' => $id,
            'details' => "Deleted turnaround flight: " . ($flight['flightNbr'] ?? $id),
            'severity' => 'warning',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json(['success' => true, 'message' => 'Flight deleted successfully']);
    }
}
