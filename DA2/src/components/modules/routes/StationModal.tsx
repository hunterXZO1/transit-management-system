import React, { useState, useEffect } from 'react';
import { Station } from '../../../types/transit';
import { Modal } from '../../common/Modal';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (station: Station) => boolean;
  stationToEdit?: Station | null;
}

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stationToEdit,
}) => {
  const isEditing = Boolean(stationToEdit);

  const [formData, setFormData] = useState<Station>({
    stationId: '',
    name: '',
    city: 'Chennai',
    area: '',
    landmark: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (stationToEdit) {
      setFormData(stationToEdit);
    } else {
      setFormData({
        stationId: `S00${Math.floor(10 + Math.random() * 90)}`,
        name: '',
        city: 'Chennai',
        area: '',
        landmark: '',
      });
    }
    setErrors({});
  }, [stationToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.stationId.trim()) newErrors.stationId = 'Station ID is required';
    if (!formData.name.trim()) newErrors.name = 'Station Name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.landmark.trim()) newErrors.landmark = 'Landmark is required';
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
      title={isEditing ? `Edit Station: ${formData.stationId}` : 'Register Station'}
      subtitle="Define a physical transit station, terminal, or hub"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Station ID *
          </label>
          <input
            type="text"
            disabled={isEditing}
            value={formData.stationId}
            onChange={(e) => setFormData({ ...formData, stationId: e.target.value.toUpperCase() })}
            placeholder="e.g. S001"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
          />
          {errors.stationId && <p className="text-xs text-rose-600 mt-1">{errors.stationId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Station Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Chennai Central"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Chennai"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Area / Neighborhood *
            </label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="e.g. Park Town"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.area && <p className="text-xs text-rose-600 mt-1">{errors.area}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Landmark *
          </label>
          <textarea
            rows={2}
            value={formData.landmark}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            placeholder="e.g. Near Main Terminal Gate 1"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.landmark && <p className="text-xs text-rose-600 mt-1">{errors.landmark}</p>}
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
            {isEditing ? 'Save Changes' : 'Register Station'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
