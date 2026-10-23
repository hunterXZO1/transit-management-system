import React, { useState } from 'react';
import { Trip, TripStop } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { DataTable, Column } from '../../common/DataTable';
import { Badge } from '../../common/Badge';
import { Plus, Clock, Calendar, ChevronRight, Milestone } from 'lucide-react';
import { TripModal } from './TripModal';
import { TripTimeline } from './TripTimeline';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const TripModule: React.FC = () => {
  const {
    trips,
    routes,
    tripStops,
    routeStations,
    addTrip,
    updateTrip,
    deleteTrip,
    addTripStop,
    globalSearch,
  } = useTransit();

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(trips[0] ?? null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [deleteTripTarget, setDeleteTripTarget] = useState<Trip | null>(null);

  const handleSaveTrip = (tripData: Trip, autoGenerateStops: boolean) => {
    const isEdit = Boolean(tripToEdit);
    let success = false;
    if (isEdit) {
      success = updateTrip(tripData);
    } else {
      success = addTrip(tripData);
      if (success && autoGenerateStops) {
        // Auto-generate stops based on assigned route's stations
        const routeStops = routeStations
          .filter((rs) => rs.routeId === tripData.routeId)
          .sort((a, b) => a.stopOrder - b.stopOrder);

        routeStops.forEach((rs, index) => {
          const autoStop: TripStop = {
            id: `${tripData.tripId}-${rs.stationId}-${index + 1}`,
            tripId: tripData.tripId,
            stationId: rs.stationId,
            stopOrder: index + 1,
            arrivalTime: index === 0 ? tripData.startTime : '08:20',
            departureTime: index === routeStops.length - 1 ? tripData.endTime : '08:25',
            status: 'Scheduled',
          };
          addTripStop(autoStop);
        });
      }
    }
    if (success) {
      setSelectedTrip(tripData);
    }
    return success;
  };

  const columns: Column<Trip>[] = [
    {
      header: 'Trip ID',
      accessor: (t) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {t.tripId}
        </span>
      ),
      sortKey: 'tripId',
    },
    {
      header: 'Operating Date',
      accessor: (t) => (
        <span className="font-mono text-slate-700 flex items-center gap-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {t.date}
        </span>
      ),
      sortKey: 'date',
    },
    {
      header: 'Run Schedule',
      accessor: (t) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.startTime}</span>
          <span className="text-slate-400">&rarr;</span>
          <span>{t.endTime}</span>
        </div>
      ),
      sortKey: 'startTime',
    },
    {
      header: 'Assigned Corridor',
      accessor: (t) => {
        const r = routes.find((route) => route.routeId === t.routeId);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 rounded">
                {t.routeId}
              </span>
              <span className="font-bold text-slate-900 text-xs">{r?.name || t.routeId}</span>
            </div>
            {r && (
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={r.type === 'Metro' ? 'metro' : 'bus'} size="sm">
                  {r.type}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">{r.totalDistanceKm} km</span>
              </div>
            )}
          </div>
        );
      },
      sortKey: 'routeId',
    },
    {
      header: 'Trip Stops (Weak Entity)',
      accessor: (t) => {
        const stopsCount = tripStops.filter((ts) => ts.tripId === t.tripId).length;
        const isSelected = selectedTrip?.tripId === t.tripId;
        return (
          <button
            type="button"
            onClick={() => setSelectedTrip(t)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isSelected
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Milestone className="w-3 h-3" />
            <span>{stopsCount} Stops Timeline</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Trips Grid */}
      <DataTable
        title="Scheduled Transit Trips"
        subtitle="Daily departures with assigned routes and weak-entity stop timelines"
        data={trips}
        columns={columns}
        keyExtractor={(t) => t.tripId}
        externalSearch={globalSearch}
        searchPlaceholder="Search trips by ID, date, or route..."
        filterPredicate={(t, q) =>
          t.tripId.toLowerCase().includes(q) ||
          t.date.includes(q) ||
          t.routeId.toLowerCase().includes(q) ||
          t.startTime.includes(q) ||
          t.endTime.includes(q)
        }
        headerAction={
          <button
            type="button"
            onClick={() => {
              setTripToEdit(null);
              setIsTripModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Trip
          </button>
        }
        onEdit={(t) => {
          setTripToEdit(t);
          setIsTripModalOpen(true);
        }}
        onDelete={(t) => setDeleteTripTarget(t)}
      />

      {/* Interactive Trip Timeline Display */}
      {selectedTrip && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selected Trip Stop Details
            </span>
          </div>
          <TripTimeline trip={selectedTrip} />
        </div>
      )}

      {/* Modals */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setTripToEdit(null);
        }}
        onSave={handleSaveTrip}
        tripToEdit={tripToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTripTarget)}
        onClose={() => setDeleteTripTarget(null)}
        onConfirm={() => {
          if (deleteTripTarget) {
            deleteTrip(deleteTripTarget.tripId);
            if (selectedTrip?.tripId === deleteTripTarget.tripId) {
              setSelectedTrip(null);
            }
            setDeleteTripTarget(null);
          }
        }}
        title="Cancel Scheduled Trip"
        message={`Are you sure you want to cancel Trip ${deleteTripTarget?.tripId} on ${deleteTripTarget?.date}? Associated weak-entity trip stops will also be removed.`}
      />
    </div>
  );
};
