<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GroundOpsStore;
use Illuminate\Http\JsonResponse;

class FlightController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(GroundOpsStore::getFlights());
    }

    public function show(string $id): JsonResponse
    {
        $flight = GroundOpsStore::findFlight($id);
        if (!$flight) {
            return response()->json(['error' => 'Flight not found'], 404);
        }
        return response()->json($flight);
    }
}
