import React, { useState } from 'react';
import { UserPlus, Phone, MapPin, Mail, Calendar } from 'lucide-react';
import { useTransit } from '../../../context/TransitContext';
import { Passenger } from '../../../types/transit';
import { DataTable, Column } from '../../common/DataTable';
import { Badge } from '../../common/Badge';
import { PassengerModal } from './PassengerModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const PassengerModule: React.FC = () => {
  const { passengers, addPassenger, updatePassenger, deletePassenger, globalSearch } = useTransit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passengerToEdit, setPassengerToEdit] = useState<Passenger | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Passenger | null>(null);

  const columns: Column<Passenger>[] = [
    {
      header: 'ID',
      accessor: (p) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {p.passengerId}
        </span>
      ),
      sortKey: 'passengerId',
    },
    {
      header: 'Full Name',
      accessor: (p) => (
        <div>
          <p className="font-bold text-slate-900">
            {p.firstName} {p.lastName}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-slate-400" />
            {p.email}
          </p>
        </div>
      ),
      sortKey: (p) => `${p.firstName} ${p.lastName}`,
    },
    {
      header: 'Gender',
      accessor: (p) => (
        <Badge
          size="sm"
          variant={p.gender === 'F' ? 'purple' : p.gender === 'M' ? 'info' : 'neutral'}
        >
          {p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender}
        </Badge>
      ),
      sortKey: 'gender',
      align: 'center',
    },
    {
      header: 'DOB',
      accessor: (p) => (
        <span className="text-slate-600 flex items-center gap-1 font-mono text-xs">
          <Calendar className="w-3 h-3 text-slate-400" />
          {p.dob}
        </span>
      ),
      sortKey: 'dob',
    },
    {
      header: 'Address',
      accessor: (p) => (
        <div className="max-w-xs text-xs text-slate-600">
          <p className="truncate font-medium text-slate-800">
            {p.doorNo}, {p.street}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {p.city}, {p.state} - {p.pin}
          </p>
        </div>
      ),
    },
    {
      header: 'Contact Numbers (PASSENGER_CONTACT)',
      accessor: (p) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {p.phoneNumbers && p.phoneNumbers.length > 0 ? (
            p.phoneNumbers.map((phone, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200"
              >
                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                {phone}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">None</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrolled</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{passengers.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active passengers in directory</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Contacts</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {passengers.reduce((acc, p) => acc + (p.phoneNumbers?.length || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Registered phone numbers</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Schema Conformance</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">1:N Multivalued Contact</p>
          </div>
          <p className="text-[11px] text-slate-400">PASSENGER_CONTACT sub-entity active</p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        title="Passenger Directory"
        subtitle="Full CRUD on Passenger entity with address and multi-phone relation"
        data={passengers}
        columns={columns}
        keyExtractor={(p) => p.passengerId}
        externalSearch={globalSearch}
        searchPlaceholder="Search by name, email, ID, PIN..."
        filterPredicate={(p, q) =>
          p.passengerId.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.pin.includes(q) ||
          p.phoneNumbers.some((ph) => ph.includes(q))
        }
        headerAction={
          <button
            type="button"
            onClick={() => {
              setPassengerToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Passenger
          </button>
        }
        onEdit={(p) => {
          setPassengerToEdit(p);
          setIsModalOpen(true);
        }}
        onDelete={(p) => setDeleteTarget(p)}
      />

      {/* CRUD Modal */}
      <PassengerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPassengerToEdit(null);
        }}
        onSave={(item) => (passengerToEdit ? updatePassenger(item) : addPassenger(item))}
        passengerToEdit={passengerToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deletePassenger(deleteTarget.passengerId);
            setDeleteTarget(null);
          }
        }}
        title="Delete Passenger Record"
        message={`Are you sure you want to remove passenger ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.passengerId})? Associated contact numbers will also be purged.`}
      />
    </div>
  );
};
