import { Search, X, Activity } from 'lucide-react';
import { useTransit } from '../../context/TransitContext';

export const Header: React.FC = () => {
  const { globalSearch, setGlobalSearch, activeTab } = useTransit();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Network Operations Dashboard', desc: 'Real-time overview of fleet, routes, and transit volume' };
      case 'passengers':
        return { title: 'Passenger Management', desc: 'Manage registered passengers and multi-contact phone numbers' };
      case 'routes':
        return { title: 'Route & Network Management', desc: 'Bus & Metro transit lines, stations, and stop sequences' };
      case 'fleet':
        return { title: 'Fleet & Driver Management', desc: 'Vehicle inventory, capacity types, and 1:1 driver assignments' };
      case 'trips':
        return { title: 'Trip Scheduling & Timeline', desc: 'Scheduled runs with weak-entity Station Arrival/Departure stop times' };
      case 'bookings':
        return { title: 'Bookings, Tickets & Payments', desc: 'Passenger M:N trip reservations, fares, and ticket issuance' };
      default:
        return { title: 'Transit Management System', desc: '' };
    }
  };

  const { title, desc } = getTabTitle();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb / Title */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations Console
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {activeTab.toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">{title}</h2>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>

        {/* Global Search & System Status */}
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Global search across all views..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400 shadow-sm"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Network Health Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">System Status</p>
              <p className="text-xs font-semibold text-slate-800 leading-tight">All Transit Active</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
