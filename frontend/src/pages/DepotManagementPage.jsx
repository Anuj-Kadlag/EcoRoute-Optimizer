import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Save,
  CheckCircle,
  Compass,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import MoshiMap from '../map/MoshiMap';

export default function DepotManagementPage({
  depot,
  onUpdateDepot,
  boundary,
  collectionPoints,
}) {
  const [formData, setFormData] = useState({
    id: depot?.id || 'DEPOT-01',
    name: depot?.name || 'PCMC Moshi Waste Processing & Transfer Station',
    lat: depot?.lat || 18.6794,
    lng: depot?.lng || 73.8492,
    address: depot?.address || 'Spine Road, Moshi Gaothan, Pimpri-Chinchwad, Maharashtra 412105',
    service_radius_km: depot?.service_radius_km || 10.0,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pickMode, setPickMode] = useState(false);

  const handleMapClick = (latlng) => {
    if (pickMode) {
      setFormData((prev) => ({
        ...prev,
        lat: parseFloat(latlng.lat.toFixed(5)),
        lng: parseFloat(latlng.lng.toFixed(5)),
      }));
      setPickMode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdateDepot(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          Depot & Transfer Facility Management
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Configure the central starting and ending depot facility for all waste collection vehicles in Moshi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
        {/* Depot Form */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0f172a',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Primary Depot Configuration
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Vehicle Yard & Material Recovery Facility
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Depot Facility Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Street Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Depot Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Depot Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Service Radius Coverage (km)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                required
                value={formData.service_radius_km}
                onChange={(e) => setFormData({ ...formData, service_radius_km: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setPickMode(!pickMode)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${pickMode ? '#059669' : '#cbd5e1'}`,
                  background: pickMode ? '#ecfdf5' : '#ffffff',
                  color: pickMode ? '#059669' : '#334155',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <MapPin size={15} />
                {pickMode ? 'Click on Map to Pick' : 'Pick Location from Map'}
              </button>

              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                }}
              >
                <Save size={15} />
                Save Depot
              </button>
            </div>

            {savedSuccess && (
              <div style={{
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <CheckCircle size={15} />
                Depot parameters updated and saved successfully!
              </div>
            )}
          </form>
        </div>

        {/* Live Map with Depot Location */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Depot Positioning in Moshi
            </span>
            {pickMode && (
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                Click anywhere to reposition depot
              </span>
            )}
          </div>

          <div style={{ height: '420px', borderRadius: '10px', overflow: 'hidden' }}>
            <MoshiMap
              center={[formData.lat, formData.lng]}
              zoom={14}
              collectionPoints={collectionPoints}
              depot={{
                ...formData,
                lat: formData.lat,
                lng: formData.lng,
              }}
              boundary={boundary}
              onMapClick={handleMapClick}
              isClickToAddActive={pickMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
