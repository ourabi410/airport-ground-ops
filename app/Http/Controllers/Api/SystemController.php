<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SystemController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'app' => config('app.name', 'AeroTurn Ground Ops'),
            'time' => now()->toIso8601String(),
            'version' => '1.0.0',
        ]);
    }

    public function time(): JsonResponse
    {
        return response()->json([
            'serverTimeUtc' => now()->toIso8601String(),
            'timezone' => 'UTC',
            'epochMs' => (int) round(microtime(true) * 1000),
        ]);
    }
}
