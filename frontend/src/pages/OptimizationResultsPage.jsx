import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Truck,
  MapPin,
  Clock,
  Fuel,
  IndianRupee,
  Layers,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

export default function OptimizationResultsPage({
  optimizationResult,
  onRunOptimization,
  isOptimizing,
}) {
  const [expandedVehicleIds, setExpandedVehicleIds] = useState([]);

  if (!optimizationResult || !optimizationResult.success) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <FileText size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          No Optimization Results Available
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '8px auto 20px', lineHeight: '1.5' }}>
          Run the Google OR-Tools route optimization from the Route Planner or click below to generate optimal vehicle routes.
        </p>
        <button
          type="button"
          onClick={onRunOptimization}
          disabled={isOptimizing}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#059669',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization Now'}
        </button>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpandedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(optimizationResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ecoroute_optimization_solution.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const {
    total_collection_points,
    assigned_collection_points,
    vehicles_used_count,
    total_distance_km,
    total_duration_mins,
    total_fuel_litres,
    total_cost,
    total_garbage_kg,
    unassigned_points,
    unassigned_reason,
    routes,
    baseline_comparison,
    recommendations,
  } = optimizationResult;

  const hours = Math.floor(total_duration_mins / 60);
  const minutes = Math.round(total_duration_mins % 60);

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header with Export Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Optimization Results & Driver Manifests
            </h2>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              Goal: {optimizationResult.objective_used}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Multi-vehicle assignment details, visiting sequences, arrival times, and operating expenses.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button
            type="button"
            onClick={downloadJson}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export JSON
          </button>

          <a
            href={api.getRoutesCSVUrl()}
            download
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export Routes CSV
          </a>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Printer size={14} />
            Print Route Manifests
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatCard
          title="Collection Points"
          value={`${assigned_collection_points} / ${total_collection_points}`}
          subtitle={`${unassigned_points?.length || 0} unassigned`}
          icon={MapPin}
          color="#059669"
          bgTint="#ecfdf5"
        />

        <StatCard
          title="Fleet Deployed"
          value={vehicles_used_count}
          unit="Vehicles"
          subtitle="Optimal active fleet"
          icon={Truck}
          color="#2563eb"
          bgTint="#eff6ff"
        />

        <StatCard
          title="Total Road Distance"
          value={total_distance_km}
          unit="km"
          subtitle="Street-following route"
          icon={Fuel}
          color="#d97706"
          bgTint="#fffbeb"
        />

        <StatCard
          title="Collection Time"
          value={`${hours}h ${minutes}m`}
          unit=""
          subtitle="Travel + Pickup duration"
          icon={Clock}
          color="#0891b2"
          bgTint="#ecfeff"
        />

        <StatCard
          title="Fuel Consumption"
          value={total_fuel_litres}
          unit="Litres"
          subtitle="Calculated from vehicle eff"
          icon={Fuel}
          color="#dc2626"
          bgTint="#fef2f2"
        />

        <StatCard
          title="Total Operating Cost"
          value={`₹${total_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${baseline_comparison?.cost_saved_pct || 0}% savings vs baseline`}
          icon={IndianRupee}
          color="#7c3aed"
          bgTint="#f5f3ff"
          badge={`${baseline_comparison?.cost_saved_pct || 0}% Saved`}
          badgeType="positive"
        />
      </div>

      {/* Recommendations & Diagnostic Notice */}
      {recommendations && recommendations.length > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#059669" />
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
              Optimization Insights & Recommendations
            </strong>
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Individual Vehicle Results Section */}
      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
          Vehicle-Wise Route Assignments ({routes.length} Active Routes)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {routes.map((route, rIdx) => {
            const isExpanded = expandedVehicleIds.includes(route.vehicle_id);
            const routeColor = route.color || '#2563eb';

            return (
              <div
                key={route.vehicle_id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                className="printable-manifest"
              >
                {/* Vehicle Card Header */}
                <div style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                  background: '#ffffff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: routeColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}>
                      {route.vehicle_id.replace('VEH-', 'V')}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '16px', color: '#0f172a' }}>
                          {route.vehicle_name}
                        </strong>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {route.registration_number}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Route: Moshi Depot ➔ {route.total_stops} Collection Stops ➔ Moshi Depot
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {/* Key Metrics */}
                    <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Garbage</span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{route.total_garbage_kg} kg</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Distance</span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{route.total_distance_km} km</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Duration</span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{route.total_duration_mins} mins</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Operating Cost</span>
                        <strong style={{ fontSize: '14px', color: '#059669' }}>₹{route.total_cost}</strong>
                      </div>
                    </div>

                    {/* Expand Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(route.vehicle_id)}
                      className="no-print"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? (
                        <>Hide Itinerary <ChevronUp size={15} /></>
                      ) : (
                        <>View Itinerary ({route.steps.length} stops) <ChevronDown size={15} /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Capacity Progress Bar Row */}
                <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    <span>Capacity Utilization: <strong>{route.total_garbage_kg} kg</strong> of {route.capacity_kg} kg max</span>
                    <span style={{ color: route.capacity_utilization_pct > 90 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      {route.capacity_utilization_pct}% Utilized
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(route.capacity_utilization_pct, 100)}%`,
                      height: '100%',
                      background: routeColor,
                      borderRadius: '9999px',
                    }} />
                  </div>

                  {/* Sub-cost badges */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                    <span>Fuel: <strong>₹{route.fuel_cost}</strong> ({route.fuel_consumed_litres} L)</span>
                    <span>Driver: <strong>₹{route.driver_cost}</strong></span>
                    <span>Maintenance: <strong>₹{route.maintenance_cost}</strong></span>
                    <span>Activation: <strong>₹{route.activation_cost}</strong></span>
                  </div>
                </div>

                {/* Stop-by-stop itinerary table (expanded) */}
                {isExpanded && (
                  <div style={{ padding: '16px 24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                          <th style={{ padding: '8px 10px' }}>#</th>
                          <th style={{ padding: '8px 10px' }}>Stop Name / Landmark</th>
                          <th style={{ padding: '8px 10px' }}>Type</th>
                          <th style={{ padding: '8px 10px' }}>Pickup (kg)</th>
                          <th style={{ padding: '8px 10px' }}>Cumul (kg)</th>
                          <th style={{ padding: '8px 10px' }}>Leg Dist (km)</th>
                          <th style={{ padding: '8px 10px' }}>Cumul Dist (km)</th>
                          <th style={{ padding: '8px 10px' }}>ETA Arrival</th>
                          <th style={{ padding: '8px 10px' }}>Departure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.steps.map((st) => (
                          <tr key={st.step_index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: st.point_type === 'Depot' ? '#0f172a' : routeColor,
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                              }}>
                                {st.point_type === 'Depot' ? 'D' : st.step_index}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                              {st.point_name}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                              {st.point_type}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                              {st.garbage_picked_kg > 0 ? `${st.garbage_picked_kg} kg` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>
                              {st.cumulative_garbage_kg} kg
                            </td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>
                              {st.distance_from_prev_km} km
                            </td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>
                              {st.cumulative_distance_km} km
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#059669' }}>
                              {st.arrival_time_str}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                              {st.departure_time_str}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
