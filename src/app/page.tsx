'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Dashboard } from '@/components/pages/Dashboard';
import { WorkOrdersPage } from '@/components/pages/WorkOrdersPage';
import { AssetsPage } from '@/components/pages/AssetsPage';
import { IoTSupervisionPage } from '@/components/pages/IoTSupervisionPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { SparePartsPage } from '@/components/pages/SparePartsPage';
import { AlertsPage } from '@/components/pages/AlertsPage';
import { PreventiveMaintenancePage } from '@/components/pages/PreventiveMaintenancePage';
import { TechnicianPerformancePage } from '@/components/pages/TechnicianPerformancePage';
import { PricingPage } from '@/components/pages/PricingPage';

export type PageType = 'dashboard' | 'work-orders' | 'assets' | 'iot' | 'analytics' | 'parts' | 'alerts' | 'pm' | 'technicians' | 'pricing';

export default function GMAOPro() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orgName, setOrgName] = useState('GMAO Pro');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        // Could fetch org name here
      })
      .catch(console.error);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'assets':
        return <AssetsPage />;
      case 'iot':
        return <IoTSupervisionPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'parts':
        return <SparePartsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'pm':
        return <PreventiveMaintenancePage />;
      case 'technicians':
        return <TechnicianPerformancePage />;
      case 'pricing':
        return <PricingPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          orgName={orgName}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
