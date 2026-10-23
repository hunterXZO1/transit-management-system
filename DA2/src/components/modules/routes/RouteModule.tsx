import React, { useState } from 'react';
import { Route, Station } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { DataTable, Column } from '../../common/DataTable';
import { Badge } from '../../common/Badge';
import { Plus, Milestone, Building2, GitFork, ArrowRight } from 'lucide-react';
import { RouteModal } from './RouteModal';
import { StationModal } from './StationModal';
import { RouteStationMapperModal } from './RouteStationMapperModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const RouteModule: React.FC = () => {
  const {
    routes,
    stations,
    routeStations,
    addRoute,
    updateRoute,
    deleteRoute,
    addStation,
    updateStation,
    deleteStation,
    globalSearch,
  } = useTransit();

  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'stations' | 'topology'>('routes');

  // Route Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [deleteRouteTarget, setDeleteRouteTarget] = useState<Route | null>(null);

  // Station Modal State
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);
  const [deleteStationTarget, setDeleteStationTarget] = useState<Station | null>(null);

  // Mapper Modal State
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [selectedRouteForMapping, setSelectedRouteForMapping] = useState<Route | null>(null);

  // Route Columns
  const routeColumns: Column<Route>[] = [
    {
      header: 'Route ID',
      accessor: (r) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {r.routeId}
        </span>
      ),
      sortKey: 'routeId',
    },
    {
      header: 'Corridor Name',
      accessor: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{r.name}</span>
        </div>
      ),
      sortKey: 'name',
    },
    {
      header: 'Type',
      accessor: (r) => (
        <Badge variant={r.type === 'Metro' ? 'metro' : 'bus'} size="sm">
          {r.type}
        </Badge>
      ),
      sortKey: 'type',
      align: 'center',
    },
    {
      header: 'Total Distance',
      accessor: (r) => <span className="font-mono font-semibold">{r.totalDistanceKm} km</span>,
      sortKey: 'totalDistanceKm',
    },
    {
      header: 'Configured Stops',
      accessor: (r) => {
        const stops = routeStations
          .filter((rs) => rs.routeId === r.routeId)
          .sort((a, b) => a.stopOrder - b.stopOrder);

        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {stops.length} stops
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedRouteForMapping(r);
                setIsMapperOpen(true);
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
            >
              Order stops <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        );
      },
    },
  ];

  // Station Columns
  const stationColumns: Column<Station>[] = [
    {
      header: 'Station ID',
      accessor: (s) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {s.stationId}
        </span>
      ),
      sortKey: 'stationId',
    },
    {
      header: 'Station Name',
      accessor: (s) => <span className="font-bold text-slate-900 text-xs">{s.name}</span>,
      sortKey: 'name',
    },
    {
      header: 'Area',
      accessor: (s) => <span className="text-slate-600 text-xs">{s.area}</span>,
      sortKey: 'area',
    },
    {
      header: 'City',
      accessor: (s) => <span className="text-slate-700 font-medium text-xs">{s.city}</span>,
      sortKey: 'city',
    },
    {
      header: 'Landmark',
      accessor: (s) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">{s.landmark}</span>
      ),
    },
    {
      header: 'Active Lines',
      accessor: (s) => {
        const routesServing = routeStations
          .filter((rs) => rs.stationId === s.stationId)
          .map((rs) => rs.routeId);
        const uniqueRoutes = Array.from(new Set(routesServing));

        return (
          <div className="flex flex-wrap gap-1">
            {uniqueRoutes.length > 0 ? (
              uniqueRoutes.map((rId) => (
                <span
                  key={rId}
                  className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.2 rounded font-semibold"
                >
                  {rId}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">No lines</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('routes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'routes'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            Transit Routes ({routes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('stations')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'stations'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Stations & Hubs ({stations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('topology')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'topology'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Corridor Topology
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedRouteForMapping(routes[0] || null);
            setIsMapperOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
        >
          <GitFork className="w-3.5 h-3.5" />
          Open Stop Sequence Mapper
        </button>
      </div>

      {/* View 1: Routes */}
      {activeSubTab === 'routes' && (
        <DataTable
          title="Corridor & Line Directory"
          subtitle="Bus & Metro transit corridors with total operational distances"
          data={routes}
          columns={routeColumns}
          keyExtractor={(r) => r.routeId}
          externalSearch={globalSearch}
          searchPlaceholder="Search routes by ID or name..."
          filterPredicate={(r, q) =>
            r.routeId.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q)
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setRouteToEdit(null);
                setIsRouteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Route
            </button>
          }
          onEdit={(r) => {
            setRouteToEdit(r);
            setIsRouteModalOpen(true);
          }}
          onDelete={(r) => setDeleteRouteTarget(r)}
        />
      )}

      {/* View 2: Stations */}
      {activeSubTab === 'stations' && (
        <DataTable
          title="Station & Terminal Directory"
          subtitle="Physical boarding points, junctions, and interchanges across the network"
          data={stations}
          columns={stationColumns}
          keyExtractor={(s) => s.stationId}
          externalSearch={globalSearch}
          searchPlaceholder="Search stations by name, area, city..."
          filterPredicate={(s, q) =>
            s.stationId.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.area.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.landmark.toLowerCase().includes(q)
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setStationToEdit(null);
                setIsStationModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Station
            </button>
          }
          onEdit={(s) => {
            setStationToEdit(s);
            setIsStationModalOpen(true);
          }}
          onDelete={(s) => setDeleteStationTarget(s)}
        />
      )}

      {/* View 3: Visual Topology Card View */}
      {activeSubTab === 'topology' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Network Stop Topology</h3>
            <p className="text-xs text-slate-500">
              Visual M:N alignment between lines and their sequential stops
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r) => {
              const stops = routeStations
                .filter((rs) => rs.routeId === r.routeId)
                .sort((a, b) => a.stopOrder - b.stopOrder);

              return (
                <div
                  key={r.routeId}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                          {r.routeId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                      </div>
                      <Badge variant={r.type === 'Metro' ? 'metro' : 'bus'} size="sm">
                        {r.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Distance: {r.totalDistanceKm} km • {stops.length} stops
                    </p>

                    {/* Timeline visualization */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {stops.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No stations assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {stops.map((st) => {
                            const stDetail = stations.find((s) => s.stationId === st.stationId);
                            return (
                              <div key={st.id} className="flex items-center gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[10px]">
                                  {st.stopOrder}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {stDetail?.name || st.stationId}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({stDetail?.area})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRouteForMapping(r);
                        setIsMapperOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <GitFork className="w-3 h-3" />
                      Configure Stop Sequence
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <RouteModal
        isOpen={isRouteModalOpen}
        onClose={() => {
          setIsRouteModalOpen(false);
          setRouteToEdit(null);
        }}
        onSave={(item) => (routeToEdit ? updateRoute(item) : addRoute(item))}
        routeToEdit={routeToEdit}
      />

      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setStationToEdit(null);
        }}
        onSave={(item) => (stationToEdit ? updateStation(item) : addStation(item))}
        stationToEdit={stationToEdit}
      />

      <RouteStationMapperModal
        isOpen={isMapperOpen}
        onClose={() => {
          setIsMapperOpen(false);
          setSelectedRouteForMapping(null);
        }}
        selectedRoute={selectedRouteForMapping}
      />

      {/* Delete Confirms */}
      <ConfirmDialog
        isOpen={Boolean(deleteRouteTarget)}
        onClose={() => setDeleteRouteTarget(null)}
        onConfirm={() => {
          if (deleteRouteTarget) {
            deleteRoute(deleteRouteTarget.routeId);
            setDeleteRouteTarget(null);
          }
        }}
        title="Delete Transit Corridor"
        message={`Are you sure you want to delete route ${deleteRouteTarget?.name} (${deleteRouteTarget?.routeId})? All station stop sequence mappings for this route will also be erased.`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteStationTarget)}
        onClose={() => setDeleteStationTarget(null)}
        onConfirm={() => {
          if (deleteStationTarget) {
            deleteStation(deleteStationTarget.stationId);
            setDeleteStationTarget(null);
          }
        }}
        title="Delete Station Terminal"
        message={`Are you sure you want to remove station ${deleteStationTarget?.name} (${deleteStationTarget?.stationId})? All routes stopping at this station will have this stop removed.`}
      />
    </div>
  );
};
