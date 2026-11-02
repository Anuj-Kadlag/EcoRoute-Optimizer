import React from 'react';
import {
  Truck,
  MapPin,
  Route,
  Fuel,
  IndianRupee,
  Clock,
  TrendingDown,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import MoshiMap from '../map/MoshiMap';
import CostBreakdownChart from '../charts/CostBreakdownChart';
import VehicleUtilizationChart from '../charts/VehicleUtilizationChart';

export default function DashboardPage({
  collectionPoints,
  vehicles,
  depot,
  boundary,
  optimizationResult,
  setActiveTab,
  onRunOptimization,
  isOptimizing,
}) {
  const pendingCount = collectionPoints.filter((p) => p.status.toLowerCase() !== 'collected').length;
  const availableVehicles = vehicles.filter((v) => v.status.toLowerCase() === 'available').length;

  const totalDist = optimizationResult?.total_distance_km || 0;
  const totalCost = optimizationResult?.total_cost || 0;
  const totalFuel = optimizationResult?.total_fuel_litres || 0;
  const totalGarbage = optimizationResult?.total_garbage_kg || 0;
  const vehiclesUsed = optimizationResult?.vehicles_used_count || 0;
  const savingsPct = optimizationResult?.baseline_comparison?.cost_saved_pct || 0;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 20px -5px rgba(6, 78, 59, 0.3)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Municipal Solid Waste Optimization
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Moshi Sector Fleet Operations
          </h2>
          <p style={{ fontSize: '13px', color: '#a7f3d0', maxWidth: '600px', lineHeight: '1.5' }}>
            Multi-vehicle Capacitated Vehicle Routing Problem (CVRP) with real road distance matrices, fuel dynamics, and driver working hour constraints.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('route-planner')}
            style={{
              background: '#ffffff',
              color: '#064e3b',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Open Route Planner
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Collection Demand"
          value={collectionPoints.reduce((acc, p) => acc + p.garbage_quantity_kg, 0).toLocaleString()}
          unit="kg"
          subtitle={`${pendingCount} pending pickups (${collectionPoints.reduce((acc, p) => acc + (p.household_units_count || 1), 0)} family units)`}
          icon={MapPin}
          color="#059669"
          bgTint="#ecfdf5"
          badge={`${collectionPoints.length} Moshi Stops`}
          badgeType="positive"
        />

        <StatCard
          title="Active Fleet Size"
          value={vehiclesUsed > 0 ? `${vehiclesUsed} / ${availableVehicles}` : `${availableVehicles}`}
          unit="Vehicles"
          subtitle="Heterogeneous fleet deployed"
          icon={Truck}
          color="#2563eb"
          bgTint="#eff6ff"
          badge="Available"
          badgeType="positive"
        />

        <StatCard
          title="Total Route Distance"
          value={totalDist.toFixed(1)}
          unit="km"
          subtitle="Real road network kilometers"
          icon={Route}
          color="#d97706"
          bgTint="#fffbeb"
          badge={totalDist > 0 ? 'Road Followed' : 'Not Run'}
          badgeType="neutral"
        />

        <StatCard
          title="Total Operating Cost"
          value={`₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          unit=""
          subtitle="Fuel + Driver + Maint + Activation"
          icon={IndianRupee}
          color="#7c3aed"
          bgTint="#f5f3ff"
          badge={savingsPct > 0 ? `${savingsPct}% Saved` : 'Optimized'}
          badgeType={savingsPct > 0 ? 'positive' : 'neutral'}
        />
      </div>

      {/* Middle Split: Map Preview & Fleet Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* Interactive Map Box */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Moshi Route Visualization
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Depot: {depot?.name} (Spine Road)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('route-planner')}
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Full Screen Map
            </button>
          </div>

          <div style={{ height: '360px', borderRadius: '10px', overflow: 'hidden' }}>
            <MoshiMap
              center={[depot?.lat || 18.6794, depot?.lng || 73.8492]}
              zoom={13}
              collectionPoints={collectionPoints}
              depot={depot}
              boundary={boundary}
              routes={optimizationResult?.routes || []}
            />
          </div>
        </div>

        {/* Fleet Utilization & Cost Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Capacity Utilization Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Vehicle Capacity Utilization
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
              Load % per assigned vehicle
            </span>
            <VehicleUtilizationChart routes={optimizationResult?.routes || []} />
          </div>

          {/* Cost Distribution Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Operating Expense Breakdown
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
              Fuel, labor, maintenance & activation
            </span>
            <CostBreakdownChart costBreakdown={optimizationResult?.cost_breakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
