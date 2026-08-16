<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GroundOpsStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SyncController extends Controller
{
    public function batchSync(Request $request): JsonResponse
    {
        $batch = $request->input('batch');
        $clientSyncTimestampUtc = $request->input('clientSyncTimestampUtc');

        if (!is_array($batch)) {
            return response()->json(['error' => 'Invalid batch format. Expected array.'], 400);
        }

        $serverReceivedTime = now()->toIso8601String();
        $processed = [];
        $duplicates = [];

        $existingEvents = collect(GroundOpsStore::getEvents())->keyBy('id')->all();
        $existingIncidents = collect(GroundOpsStore::getIncidents())->keyBy('id')->all();

        foreach ($batch as $item) {
            $idempotencyKey = $item['id'] ?? null;
            if (!$idempotencyKey) {
                continue;
            }

            $entityType = $item['entityType'] ?? '';

            if ($entityType === 'OPERATIONAL_EVENT' || $entityType === 'CORRECTION') {
                $eventData = $item['payload'] ?? [];
                
                if (isset($existingEvents[$idempotencyKey]) && $entityType !== 'CORRECTION') {
                    $duplicates[] = $idempotencyKey;
                } else {
                    $enrichedEvent = array_merge($eventData, [
                        'serverReceivedTime' => $serverReceivedTime,
                        'syncTime' => $serverReceivedTime,
                        'syncStatus' => 'SYNCED',
                    ]);

                    GroundOpsStore::saveEvent($idempotencyKey, $enrichedEvent);
                    $processed[] = $idempotencyKey;

                    // Audit trail entry
                    GroundOpsStore::addAuditLog([
                        'id' => 'srv_aud_' . round(microtime(true) * 1000) . '_' . Str::random(4),
                        'entityType' => 'EVENT',
                        'entityId' => $idempotencyKey,
                        'action' => $entityType === 'CORRECTION' ? 'CORRECTION' : 'SYNC',
                        'userId' => $eventData['userId'] ?? 'unknown',
                        'userName' => $eventData['userName'] ?? 'unknown',
                        'userRole' => $eventData['userRole'] ?? 'unknown',
                        'deviceId' => $eventData['deviceId'] ?? 'unknown',
                        'timestampUtc' => $serverReceivedTime,
                        'eventTimeUtc' => $eventData['eventTimeUtc'] ?? $serverReceivedTime,
                        'oldValue' => $eventData['originalEventData'] ?? null,
                        'newValue' => $eventData,
                        'reason' => $eventData['correctionReason'] ?? 'Batch sync from mobile client',
                        'clientSyncTimestampUtc' => $clientSyncTimestampUtc,
                    ]);
                }
            } elseif ($entityType === 'INCIDENT') {
                $incidentData = $item['payload'] ?? [];

                if (isset($existingIncidents[$idempotencyKey])) {
                    $duplicates[] = $idempotencyKey;
                } else {
                    $enrichedIncident = array_merge($incidentData, [
                        'syncStatus' => 'SYNCED',
                        'serverReceivedTime' => $serverReceivedTime,
                    ]);

                    GroundOpsStore::saveIncident($idempotencyKey, $enrichedIncident);
                    $processed[] = $idempotencyKey;
                }
            }
        }

        return response()->json([
            'success' => true,
            'serverReceivedTime' => $serverReceivedTime,
            'processedCount' => count($processed),
            'duplicateCount' => count($duplicates),
            'processedIds' => $processed,
            'duplicateIds' => $duplicates,
        ]);
    }
}
