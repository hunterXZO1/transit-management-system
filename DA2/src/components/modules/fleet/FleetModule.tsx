import React, { useState } from 'react';
import { Vehicle, Driver, VehicleType } from '../../../types/transit';
import { useTransit } from '../../../context/TransitContext';
import { DataTable, Column } from '../../common/DataTable';
import { Badge } from '../../common/Badge';
import { Bus, Users, Wrench, Plus, Fuel, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VehicleModal } from './VehicleModal';
import { DriverModal } from './DriverModal';
import { VehicleTypeModal } from './VehicleTypeModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const FleetModule: React.FC = () => {
  const {
    vehicles,
    drivers,
    vehicleTypes,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
    addVehicleType,
    updateVehicleType,
    deleteVehicleType,
    globalSearch,
  } = useTransit();

  const [activeSubTab, setActiveSubTab] = useState<'vehicles' | 'drivers' | 'types'>('vehicles');

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState<Vehicle | null>(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [deleteDriverTarget, setDeleteDriverTarget] = useState<Driver | null>(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<VehicleType | null>(null);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<VehicleType | null>(null);

  // Column definitions: Vehicles
  const vehicleColumns: Column<Vehicle>[] = [
    {
      header: 'Vehicle ID',
      accessor: (v) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {v.vehicleId}
        </span>
      ),
      sortKey: 'vehicleId',
    },
    {
      header: 'Registration No',
      accessor: (v) => (
        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs">
          <Bus className="w-3.5 h-3.5 text-slate-400" />
          <span>{v.registrationNo}</span>
        </div>
      ),
      sortKey: 'registrationNo',
    },
    {
      header: 'Classification & Fuel',
      accessor: (v) => {
        const vt = vehicleTypes.find((t) => t.typeId === v.vehicleTypeId);
        return (
          <div>
            <p className="font-bold text-slate-800 text-xs">{vt?.name || v.vehicleTypeId}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge
                variant={
                  vt?.fuelType === 'Electric'
                    ? 'success'
                    : vt?.fuelType === 'CNG'
                    ? 'info'
                    : 'amber'
                }
                size="sm"
              >
                <Fuel className="w-2.5 h-2.5 inline" /> {vt?.fuelType || 'Diesel'}
              </Badge>
              <span className="text-[10px] text-slate-400 font-mono">Cap: {vt?.capacity}</span>
            </div>
          </div>
        );
      },
      sortKey: 'vehicleTypeId',
    },
    {
      header: 'Color',
      accessor: (v) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
          <span
            className="w-2.5 h-2.5 rounded-full border border-slate-300"
            style={{
              backgroundColor:
                v.color.toLowerCase().includes('blue')
                  ? '#0284c7'
                  : v.color.toLowerCase().includes('white')
                  ? '#f8fafc'
                  : v.color.toLowerCase().includes('green')
                  ? '#10b981'
                  : '#64748b',
            }}
          />
          {v.color}
        </span>
      ),
      sortKey: 'color',
    },
    {
      header: 'Assigned Driver (1:1 Constraint)',
      accessor: (v) => {
        const driver = drivers.find((d) => d.driverId === v.assignedDriverId);
        if (!driver) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
              <AlertCircle className="w-3 h-3 text-amber-500" /> Unassigned
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {driver.name} ({driver.driverId})
            </span>
          </div>
        );
      },
      sortKey: 'assignedDriverId',
    },
    {
      header: 'Manufactured',
      accessor: (v) => <span className="font-mono text-xs text-slate-500">{v.manufactureDate}</span>,
      sortKey: 'manufactureDate',
    },
  ];

  // Column definitions: Drivers
  const driverColumns: Column<Driver>[] = [
    {
      header: 'Driver ID',
      accessor: (d) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {d.driverId}
        </span>
      ),
      sortKey: 'driverId',
    },
    {
      header: 'Driver Name',
      accessor: (d) => <span className="font-bold text-slate-900 text-xs">{d.name}</span>,
      sortKey: 'name',
    },
    {
      header: 'License No',
      accessor: (d) => (
        <span className="font-mono font-semibold text-slate-700 text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {d.licenseNo}
        </span>
      ),
      sortKey: 'licenseNo',
    },
    {
      header: 'DOB',
      accessor: (d) => <span className="font-mono text-xs text-slate-600">{d.dob}</span>,
      sortKey: 'dob',
    },
    {
      header: 'Assigned Vehicle',
      accessor: (d) => {
        const assignedVehicle = vehicles.find((v) => v.assignedDriverId === d.driverId);
        return assignedVehicle ? (
          <span className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
            {assignedVehicle.vehicleId} ({assignedVehicle.registrationNo})
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Standby / Unassigned</span>
        );
      },
    },
    {
      header: 'Contact Numbers (PASSENGER_CONTACT)',
      accessor: (d) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {d.contactNumbers.map((phone, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700"
            >
              <Phone className="w-2.5 h-2.5 text-emerald-600" />
              {phone}
            </span>
          ))}
        </div>
      ),
    },
  ];

  // Column definitions: Vehicle Types
  const typeColumns: Column<VehicleType>[] = [
    {
      header: 'Type ID',
      accessor: (vt) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {vt.typeId}
        </span>
      ),
      sortKey: 'typeId',
    },
    {
      header: 'Type Name',
      accessor: (vt) => <span className="font-bold text-slate-900 text-xs">{vt.name}</span>,
      sortKey: 'name',
    },
    {
      header: 'Passenger Capacity',
      accessor: (vt) => (
        <span className="font-mono font-bold text-slate-800 text-xs">{vt.capacity} Seats</span>
      ),
      sortKey: 'capacity',
    },
    {
      header: 'Fuel Type',
      accessor: (vt) => (
        <Badge
          variant={
            vt.fuelType === 'Electric' ? 'success' : vt.fuelType === 'CNG' ? 'info' : 'amber'
          }
          size="sm"
        >
          {vt.fuelType}
        </Badge>
      ),
      sortKey: 'fuelType',
      align: 'center',
    },
    {
      header: 'Active In Fleet',
      accessor: (vt) => {
        const count = vehicles.filter((v) => v.vehicleTypeId === vt.typeId).length;
        return (
          <span className="font-mono text-xs font-semibold text-slate-700">
            {count} vehicles
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Fleet</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{vehicles.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Vehicles in service</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Drivers Roster</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{drivers.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Licensed drivers</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assignment Rate</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {vehicles.filter((v) => v.assignedDriverId).length} / {vehicles.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">1:1 Assigned vehicles</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vehicle Types</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{vehicleTypes.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Diesel, CNG, Electric</p>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('vehicles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'vehicles'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            Vehicles ({vehicles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('drivers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'drivers'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Drivers ({drivers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('types')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'types'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Vehicle Types ({vehicleTypes.length})
          </button>
        </div>
      </div>

      {/* View 1: Vehicles */}
      {activeSubTab === 'vehicles' && (
        <DataTable
          title="Fleet Vehicles"
          subtitle="Inventory of transit buses and metro rakes with driver assignment"
          data={vehicles}
          columns={vehicleColumns}
          keyExtractor={(v) => v.vehicleId}
          externalSearch={globalSearch}
          searchPlaceholder="Search vehicles by reg no, ID, color..."
          filterPredicate={(v, q) =>
            v.vehicleId.toLowerCase().includes(q) ||
            v.registrationNo.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            Boolean(v.assignedDriverId && v.assignedDriverId.toLowerCase().includes(q))
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setVehicleToEdit(null);
                setIsVehicleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Vehicle
            </button>
          }
          onEdit={(v) => {
            setVehicleToEdit(v);
            setIsVehicleModalOpen(true);
          }}
          onDelete={(v) => setDeleteVehicleTarget(v)}
        />
      )}

      {/* View 2: Drivers */}
      {activeSubTab === 'drivers' && (
        <DataTable
          title="Drivers Directory"
          subtitle="Certified operators with contact details and 1:1 vehicle assignments"
          data={drivers}
          columns={driverColumns}
          keyExtractor={(d) => d.driverId}
          externalSearch={globalSearch}
          searchPlaceholder="Search drivers by name, ID, license..."
          filterPredicate={(d, q) =>
            d.driverId.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q) ||
            d.licenseNo.toLowerCase().includes(q) ||
            d.contactNumbers.some((num) => num.includes(q))
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setDriverToEdit(null);
                setIsDriverModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Enrol Driver
            </button>
          }
          onEdit={(d) => {
            setDriverToEdit(d);
            setIsDriverModalOpen(true);
          }}
          onDelete={(d) => setDeleteDriverTarget(d)}
        />
      )}

      {/* View 3: Vehicle Types */}
      {activeSubTab === 'types' && (
        <DataTable
          title="Vehicle Classifications & Specifications"
          subtitle="Capacity constraints, seating layouts, and fuel types"
          data={vehicleTypes}
          columns={typeColumns}
          keyExtractor={(vt) => vt.typeId}
          externalSearch={globalSearch}
          searchPlaceholder="Search types by name or ID..."
          filterPredicate={(vt, q) =>
            vt.typeId.toLowerCase().includes(q) ||
            vt.name.toLowerCase().includes(q) ||
            vt.fuelType.toLowerCase().includes(q)
          }
          headerAction={
            <button
              type="button"
              onClick={() => {
                setTypeToEdit(null);
                setIsTypeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Vehicle Type
            </button>
          }
          onEdit={(vt) => {
            setTypeToEdit(vt);
            setIsTypeModalOpen(true);
          }}
          onDelete={(vt) => setDeleteTypeTarget(vt)}
        />
      )}

      {/* Modals */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={(item) => (vehicleToEdit ? updateVehicle(item) : addVehicle(item))}
        vehicleToEdit={vehicleToEdit}
      />

      <DriverModal
        isOpen={isDriverModalOpen}
        onClose={() => {
          setIsDriverModalOpen(false);
          setDriverToEdit(null);
        }}
        onSave={(item) => (driverToEdit ? updateDriver(item) : addDriver(item))}
        driverToEdit={driverToEdit}
      />

      <VehicleTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setTypeToEdit(null);
        }}
        onSave={(item) => (typeToEdit ? updateVehicleType(item) : addVehicleType(item))}
        typeToEdit={typeToEdit}
      />

      {/* Deletion Confirms */}
      <ConfirmDialog
        isOpen={Boolean(deleteVehicleTarget)}
        onClose={() => setDeleteVehicleTarget(null)}
        onConfirm={() => {
          if (deleteVehicleTarget) {
            deleteVehicle(deleteVehicleTarget.vehicleId);
            setDeleteVehicleTarget(null);
          }
        }}
        title="Delete Vehicle"
        message={`Are you sure you want to decommission vehicle ${deleteVehicleTarget?.registrationNo} (${deleteVehicleTarget?.vehicleId})?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteDriverTarget)}
        onClose={() => setDeleteDriverTarget(null)}
        onConfirm={() => {
          if (deleteDriverTarget) {
            deleteDriver(deleteDriverTarget.driverId);
            setDeleteDriverTarget(null);
          }
        }}
        title="Remove Driver"
        message={`Are you sure you want to remove driver ${deleteDriverTarget?.name} (${deleteDriverTarget?.driverId})? Any vehicle assigned to this driver will be marked unassigned.`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTypeTarget)}
        onClose={() => setDeleteTypeTarget(null)}
        onConfirm={() => {
          if (deleteTypeTarget) {
            deleteVehicleType(deleteTypeTarget.typeId);
            setDeleteTypeTarget(null);
          }
        }}
        title="Delete Vehicle Type"
        message={`Are you sure you want to delete type classification ${deleteTypeTarget?.name} (${deleteTypeTarget?.typeId})?`}
      />
    </div>
  );
};
