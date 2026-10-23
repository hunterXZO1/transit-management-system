import React, { useState, useEffect } from 'react';
import { Route, RouteType } from '../../../types/transit';
import { Modal } from '../../common/Modal';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: Route) => boolean;
  routeToEdit?: Route | null;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  routeToEdit,
}) => {
  const isEditing = Boolean(routeToEdit);

  const [formData, setFormData] = useState<Route>({
    routeId: '',
    name: '',
    type: 'Bus',
    totalDistanceKm: 10,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (routeToEdit) {
      setFormData(routeToEdit);
    } else {
      setFormData({
        routeId: `R00${Math.floor(10 + Math.random() * 90)}`,
        name: '',
        type: 'Bus',
        totalDistanceKm: 15,
      });
    }
    setErrors({});
  }, [routeToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.routeId.trim()) newErrors.routeId = 'Route ID is required';
    if (!formData.name.trim()) newErrors.name = 'Route name is required';
    if (!formData.totalDistanceKm || formData.totalDistanceKm <= 0) {
      newErrors.totalDistanceKm = 'Total distance must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const success = onSave(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Route: ${formData.routeId}` : 'Create Transit Route'}
      subtitle="Define a Bus or Metro transit corridor with distance parameters"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Route ID *
          </label>
          <input
            type="text"
            disabled={isEditing}
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value.toUpperCase() })}
            placeholder="e.g. R001"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
          />
          {errors.routeId && <p className="text-xs text-rose-600 mt-1">{errors.routeId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Route Name / Corridor *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Chennai Central - Airport Corridor"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Transit Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as RouteType })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Bus">Bus</option>
              <option value="Metro">Metro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Total Distance (km) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.totalDistanceKm}
              onChange={(e) =>
                setFormData({ ...formData, totalDistanceKm: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.totalDistanceKm && (
              <p className="text-xs text-rose-600 mt-1">{errors.totalDistanceKm}</p>
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
            {isEditing ? 'Save Changes' : 'Create Route'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
