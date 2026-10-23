import React, { useState, useEffect } from 'react';
import { Payment, PaymentMode } from '../../../types/transit';
import { Modal } from '../../common/Modal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => boolean;
  paymentToEdit?: Payment | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  paymentToEdit,
}) => {
  const isEditing = Boolean(paymentToEdit);

  const [formData, setFormData] = useState<Payment>({
    paymentId: '',
    mode: 'UPI',
    amount: 40.0,
    date: '2026-08-18',
    txnReferenceNo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (paymentToEdit) {
      setFormData(paymentToEdit);
    } else {
      setFormData({
        paymentId: `PAY00${Math.floor(10 + Math.random() * 90)}`,
        mode: 'UPI',
        amount: 40.0,
        date: new Date().toISOString().slice(0, 10),
        txnReferenceNo: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      });
    }
    setErrors({});
  }, [paymentToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.paymentId.trim()) newErrors.paymentId = 'Payment ID is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be positive';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.txnReferenceNo.trim()) newErrors.txnReferenceNo = 'Transaction reference is required';
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
      title={isEditing ? `Edit Payment: ${formData.paymentId}` : 'Record Transit Payment'}
      subtitle="Financial transaction audit record for fare collection"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value.toUpperCase() })}
              placeholder="e.g. PAY001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
            />
            {errors.paymentId && <p className="text-xs text-rose-600 mt-1">{errors.paymentId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment Mode *
            </label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value as PaymentMode })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="UPI">UPI / Digital QR</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Cash">Cash at Counter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.amount && <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment Date *
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
            Transaction Reference Number *
          </label>
          <input
            type="text"
            value={formData.txnReferenceNo}
            onChange={(e) => setFormData({ ...formData, txnReferenceNo: e.target.value })}
            placeholder="e.g. UPI-REF-992817462"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
          {errors.txnReferenceNo && (
            <p className="text-xs text-rose-600 mt-1">{errors.txnReferenceNo}</p>
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
            {isEditing ? 'Save Changes' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
