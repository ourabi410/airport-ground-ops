import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { FlightManagementView } from './components/flights/FlightManagementView';
import { BaggageWorkflowView } from './components/baggage/BaggageWorkflowView';
import { TaskManagementView } from './components/tasks/TaskManagementView';
import { CompanyManagementView } from './components/companies/CompanyManagementView';
import { DollyManagementView } from './components/dolly/DollyManagementView';
import { UserManagementView } from './components/users/UserManagementView';
import { AuditLogsView } from './components/logs/AuditLogsView';
import { RampAgentFieldModeView } from './components/ramp/RampAgentFieldModeView';
import { AccessRestrictedNotice } from './components/common/AccessRestrictedNotice';
import { ZebraScannerModal } from './components/baggage/ZebraScannerModal';
import { LoginView } from './components/auth/LoginView';

const DashboardContent: React.FC = () => {
  const { isRtl } = useLanguage();
  const { activeTab, currentUser, permissions, isAuthenticated } = useApp();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerDefaultStep, setScannerDefaultStep] = useState<1 | 2>(2);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenScanner = (step: 1 | 2 = 2) => {
    setScannerDefaultStep(step);
    setIsScannerOpen(true);
  };

  const isAdmin = currentUser?.role === 'Administrator';

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-[#1E293B] selection:bg-[#0284C7] selection:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Navigation Bar */}
      <Navbar onOpenScanner={() => handleOpenScanner(2)} />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed / Responsive Technical Sidebar */}
        <Sidebar onOpenScanner={() => handleOpenScanner(2)} />

        {/* Dynamic Main Workspace Area with Motion Transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* Dedicated Ramp Agent Field Mode (Glove Friendly) */}
                {activeTab === 'ramp_field' && (
                  <RampAgentFieldModeView onOpenScanner={() => handleOpenScanner(2)} />
                )}

                {activeTab === 'dashboard' && (
                  <OverviewDashboard onOpenScanner={handleOpenScanner} />
                )}

                {activeTab === 'flights' && (
                  <FlightManagementView />
                )}

                {activeTab === 'baggage' && (
                  <BaggageWorkflowView />
                )}

                {activeTab === 'tasks' && (
                  <TaskManagementView />
                )}

                {activeTab === 'companies' && (
                  isAdmin ? <CompanyManagementView /> : <AccessRestrictedNotice requiredPermission="canManageCompanies" />
                )}

                {activeTab === 'dolly' && (
                  <DollyManagementView />
                )}

                {activeTab === 'users' && (
                  isAdmin ? <UserManagementView /> : <AccessRestrictedNotice requiredPermission="canManageUsers" />
                )}

                {activeTab === 'logs' && (
                  isAdmin || permissions.canViewAuditLogs ? <AuditLogsView /> : <AccessRestrictedNotice requiredPermission="canViewAuditLogs" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Zebra Handheld Scanner Modal Simulation */}
      <ZebraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        defaultStep={scannerDefaultStep}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <DashboardContent />
      </AppProvider>
    </LanguageProvider>
  );
}
