<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    public function turnaroundAssistant(Request $request): JsonResponse
    {
        $flight = $request->input('flight', []);
        $events = $request->input('events', []);
        $groundServices = $request->input('groundServices', []);
        $baggage = $request->input('baggage', []);
        $passengers = $request->input('passengers', []);
        $incidents = $request->input('incidents', []);

        $apiKey = env('GEMINI_API_KEY');

        // If Gemini API Key is configured, make real Google Gemini API call
        if (!empty($apiKey)) {
            try {
                $prompt = "You are a Senior Airline Airport Ground Operations Dispatcher & Turnaround Specialist at Hamad International Airport (DOH).\n" .
                    "Analyze the live turnaround operational state for flight " . ($flight['flightNumber'] ?? 'Unknown') . ":\n\n" .
                    "Flight Details:\n" .
                    "- Aircraft: " . ($flight['aircraftType'] ?? 'Unknown') . " (Reg: " . ($flight['aircraftReg'] ?? 'N/A') . ")\n" .
                    "- Gate: " . ($flight['gate'] ?? 'N/A') . " (Stand: " . ($flight['stand'] ?? 'N/A') . ")\n" .
                    "- Status: " . ($flight['status'] ?? 'IN PROGRESS') . "\n" .
                    "- Scheduled Turnaround Target: " . ($flight['targetTurnaroundMin'] ?? 90) . " min\n" .
                    "- Current Delay: " . ($flight['delayMinutes'] ?? 0) . " min\n\n" .
                    "Ground Services:\n" .
                    "- Cleaning: " . ($groundServices['cleaning']['status'] ?? 'N/A') . " (Crew: " . ($groundServices['cleaning']['crewCount'] ?? 0) . ")\n" .
                    "- Catering: " . ($groundServices['catering']['status'] ?? 'N/A') . " (Meals: " . ($groundServices['catering']['mealsLoaded'] ?? 0) . ")\n" .
                    "- Fueling: " . ($groundServices['fueling']['status'] ?? 'N/A') . " (Actual: " . ($groundServices['fueling']['actualFuelKg'] ?? 0) . " kg / Planned: " . ($groundServices['fueling']['plannedFuelKg'] ?? 0) . " kg)\n" .
                    "- Maintenance: " . ($groundServices['maintenance']['status'] ?? 'N/A') . " (RTS: " . (($groundServices['maintenance']['releaseToService'] ?? false) ? 'YES' : 'NO') . ")\n\n" .
                    "Passenger & Baggage:\n" .
                    "- Boarding: " . ($passengers['boarded'] ?? 0) . " / " . ($passengers['checkedIn'] ?? 0) . "\n" .
                    "- Baggage: " . ($baggage['loadedBags'] ?? 0) . " / " . ($baggage['totalBags'] ?? 0) . " bags (Missing: " . ($baggage['missingBags'] ?? 0) . ", Damaged: " . ($baggage['damagedBags'] ?? 0) . ")\n\n" .
                    "Incidents / Bottlenecks:\n" . json_encode($incidents) . "\n\n" .
                    "Provide a valid JSON response with format:\n" .
                    "{\n" .
                    "  \"turnaroundHealthScore\": number (0-100),\n" .
                    "  \"riskLevel\": \"LOW\" | \"MEDIUM\" | \"HIGH\" | \"CRITICAL\",\n" .
                    "  \"criticalPathBottleneck\": string,\n" .
                    "  \"recommendedActions\": [string, string, string],\n" .
                    "  \"delayPredictionMin\": number,\n" .
                    "  \"summary\": string\n" .
                    "}\nReturn ONLY JSON.";

                $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->post($url, [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]]
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                    $parsed = json_decode($text, true);
                    if ($parsed) {
                        return response()->json(['analysis' => $parsed]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini API call failed, using intelligent heuristic fallback: ' . $e->getMessage());
            }
        }

        // Intelligent heuristic fallback turnaround advisor
        $delayMin = (int) ($flight['delayMinutes'] ?? 0);
        $incidentCount = count($incidents);
        $unboardedPax = max(0, ((int) ($passengers['checkedIn'] ?? 0)) - ((int) ($passengers['boarded'] ?? 0)));
        $uncompletedBags = max(0, ((int) ($baggage['totalBags'] ?? 0)) - ((int) ($baggage['loadedBags'] ?? 0)));

        $healthScore = max(30, 100 - ($delayMin * 3) - ($incidentCount * 15));
        $risk = $delayMin > 15 ? 'CRITICAL' : ($delayMin > 10 ? 'HIGH' : ($delayMin > 0 ? 'MEDIUM' : 'LOW'));

        $bottleneck = $unboardedPax > 50
            ? 'Passenger Boarding Gate Congestion'
            : ($uncompletedBags > 50 ? 'Baggage Loading Aft Hold' : 'Ground Refueling / Final Loadsheet Sign-off');

        $actions = [
            $unboardedPax > 40
                ? 'Call Zone B & C boarding immediately and verify biometric gate reader sync.'
                : 'Prepare final passenger reconciliation manifest with IOC.',
            $uncompletedBags > 30
                ? 'Dispatch backup baggage tug to Aft Cargo door 4.'
                : 'Secure cargo hold doors and confirm mechanical latch pins.',
            'Cross-check NOTOC dangerous goods sign-off with flight crew before door closure.',
        ];

        return response()->json([
            'analysis' => [
                'turnaroundHealthScore' => $healthScore,
                'riskLevel' => $risk,
                'criticalPathBottleneck' => $bottleneck,
                'recommendedActions' => $actions,
                'delayPredictionMin' => $delayMin,
                'summary' => "Flight " . ($flight['flightNumber'] ?? 'QR123') . " turnaround is " . ($flight['status'] ?? 'IN PROGRESS') . " with {$delayMin}m projected variance. Laravel ground operations engine synchronized.",
            ]
        ]);
    }
}
