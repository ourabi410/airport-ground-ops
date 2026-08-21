<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TaskReminderMail;
use App\Services\DatabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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

        // Dynamically resolve and attach latest customer & flight location info
        $flights = DatabaseService::all('flights');
        $companies = DatabaseService::all('companies');

        $flightsMap = [];
        foreach ($flights as $f) {
            $flightsMap[$f['flightNbr']] = $f;
        }

        $companiesMap = [];
        foreach ($companies as $c) {
            $companiesMap[$c['name']] = $c;
            if (!empty($c['abbreviation'])) $companiesMap[$c['abbreviation']] = $c;
            if (!empty($c['iata'])) $companiesMap[$c['iata']] = $c;
        }

        foreach ($tasks as &$task) {
            $flt = $flightsMap[$task['flightNbr'] ?? ''] ?? null;
            if ($flt) {
                $compName = $flt['companyName'] ?? '';
                $comp = $companiesMap[$compName] ?? null;

                $task['customerName'] = $compName;
                $task['customerHub'] = $comp['hub'] ?? ($flt['companyHub'] ?? 'Main Hub');
                $task['standZone'] = $flt['subplaneAreaZone'] ?? 'Apron Stand';
                $task['gateNbr'] = $flt['gateNbr'] ?? '';
            }
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

        // Enrich with flight & customer details
        $flight = !empty($data['flightNbr']) ? DatabaseService::find('flights', $data['flightNbr']) : null;
        $company = null;
        if ($flight && !empty($flight['companyName'])) {
            $companies = DatabaseService::all('companies');
            foreach ($companies as $c) {
                if ($c['name'] === $flight['companyName'] || ($c['abbreviation'] ?? '') === $flight['companyName'] || ($c['iata'] ?? '') === $flight['companyName']) {
                    $company = $c;
                    break;
                }
            }
        }

        if ($flight) {
            $data['customerName'] = $company['name'] ?? ($flight['companyName'] ?? '');
            $data['customerHub'] = $company['hub'] ?? ($flight['companyHub'] ?? '');
            $data['standZone'] = $flight['subplaneAreaZone'] ?? '';
            $data['gateNbr'] = $flight['gateNbr'] ?? '';
        }

        $created = DatabaseService::insert('tasks', $data);

        // Update assigned user's task count
        $user = null;
        if (!empty($created['assignedUserId'])) {
            $user = DatabaseService::find('users', $created['assignedUserId']);
            if ($user) {
                DatabaseService::update('users', $user['id'], [
                    'assignedTasksCount' => ($user['assignedTasksCount'] ?? 0) + 1,
                ]);
            }
        }

        // Send email notification on task creation/dispatch
        $this->dispatchTaskEmail($created, $user, $flight, $company);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Supervisor'),
            'userRole' => 'Administrator',
            'module' => 'Tasks',
            'actionType' => 'CREATE',
            'entityId' => $created['id'],
            'details' => "Dispatched ground task: '{$created['taskTitle']}' (Target: {$created['targetTime']}) assigned to {$created['assignedUserName']} on flight {$created['flightNbr']}",
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

    public function sendReminder(Request $request, string $id): JsonResponse
    {
        $task = DatabaseService::find('tasks', $id);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $user = !empty($task['assignedUserId']) ? DatabaseService::find('users', $task['assignedUserId']) : null;
        $flight = !empty($task['flightNbr']) ? DatabaseService::find('flights', $task['flightNbr']) : null;
        $company = null;
        if ($flight && !empty($flight['companyName'])) {
            $companies = DatabaseService::all('companies');
            foreach ($companies as $c) {
                if ($c['name'] === $flight['companyName'] || ($c['abbreviation'] ?? '') === $flight['companyName'] || ($c['iata'] ?? '') === $flight['companyName']) {
                    $company = $c;
                    break;
                }
            }
        }

        $customEmail = $request->input('email');
        $recipientEmail = $customEmail ?: ($user['email'] ?? config('mail.from.address'));

        $sent = $this->dispatchTaskEmail($task, $user, $flight, $company, $recipientEmail);

        DatabaseService::insert('audit_logs', [
            'timestamp' => now()->toDateTimeString(),
            'userId' => $request->input('authorId', 'SYSTEM'),
            'userName' => $request->input('authorName', 'Supervisor'),
            'userRole' => 'Administrator',
            'module' => 'Tasks',
            'actionType' => 'UPDATE',
            'entityId' => $task['id'],
            'details' => "Dispatched Email Reminder for task '{$task['taskTitle']}' (Target: {$task['targetTime']}) to {$recipientEmail}",
            'severity' => 'info',
            'device' => 'AeroTurn Mailer',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Reminder email sent successfully to {$recipientEmail}",
            'task' => $task,
            'recipient' => $recipientEmail,
        ]);
    }

    public function checkDueReminders(Request $request): JsonResponse
    {
        $currentTime = $request->input('currentTime', now()->format('H:i'));
        $tasks = DatabaseService::all('tasks');
        $flights = DatabaseService::all('flights');
        $companies = DatabaseService::all('companies');
        $users = DatabaseService::all('users');

        $usersMap = [];
        foreach ($users as $u) { $usersMap[$u['id']] = $u; }
        $flightsMap = [];
        foreach ($flights as $f) { $flightsMap[$f['flightNbr']] = $f; }
        $companiesMap = [];
        foreach ($companies as $c) { $companiesMap[$c['name']] = $c; }

        $notified = [];

        foreach ($tasks as $task) {
            if (($task['status'] ?? '') === 'Completed') {
                continue;
            }

            $targetTime = $task['targetTime'] ?? '';
            // Match current target time or requested trigger
            if ($targetTime === $currentTime || $request->has('forceAll')) {
                $user = $usersMap[$task['assignedUserId'] ?? ''] ?? null;
                $flight = $flightsMap[$task['flightNbr'] ?? ''] ?? null;
                $compName = $flight['companyName'] ?? '';
                $company = $companiesMap[$compName] ?? null;

                $recipientEmail = $user['email'] ?? config('mail.from.address');
                $this->dispatchTaskEmail($task, $user, $flight, $company, $recipientEmail);

                $notified[] = [
                    'taskId' => $task['id'],
                    'taskTitle' => $task['taskTitle'],
                    'targetTime' => $targetTime,
                    'recipient' => $recipientEmail,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'checkedTime' => $currentTime,
            'notifiedCount' => count($notified),
            'tasks' => $notified,
        ]);
    }

    private function dispatchTaskEmail(array $task, ?array $user, ?array $flight, ?array $company, ?string $recipientEmail = null): bool
    {
        $email = $recipientEmail ?: ($user['email'] ?? config('mail.from.address', 'groundops@aeroturn.local'));
        if (empty($email)) {
            $email = 'groundops@aeroturn.local';
        }

        try {
            Mail::to($email)->send(new TaskReminderMail($task, $user, $flight, $company));
            Log::info("AeroTurn Task Reminder Email sent to [{$email}] for task [{$task['id']}] '{$task['taskTitle']}' (Due: {$task['targetTime']})");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send Task Reminder Email to [{$email}]: " . $e->getMessage());
            return false;
        }
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
