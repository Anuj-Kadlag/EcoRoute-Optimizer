import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SavingsComparisonChart({ baselineComparison, totalCost, totalDistance, totalFuel }) {
  if (!baselineComparison || !baselineComparison.baseline_total_cost) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
        Baseline comparison data not available.
      </div>
    );
  }

  const data = [
    {
      metric: 'Distance (km)',
      Baseline: baselineComparison.baseline_distance_km,
      Optimized: totalDistance,
    },
    {
      metric: 'Fuel (Litres)',
      Baseline: baselineComparison.baseline_fuel_litres,
      Optimized: totalFuel,
    },
    {
      metric: 'Cost (₹100s)',
      Baseline: Math.round(baselineComparison.baseline_total_cost / 100),
      Optimized: Math.round(totalCost / 100),
    },
  ];

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#ffffff', border: 'none', fontSize: '12px' }}
          />
          <Legend
            verticalAlign="top"
            formatter={(value) => (
              <span style={{ color: '#334155', fontSize: '12px', fontWeight: 600 }}>{value}</span>
            )}
          />
          <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Unoptimized Baseline" />
          <Bar dataKey="Optimized" fill="#059669" radius={[4, 4, 0, 0]} name="EcoRoute Optimized" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
