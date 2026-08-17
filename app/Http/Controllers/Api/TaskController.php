<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $flightNbr = $request->query('flightNbr');
        $userId = $request->query('userId');

        $tasks = DatabaseService::all('tasks');

        if ($flightNbr) {
            $tasks = array_values(array_filter($tasks, fn($t) => ($t['flightNbr'] ?? '') === $flightNbr));
        }

        if ($userId) {
            $tasks = array_values(array_filter($tasks, fn($t) => ($t['assignedUserId'] ?? '') === $userId));
        }

        return response()->json($tasks);
    }

    public function show(string $id): JsonResponse
    {
        $task = DatabaseService::find('tasks', $id);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }
        return response()->json($task);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        if (empty($data['status'])) {
            $data['status'] = 'Pending';
        }
        if (empty($data['priority'])) {
            $data['priority'] = 'Normal';
        }
        if (!isset($data['checklist'])) {
            $data['checklist'] = [];
        }

        $created = DatabaseService::insert('tasks', $data);

        // Update assigned user's task count
        if (!empty($created['assignedUserId'])) {
            $user = DatabaseService::find('users', $created['assignedUserId']);
            if ($user) {
                DatabaseService::update('users', $user['id'], [
                    'assignedTasksCount' => ($user['assignedTasksCount'] ?? 0) + 1,
                ]);
            }
        }

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Supervisor'),
            'userRole' => 'Administrator',
            'module' => 'Tasks',
            'actionType' => 'CREATE',
            'entityId' => $created['id'],
            'details' => "Dispatched ground task: '{$created['taskTitle']}' assigned to {$created['assignedUserName']} on flight {$created['flightNbr']}",
            'severity' => 'info',
            'device' => 'AeroTurn Terminal',
        ]);

        return response()->json($created, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $updated = DatabaseService::update('tasks', $id, $request->all());
        if (!$updated) {
            return response()->json(['error' => 'Task not found'], 404);
        }
        return response()->json($updated);
    }

    public function toggleChecklistItem(Request $request, string $id): JsonResponse
    {
        $task = DatabaseService::find('tasks', $id);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $checkId = $request->input('checkId');
        $checklist = $task['checklist'] ?? [];
        $allDone = true;

        foreach ($checklist as &$item) {
            if ($item['id'] === $checkId) {
                $item['done'] = !$item['done'];
            }
            if (!$item['done']) {
                $allDone = false;
            }
        }

        $updates = [
            'checklist' => $checklist,
            'status' => $allDone ? 'Completed' : 'In Progress',
        ];

        if ($allDone) {
            $updates['completedAt'] = now()->toDateTimeString();
        }

        $updated = DatabaseService::update('tasks', $id, $updates);

        return response()->json($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $deleted = DatabaseService::delete('tasks', $id);
        if (!$deleted) {
            return response()->json(['error' => 'Task not found'], 404);
        }
        return response()->json(['success' => true, 'message' => 'Task deleted']);
    }
}
