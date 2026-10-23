import React, { useState, useEffect } from 'react';
import { VehicleType, FuelType } from '../../../types/transit';
import { Modal } from '../../common/Modal';

interface VehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vt: VehicleType) => boolean;
  typeToEdit?: VehicleType | null;
}

export const VehicleTypeModal: React.FC<VehicleTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  typeToEdit,
}) => {
  const isEditing = Boolean(typeToEdit);

  const [formData, setFormData] = useState<VehicleType>({
    typeId: '',
    name: '',
    capacity: 40,
    fuelType: 'Diesel',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeToEdit) {
      setFormData(typeToEdit);
    } else {
      setFormData({
        typeId: `VT0${Math.floor(10 + Math.random() * 90)}`,
        name: '',
        capacity: 40,
        fuelType: 'Diesel',
      });
    }
    setErrors({});
  }, [typeToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.typeId.trim()) newErrors.typeId = 'Type ID is required';
    if (!formData.name.trim()) newErrors.name = 'Type Name is required';
    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1 passenger';
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
      title={isEditing ? `Edit Vehicle Type: ${formData.typeId}` : 'Register Vehicle Type'}
      subtitle="Define seating capacity and propulsion fuel specifications"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Type ID *
          </label>
          <input
            type="text"
            disabled={isEditing}
            value={formData.typeId}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value.toUpperCase() })}
            placeholder="e.g. VT01"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
          />
          {errors.typeId && <p className="text-xs text-rose-600 mt-1">{errors.typeId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Classification Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. City Bus Standard or Metro Rapid 6-Car"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Passenger Capacity *
            </label>
            <input
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.capacity && <p className="text-xs text-rose-600 mt-1">{errors.capacity}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Fuel / Propulsion Type *
            </label>
            <select
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="CNG">CNG</option>
            </select>
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
            {isEditing ? 'Save Changes' : 'Save Vehicle Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
