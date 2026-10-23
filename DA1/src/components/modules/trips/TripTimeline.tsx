import React, { useState } from 'react';
import { Trip, TripStop } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Badge } from '../../common/Badge';
import { Plus, Edit2, Trash2, Clock, MapPin, ArrowRight } from 'lucide-react';
import { TripStopModal } from './TripStopModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface TripTimelineProps {
  trip: Trip;
  onClose?: () => void;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ trip }) => {
  const { stations, routes, tripStops, addTripStop, updateTripStop, deleteTripStop } = useTransit();

  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopToEdit, setStopToEdit] = useState<TripStop | null>(null);
  const [deleteStopTarget, setDeleteStopTarget] = useState<TripStop | null>(null);

  const routeDetail = routes.find((r) => r.routeId === trip.routeId);
  const activeStops = tripStops
    .filter((ts) => ts.tripId === trip.tripId)
    .sort((a, b) => a.stopOrder - b.stopOrder);

  const getStatusVariant = (status?: TripStop['status']) => {
    switch (status) {
      case 'Departed':
        return 'neutral';
      case 'On Time':
        return 'success';
      case 'Delayed':
        return 'danger';
      case 'Scheduled':
      default:
        return 'info';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
              {trip.tripId}
            </span>
            <h3 className="font-bold text-slate-900 text-base">Trip Schedule Timeline</h3>
            <span className="text-xs text-slate-400 font-mono">• {trip.date}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Route:</span>
            <strong className="text-slate-800 font-semibold">{routeDetail?.name || trip.routeId}</strong>
            <span className="text-slate-300">|</span>
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-mono font-medium text-slate-700">
              {trip.startTime} &rarr; {trip.endTime}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setStopToEdit(null);
            setIsStopModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stop
        </button>
      </div>

      {/* Visual Timeline (Weak Entity: Trip Stops) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Station Arrival & Departure Timeline ({activeStops.length} Stops)
          </p>
          <span className="text-[11px] text-slate-400">Weak Entity: TRIP_STOP</span>
        </div>

        {activeStops.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No scheduled stops for this trip</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "+ Add Stop" above to configure station boarding timings.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {activeStops.map((stop, idx) => {
              const stDetail = stations.find((s) => s.stationId === stop.stationId);
              const isFirst = idx === 0;
              const isLast = idx === activeStops.length - 1;

              return (
                <div key={stop.id} className="relative group">
                  {/* Timeline Indicator Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-sm border-2 border-white ${
                      isFirst
                        ? 'bg-emerald-600 text-white'
                        : isLast
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {stop.stopOrder}
                  </div>

                  {/* Stop Card */}
                  <div className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {stDetail?.name || stop.stationId}
                          </h4>
                          <span className="font-mono text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                            {stop.stationId}
                          </span>
                          <Badge variant={getStatusVariant(stop.status)} size="sm">
                            {stop.status || 'Scheduled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {stDetail?.area}, {stDetail?.city} — {stDetail?.landmark}
                        </p>
                      </div>

                      {/* Timings */}
                      <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs font-mono text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                            Arrival
                          </span>
                          <span className="font-semibold text-slate-800">{stop.arrivalTime}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                            Departure
                          </span>
                          <span className="font-semibold text-slate-800">{stop.departureTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setStopToEdit(stop);
                          setIsStopModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Timings
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteStopTarget(stop)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <TripStopModal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setStopToEdit(null);
        }}
        activeTripId={trip.tripId}
        stopToEdit={stopToEdit}
        suggestedOrder={activeStops.length + 1}
        onSave={(item) => (stopToEdit ? updateTripStop(item) : addTripStop(item))}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteStopTarget)}
        onClose={() => setDeleteStopTarget(null)}
        onConfirm={() => {
          if (deleteStopTarget) {
            deleteTripStop(deleteStopTarget.id);
            setDeleteStopTarget(null);
          }
        }}
        title="Remove Trip Stop"
        message={`Are you sure you want to remove Stop #${deleteStopTarget?.stopOrder} (${deleteStopTarget?.stationId}) from Trip ${trip.tripId}?`}
      />
    </div>
  );
};
