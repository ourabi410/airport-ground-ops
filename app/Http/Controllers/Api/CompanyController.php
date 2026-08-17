<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DatabaseService::all('companies'));
    }

    public function show(string $id): JsonResponse
    {
        $company = DatabaseService::find('companies', $id);
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }
        return response()->json($company);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['logo'])) {
            $data['logo'] = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=150&auto=format&fit=crop&q=80';
        }
        if (!isset($data['activeFlightsCount'])) {
            $data['activeFlightsCount'] = 0;
        }
        if (!isset($data['slaComplianceRate'])) {
            $data['slaComplianceRate'] = 99.0;
        }

        $created = DatabaseService::insert('companies', $data);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Company',
            'actionType' => 'CREATE',
            'entityId' => $created['id'],
            'details' => "Registered new airline company: {$created['name']} ({$created['iata']}/{$created['icao']})",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('companies', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Company',
            'actionType' => 'UPDATE',
            'entityId' => $id,
            'details' => "Updated airline contract details for {$updated['name']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $company = DatabaseService::find('companies', $id);
        $deleted = DatabaseService::delete('companies', $id);
        if (!$deleted) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Company',
            'actionType' => 'DELETE',
            'entityId' => $id,
            'details' => "Removed airline partner: " . ($company['name'] ?? $id),
            'severity' => 'warning',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json(['success' => true, 'message' => 'Company deleted successfully']);
    }
}
