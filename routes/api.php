<?php

use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BaggageController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DollyController;
use App\Http\Controllers\Api\FlightController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// System & Health
Route::get('/health', [SystemController::class, 'health']);
Route::get('/time', [SystemController::class, 'time']);

// Authentication & Permissions
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/switch-user', [AuthController::class, 'switchUser']);
    Route::get('/me', [AuthController::class, 'me']);
});

// Users CRUD
Route::apiResource('users', UserController::class);

// Companies CRUD
Route::apiResource('companies', CompanyController::class);

// Flights CRUD, Locking & Comments
Route::apiResource('flights', FlightController::class);
Route::post('/flights/{id}/lock', [FlightController::class, 'lock']);
Route::post('/flights/{id}/comments', [FlightController::class, 'addComment']);

// Baggage Tracking & Scanning Workflows
Route::apiResource('baggages', BaggageController::class);
Route::post('/baggages/scan/sorting', [BaggageController::class, 'scanSorting']);
Route::post('/baggages/scan/loading', [BaggageController::class, 'scanLoading']);

// Dollies & ULD Containers CRUD
Route::apiResource('dollies', DollyController::class);
Route::post('/dollies/{id}/assign-bags', [DollyController::class, 'assignBags']);

// Flight Ground Tasks & Checklists
Route::apiResource('tasks', TaskController::class);
Route::post('/tasks/{id}/toggle-item', [TaskController::class, 'toggleChecklistItem']);

// Turnaround Milestones & GPS Verification
Route::apiResource('milestones', MilestoneController::class);
Route::post('/milestones/{id}/complete', [MilestoneController::class, 'complete']);

// Audit Logs
Route::get('/audit-logs', [AuditLogController::class, 'index']);
Route::post('/audit-logs', [AuditLogController::class, 'store']);

// Active Device & User Sessions
Route::get('/sessions', [SessionController::class, 'index']);
Route::post('/sessions', [SessionController::class, 'store']);
Route::post('/sessions/{id}/close', [SessionController::class, 'close']);

// Gemini AI Turnaround Advisory
Route::post('/ai/turnaround-assistant', [AiAssistantController::class, 'turnaroundAssistant']);
