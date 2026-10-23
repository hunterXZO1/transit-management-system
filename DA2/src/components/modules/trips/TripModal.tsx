import React, { useState, useEffect } from 'react';
import { Trip } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip, autoGenerateStops: boolean) => boolean;
  tripToEdit?: Trip | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tripToEdit,
}) => {
  const { routes } = useTransit();
  const isEditing = Boolean(tripToEdit);

  const [formData, setFormData] = useState<Trip>({
    tripId: '',
    date: '2026-08-20',
    startTime: '08:00',
    endTime: '08:45',
    routeId: routes[0]?.routeId ?? 'R001',
  });

  const [autoGenerateStops, setAutoGenerateStops] = useState(!isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tripToEdit) {
      setFormData(tripToEdit);
      setAutoGenerateStops(false);
    } else {
      setFormData({
        tripId: `T00${Math.floor(10 + Math.random() * 90)}`,
        date: '2026-08-20',
        startTime: '08:00',
        endTime: '08:45',
        routeId: routes[0]?.routeId ?? 'R001',
      });
      setAutoGenerateStops(true);
    }
    setErrors({});
  }, [tripToEdit, isOpen, routes]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tripId.trim()) newErrors.tripId = 'Trip ID is required';
    if (!formData.date) newErrors.date = 'Trip date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.routeId) newErrors.routeId = 'Select an assigned route';

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const success = onSave(formData, autoGenerateStops);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Trip: ${formData.tripId}` : 'Schedule Transit Trip'}
      subtitle="Define departure schedules, operating date, and assigned corridor"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Trip ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.tripId}
              onChange={(e) => setFormData({ ...formData, tripId: e.target.value.toUpperCase() })}
              placeholder="e.g. T001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
            />
            {errors.tripId && <p className="text-xs text-rose-600 mt-1">{errors.tripId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Operating Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Assigned Route Corridor *
          </label>
          <select
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {routes.map((r) => (
              <option key={r.routeId} value={r.routeId}>
                {r.routeId}: {r.name} ({r.type}) — {r.totalDistanceKm} km
              </option>
            ))}
          </select>
          {errors.routeId && <p className="text-xs text-rose-600 mt-1">{errors.routeId}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.startTime && <p className="text-xs text-rose-600 mt-1">{errors.startTime}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.endTime && <p className="text-xs text-rose-600 mt-1">{errors.endTime}</p>}
          </div>
        </div>

        {!isEditing && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerateStops}
                onChange={(e) => setAutoGenerateStops(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-900">
                  Auto-populate Trip Stops timeline from Route stations
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically initializes the weak-entity Trip Stops based on the assigned route's
                  stations and calculated stop intervals.
                </p>
              </div>
            </label>
          </div>
        )}

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
            {isEditing ? 'Save Changes' : 'Schedule Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
