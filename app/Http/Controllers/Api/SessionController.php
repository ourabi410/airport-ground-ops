<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DatabaseService::all('sessions'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $created = DatabaseService::insert('sessions', $data);
        return response()->json($created, 201);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('sessions', $id, [
            'status' => 'closed',
            'logoutTime' => now()->toDateTimeString(),
        ]);
        return response()->json($updated);
    }
}
