<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Reminder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b1320;
            color: #e2e8f0;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 16px;
            border: 1px solid #334155;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            padding: 24px;
            color: #ffffff;
        }
        .header h1 {
            margin: 0 0 6px 0;
            font-size: 20px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 24px;
        }
        .alert-box {
            background-color: #0f172a;
            border-left: 4px solid #38bdf8;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .grid-row {
            display: table-row;
        }
        .grid-cell {
            display: table-cell;
            padding: 8px 12px;
            border-bottom: 1px solid #334155;
            font-size: 13px;
        }
        .grid-cell.label {
            color: #94a3b8;
            width: 35%;
            font-weight: 600;
        }
        .grid-cell.value {
            color: #f8fafc;
            font-weight: 500;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-high {
            background-color: #dc2626;
            color: #ffffff;
        }
        .badge-normal {
            background-color: #0284c7;
            color: #ffffff;
        }
        .badge-critical {
            background-color: #9333ea;
            color: #ffffff;
        }
        .checklist {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }
        .checklist h3 {
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #38bdf8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .checklist-item {
            padding: 6px 0;
            font-size: 13px;
            color: #cbd5e1;
            border-bottom: 1px solid #1e293b;
        }
        .checklist-item:last-child {
            border-bottom: none;
        }
        .footer {
            padding: 16px 24px;
            background-color: #0f172a;
            border-top: 1px solid #334155;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ AeroTurn Ground Ops — Task Reminder</h1>
            <p>Automated Operational Dispatch Alert for Airport Field Team</p>
        </div>

        <div class="content">
            <div class="alert-box">
                <div style="font-size: 16px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">
                    {{ $task['taskTitle'] ?? 'Turnaround Task' }}
                </div>
                <div style="font-size: 13px; color: #38bdf8;">
                    ⏰ Target Schedule: <strong>{{ $task['targetTime'] ?? 'N/A' }}</strong> &nbsp;|&nbsp;
                    Status: <strong>{{ $task['status'] ?? 'Pending' }}</strong>
                </div>
            </div>

            <div class="grid">
                <div class="grid-row">
                    <div class="grid-cell label">Flight Number</div>
                    <div class="grid-cell value">
                        <strong style="font-family: monospace; font-size: 14px;">{{ $task['flightNbr'] ?? ($flight['flightNbr'] ?? 'N/A') }}</strong>
                        @if(!empty($flight['acType']))
                            <span style="color: #94a3b8; font-size: 12px;">({{ $flight['acType'] }})</span>
                        @endif
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell label">Customer / Airline</div>
                    <div class="grid-cell value">
                        <strong>{{ $company['name'] ?? ($flight['companyName'] ?? 'Customer Airline') }}</strong>
                        @if(!empty($company['iata']))
                            <span style="color: #94a3b8;">[{{ $company['iata'] }}/{{ $company['icao'] ?? '' }}]</span>
                        @endif
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell label">Customer Hub / Location</div>
                    <div class="grid-cell value" style="color: #38bdf8; font-weight: bold;">
                        📍 {{ $company['hub'] ?? 'Main Airport Terminal' }}
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell label">Ramp Stand / Gate</div>
                    <div class="grid-cell value">
                        📍 Stand: <strong>{{ $flight['subplaneAreaZone'] ?? 'Apron Stand' }}</strong>
                        @if(!empty($flight['gateNbr']))
                            &nbsp;|&nbsp; Gate: <strong>{{ $flight['gateNbr'] }}</strong>
                        @endif
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell label">Assigned Agent</div>
                    <div class="grid-cell value">
                        {{ $user['name'] ?? ($task['assignedUserName'] ?? 'Unassigned') }}
                        @if(!empty($user['role']))
                            <span style="color: #94a3b8; font-size: 12px;">({{ $user['role'] }})</span>
                        @endif
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell label">Priority</div>
                    <div class="grid-cell value">
                        @php
                            $p = strtolower($task['priority'] ?? 'normal');
                            $badgeClass = $p === 'high' ? 'badge-high' : ($p === 'critical' ? 'badge-critical' : 'badge-normal');
                        @endphp
                        <span class="badge {{ $badgeClass }}">{{ $task['priority'] ?? 'Normal' }}</span>
                    </div>
                </div>
            </div>

            @if(!empty($task['checklist']) && is_array($task['checklist']))
                <div class="checklist">
                    <h3>📋 Action Checklist Items</h3>
                    @foreach($task['checklist'] as $item)
                        <div class="checklist-item">
                            @if(!empty($item['done']))
                                <span style="color: #4ade80;">[✓]</span>
                            @else
                                <span style="color: #f59e0b;">[ ]</span>
                            @endif
                            {{ $item['text'] ?? '' }}
                        </div>
                    @endforeach
                </div>
            @endif

            @if(!empty($task['notes']))
                <div style="margin-top: 16px; padding: 12px; background-color: #0f172a; border-radius: 8px; font-size: 12px; color: #cbd5e1;">
                    <strong style="color: #94a3b8;">Operational Notes:</strong> {{ $task['notes'] }}
                </div>
            @endif
        </div>

        <div class="footer">
            AeroTurn Ground Operations Real-Time Control Center • sas.smartcityt.com<br>
            Sent automatically at {{ now()->toDateTimeString() }} (UTC)
        </div>
    </div>
</body>
</html>
