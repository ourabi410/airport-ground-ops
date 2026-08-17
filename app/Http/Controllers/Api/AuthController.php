<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private static function getPermissions(string $role): array
    {
        $permissions = [
            'Administrator' => [
                'canCreateFlight' => true,
                'canEditFlight' => true,
                'canLockFlight' => true,
                'canScanSorting' => true,
                'canScanLoading' => true,
                'canManageUsers' => true,
                'canManageCompanies' => true,
                'canManageDollies' => true,
                'canViewAuditLogs' => true,
                'canResolveDiscrepancy' => true,
            ],
            'Sorting Agent' => [
                'canCreateFlight' => false,
                'canEditFlight' => false,
                'canLockFlight' => false,
                'canScanSorting' => true,
                'canScanLoading' => false,
                'canManageUsers' => false,
                'canManageCompanies' => false,
                'canManageDollies' => true,
                'canViewAuditLogs' => false,
                'canResolveDiscrepancy' => false,
            ],
            'Subplane Agent' => [
                'canCreateFlight' => false,
                'canEditFlight' => false,
                'canLockFlight' => false,
                'canScanSorting' => true,
                'canScanLoading' => true,
                'canManageUsers' => false,
                'canManageCompanies' => false,
                'canManageDollies' => true,
                'canViewAuditLogs' => false,
                'canResolveDiscrepancy' => true,
            ],
            'Ramp/Loading Agent' => [
                'canCreateFlight' => false,
                'canEditFlight' => false,
                'canLockFlight' => false,
                'canScanSorting' => false,
                'canScanLoading' => true,
                'canManageUsers' => false,
                'canManageCompanies' => false,
                'canManageDollies' => true,
                'canViewAuditLogs' => false,
                'canResolveDiscrepancy' => true,
            ],
            'Auditor' => [
                'canCreateFlight' => false,
                'canEditFlight' => false,
                'canLockFlight' => false,
                'canScanSorting' => false,
                'canScanLoading' => false,
                'canManageUsers' => false,
                'canManageCompanies' => false,
                'canManageDollies' => false,
                'canViewAuditLogs' => true,
                'canResolveDiscrepancy' => false,
            ],
        ];

        return $permissions[$role] ?? $permissions['Ramp/Loading Agent'];
    }

    public function login(Request $request): JsonResponse
    {
        $identifier = $request->input('identifier') ?? $request->input('email') ?? $request->input('badgeId');
        $password = $request->input('password');

        $users = DatabaseService::all('users');
        $matchedUser = null;

        foreach ($users as $user) {
            if (
                strtolower($user['email'] ?? '') === strtolower($identifier) ||
                strtoupper($user['badgeId'] ?? '') === strtoupper($identifier) ||
                ($user['id'] ?? '') === $identifier
            ) {
                $matchedUser = $user;
                break;
            }
        }

        if (!$matchedUser) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or badge ID. User not found.',
            ], 401);
        }

        // Update user status and last login
        $updatedUser = DatabaseService::update('users', $matchedUser['id'], [
            'lastLogin' => now()->toDateTimeString(),
            'status' => 'on_shift',
        ]);

        // Create user session log
        $session = DatabaseService::insert('sessions', [
            'id' => 'SES-' . Str::random(6),
            'userId' => $matchedUser['id'],
            'userName' => $matchedUser['name'],
            'role' => $matchedUser['role'],
            'loginTime' => now()->toDateTimeString(),
            'ipAddress' => $request->ip() ?? '127.0.0.1',
            'device' => $request->header('User-Agent') ?? 'Handheld / Desktop Client',
            'actionsPerformed' => 1,
            'status' => 'active',
        ]);

        // Add audit log
        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $matchedUser['id'],
            'userName' => $matchedUser['name'],
            'userRole' => $matchedUser['role'],
            'module' => 'Security',
            'actionType' => 'AUTH_LOGIN',
            'entityId' => $matchedUser['badgeId'] ?? $matchedUser['id'],
            'details' => "Agent logged in successfully: {$matchedUser['name']} ({$matchedUser['role']})",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        $token = 'Bearer_' . base64_encode($matchedUser['id'] . ':' . time());

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $updatedUser,
            'permissions' => self::getPermissions($matchedUser['role']),
            'sessionId' => $session['id'],
        ]);
    }

    public function switchUser(Request $request): JsonResponse
    {
        $userId = $request->input('userId');
        $user = DatabaseService::find('users', $userId);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        DatabaseService::update('users', $user['id'], [
            'lastLogin' => now()->toDateTimeString(),
            'status' => 'on_shift',
        ]);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $user['id'],
            'userName' => $user['name'],
            'userRole' => $user['role'],
            'module' => 'Security',
            'actionType' => 'AUTH_LOGIN',
            'entityId' => $user['badgeId'] ?? $user['id'],
            'details' => "Switched active agent to: {$user['name']} ({$user['role']})",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json([
            'success' => true,
            'user' => $user,
            'permissions' => self::getPermissions($user['role']),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $users = DatabaseService::all('users');
        $user = $users[0] ?? null;

        if (!$user) {
            return response()->json(['error' => 'No user logged in'], 401);
        }

        return response()->json([
            'user' => $user,
            'permissions' => self::getPermissions($user['role']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $userId = $request->input('userId');
        if ($userId) {
            DatabaseService::update('users', $userId, ['status' => 'off_duty']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
