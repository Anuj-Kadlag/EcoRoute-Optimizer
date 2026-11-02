import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Fuel,
  IndianRupee,
  Clock,
  Compass,
  Save,
  CheckCircle,
  RotateCw,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({
  settings,
  onUpdateSettings,
  boundary,
  onUpdateBoundary,
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [boundaryData, setBoundaryData] = useState({ ...boundary });
  const [osrmUrl, setOsrmUrl] = useState('https://router.project-osrm.org');
  const [osrmStatus, setOsrmStatus] = useState(null);
  const [testingOsrm, setTestingOsrm] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    await onUpdateSettings(formData);
    await onUpdateBoundary(boundaryData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTestOsrm = async () => {
    setTestingOsrm(true);
    setOsrmStatus(null);
    try {
      await api.updateRoutingProvider(osrmUrl);
      const health = await api.getHealth();
      setOsrmStatus({ success: true, message: `Connected to: ${health.routing_provider}` });
    } catch (err) {
      setOsrmStatus({ success: false, message: `Failed to connect: ${err.message}` });
    } finally {
      setTestingOsrm(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          System & Optimization Settings
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Configure CVRP algorithm parameters, economic cost overrides, and road network routing services.
        </p>
      </div>

      <form onSubmit={handleSubmitSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card 1: Optimization Objective & Strategy */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={18} color="#059669" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Optimization Objective & Strategy
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Primary Optimization Goal
              </label>
              <select
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              >
                <option value="min_cost">Minimum Operating Cost (Fuel + Wages + Maint + Activation)</option>
                <option value="min_vehicles">Minimum Number of Vehicles Deployed</option>
                <option value="fastest">Fastest Collection Completion (Makespan)</option>
                <option value="balanced">Balanced Fleet Workload</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Fleet Sizing Mode
              </label>
              <select
                value={formData.fleet_mode}
                onChange={(e) => setFormData({ ...formData, fleet_mode: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              >
                <option value="manual">Manual Fleet Selection (Available Vehicles)</option>
                <option value="auto_recommend">Automatic Fleet Sizing Recommendation</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Solver Search Time Limit (seconds)
              </label>
              <input
                type="number"
                min="2"
                max="60"
                value={formData.search_time_limit_seconds}
                onChange={(e) => setFormData({ ...formData, search_time_limit_seconds: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Shift Working Hours Override (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="2"
                max="24"
                placeholder="Leave blank for per-vehicle setting"
                value={formData.working_hours_override || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    working_hours_override: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Routing Provider (OSRM) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Globe size={18} color="#2563eb" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Road Routing Service Provider (OSRM)
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
            Configurable OSRM or OpenStreetMap routing endpoint for road distance matrices and geometries.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={osrmUrl}
              onChange={(e) => setOsrmUrl(e.target.value)}
              placeholder="e.g. https://router.project-osrm.org or local http://localhost:5000"
              style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={handleTestOsrm}
              disabled={testingOsrm}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {testingOsrm ? <RotateCw size={14} className="animate-spin" /> : 'Test & Set URL'}
            </button>
          </div>

          {osrmStatus && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              background: osrmStatus.success ? '#ecfdf5' : '#fee2e2',
              color: osrmStatus.success ? '#047857' : '#b91c1c',
            }}>
              {osrmStatus.message}
            </div>
          )}
        </div>

        {/* Card 3: Moshi Operational Boundary */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Compass size={18} color="#d97706" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Operational Service Boundary (Moshi)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Center Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={boundaryData.center_lat}
                onChange={(e) => setBoundaryData({ ...boundaryData, center_lat: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Center Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={boundaryData.center_lng}
                onChange={(e) => setBoundaryData({ ...boundaryData, center_lng: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Radius (km)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={boundaryData.radius_km}
                onChange={(e) => setBoundaryData({ ...boundaryData, radius_km: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Save button & notice */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px' }}>
          {savedNotice && (
            <span style={{ color: '#059669', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={16} />
              Settings saved successfully!
            </span>
          )}

          <button
            type="submit"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            <Save size={16} />
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
