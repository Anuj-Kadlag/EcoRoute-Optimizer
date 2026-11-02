import React from 'react';
import {
  IndianRupee,
  Fuel,
  TrendingDown,
  Percent,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import CostBreakdownChart from '../charts/CostBreakdownChart';
import SavingsComparisonChart from '../charts/SavingsComparisonChart';

export default function CostAnalyticsPage({ optimizationResult }) {
  if (!optimizationResult || !optimizationResult.success) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', color: '#94a3b8' }}>
        <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          No Cost Analytics Available Yet
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
          Run the route optimization to view detailed cost breakdowns and verified baseline comparison savings.
        </p>
      </div>
    );
  }

  const {
    total_cost,
    total_distance_km,
    total_fuel_litres,
    cost_breakdown,
    baseline_comparison,
  } = optimizationResult;

  const costSavedInr = baseline_comparison?.cost_saved_inr || 0;
  const costSavedPct = baseline_comparison?.cost_saved_pct || 0;
  const distSavedKm = baseline_comparison?.distance_saved_km || 0;
  const distSavedPct = baseline_comparison?.distance_saved_pct || 0;
  const fuelSavedL = baseline_comparison?.fuel_saved_litres || 0;
  const fuelSavedPct = baseline_comparison?.fuel_saved_pct || 0;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          Cost Analysis & Verified Savings
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Financial breakdown of fuel, driver wages, vehicle maintenance, and genuine algorithmic savings.
        </p>
      </div>

      {/* Savings Metric Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Operating Cost Savings"
          value={`₹${costSavedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${costSavedPct}% reduction vs baseline`}
          icon={TrendingDown}
          color="#059669"
          bgTint="#ecfdf5"
          badge={`${costSavedPct}% Saved`}
          badgeType="positive"
        />

        <StatCard
          title="Distance Avoided"
          value={distSavedKm}
          unit="km"
          subtitle={`${distSavedPct}% shorter road travel`}
          icon={TrendingDown}
          color="#2563eb"
          bgTint="#eff6ff"
          badge={`${distSavedPct}% Less km`}
          badgeType="positive"
        />

        <StatCard
          title="Fuel Saved"
          value={fuelSavedL}
          unit="Litres"
          subtitle={`${fuelSavedPct}% less fuel consumed`}
          icon={Fuel}
          color="#d97706"
          bgTint="#fffbeb"
          badge={`${fuelSavedPct}% Less Fuel`}
          badgeType="positive"
        />

        <StatCard
          title="Total Optimized Expense"
          value={`₹${total_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Full operational cycle cost"
          icon={IndianRupee}
          color="#7c3aed"
          bgTint="#f5f3ff"
          badge="Verified CVRP"
          badgeType="neutral"
        />
      </div>

      {/* Side-by-Side Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Cost Distribution Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Operating Expense Categories
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '16px' }}>
            Distribution of costs across vehicle operating factors
          </span>
          <CostBreakdownChart costBreakdown={cost_breakdown} />

          {/* Breakdown summary table */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '12px', color: '#475569' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Total Fuel Expenses:</span>
              <strong style={{ color: '#0f172a' }}>₹{cost_breakdown?.fuel_cost}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Driver Labor Expenses:</span>
              <strong style={{ color: '#0f172a' }}>₹{cost_breakdown?.driver_cost}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Vehicle Maintenance:</span>
              <strong style={{ color: '#0f172a' }}>₹{cost_breakdown?.maintenance_cost}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Vehicle Fixed Activation:</span>
              <strong style={{ color: '#0f172a' }}>₹{cost_breakdown?.activation_cost}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontWeight: 800, fontSize: '13px' }}>
              <span>Total Operating Cost:</span>
              <strong style={{ color: '#059669' }}>₹{cost_breakdown?.total_cost}</strong>
            </div>
          </div>
        </div>

        {/* Baseline Comparison Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Optimized Plan vs Baseline Plan
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '16px' }}>
            Direct comparison on real road distance, fuel, and cost
          </span>
          <SavingsComparisonChart
            baselineComparison={baseline_comparison}
            totalCost={total_cost}
            totalDistance={total_distance_km}
            totalFuel={total_fuel_litres}
          />

          {/* Baseline Methodology Explanation */}
          <div style={{
            marginTop: '16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: '1.5',
          }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
              Baseline Calculation Methodology:
            </strong>
            {baseline_comparison?.assumptions ||
              'Baseline represents uncoordinated FIFO sequential collection where vehicles visit collection points in registration order.'}
          </div>
        </div>
      </div>
    </div>
  );
}
