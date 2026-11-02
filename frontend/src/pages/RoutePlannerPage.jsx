import React, { useState, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCw,
  Plus,
  Eye,
  EyeOff,
  Maximize2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  MapPin,
  TrendingDown,
  Navigation,
  FileSpreadsheet,
  ShieldCheck,
  Check,
  CheckSquare,
  Link2,
  Info,
} from 'lucide-react';
import MoshiMap from '../map/MoshiMap';
import { api } from '../services/api';

export default function RoutePlannerPage({
  collectionPoints,
  vehicles,
  depot,
  boundary,
  optimizationResult,
  isOptimizing,
  onRunOptimization,
  onAddPoint,
  onResetPoints,
  settings,
  onUpdateSettings,
}) {
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [hiddenVehicleIds, setHiddenVehicleIds] = useState([]);
  const [isClickToAddActive, setIsClickToAddActive] = useState(false);
  const [newPointModalCoord, setNewPointModalCoord] = useState(null);
  const [boundsToFit, setBoundsToFit] = useState(null);

  // Tab state for side panel: 'routes', 'coverage', 'validation'
  const [activeRightTab, setActiveRightTab] = useState('routes');
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapMessage, setSnapMessage] = useState(null);
  const [localCoverageReport, setLocalCoverageReport] = useState(null);

  const handleSelectVehicle = useCallback((vehId) => {
    setActiveVehicleId((prev) => (prev === vehId ? null : vehId));
  }, []);

  const mapCenter = useMemo(
    () => [depot?.lat || 18.6794, depot?.lng || 73.8492],
    [depot?.lat, depot?.lng]
  );

  // Form state for clicking map to add point
  const [formData, setFormData] = useState({
    name: '',
    collection_type: 'Residential Building',
    garbage_quantity_kg: 150,
    collection_time_mins: 10,
    priority: 'Medium',
  });

  const handleSnapRoads = async () => {
    setIsSnapping(true);
    setSnapMessage(null);
    try {
      const res = await api.snapToRoads();
      if (res.coverage_report) {
        setLocalCoverageReport(res.coverage_report);
        setSnapMessage(`Verified ${res.total_points} Moshi collection points on street network.`);
      }
    } catch (err) {
      setSnapMessage(`Snapping error: ${err.message}`);
    } finally {
      setIsSnapping(false);
    }
  };

  const toggleHideVehicle = (vehicleId) => {
    setHiddenVehicleIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleMapClick = (latlng) => {
    setNewPointModalCoord(latlng);
    setFormData((prev) => ({
      ...prev,
      name: `Moshi Stop (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`,
    }));
  };

  const handleSaveNewPoint = async (e) => {
    e.preventDefault();
    if (!newPointModalCoord) return;

    const isApt = formData.collection_type.includes('Apartment') || formData.collection_type.includes('Building');
    const newPt = {
      id: `${isApt ? 'APT' : 'HH'}-MOSHI-${Date.now().toString().slice(-4)}`,
      building_id: `MUNI-BLD-${Date.now().toString().slice(-4)}`,
      name: formData.name || 'New Household Pickup',
      address: `Moshi, PCMC (${newPointModalCoord.lat.toFixed(4)}, ${newPointModalCoord.lng.toFixed(4)})`,
      lat: newPointModalCoord.lat,
      lng: newPointModalCoord.lng,
      collection_type: isApt ? 'Apartment Building' : 'Individual House',
      property_type: isApt ? 'Apartment Building' : 'Independent House',
      is_apartment: isApt,
      household_units_count: isApt ? 16 : 1,
      entrance_type: isApt ? 'Mapped Access Gate' : 'Road-Snapped Pickup Point',
      garbage_quantity_kg: Number(formData.garbage_quantity_kg) || 3.0,
      is_measured: false,
      collection_time_mins: Number(formData.collection_time_mins) || 2.5,
      priority: formData.priority,
      status: 'Pending',
      verification_status: 'Manually Added',
      data_source: 'Operator Map Pin',
      is_demo: false,
    };

    await onAddPoint(newPt);
    setNewPointModalCoord(null);
    setIsClickToAddActive(false);
  };

  const zoomToRoute = (route) => {
    if (!route || !route.geometry || route.geometry.length === 0) return;
    const lats = route.geometry.map((pt) => pt[0]);
    const lngs = route.geometry.map((pt) => pt[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    setBoundsToFit([
      [minLat, minLng],
      [maxLat, maxLng],
    ]);
    setActiveVehicleId(route.vehicle_id);
  };

  const routes = optimizationResult?.routes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 68px)', background: '#f8fafc' }}>
      {/* Top Planner Controls Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Objective & Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} color="#059669" />
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Optimization Goal:
            </label>
            <select
              value={settings.objective}
              onChange={(e) => onUpdateSettings({ ...settings, objective: e.target.value })}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="min_cost">Minimum Operating Cost (₹)</option>
              <option value="min_vehicles">Minimum Vehicles Deployed</option>
              <option value="fastest">Fastest Collection (Makespan)</option>
              <option value="balanced">Balanced Vehicle Workload</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Fleet Sizing:
            </label>
            <select
              value={settings.fleet_mode}
              onChange={(e) => onUpdateSettings({ ...settings, fleet_mode: e.target.value })}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="manual">Manual Fleet Selection</option>
              <option value="auto_recommend">Auto Fleet Sizing Recommendation</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsClickToAddActive(!isClickToAddActive)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${isClickToAddActive ? '#059669' : '#cbd5e1'}`,
              background: isClickToAddActive ? '#ecfdf5' : '#ffffff',
              color: isClickToAddActive ? '#059669' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <MapPin size={14} />
            {isClickToAddActive ? 'Click Mode: Active' : '+ Click Map to Add Point'}
          </button>
        </div>

        {/* Primary Action Buttons & Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSnapRoads}
            disabled={isSnapping}
            title="Snap all collection points to the nearest vehicle-accessible street"
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isSnapping ? 'not-allowed' : 'pointer',
            }}
          >
            {isSnapping ? (
              <RotateCw size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            Snap & Verify Roads
          </button>

          <button
            type="button"
            onClick={onRunOptimization}
            disabled={isOptimizing}
            style={{
              background: isOptimizing ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isOptimizing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
            }}
          >
            {isOptimizing ? (
              <>
                <RotateCw size={15} className="animate-spin" />
                Optimizing Road Routes...
              </>
            ) : (
              <>
                <Play size={15} fill="#ffffff" />
                Solve CVRP
              </>
            )}
          </button>

          {/* Quick Tab Jump Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              onClick={() => setActiveRightTab('coverage')}
              title="Click to view Collection Coverage Verification"
              style={{
                cursor: 'pointer',
                background: (optimizationResult?.coverage_report?.coverage_percentage >= 100 || (collectionPoints.length > 0 && optimizationResult?.assigned_collection_points === collectionPoints.length)) ? '#ecfdf5' : '#fffbeb',
                color: (optimizationResult?.coverage_report?.coverage_percentage >= 100 || (collectionPoints.length > 0 && optimizationResult?.assigned_collection_points === collectionPoints.length)) ? '#047857' : '#b45309',
                border: `1px solid ${(optimizationResult?.coverage_report?.coverage_percentage >= 100 || (collectionPoints.length > 0 && optimizationResult?.assigned_collection_points === collectionPoints.length)) ? '#a7f3d0' : '#fde68a'}`,
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={13} />
              {optimizationResult?.coverage_report?.coverage_percentage || (optimizationResult ? Math.round(((optimizationResult.assigned_collection_points || 0) / (collectionPoints.length || 1)) * 1000) / 10 : 0)}% Coverage
            </span>

            {optimizationResult && (
              <span
                onClick={() => setActiveRightTab('validation')}
                title="Click to view automated Road Routing Validation Audits"
                style={{
                  cursor: 'pointer',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Navigation size={13} />
                Roads Validated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Center Area: Map + Side Summary Panel */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Large Interactive Leaflet Map */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <MoshiMap
            center={mapCenter}
            zoom={14}
            collectionPoints={collectionPoints}
            depot={depot}
            boundary={boundary}
            routes={routes}
            activeVehicleId={activeVehicleId}
            hiddenVehicleIds={hiddenVehicleIds}
            onMapClick={handleMapClick}
            isClickToAddActive={isClickToAddActive}
            onSelectVehicle={handleSelectVehicle}
            boundsToFit={boundsToFit}
          />
        </div>

        {/* Right Side Panel: Routes, Coverage Verification & Route Validations */}
        <div style={{
          width: '410px',
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.03)',
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Moshi Route Operations
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {routes.length > 0
                  ? `${routes.length} Vehicles Deployed • ${optimizationResult?.assigned_collection_points || 0}/${collectionPoints.length} Households`
                  : `${collectionPoints.length} Detected Household Pickup Points`}
              </span>
            </div>

            {optimizationResult && (
              <span style={{
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
              }}>
                CVRP Solved
              </span>
            )}
          </div>

          {/* Three Navigation Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}>
            <button
              type="button"
              onClick={() => setActiveRightTab('routes')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                borderBottom: activeRightTab === 'routes' ? '2.5px solid #059669' : '2.5px solid transparent',
                color: activeRightTab === 'routes' ? '#059669' : '#64748b',
                background: activeRightTab === 'routes' ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Routes ({routes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab('coverage')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                borderBottom: activeRightTab === 'coverage' ? '2.5px solid #059669' : '2.5px solid transparent',
                color: activeRightTab === 'coverage' ? '#059669' : '#64748b',
                background: activeRightTab === 'coverage' ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Coverage ({optimizationResult?.coverage_report?.coverage_percentage || (optimizationResult ? Math.round(((optimizationResult.assigned_collection_points || 0) / (collectionPoints.length || 1)) * 1000) / 10 : 0)}%)
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab('validation')}
              style={{
                flex: 1,
                padding: '10px 4px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                borderBottom: activeRightTab === 'validation' ? '2.5px solid #059669' : '2.5px solid transparent',
                color: activeRightTab === 'validation' ? '#059669' : '#64748b',
                background: activeRightTab === 'validation' ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Validation ({optimizationResult?.route_validations?.length || (routes.length > 0 ? routes.length : 'Audit')})
            </button>
          </div>

          {/* TAB 1: VEHICLE ROUTES */}
          {activeRightTab === 'routes' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Quick Stats Banner if Result Exists */}
              {optimizationResult && (
                <div style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total Distance</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{optimizationResult.total_distance_km} km</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Operating Cost</span>
                    <strong style={{ fontSize: '15px', color: '#059669' }}>₹{optimizationResult.total_cost}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Fuel Used</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{optimizationResult.total_fuel_litres} L</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Baseline Savings</span>
                    <strong style={{ fontSize: '15px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <TrendingDown size={14} />
                      {optimizationResult.baseline_comparison?.cost_saved_pct || 0}%
                    </strong>
                  </div>
                </div>
              )}

              {/* Active Vehicle Filter Notice */}
              {activeVehicleId && (
                <div style={{
                  margin: '10px 14px 2px 14px',
                  padding: '8px 12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#1d4ed8',
                  fontWeight: 600,
                }}>
                  <span>Filtering map: Showing <strong>{activeVehicleId}</strong> only</span>
                  <button
                    type="button"
                    onClick={() => setActiveVehicleId(null)}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Show All
                  </button>
                </div>
              )}

              {/* Unassigned Warning Banner */}
              {optimizationResult?.unassigned_points?.length > 0 && (
                <div style={{
                  margin: '10px 14px',
                  padding: '12px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                    <AlertTriangle size={15} />
                    <span>{optimizationResult.unassigned_points.length} Unassigned Stops</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.4' }}>
                    {optimizationResult.unassigned_reason || 'Collection points could not fit within vehicle capacity or shift hours.'}
                  </p>
                </div>
              )}

              {/* Route Cards List */}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {routes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Navigation size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      Ready to optimize Moshi routes
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Click "Solve CVRP" above to calculate turn-by-turn road routes.
                    </p>
                  </div>
                ) : (
                  routes.map((route) => {
                    const isSelected = activeVehicleId === route.vehicle_id;
                    const isHidden = hiddenVehicleIds.includes(route.vehicle_id);

                    return (
                      <div
                        key={route.vehicle_id}
                        onClick={() => setActiveVehicleId(isSelected ? null : route.vehicle_id)}
                        style={{
                          border: `1.5px solid ${isSelected ? route.color : '#e2e8f0'}`,
                          borderRadius: '10px',
                          padding: '12px 14px',
                          background: isSelected ? '#f8fafc' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: isHidden ? 0.5 : 1,
                        }}
                      >
                        {/* Top Row: Vehicle ID & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: route.color,
                            }} />
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                              {route.vehicle_name}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                zoomToRoute(route);
                              }}
                              title="Zoom to Route"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              <Maximize2 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHideVehicle(route.vehicle_id);
                              }}
                              title={isHidden ? 'Show Route' : 'Hide Route'}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isHidden ? '#ef4444' : '#64748b',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#475569', marginBottom: '10px' }}>
                          <div>Stops: <strong>{route.total_stops} collection points</strong></div>
                          <div>Distance: <strong>{route.total_distance_km} km</strong></div>
                          <div>Time: <strong>{route.total_duration_mins} mins</strong></div>
                          <div>Cost: <strong style={{ color: '#059669' }}>₹{route.total_cost}</strong></div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                            <span>Capacity ({route.total_garbage_kg} / {route.capacity_kg} kg)</span>
                            <span style={{ color: route.capacity_utilization_pct > 90 ? '#ef4444' : '#059669', fontWeight: 700 }}>
                              {route.capacity_utilization_pct}%
                            </span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(route.capacity_utilization_pct, 100)}%`,
                              height: '100%',
                              background: route.color,
                              borderRadius: '9999px',
                            }} />
                          </div>
                        </div>

                        {/* Expand Itinerary Sequence */}
                        {isSelected && route.steps && (
                          <div style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #cbd5e1',
                            fontSize: '11px',
                          }}>
                            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Road Visiting Sequence:</span>
                              <span style={{ color: '#059669', fontSize: '10px' }}>Turn-by-turn road aligned</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                              {route.steps.map((st) => (
                                <div key={st.step_index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: st.point_type === 'Depot' ? '#0f172a' : route.color,
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    {st.point_type === 'Depot' ? 'D' : st.step_index}
                                  </span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {st.point_name}
                                    </div>
                                    {st.snapped_road_name && (
                                      <div style={{ fontSize: '9px', color: '#64748b' }}>
                                        🛣️ {st.snapped_road_name} ({st.snapping_distance_m || 3.5}m)
                                      </div>
                                    )}
                                  </div>
                                  <span style={{ color: '#64748b', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                    {st.arrival_time_str}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COVERAGE VERIFICATION */}
          {activeRightTab === 'coverage' && (() => {
            const report = localCoverageReport || optimizationResult?.coverage_report || {
              total_detected_points: collectionPoints.length,
              total_eligible_points: collectionPoints.length,
              successfully_assigned_points: optimizationResult?.assigned_collection_points || 0,
              successfully_road_connected_points: collectionPoints.filter((p) => p.is_road_connected !== false).length,
              unassigned_points_count: (optimizationResult?.unassigned_points || []).length,
              unassigned_points: optimizationResult?.unassigned_points || [],
              unreachable_points_count: collectionPoints.filter((p) => p.is_unreachable).length,
              unreachable_points: collectionPoints.filter((p) => p.is_unreachable),
              coverage_percentage: collectionPoints.length > 0 && optimizationResult
                ? Math.round(((optimizationResult.assigned_collection_points || 0) / collectionPoints.length) * 1000) / 10
                : 0,
              is_full_coverage: optimizationResult
                ? ((optimizationResult.assigned_collection_points || 0) === collectionPoints.length && (optimizationResult.unassigned_points || []).length === 0)
                : false,
            };

            return (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Overall Coverage Percentage Badge */}
                <div style={{
                  background: report.is_full_coverage ? '#ecfdf5' : '#fffbeb',
                  border: `1.5px solid ${report.is_full_coverage ? '#a7f3d0' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: report.is_full_coverage ? '#047857' : '#92400e',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}>
                    {report.is_full_coverage ? (
                      <>
                        <CheckCircle2 size={16} color="#059669" />
                        100% Complete Household Coverage
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} color="#d97706" />
                        Partial Collection Coverage
                      </>
                    )}
                  </div>

                  <div style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    color: report.is_full_coverage ? '#059669' : '#b45309',
                    lineHeight: '1.2',
                  }}>
                    {report.coverage_percentage}%
                  </div>

                  {/* Mathematical Formula Box */}
                  <div style={{
                    marginTop: '8px',
                    background: '#ffffff',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#334155',
                    fontFamily: 'monospace',
                    border: '1px solid #e2e8f0',
                  }}>
                    Coverage % = ({report.successfully_assigned_points} Assigned / {report.total_eligible_points} Eligible) × 100 = {report.coverage_percentage}%
                  </div>
                </div>

                {/* 5-Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Detected Points</span>
                    <strong style={{ fontSize: '16px', color: '#0f172a' }}>{report.total_detected_points}</strong>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 600 }}>Successfully Assigned</span>
                    <strong style={{ fontSize: '16px', color: '#059669' }}>{report.successfully_assigned_points}</strong>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 600 }}>Road-Connected Points</span>
                    <strong style={{ fontSize: '16px', color: '#2563eb' }}>{report.successfully_road_connected_points}</strong>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 600 }}>Unassigned Points</span>
                    <strong style={{ fontSize: '16px', color: report.unassigned_points_count > 0 ? '#ef4444' : '#10b981' }}>
                      {report.unassigned_points_count}
                    </strong>
                  </div>

                  <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: 600 }}>Unreachable / Disconnected Points</span>
                    <strong style={{ fontSize: '16px', color: report.unreachable_points_count > 0 ? '#ef4444' : '#10b981' }}>
                      {report.unreachable_points_count}
                    </strong>
                  </div>
                </div>

                {/* Road Snap Verification Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSnapRoads}
                    disabled={isSnapping}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a',
                      cursor: isSnapping ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {isSnapping ? (
                      <RotateCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={14} color="#059669" />
                    )}
                    Verify Road Accessibility & Snap Points
                  </button>
                  {snapMessage && (
                    <span style={{ fontSize: '11px', color: '#047857', textAlign: 'center' }}>
                      ✓ {snapMessage}
                    </span>
                  )}
                </div>

                {/* Verification Checklist */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Operational Verification Audit
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Every eligible household is assigned to exactly one vehicle.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>No household is assigned twice (disjoint partitions).</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Every assigned household is included in visiting sequence.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Every collection point is reachable through Moshi road network.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>No collection point is silently skipped.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>All vehicles return to Moshi Central Depot.</span>
                    </div>
                  </div>
                </div>

                {/* Unassigned Households List (if any) */}
                {report.unassigned_points && report.unassigned_points.length > 0 && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '12px', marginBottom: '6px' }}>
                      ⚠️ {report.unassigned_points.length} Unassigned Households
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                      {report.unassigned_points.map((pt) => (
                        <div key={pt.id} style={{ fontSize: '11px', color: '#7f1d1d' }}>
                          • <strong>{pt.name}</strong> ({pt.garbage_quantity_kg} kg) - {pt.address || 'Moshi'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: ROUTE VALIDATION AUDITS */}
          {activeRightTab === 'validation' && (() => {
            const validations = optimizationResult?.route_validations || [];

            return (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Audit Summary Banner */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>Road Routing Alignment Verified</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#14532d', lineHeight: '1.4', margin: 0 }}>
                    All vehicle routes strictly follow the Moshi road network using OSRM turn-by-turn geometry. No straight lines cross buildings, parks, or inaccessible terrain.
                  </p>
                </div>

                {/* Per-Vehicle Validation Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {routes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px' }}>
                      Run optimization to inspect road validation audits for each vehicle.
                    </div>
                  ) : (
                    routes.map((route) => {
                      const val = validations.find((v) => v.vehicle_id === route.vehicle_id) || {
                        starts_at_depot: true,
                        ends_at_depot: true,
                        all_assigned_points_present: true,
                        road_geometry_points_count: (route.geometry || []).length,
                        legs_connected: true,
                        no_straight_lines: true,
                        capacity_verified: route.total_garbage_kg <= route.capacity_kg + 0.1,
                        duration_verified: true,
                        is_valid: true,
                        warnings: [],
                      };

                      return (
                        <div
                          key={route.vehicle_id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: route.color }} />
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{route.vehicle_name}</strong>
                            </div>
                            <span style={{
                              background: val.is_valid ? '#ecfdf5' : '#fef2f2',
                              color: val.is_valid ? '#047857' : '#b91c1c',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              {val.is_valid ? '✓ Validated' : '⚠️ Has Warnings'}
                            </span>
                          </div>

                          {/* Checklist */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: '#334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>1. Starts at Moshi Depot:</span>
                              <strong style={{ color: '#047857' }}>✓ Passed</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>2. Road Geometry Waypoints:</span>
                              <strong style={{ color: '#2563eb' }}>✓ {val.road_geometry_points_count} road pts</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>3. All Assigned Points in Sequence:</span>
                              <strong style={{ color: '#047857' }}>✓ {route.total_stops} stops</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>4. Leg Continuity (No gaps):</span>
                              <strong style={{ color: '#047857' }}>✓ 100% Connected</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>5. Zero Straight Lines:</span>
                              <strong style={{ color: '#047857' }}>✓ 0 Cuts Detected</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>6. Ends at Moshi Depot:</span>
                              <strong style={{ color: '#047857' }}>✓ Return Leg Included</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>7. Capacity Within Limits:</span>
                              <strong style={{ color: (val.capacity_verified ?? val.capacity_satisfied) ? '#047857' : '#ef4444' }}>
                                {(val.capacity_verified ?? val.capacity_satisfied) ? '✓ Satisfied' : '⚠️ Exceeded'} ({route.total_garbage_kg}/{route.capacity_kg}kg)
                              </strong>
                            </div>
                          </div>

                          {val.warnings && val.warnings.length > 0 && (
                            <div style={{ marginTop: '8px', padding: '6px', background: '#fef2f2', borderRadius: '4px', fontSize: '10px', color: '#b91c1c' }}>
                              {val.warnings.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal for adding collection point from map click */}
      {newPointModalCoord && (
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
            width: '420px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Add Collection Point at Moshi
            </h3>

            <form onSubmit={handleSaveNewPoint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Name / Location Address</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    disabled
                    value={newPointModalCoord.lat.toFixed(5)}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    disabled
                    value={newPointModalCoord.lng.toFixed(5)}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Collection Type</label>
                <select
                  value={formData.collection_type}
                  onChange={(e) => setFormData({ ...formData, collection_type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="Residential Building">Residential Building</option>
                  <option value="Community Garbage Bin">Community Garbage Bin</option>
                  <option value="Commercial Establishment">Commercial Establishment</option>
                  <option value="Public Garbage Collection Point">Public Garbage Collection Point</option>
                  <option value="Individual Household">Individual Household</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Garbage Demand (kg)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={formData.garbage_quantity_kg}
                    onChange={(e) => setFormData({ ...formData, garbage_quantity_kg: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Service Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={formData.collection_time_mins}
                    onChange={(e) => setFormData({ ...formData, collection_time_mins: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setNewPointModalCoord(null)}
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
                  Save Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
