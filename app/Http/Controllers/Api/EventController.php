<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GroundOpsStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $flightId = $request->query('flightId');
        return response()->json(GroundOpsStore::getEvents($flightId));
    }
}
