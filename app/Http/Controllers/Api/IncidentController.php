<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GroundOpsStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class IncidentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(GroundOpsStore::getIncidents());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $id = $data['id'] ?? ('inc_' . Str::random(8));
        $incident = array_merge($data, [
            'id' => $id,
            'serverReceivedTime' => now()->toIso8601String(),
            'syncStatus' => 'SYNCED',
        ]);

        GroundOpsStore::saveIncident($id, $incident);

        return response()->json([
            'success' => true,
            'incident' => $incident,
        ], 201);
    }
}
