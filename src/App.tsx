/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OperationsDashboard } from './components/dashboard/OperationsDashboard';
import { FlightDetailPage } from './components/flights/FlightDetailPage';
import { RampQuickMode } from './components/agent-mode/RampQuickMode';
import { BaggageModule } from './components/baggage/BaggageModule';
import { PassengerBoardingModule } from './components/passengers/PassengerBoardingModule';
import { GroundServicesModule } from './components/ground-services/GroundServicesModule';
import { IncidentModule } from './components/incidents/IncidentModule';
import { DelayManagementModule } from './components/delays/DelayManagementModule';
import { AirportMap } from './components/map/AirportMap';
import { KpiDashboard } from './components/kpis/KpiDashboard';
import { SyncCenter } from './components/sync/SyncCenter';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { ReportsView } from './components/reports/ReportsView';
import { TurnaroundAiAssistant } from './components/ai/TurnaroundAiAssistant';
import { UserGuideView } from './components/guide/UserGuideView';
import { QuickEventModal } from './components/events/QuickEventModal';
import { Footer } from './components/layout/Footer';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            {(activeTab === 'dashboard' || activeTab === 'flights') && <OperationsDashboard />}
            {(activeTab === 'flight-detail' || activeTab === 'flight_detail') && <FlightDetailPage />}
            {(activeTab === 'ramp-mode' || activeTab === 'ramp_mode') && <RampQuickMode />}
            {activeTab === 'baggage' && <BaggageModule />}
            {activeTab === 'passengers' && <PassengerBoardingModule />}
            {(activeTab === 'ground-services' || activeTab === 'ground_services') && <GroundServicesModule />}
            {activeTab === 'incidents' && <IncidentModule />}
            {activeTab === 'delays' && <DelayManagementModule />}
            {activeTab === 'map' && <AirportMap />}
            {activeTab === 'kpis' && <KpiDashboard />}
            {(activeTab === 'sync' || activeTab === 'sync_center') && <SyncCenter />}
            {(activeTab === 'audit' || activeTab === 'audit_trail') && <AuditTrailView />}
            {activeTab === 'reports' && <ReportsView />}
            {(activeTab === 'ai-assistant' || activeTab === 'ai_advisor') && <TurnaroundAiAssistant />}
            {(activeTab === 'guide' || activeTab === 'help' || activeTab === 'user-guide') && <UserGuideView />}
          </div>
        </main>
      </div>

      {/* Modern Status Footer */}
      <Footer />

      {/* Floating Modals */}
      <QuickEventModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
