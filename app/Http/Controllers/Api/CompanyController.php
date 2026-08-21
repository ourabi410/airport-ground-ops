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
        $oldCompany = DatabaseService::find('companies', $id);
        $updated = DatabaseService::update('companies', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        // Cascade updated company details/hub/name to all associated flights and tasks
        if ($oldCompany) {
            $oldName = $oldCompany['name'] ?? '';
            $newName = $updated['name'] ?? $oldName;
            $newHub = $updated['hub'] ?? ($oldCompany['hub'] ?? '');

            $flights = DatabaseService::all('flights');
            $modifiedFlights = false;
            foreach ($flights as &$flight) {
                if (($flight['companyName'] ?? '') === $oldName || ($flight['companyId'] ?? '') === $id) {
                    $flight['companyName'] = $newName;
                    $flight['companyHub'] = $newHub;
                    $modifiedFlights = true;
                }
            }
            if ($modifiedFlights) {
                DatabaseService::saveAll('flights', $flights);
            }

            // Also update tasks related to this company or its flights
            $tasks = DatabaseService::all('tasks');
            $modifiedTasks = false;
            foreach ($tasks as &$task) {
                if (($task['companyName'] ?? '') === $oldName || ($task['companyId'] ?? '') === $id) {
                    $task['companyName'] = $newName;
                    $task['companyHub'] = $newHub;
                    $modifiedTasks = true;
                }
            }
            if ($modifiedTasks) {
                DatabaseService::saveAll('tasks', $tasks);
            }
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Administrator'),
            'userRole' => 'Administrator',
            'module' => 'Company',
            'actionType' => 'UPDATE',
            'entityId' => $id,
            'details' => "Updated airline customer contract & location ({$updated['hub']}) for {$updated['name']}",
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
