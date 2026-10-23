import React, { useState, useEffect } from 'react';
import { Booking, PaymentMode, TravelClass, TicketType } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';
import { AlertCircle, Ticket as TicketIcon } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    booking: Booking,
    issueTicketAndPayment: boolean,
    ticketDetails?: {
      ticketType: TicketType;
      travelClass: TravelClass;
      amount: number;
      paymentMode: PaymentMode;
    }
  ) => boolean;
  bookingToEdit?: Booking | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookingToEdit,
}) => {
  const { passengers, trips, bookings, routes } = useTransit();
  const isEditing = Boolean(bookingToEdit);

  const [formData, setFormData] = useState<Booking>({
    bookingId: '',
    passengerId: passengers[0]?.passengerId ?? 'P001',
    tripId: trips[0]?.tripId ?? 'T001',
    seatNumber: 'A01',
    date: '2026-08-20',
    status: 'Confirmed',
  });

  // Optional combined ticket + payment issuance
  const [autoIssueTicket, setAutoIssueTicket] = useState(!isEditing);
  const [ticketType, setTicketType] = useState<TicketType>('Regular');
  const [travelClass, setTravelClass] = useState<TravelClass>('General');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [amount, setAmount] = useState<number>(40.0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bookingToEdit) {
      setFormData(bookingToEdit);
      setAutoIssueTicket(false);
    } else {
      setFormData({
        bookingId: `B00${Math.floor(10 + Math.random() * 90)}`,
        passengerId: passengers[0]?.passengerId ?? 'P001',
        tripId: trips[0]?.tripId ?? 'T001',
        seatNumber: `A0${Math.floor(1 + Math.random() * 9)}`,
        date: '2026-08-20',
        status: 'Confirmed',
      });
      setAutoIssueTicket(true);
    }
    setErrors({});
  }, [bookingToEdit, isOpen, passengers, trips]);

  // Seat collision check
  const seatConflict = bookings.find(
    (b) =>
      b.tripId === formData.tripId &&
      b.seatNumber.trim().toUpperCase() === formData.seatNumber.trim().toUpperCase() &&
      b.bookingId !== formData.bookingId &&
      b.status === 'Confirmed'
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.bookingId.trim()) newErrors.bookingId = 'Booking ID is required';
    if (!formData.passengerId) newErrors.passengerId = 'Select a passenger';
    if (!formData.tripId) newErrors.tripId = 'Select a trip';
    if (!formData.seatNumber.trim()) newErrors.seatNumber = 'Seat number is required';
    if (!formData.date) newErrors.date = 'Booking date is required';
    if (seatConflict) {
      newErrors.seatNumber = `Seat ${formData.seatNumber} is already booked on Trip ${formData.tripId}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const success = onSave(
      formData,
      autoIssueTicket,
      autoIssueTicket
        ? {
            ticketType,
            travelClass,
            amount,
            paymentMode,
          }
        : undefined
    );
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Booking: ${formData.bookingId}` : 'Create Passenger Trip Booking (M:N)'}
      subtitle="Relational link associating a Passenger with a Scheduled Trip and designated seat"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Booking ID *
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value.toUpperCase() })}
              placeholder="e.g. B001"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 font-mono"
            />
            {errors.bookingId && <p className="text-xs text-rose-600 mt-1">{errors.bookingId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Travel Date *
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

        {/* Passenger Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Passenger *
          </label>
          <select
            value={formData.passengerId}
            onChange={(e) => setFormData({ ...formData, passengerId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {passengers.map((p) => (
              <option key={p.passengerId} value={p.passengerId}>
                {p.firstName} {p.lastName} ({p.passengerId}) — {p.email}
              </option>
            ))}
          </select>
          {errors.passengerId && (
            <p className="text-xs text-rose-600 mt-1">{errors.passengerId}</p>
          )}
        </div>

        {/* Trip Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Scheduled Trip *
          </label>
          <select
            value={formData.tripId}
            onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {trips.map((t) => {
              const r = routes.find((route) => route.routeId === t.routeId);
              return (
                <option key={t.tripId} value={t.tripId}>
                  {t.tripId} ({t.date}) — {t.startTime} to {t.endTime} [{r?.name || t.routeId}]
                </option>
              );
            })}
          </select>
          {errors.tripId && <p className="text-xs text-rose-600 mt-1">{errors.tripId}</p>}
        </div>

        {/* Seat Number & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Seat Number (e.g. A01, B05) *
            </label>
            <input
              type="text"
              value={formData.seatNumber}
              onChange={(e) =>
                setFormData({ ...formData, seatNumber: e.target.value.toUpperCase() })
              }
              placeholder="e.g. A01"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            {errors.seatNumber && (
              <p className="text-xs text-rose-600 mt-1">{errors.seatNumber}</p>
            )}
            {seatConflict && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Seat occupied by another passenger on this trip</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Booking Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'Confirmed' | 'Cancelled' })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Combined Ticket & Payment Quick-Issue Switch */}
        {!isEditing && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={autoIssueTicket}
                onChange={(e) => setAutoIssueTicket(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <TicketIcon className="w-4 h-4 text-indigo-600" />
                Simultaneously issue Boarding Ticket & record Payment
              </span>
            </label>

            {autoIssueTicket && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ticket Type
                  </label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value as TicketType)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Season">Season</option>
                    <option value="Concession">Concession</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Travel Class
                  </label>
                  <select
                    value={travelClass}
                    onChange={(e) => {
                      const tc = e.target.value as TravelClass;
                      setTravelClass(tc);
                      setAmount(tc === 'AC' ? 60.0 : 40.0);
                    }}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="General">General</option>
                    <option value="AC">AC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fare ($)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}
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
            {isEditing ? 'Save Changes' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
