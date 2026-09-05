import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { WebSidebar } from './components/web/WebSidebar';
import { DashboardView } from './components/web/DashboardView';
import { ProductsView } from './components/web/ProductsView';
import { PDVView } from './components/web/PDVView';
import { KitsView } from './components/web/KitsView';
import { PurchasesView } from './components/web/PurchasesView';
import { TransfersView } from './components/web/TransfersView';
import { InventoryView } from './components/web/InventoryView';
import { CRMView } from './components/web/CRMView';
import { IntelligenceView } from './components/web/IntelligenceView';
import { ReportsView } from './components/web/ReportsView';
import { CompaniesView } from './components/web/CompaniesView';
import { AuditView } from './components/web/AuditView';
import { MobileApp } from './components/mobile/MobileApp';

const AppContent: React.FC = () => {
  const { surface, activeTab } = useApp();

  if (surface === 'mobile') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <MobileApp />
        <BarcodeScannerModal />
        <GlobalSearchModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Sleek Dark Left Sidebar */}
      <WebSidebar />

      {/* Main Content Area with Sleek Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Universal Top Header */}
        <Header />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'pdv' && <PDVView />}
            {activeTab === 'kits' && <KitsView />}
            {activeTab === 'purchases' && <PurchasesView />}
            {activeTab === 'transfers' && <TransfersView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'crm' && <CRMView />}
            {activeTab === 'intelligence' && <IntelligenceView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'audit' && <AuditView />}
          </div>
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <BarcodeScannerModal />
      <GlobalSearchModal />
      <ToastContainer />
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
