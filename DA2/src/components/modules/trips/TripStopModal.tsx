import React, { useState, useEffect } from 'react';
import { TripStop } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';

interface TripStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stop: TripStop) => boolean;
  activeTripId: string;
  stopToEdit?: TripStop | null;
  suggestedOrder?: number;
}

export const TripStopModal: React.FC<TripStopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activeTripId,
  stopToEdit,
  suggestedOrder = 1,
}) => {
  const { stations } = useTransit();
  const isEditing = Boolean(stopToEdit);

  const [formData, setFormData] = useState<TripStop>({
    id: '',
    tripId: activeTripId,
    stationId: stations[0]?.stationId ?? 'S001',
    stopOrder: suggestedOrder,
    arrivalTime: '08:00',
    departureTime: '08:05',
    status: 'Scheduled',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (stopToEdit) {
      setFormData(stopToEdit);
    } else {
      setFormData({
        id: `${activeTripId}-${stations[0]?.stationId ?? 'S001'}-${suggestedOrder}`,
        tripId: activeTripId,
        stationId: stations[0]?.stationId ?? 'S001',
        stopOrder: suggestedOrder,
        arrivalTime: '08:00',
        departureTime: '08:05',
        status: 'Scheduled',
      });
    }
    setErrors({});
  }, [stopToEdit, isOpen, activeTripId, stations, suggestedOrder]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.stationId) newErrors.stationId = 'Select a station';
    if (!formData.stopOrder || formData.stopOrder < 1) {
      newErrors.stopOrder = 'Stop order must be at least 1';
    }
    if (!formData.arrivalTime) newErrors.arrivalTime = 'Arrival time is required';
    if (!formData.departureTime) newErrors.departureTime = 'Departure time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalData = {
      ...formData,
      id: formData.id || `${activeTripId}-${formData.stationId}-${formData.stopOrder}`,
    };
    const success = onSave(finalData);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Stop #${formData.stopOrder}` : `Add Stop to Trip ${activeTripId}`}
      subtitle="Weak-Entity stop record defining scheduled arrival & departure timings"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Stop Sequence Order *
            </label>
            <input
              type="number"
              min={1}
              value={formData.stopOrder}
              onChange={(e) =>
                setFormData({ ...formData, stopOrder: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.stopOrder && <p className="text-xs text-rose-600 mt-1">{errors.stopOrder}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Live Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as TripStop['status'] })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="On Time">On Time</option>
              <option value="Departed">Departed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Station Boarding Point *
          </label>
          <select
            value={formData.stationId}
            onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {stations.map((s) => (
              <option key={s.stationId} value={s.stationId}>
                {s.name} ({s.stationId}) — {s.area}, {s.city}
              </option>
            ))}
          </select>
          {errors.stationId && <p className="text-xs text-rose-600 mt-1">{errors.stationId}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Scheduled Arrival *
            </label>
            <input
              type="time"
              value={formData.arrivalTime}
              onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.arrivalTime && (
              <p className="text-xs text-rose-600 mt-1">{errors.arrivalTime}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Scheduled Departure *
            </label>
            <input
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.departureTime && (
              <p className="text-xs text-rose-600 mt-1">{errors.departureTime}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            {isEditing ? 'Save Changes' : 'Add Stop'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
