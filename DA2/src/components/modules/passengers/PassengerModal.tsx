import React, { useState, useEffect } from 'react';
import { Passenger, Gender } from '../../../types/transit';
import { Modal } from '../../common/Modal';
import { MultiInput } from '../../common/MultiInput';

interface PassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passenger: Passenger) => boolean;
  passengerToEdit?: Passenger | null;
}

export const PassengerModal: React.FC<PassengerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  passengerToEdit,
}) => {
  const isEditing = Boolean(passengerToEdit);

  const [formData, setFormData] = useState<Passenger>({
    passengerId: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'F',
    dob: '',
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pin: '',
    phoneNumbers: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (passengerToEdit) {
      setFormData(passengerToEdit);
    } else {
      setFormData({
        passengerId: `P00${Math.floor(100 + Math.random() * 900)}`,
        firstName: '',
        lastName: '',
        email: '',
        gender: 'F',
        dob: '',
        doorNo: '',
        street: '',
        city: 'Chennai',
        state: 'TN',
        pin: '',
        phoneNumbers: [],
      });
    }
    setErrors({});
  }, [passengerToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.passengerId.trim()) newErrors.passengerId = 'Passenger ID is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.doorNo.trim()) newErrors.doorNo = 'Door No is required';
    if (!formData.street.trim()) newErrors.street = 'Street is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pin.trim()) {
      newErrors.pin = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pin)) {
      newErrors.pin = 'PIN code must be exactly 6 digits';
    }
    if (formData.phoneNumbers.length === 0) {
      newErrors.phoneNumbers = 'At least one contact phone number is required';
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
      title={isEditing ? `Edit Passenger: ${formData.passengerId}` : 'Enrol New Passenger'}
      subtitle="Main Passenger entity with multivalued contact phone numbers"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: ID, First Name, Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Passenger ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.passengerId}
              onChange={(e) => setFormData({ ...formData, passengerId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
              placeholder="e.g. P001"
            />
            {errors.passengerId && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.passengerId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="e.g. Anu"
            />
            {errors.firstName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="e.g. Kumar"
            />
            {errors.lastName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email, Gender, DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="anu@gmail.com"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="F">Female (F)</option>
              <option value="M">Male (M)</option>
              <option value="Other">Other</option>
            </select>
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
            {errors.dob && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.dob}</p>}
          </div>
        </div>

        {/* Row 3: Multivalued Contact Numbers (PASSENGER_CONTACT) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <MultiInput
            label="Multivalued Phone Contacts (PASSENGER_CONTACT) *"
            values={formData.phoneNumbers}
            onChange={(newPhones) => {
              setFormData({ ...formData, phoneNumbers: newPhones });
              if (errors.phoneNumbers) {
                setErrors({ ...errors, phoneNumbers: '' });
              }
            }}
            placeholder="e.g. 9876543210"
            helperText="Add one or more primary and emergency phone numbers"
          />
          {errors.phoneNumbers && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.phoneNumbers}</p>
          )}
        </div>

        {/* Row 4: Address Details */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Address Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Door No *</label>
              <input
                type="text"
                value={formData.doorNo}
                onChange={(e) => setFormData({ ...formData, doorNo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="12"
              />
              {errors.doorNo && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.doorNo}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street *</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Anna St"
              />
              {errors.street && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.street}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Chennai"
              />
              {errors.city && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="TN"
              />
              {errors.state && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                maxLength={6}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                placeholder="600001"
              />
              {errors.pin && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.pin}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
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
            {isEditing ? 'Save Changes' : 'Create Passenger'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
