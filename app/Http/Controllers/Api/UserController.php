<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DatabaseService::all('users'));
    }

    public function show(string $id): JsonResponse
    {
        $user = DatabaseService::find('users', $id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['avatarUrl'])) {
            $data['avatarUrl'] = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
        }
        if (!isset($data['bagsScannedToday'])) {
            $data['bagsScannedToday'] = 0;
        }
        if (!isset($data['flightsHandled'])) {
            $data['flightsHandled'] = 0;
        }
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $created = DatabaseService::insert('users', $data);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('createdById', 'SYSTEM'),
            'userName' => $request->input('createdByName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Users',
            'actionType' => 'CREATE',
            'entityId' => $created['id'],
            'details' => "Created new staff user: {$created['name']} ({$created['role']}) - Badge: {$created['badgeId']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('users', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'User not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('updatedById', 'SYSTEM'),
            'userName' => $request->input('updatedByName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Users',
            'actionType' => 'UPDATE',
            'entityId' => $id,
            'details' => "Updated user profile details for {$updated['name']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = DatabaseService::find('users', $id);
        $deleted = DatabaseService::delete('users', $id);
        if (!$deleted) {
            return response()->json(['error' => 'User not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('deletedById', 'SYSTEM'),
            'userName' => $request->input('deletedByName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Users',
            'actionType' => 'DELETE',
            'entityId' => $id,
            'details' => "Deleted staff user account: " . ($user['name'] ?? $id),
            'severity' => 'warning',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json(['success' => true, 'message' => 'User deleted successfully']);
    }
}
