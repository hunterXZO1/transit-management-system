import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
import { GraphExplorer } from './components/modules/graph/GraphExplorer';

const AppContent: React.FC = () => {
  const { activeTab, toasts, removeToast, loading, busy, apiError, reload } = useTransit();

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
      case 'graph':
        return <GraphExplorer />;
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

        {/* Live API status strip */}
        {(loading || busy || apiError) && (
          <div
            className={`px-6 md:px-8 py-2 text-xs font-medium flex items-center gap-2 border-b ${
              apiError
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}
          >
            {apiError ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>MySQL API error: {apiError}</span>
                <button
                  type="button"
                  onClick={reload}
                  className="ml-auto px-2.5 py-1 rounded-md bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{loading ? 'Reading tables from MySQL…' : 'Saving to MySQL…'}</span>
              </>
            )}
          </div>
        )}

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
