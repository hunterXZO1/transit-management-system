import React, { useState } from 'react';
import { Route } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';
import { ArrowUp, ArrowDown, Trash2, Plus, MapPin, Milestone } from 'lucide-react';
import { Badge } from '../../common/Badge';

interface RouteStationMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoute: Route | null;
}

export const RouteStationMapperModal: React.FC<RouteStationMapperModalProps> = ({
  isOpen,
  onClose,
  selectedRoute,
}) => {
  const { stations, routeStations, reorderRouteStations, routes } = useTransit();
  const [activeRouteId, setActiveRouteId] = useState<string>(
    selectedRoute?.routeId || (routes[0]?.routeId ?? '')
  );
  const [selectedStationToAdd, setSelectedStationToAdd] = useState<string>('');

  // Synchronize with passed selectedRoute
  React.useEffect(() => {
    if (selectedRoute) {
      setActiveRouteId(selectedRoute.routeId);
    }
  }, [selectedRoute]);

  if (!isOpen) return null;

  const currentRoute = routes.find((r) => r.routeId === activeRouteId);
  const currentStops = routeStations
    .filter((rs) => rs.routeId === activeRouteId)
    .sort((a, b) => a.stopOrder - b.stopOrder);

  // Available stations not currently on this route
  const availableStations = stations.filter(
    (st) => !currentStops.some((cs) => cs.stationId === st.stationId)
  );

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentStops.length) return;

    const newOrderedIds = currentStops.map((s) => s.stationId);
    const temp = newOrderedIds[index];
    newOrderedIds[index] = newOrderedIds[newIndex];
    newOrderedIds[newIndex] = temp;

    reorderRouteStations(activeRouteId, newOrderedIds);
  };

  const handleRemove = (stationIdToRemove: string) => {
    const newOrderedIds = currentStops
      .filter((s) => s.stationId !== stationIdToRemove)
      .map((s) => s.stationId);
    reorderRouteStations(activeRouteId, newOrderedIds);
  };

  const handleAddStop = () => {
    if (!selectedStationToAdd) return;
    const newOrderedIds = [...currentStops.map((s) => s.stationId), selectedStationToAdd];
    reorderRouteStations(activeRouteId, newOrderedIds);
    setSelectedStationToAdd('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Route-Station M:N Mapper"
      subtitle="Visual stop order sequencing & corridor topology configuration"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Route Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Transit Corridor
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeRouteId}
                onChange={(e) => setActiveRouteId(e.target.value)}
                className="px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {routes.map((r) => (
                  <option key={r.routeId} value={r.routeId}>
                    {r.routeId}: {r.name} ({r.type})
                  </option>
                ))}
              </select>
              {currentRoute && (
                <Badge variant={currentRoute.type === 'Metro' ? 'metro' : 'bus'} size="sm">
                  {currentRoute.type}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Distance</p>
            <p className="text-sm font-extrabold text-slate-800 font-mono">
              {currentRoute?.totalDistanceKm ?? 0} km
            </p>
          </div>
        </div>

        {/* Visual Topology Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Milestone className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Configured Sequence ({currentStops.length} Stops)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Top-to-bottom represents forward stop order
            </span>
          </div>

          {currentStops.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No stations assigned yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Use the dropdown below to append stations to this corridor.
              </p>
            </div>
          ) : (
            <div className="space-y-2 relative before:absolute before:top-4 before:bottom-4 before:left-6 before:w-0.5 before:bg-slate-200">
              {currentStops.map((stop, idx) => {
                const stationDetail = stations.find((s) => s.stationId === stop.stationId);
                const isFirst = idx === 0;
                const isLast = idx === currentStops.length - 1;

                return (
                  <div
                    key={stop.id || `${stop.stationId}-${idx}`}
                    className="relative flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all z-10 ml-2"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-sm ${
                          isFirst
                            ? 'bg-emerald-600 text-white'
                            : isLast
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {stop.stopOrder}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {stationDetail?.name ?? stop.stationId}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {stop.stationId}
                          </span>
                          {isFirst && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Origin
                            </span>
                          )}
                          {isLast && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                              Terminus
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {stationDetail?.area}, {stationDetail?.city} — {stationDetail?.landmark}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(idx, 'up')}
                        title="Move Stop Earlier"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(idx, 'down')}
                        title="Move Stop Later"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(stop.stationId)}
                        title="Remove Stop"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Append New Stop Controller */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Append Station to Corridor
          </label>
          <div className="flex gap-2">
            <select
              value={selectedStationToAdd}
              onChange={(e) => setSelectedStationToAdd(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">-- Choose station to add --</option>
              {availableStations.map((st) => (
                <option key={st.stationId} value={st.stationId}>
                  {st.name} ({st.stationId}) - {st.area}, {st.city}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedStationToAdd}
              onClick={handleAddStop}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Stop
            </button>
          </div>
          {availableStations.length === 0 && (
            <p className="text-[11px] text-amber-600">
              All registered stations in the network are already added to this route.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
