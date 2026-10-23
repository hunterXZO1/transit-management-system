import React, { useState, useEffect } from 'react';
import { Driver } from '../../../types/transit';
import { Modal } from '../../common/Modal';
import { MultiInput } from '../../common/MultiInput';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (driver: Driver) => boolean;
  driverToEdit?: Driver | null;
}

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  onClose,
  onSave,
  driverToEdit,
}) => {
  const isEditing = Boolean(driverToEdit);

  const [formData, setFormData] = useState<Driver>({
    driverId: '',
    name: '',
    licenseNo: '',
    dob: '',
    contactNumbers: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (driverToEdit) {
      setFormData(driverToEdit);
    } else {
      setFormData({
        driverId: `D00${Math.floor(10 + Math.random() * 90)}`,
        name: '',
        licenseNo: `DL${Math.floor(1000 + Math.random() * 9000)}`,
        dob: '1988-01-01',
        contactNumbers: [],
      });
    }
    setErrors({});
  }, [driverToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.driverId.trim()) newErrors.driverId = 'Driver ID is required';
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.licenseNo.trim()) newErrors.licenseNo = 'Driver license number is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (formData.contactNumbers.length === 0) {
      newErrors.contactNumbers = 'At least one contact number is required';
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
      title={isEditing ? `Edit Driver: ${formData.driverId}` : 'Enrol Driver in Fleet'}
      subtitle="Driver profile with license verification and multivalued contact numbers"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Driver ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value.toUpperCase() })}
              placeholder="e.g. D001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
            />
            {errors.driverId && <p className="text-xs text-rose-600 mt-1">{errors.driverId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              License Number *
            </label>
            <input
              type="text"
              value={formData.licenseNo}
              onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value.toUpperCase() })}
              placeholder="e.g. DL1001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.licenseNo && <p className="text-xs text-rose-600 mt-1">{errors.licenseNo}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ravi Kumar"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {errors.dob && <p className="text-xs text-rose-600 mt-1">{errors.dob}</p>}
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <MultiInput
            label="Multivalued Contact Numbers *"
            values={formData.contactNumbers}
            onChange={(phones) => {
              setFormData({ ...formData, contactNumbers: phones });
              if (errors.contactNumbers) setErrors({ ...errors, contactNumbers: '' });
            }}
            placeholder="e.g. 9840112233"
            helperText="Add primary phone, duty phone, or emergency contact"
          />
          {errors.contactNumbers && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.contactNumbers}</p>
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
            {isEditing ? 'Save Changes' : 'Register Driver'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
