<?php

use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FlightController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// System & Health
Route::get('/health', [SystemController::class, 'health']);
Route::get('/time', [SystemController::class, 'time']);

// Flights
Route::get('/flights', [FlightController::class, 'index']);
Route::get('/flights/{id}', [FlightController::class, 'show']);

// Operations Events
Route::get('/events', [EventController::class, 'index']);

// Idempotent Batch Sync
Route::post('/sync/batch', [SyncController::class, 'batchSync']);

// Incidents
Route::get('/incidents', [IncidentController::class, 'index']);
Route::post('/incidents', [IncidentController::class, 'store']);

// Audit Logs
Route::get('/audit-logs', [AuditLogController::class, 'index']);

// Gemini AI Turnaround Advisory
Route::post('/ai/turnaround-assistant', [AiAssistantController::class, 'turnaroundAssistant']);

// Sanctum Auth User
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
