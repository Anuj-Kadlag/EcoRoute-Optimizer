import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Fuel,
  IndianRupee,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function VehiclesPage({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onResetDemoVehicles,
  collectionPoints,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    registration_number: '',
    vehicle_type: 'Medium Compactor',
    capacity_kg: 2000,
    fuel_type: 'Diesel',
    fuel_efficiency: 7.5,
    fuel_price: 94.0,
    driver_cost_per_hour: 280.0,
    maintenance_cost_per_km: 14.0,
    activation_cost: 600.0,
    max_working_hours: 8.0,
    status: 'Available',
    color: '#059669',
  });

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      id: `VEH-${(vehicles.length + 1).toString().padStart(2, '0')}`,
      registration_number: `MH-14-GH-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle_type: 'Medium Compactor',
      capacity_kg: 2000,
      fuel_type: 'Diesel',
      fuel_efficiency: 7.5,
      fuel_price: 94.0,
      driver_cost_per_hour: 280.0,
      maintenance_cost_per_km: 14.0,
      activation_cost: 600.0,
      max_working_hours: 8.0,
      status: 'Available',
      color: '#059669',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({ ...v });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingVehicle) {
      await onUpdateVehicle(editingVehicle.id, formData);
    } else {
      await onAddVehicle(formData);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = async (vehicle) => {
    const nextStatus =
      vehicle.status === 'Available'
        ? 'Maintenance'
        : vehicle.status === 'Maintenance'
        ? 'Inactive'
        : 'Available';
    await onUpdateVehicle(vehicle.id, { ...vehicle, status: nextStatus });
  };

  // Fleet Sizing Recommendation calculations
  const totalDemand = collectionPoints.reduce((acc, p) => acc + p.garbage_quantity_kg, 0);
  const totalFleetCapacity = vehicles
    .filter((v) => v.status === 'Available')
    .reduce((acc, v) => acc + v.capacity_kg, 0);
  const estVehiclesNeeded = Math.ceil((totalDemand * 1.15) / 2000); // assume 2000kg avg compactor

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Vehicle Fleet Management
            </h2>
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {vehicles.length} Total Vehicles
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Configure vehicle carrying capacities, fuel types, operating wages, and availability status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onResetDemoVehicles}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            Reset Default 5 Vehicles
          </button>

          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Fleet Sizing Recommendation Banner */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              Automatic Fleet Recommendation Engine
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Current pending demand: <strong>{totalDemand.toLocaleString()} kg</strong> | Available Fleet Capacity: <strong>{totalFleetCapacity.toLocaleString()} kg</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Capacity Coverage</span>
            <strong style={{
              fontSize: '14px',
              color: totalFleetCapacity >= totalDemand ? '#059669' : '#dc2626',
            }}>
              {totalDemand > 0 ? ((totalFleetCapacity / totalDemand) * 100).toFixed(0) : 100}%
            </strong>
          </div>
          <div style={{
            background: totalFleetCapacity >= totalDemand ? '#ecfdf5' : '#fee2e2',
            color: totalFleetCapacity >= totalDemand ? '#059669' : '#dc2626',
            border: `1px solid ${totalFleetCapacity >= totalDemand ? '#a7f3d0' : '#fecaca'}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            {totalFleetCapacity >= totalDemand ? '✓ Fleet Sufficient' : '⚠️ Fleet Deficit - Add Vehicles'}
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {vehicles.map((v) => (
          <div
            key={v.id}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            {/* Top Vehicle Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: v.color || '#059669',
                  }} />
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{v.id}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus(v)}
                  title="Click to toggle status"
                  style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      v.status === 'Available'
                        ? '#ecfdf5'
                        : v.status === 'Maintenance'
                        ? '#fef3c7'
                        : '#f1f5f9',
                    color:
                      v.status === 'Available'
                        ? '#047857'
                        : v.status === 'Maintenance'
                        ? '#92400e'
                        : '#64748b',
                  }}
                >
                  {v.status}
                </button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                {v.vehicle_type}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                Reg: {v.registration_number}
              </div>
            </div>

            {/* Spec Highlights */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '11px',
              color: '#475569',
            }}>
              <div>Capacity: <strong style={{ color: '#0f172a' }}>{v.capacity_kg} kg</strong></div>
              <div>Fuel: <strong>{v.fuel_type}</strong></div>
              <div>Efficiency: <strong>{v.fuel_efficiency} km/L</strong></div>
              <div>Fuel Price: <strong>₹{v.fuel_price}</strong></div>
              <div>Driver: <strong>₹{v.driver_cost_per_hour}/hr</strong></div>
              <div>Maint: <strong>₹{v.maintenance_cost_per_km}/km</strong></div>
              <div>Activation: <strong>₹{v.activation_cost}</strong></div>
              <div>Max Shift: <strong>{v.max_working_hours} hrs</strong></div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => openEditModal(v)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit2 size={13} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDeleteVehicle(v.id)}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#b91c1c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            width: '480px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              {editingVehicle ? `Edit Vehicle: ${editingVehicle.id}` : 'Add New Vehicle to Fleet'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Vehicle ID</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Registration Number</label>
                  <input
                    type="text"
                    required
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Vehicle Type / Model</label>
                <input
                  type="text"
                  required
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Capacity (kg)</label>
                  <input
                    type="number"
                    min="100"
                    max="20000"
                    required
                    value={formData.capacity_kg}
                    onChange={(e) => setFormData({ ...formData, capacity_kg: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Fuel Efficiency (km/L or km/kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    required
                    value={formData.fuel_efficiency}
                    onChange={(e) => setFormData({ ...formData, fuel_efficiency: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Fuel Price (₹/unit)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.fuel_price}
                    onChange={(e) => setFormData({ ...formData, fuel_price: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Driver Wage (₹/hr)</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={formData.driver_cost_per_hour}
                    onChange={(e) => setFormData({ ...formData, driver_cost_per_hour: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Maintenance Cost (₹/km)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maintenance_cost_per_km}
                    onChange={(e) => setFormData({ ...formData, maintenance_cost_per_km: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Activation Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.activation_cost}
                    onChange={(e) => setFormData({ ...formData, activation_cost: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Max Shift Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    required
                    value={formData.max_working_hours}
                    onChange={(e) => setFormData({ ...formData, max_working_hours: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Route Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
