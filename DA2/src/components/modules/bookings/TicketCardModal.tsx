import React from 'react';
import { Ticket } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { Printer, Bus, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';

interface TicketCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export const TicketCardModal: React.FC<TicketCardModalProps> = ({ isOpen, onClose, ticket }) => {
  const { passengers, trips, routes, payments, bookings } = useTransit();

  if (!ticket) return null;

  const passenger = passengers.find((p) => p.passengerId === ticket.passengerId);
  const trip = trips.find((t) => t.tripId === ticket.tripId);
  const route = trip ? routes.find((r) => r.routeId === trip.routeId) : null;
  const payment = payments.find((pay) => pay.paymentId === ticket.paymentId);
  const booking = bookings.find((b) => b.bookingId === ticket.bookingId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transit Boarding Pass #${ticket.ticketId}`}
      subtitle="Issued digital ticket with relational booking and payment link"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Printable Ticket Container */}
        <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 print:border-black print:text-black print:bg-white">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Bus className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white">TransitFlow Pass</h3>
                <p className="text-xs text-slate-400">Electronic Boarding Ticket</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {route && (
                <Badge variant={route.type === 'Metro' ? 'metro' : 'bus'} size="sm">
                  {route.type} Express
                </Badge>
              )}
              <span className="font-mono text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-400">
                {ticket.ticketId}
              </span>
            </div>
          </div>

          {/* Ticket Middle Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passenger info */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Passenger Name
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {passenger ? `${passenger.firstName} ${passenger.lastName}` : ticket.passengerId}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{passenger?.email}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Designated Seat
                </span>
                <span className="inline-block text-lg font-black text-emerald-400 font-mono mt-0.5 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                  {booking?.seatNumber || 'A01'}
                </span>
              </div>
            </div>

            {/* Journey Schedule */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Corridor Line
                </span>
                <p className="text-sm font-bold text-white mt-0.5">{route?.name || 'Corridor'}</p>
                <p className="text-[11px] text-slate-400 font-mono">Trip #{trip?.tripId}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Run Timings
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-white mt-0.5">
                  <span className="font-bold">{trip?.startTime || '08:00'}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold">{trip?.endTime || '08:45'}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{trip?.date}</p>
              </div>
            </div>

            {/* Class, Fare & QR */}
            <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-3">
              <div className="md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Class & Tariff
                </span>
                <div className="flex items-center md:justify-end gap-1.5 mt-1">
                  <Badge variant={ticket.travelClass === 'AC' ? 'purple' : 'neutral'} size="sm">
                    {ticket.travelClass} Class
                  </Badge>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {ticket.ticketType}
                  </span>
                </div>
                <p className="text-base font-extrabold text-white mt-1 font-mono">
                  ${payment?.amount.toFixed(2) || '40.00'}
                </p>
              </div>

              {/* QR Mock graphic */}
              <div className="flex items-center gap-2 bg-white text-slate-900 p-2 rounded-xl">
                <QrCode className="w-8 h-8" />
                <div className="text-left font-mono">
                  <p className="text-[9px] uppercase font-bold text-slate-500 leading-none">Security Hash</p>
                  <p className="text-[10px] font-bold text-slate-900 leading-tight">VALID-PASS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer Strip */}
          <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid via {payment?.mode || 'UPI'} • Ref: {payment?.txnReferenceNo || 'N/A'}</span>
            </div>
            <span className="font-mono">Issued: {ticket.issueDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            Pass ready for QR gate scanning or conductor verification
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Pass
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
