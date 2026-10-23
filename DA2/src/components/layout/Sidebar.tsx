import React from 'react';
import {
  LayoutDashboard,
  Users,
  Route as RouteIcon,
  Bus,
  Clock,
  Ticket,
  RotateCcw,
  Download,
  Database,
} from 'lucide-react';
import { useTransit } from '../../context/TransitContext';
import { ActiveTab } from '../../types/transit';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    passengers,
    routes,
    vehicles,
    trips,
    bookings,
    resetToMockData,
    exportStateToJson,
  } = useTransit();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'passengers',
      label: 'Passengers',
      icon: <Users className="w-4 h-4" />,
      badge: passengers.length,
    },
    {
      id: 'routes',
      label: 'Routes & Stations',
      icon: <RouteIcon className="w-4 h-4" />,
      badge: routes.length,
    },
    {
      id: 'fleet',
      label: 'Fleet & Drivers',
      icon: <Bus className="w-4 h-4" />,
      badge: vehicles.length,
    },
    {
      id: 'trips',
      label: 'Trip Scheduling',
      icon: <Clock className="w-4 h-4" />,
      badge: trips.length,
    },
    {
      id: 'bookings',
      label: 'Bookings & Tickets',
      icon: <Ticket className="w-4 h-4" />,
      badge: bookings.length,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight">TransitFlow</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Bus & Metro Transit CMS</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Entities & Operations
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400'
                    } transition-colors`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2 text-xs">
        <div className="px-2 py-1.5 bg-slate-800/40 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Mock State Storage
          </span>
          <Database className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={resetToMockData}
            title="Reset to initial seed mock data"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Data
          </button>

          <button
            type="button"
            onClick={exportStateToJson}
            title="Export all tables to JSON"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </aside>
  );
};
