import React from 'react';
import { useTransit } from '../../../context/TransitContext';
import { Badge } from '../../common/Badge';
import {
  Users,
  Route as RouteIcon,
  Bus,
  Clock,
  Ticket,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    passengers,
    routes,
    stations,
    vehicles,
    trips,
    bookings,
    payments,
    setActiveTab,
  } = useTransit();

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalNetworkKm = routes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
  const assignedVehiclesCount = vehicles.filter((v) => v.assignedDriverId).length;

  return (
    <div className="space-y-6">
      {/* Network Highlights Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Transit Operations Control
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Public Bus & Metro Transit Management
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Relational data console managing passenger directories, multivalued contacts, multi-modal
              corridors, fleet capacity, 1:1 driver assignments, trip stop timelines, and automated
              boarding pass issuance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Ticket className="w-4 h-4" />
              Book Passenger Trip
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('routes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all border border-slate-700"
            >
              <RouteIcon className="w-4 h-4" />
              Configure Corridors
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Stat 1 */}
        <div
          onClick={() => setActiveTab('passengers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{passengers.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Enrolled Passengers</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {passengers.reduce((acc, p) => acc + (p.phoneNumbers?.length || 0), 0)} contact nos
          </p>
        </div>

        {/* Stat 2 */}
        <div
          onClick={() => setActiveTab('routes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <RouteIcon className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{routes.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Transit Corridors</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">{totalNetworkKm} km active lines</p>
        </div>

        {/* Stat 3 */}
        <div
          onClick={() => setActiveTab('routes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{stations.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Stations & Terminals</p>
          <p className="text-[11px] text-slate-400 mt-1">Intermodal boarding points</p>
        </div>

        {/* Stat 4 */}
        <div
          onClick={() => setActiveTab('fleet')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Bus className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{vehicles.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Active Fleet Units</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {assignedVehiclesCount} with 1:1 drivers
          </p>
        </div>

        {/* Stat 5 */}
        <div
          onClick={() => setActiveTab('trips')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{trips.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Scheduled Runs</p>
          <p className="text-[11px] text-slate-400 mt-1">With arrival/dept timelines</p>
        </div>

        {/* Stat 6 */}
        <div
          onClick={() => setActiveTab('bookings')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3 font-mono">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Fare Revenue</p>
          <p className="text-[11px] text-slate-400 mt-1">{payments.length} transactions</p>
        </div>
      </div>

      {/* Two Column Layout: Active Corridors & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Transit Corridors */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Transit Corridors</h3>
              <p className="text-xs text-slate-400">Routes configured in the network</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('routes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {routes.map((r) => (
              <div
                key={r.routeId}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-1 rounded">
                    {r.routeId}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{r.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {r.totalDistanceKm} km distance
                    </p>
                  </div>
                </div>

                <Badge variant={r.type === 'Metro' ? 'metro' : 'bus'} size="sm">
                  {r.type} Line
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Bookings & Tickets */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Bookings & Passes</h3>
              <p className="text-xs text-slate-400">Latest reservations and issued tickets</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Manage bookings &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {bookings.slice(0, 4).map((b) => {
              const pass = passengers.find((p) => p.passengerId === b.passengerId);
              const t = trips.find((tr) => tr.tripId === b.tripId);
              return (
                <div
                  key={b.bookingId}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs font-mono">
                      {b.seatNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {pass ? `${pass.firstName} ${pass.lastName}` : b.passengerId}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Trip #{b.tripId} • Seat {b.seatNumber} • {t?.date}
                      </p>
                    </div>
                  </div>

                  <Badge variant={b.status === 'Confirmed' ? 'success' : 'danger'} size="sm">
                    {b.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
