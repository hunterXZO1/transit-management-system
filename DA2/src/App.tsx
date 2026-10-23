import React from 'react';
import { TransitProvider, useTransit } from './context/TransitContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { DashboardView } from './components/modules/dashboard/DashboardView';
import { PassengerModule } from './components/modules/passengers/PassengerModule';
import { RouteModule } from './components/modules/routes/RouteModule';
import { FleetModule } from './components/modules/fleet/FleetModule';
import { TripModule } from './components/modules/trips/TripModule';
import { BookingModule } from './components/modules/bookings/BookingModule';

const AppContent: React.FC = () => {
  const { activeTab, toasts, removeToast } = useTransit();

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'passengers':
        return <PassengerModule />;
      case 'routes':
        return <RouteModule />;
      case 'fleet':
        return <FleetModule />;
      case 'trips':
        return <TripModule />;
      case 'bookings':
        return <BookingModule />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100/60 font-sans text-slate-900">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TransitProvider>
      <AppContent />
    </TransitProvider>
  );
};

export default App;
