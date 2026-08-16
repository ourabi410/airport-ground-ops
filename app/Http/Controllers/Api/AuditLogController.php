<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GroundOpsStore;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = GroundOpsStore::getAuditLogs();
        return response()->json(array_slice($logs, -100));
    }
}
