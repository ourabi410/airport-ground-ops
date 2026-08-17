<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = DatabaseService::all('audit_logs');
        // Sort newest first
        usort($logs, fn($a, $b) => strcmp($b['timestamp'] ?? '', $a['timestamp'] ?? ''));
        return response()->json(array_slice($logs, 0, 250));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['timestamp'])) {
            $data['timestamp'] = now()->toDateTimeString();
        }
        $created = DatabaseService::insert('audit_logs', $data);
        return response()->json($created, 201);
    }
}
