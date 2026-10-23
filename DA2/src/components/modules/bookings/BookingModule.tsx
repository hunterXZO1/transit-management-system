import React, { useState } from 'react';
import { Booking, Ticket, Payment, TicketType, TravelClass, PaymentMode } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { DataTable, Column } from '../../common/DataTable';
import { Badge } from '../../common/Badge';
import {
  Ticket as TicketIcon,
  CreditCard,
  Plus,
  QrCode,
  Calendar,
  User,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { PaymentModal } from './PaymentModal';
import { TicketCardModal } from './TicketCardModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const BookingModule: React.FC = () => {
  const {
    bookings,
    tickets,
    payments,
    passengers,
    trips,
    routes,
    addBooking,
    updateBooking,
    deleteBooking,
    addPayment,
    updatePayment,
    deletePayment,
    addTicket,
    deleteTicket,
    globalSearch,
  } = useTransit();

  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'tickets' | 'payments'>('bookings');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<Booking | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null);

  // Ticket Preview & Delete State
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null);
  const [deleteTicketTarget, setDeleteTicketTarget] = useState<Ticket | null>(null);

  const handleSaveBooking = (
    booking: Booking,
    issueTicketAndPayment: boolean,
    ticketDetails?: {
      ticketType: TicketType;
      travelClass: TravelClass;
      amount: number;
      paymentMode: PaymentMode;
    }
  ) => {
    let success = false;
    if (bookingToEdit) {
      success = updateBooking(booking);
    } else {
      success = addBooking(booking);
      if (success && issueTicketAndPayment && ticketDetails) {
        const paymentId = `PAY00${Math.floor(10 + Math.random() * 90)}`;
        const ticketId = `TK00${Math.floor(10 + Math.random() * 90)}`;
        const today = new Date().toISOString().slice(0, 10);

        // 1. Create Payment
        const paymentRecord: Payment = {
          paymentId,
          mode: ticketDetails.paymentMode,
          amount: ticketDetails.amount,
          date: today,
          txnReferenceNo: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        };
        addPayment(paymentRecord);

        // 2. Create Ticket
        const ticketRecord: Ticket = {
          ticketId,
          bookingId: booking.bookingId,
          passengerId: booking.passengerId,
          tripId: booking.tripId,
          issueDate: today,
          ticketType: ticketDetails.ticketType,
          travelClass: ticketDetails.travelClass,
          paymentId,
        };
        addTicket(ticketRecord);
      }
    }
    return success;
  };

  // Columns: Bookings
  const bookingColumns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      accessor: (b) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {b.bookingId}
        </span>
      ),
      sortKey: 'bookingId',
    },
    {
      header: 'Passenger',
      accessor: (b) => {
        const p = passengers.find((pass) => pass.passengerId === b.passengerId);
        return (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="font-bold text-slate-900 text-xs">
                {p ? `${p.firstName} ${p.lastName}` : b.passengerId}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">{b.passengerId}</p>
            </div>
          </div>
        );
      },
      sortKey: 'passengerId',
    },
    {
      header: 'Assigned Trip & Route',
      accessor: (b) => {
        const t = trips.find((trip) => trip.tripId === b.tripId);
        const r = t ? routes.find((route) => route.routeId === t.routeId) : null;
        return (
          <div>
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold text-slate-800 text-xs">{b.tripId}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-600 font-medium">{r?.name || 'Corridor'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {t?.date} ({t?.startTime} - {t?.endTime})
            </p>
          </div>
        );
      },
      sortKey: 'tripId',
    },
    {
      header: 'Seat',
      accessor: (b) => (
        <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
          {b.seatNumber}
        </span>
      ),
      sortKey: 'seatNumber',
      align: 'center',
    },
    {
      header: 'Booking Date',
      accessor: (b) => (
        <span className="font-mono text-xs text-slate-600 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {b.date}
        </span>
      ),
      sortKey: 'date',
    },
    {
      header: 'Status',
      accessor: (b) => (
        <Badge variant={b.status === 'Confirmed' ? 'success' : 'danger'} size="sm">
          {b.status}
        </Badge>
      ),
      sortKey: 'status',
      align: 'center',
    },
  ];

  // Columns: Tickets
  const ticketColumns: Column<Ticket>[] = [
    {
      header: 'Ticket ID',
      accessor: (tk) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {tk.ticketId}
        </span>
      ),
      sortKey: 'ticketId',
    },
    {
      header: 'Passenger',
      accessor: (tk) => {
        const p = passengers.find((pass) => pass.passengerId === tk.passengerId);
        return (
          <span className="font-bold text-slate-900 text-xs">
            {p ? `${p.firstName} ${p.lastName}` : tk.passengerId}
          </span>
        );
      },
      sortKey: 'passengerId',
    },
    {
      header: 'Trip & Booking',
      accessor: (tk) => (
        <span className="font-mono text-xs text-slate-700">
          Trip {tk.tripId} • Ref: {tk.bookingId}
        </span>
      ),
      sortKey: 'tripId',
    },
    {
      header: 'Type & Class',
      accessor: (tk) => (
        <div className="flex items-center gap-1">
          <Badge variant={tk.travelClass === 'AC' ? 'purple' : 'neutral'} size="sm">
            {tk.travelClass}
          </Badge>
          <span className="text-[11px] text-slate-600 font-medium">{tk.ticketType}</span>
        </div>
      ),
    },
    {
      header: 'Payment ID',
      accessor: (tk) => {
        const pay = payments.find((p) => p.paymentId === tk.paymentId);
        return (
          <div className="font-mono text-xs">
            <span className="text-emerald-700 font-semibold">{tk.paymentId}</span>
            <span className="text-slate-400 text-[10px] block">
              ${pay?.amount.toFixed(2)} ({pay?.mode})
            </span>
          </div>
        );
      },
      sortKey: 'paymentId',
    },
    {
      header: 'Boarding Pass',
      accessor: (tk) => (
        <button
          type="button"
          onClick={() => setPreviewTicket(tk)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        >
          <QrCode className="w-3 h-3" />
          View Pass
        </button>
      ),
    },
  ];

  // Columns: Payments
  const paymentColumns: Column<Payment>[] = [
    {
      header: 'Payment ID',
      accessor: (p) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {p.paymentId}
        </span>
      ),
      sortKey: 'paymentId',
    },
    {
      header: 'Mode',
      accessor: (p) => (
        <Badge
          variant={p.mode === 'UPI' ? 'success' : p.mode === 'Card' ? 'info' : 'neutral'}
          size="sm"
        >
          {p.mode}
        </Badge>
      ),
      sortKey: 'mode',
      align: 'center',
    },
    {
      header: 'Amount Collected',
      accessor: (p) => (
        <span className="font-mono font-black text-slate-900 text-xs">
          ${p.amount.toFixed(2)}
        </span>
      ),
      sortKey: 'amount',
    },
    {
      header: 'Transaction Reference',
      accessor: (p) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {p.txnReferenceNo}
        </span>
      ),
      sortKey: 'txnReferenceNo',
    },
    {
      header: 'Txn Date',
      accessor: (p) => (
        <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {p.date}
        </span>
      ),
      sortKey: 'date',
    },
  ];

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bookings</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{bookings.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Passenger-to-trip relations</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tickets Issued</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{tickets.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active boarding passes</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payments Logged</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Settled transactions</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated fare collection</p>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('bookings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'bookings'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5" />
            Bookings (M:N) ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tickets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'tickets'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Issued Tickets ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('payments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'payments'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payment Ledger ({payments.length})
          </button>
        </div>
      </div>

      {/* View 1: Bookings */}
      {activeSubTab === 'bookings' && (
        <DataTable
          title="Passenger Trip Reservations"
          subtitle="M:N mapping between Passenger and Scheduled Trip with collision-protected seat selection"
          data={bookings}
          columns={bookingColumns}
          keyExtractor={(b) => b.bookingId}
          externalSearch={globalSearch}
          searchPlaceholder="Search bookings by ID, passenger, trip, or seat..."
          filterPredicate={(b, q) =>
            b.bookingId.toLowerCase().includes(q) ||
            b.passengerId.toLowerCase().includes(q) ||
            b.tripId.toLowerCase().includes(q) ||
            b.seatNumber.toLowerCase().includes(q) ||
            b.status.toLowerCase().includes(q)
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setBookingToEdit(null);
                setIsBookingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Booking
            </button>
          }
          onEdit={(b) => {
            setBookingToEdit(b);
            setIsBookingModalOpen(true);
          }}
          onDelete={(b) => setDeleteBookingTarget(b)}
        />
      )}

      {/* View 2: Tickets */}
      {activeSubTab === 'tickets' && (
        <DataTable
          title="Issued Boarding Tickets"
          subtitle="Official transit passes linked to passenger booking and verified payment transaction"
          data={tickets}
          columns={ticketColumns}
          keyExtractor={(tk) => tk.ticketId}
          externalSearch={globalSearch}
          searchPlaceholder="Search tickets by ID, passenger, or payment..."
          filterPredicate={(tk, q) =>
            tk.ticketId.toLowerCase().includes(q) ||
            tk.passengerId.toLowerCase().includes(q) ||
            tk.tripId.toLowerCase().includes(q) ||
            tk.paymentId.toLowerCase().includes(q) ||
            tk.ticketType.toLowerCase().includes(q)
          }
          onDelete={(tk) => setDeleteTicketTarget(tk)}
        />
      )}

      {/* View 3: Payments */}
      {activeSubTab === 'payments' && (
        <DataTable
          title="Payment Audit Ledger"
          subtitle="Payment records via UPI, Card, and Cash with verified transaction references"
          data={payments}
          columns={paymentColumns}
          keyExtractor={(p) => p.paymentId}
          externalSearch={globalSearch}
          searchPlaceholder="Search payments by ID, mode, reference..."
          filterPredicate={(p, q) =>
            p.paymentId.toLowerCase().includes(q) ||
            p.mode.toLowerCase().includes(q) ||
            p.txnReferenceNo.toLowerCase().includes(q)
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setPaymentToEdit(null);
                setIsPaymentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Payment
            </button>
          }
          onEdit={(p) => {
            setPaymentToEdit(p);
            setIsPaymentModalOpen(true);
          }}
          onDelete={(p) => setDeletePaymentTarget(p)}
        />
      )}

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        onSave={handleSaveBooking}
        bookingToEdit={bookingToEdit}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentToEdit(null);
        }}
        onSave={(item) => (paymentToEdit ? updatePayment(item) : addPayment(item))}
        paymentToEdit={paymentToEdit}
      />

      <TicketCardModal
        isOpen={Boolean(previewTicket)}
        onClose={() => setPreviewTicket(null)}
        ticket={previewTicket}
      />

      {/* Delete Safeguards */}
      <ConfirmDialog
        isOpen={Boolean(deleteBookingTarget)}
        onClose={() => setDeleteBookingTarget(null)}
        onConfirm={() => {
          if (deleteBookingTarget) {
            deleteBooking(deleteBookingTarget.bookingId);
            setDeleteBookingTarget(null);
          }
        }}
        title="Cancel Booking"
        message={`Are you sure you want to cancel Booking ${deleteBookingTarget?.bookingId} for Seat ${deleteBookingTarget?.seatNumber}?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deletePaymentTarget)}
        onClose={() => setDeletePaymentTarget(null)}
        onConfirm={() => {
          if (deletePaymentTarget) {
            deletePayment(deletePaymentTarget.paymentId);
            setDeletePaymentTarget(null);
          }
        }}
        title="Void Payment Record"
        message={`Are you sure you want to delete payment record ${deletePaymentTarget?.paymentId} of amount $${deletePaymentTarget?.amount}?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTicketTarget)}
        onClose={() => setDeleteTicketTarget(null)}
        onConfirm={() => {
          if (deleteTicketTarget) {
            deleteTicket(deleteTicketTarget.ticketId);
            setDeleteTicketTarget(null);
          }
        }}
        title="Revoke Ticket"
        message={`Are you sure you want to revoke ticket #${deleteTicketTarget?.ticketId}?`}
      />
    </div>
  );
};
