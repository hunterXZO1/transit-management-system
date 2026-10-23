import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';
import { AlertCircle } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => boolean;
  vehicleToEdit?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleToEdit,
}) => {
  const { vehicleTypes, drivers, vehicles } = useTransit();
  const isEditing = Boolean(vehicleToEdit);

  const [formData, setFormData] = useState<Vehicle>({
    vehicleId: '',
    registrationNo: '',
    manufactureDate: '',
    color: 'Ocean Blue',
    vehicleTypeId: vehicleTypes[0]?.typeId ?? 'VT01',
    assignedDriverId: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData(vehicleToEdit);
    } else {
      setFormData({
        vehicleId: `V00${Math.floor(10 + Math.random() * 90)}`,
        registrationNo: `TN0${Math.floor(1 + Math.random() * 9)}AB${Math.floor(1000 + Math.random() * 9000)}`,
        manufactureDate: '2023-01-15',
        color: 'Ocean Blue',
        vehicleTypeId: vehicleTypes[0]?.typeId ?? 'VT01',
        assignedDriverId: null,
      });
    }
    setErrors({});
  }, [vehicleToEdit, isOpen, vehicleTypes]);

  // Check if chosen driver is currently assigned elsewhere (1:1 constraint visual warning)
  const conflictingVehicle = formData.assignedDriverId
    ? vehicles.find(
        (v) =>
          v.assignedDriverId === formData.assignedDriverId &&
          v.vehicleId !== formData.vehicleId
      )
    : null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.vehicleId.trim()) newErrors.vehicleId = 'Vehicle ID is required';
    if (!formData.registrationNo.trim()) newErrors.registrationNo = 'Registration number is required';
    if (!formData.manufactureDate) newErrors.manufactureDate = 'Manufacture date is required';
    if (!formData.color.trim()) newErrors.color = 'Color is required';
    if (!formData.vehicleTypeId) newErrors.vehicleTypeId = 'Select a vehicle type';
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
      title={isEditing ? `Edit Vehicle: ${formData.vehicleId}` : 'Register Fleet Vehicle'}
      subtitle="Fleet vehicle inventory with 1:1 driver assignment constraint"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Vehicle ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value.toUpperCase() })}
              placeholder="e.g. V001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
            />
            {errors.vehicleId && <p className="text-xs text-rose-600 mt-1">{errors.vehicleId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Registration No *
            </label>
            <input
              type="text"
              value={formData.registrationNo}
              onChange={(e) =>
                setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })
              }
              placeholder="e.g. TN01AB1234"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.registrationNo && (
              <p className="text-xs text-rose-600 mt-1">{errors.registrationNo}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Manufacture Date *
            </label>
            <input
              type="date"
              value={formData.manufactureDate}
              onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.manufactureDate && (
              <p className="text-xs text-rose-600 mt-1">{errors.manufactureDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Color *
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. Ocean Blue"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.color && <p className="text-xs text-rose-600 mt-1">{errors.color}</p>}
          </div>
        </div>

        {/* Vehicle Type selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Vehicle Specification Type *
          </label>
          <select
            value={formData.vehicleTypeId}
            onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {vehicleTypes.map((vt) => (
              <option key={vt.typeId} value={vt.typeId}>
                {vt.name} ({vt.typeId}) — Capacity: {vt.capacity} pax | Fuel: {vt.fuelType}
              </option>
            ))}
          </select>
          {errors.vehicleTypeId && (
            <p className="text-xs text-rose-600 mt-1">{errors.vehicleTypeId}</p>
          )}
        </div>

        {/* Assigned Driver Selector (1:1 constraint visual) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Driver (1:1 Constraint)
            </label>
            <span className="text-[10px] font-mono text-slate-400">1 Driver : 1 Vehicle</span>
          </div>

          <select
            value={formData.assignedDriverId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignedDriverId: e.target.value ? e.target.value : null,
              })
            }
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">-- No Driver Assigned (Parked/Spare) --</option>
            {drivers.map((d) => {
              const assignedV = vehicles.find(
                (v) => v.assignedDriverId === d.driverId && v.vehicleId !== formData.vehicleId
              );
              return (
                <option key={d.driverId} value={d.driverId}>
                  {d.name} ({d.driverId}) {assignedV ? `[Assigned to ${assignedV.vehicleId}]` : '[Available]'}
                </option>
              );
            })}
          </select>

          {conflictingVehicle && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>1:1 Constraint Notice:</strong> Driver{' '}
                <strong>{formData.assignedDriverId}</strong> is presently assigned to Vehicle{' '}
                <strong>{conflictingVehicle.vehicleId}</strong>. Saving will automatically reassign
                this driver to {formData.vehicleId}.
              </p>
            </div>
          )}
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
            {isEditing ? 'Save Changes' : 'Register Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
