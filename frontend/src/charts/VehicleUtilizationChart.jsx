import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function VehicleUtilizationChart({ routes }) {
  if (!routes || routes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
        No vehicle route assignments to visualize.
      </div>
    );
  }

  const data = routes.map((r) => ({
    name: r.vehicle_id,
    utilization: r.capacity_utilization_pct,
    garbage: r.total_garbage_kg,
    capacity: r.capacity_kg,
    color: r.color || '#059669',
  }));

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            formatter={(val, name, item) => [
              `${val}% (${item.payload.garbage} kg / ${item.payload.capacity} kg)`,
              'Capacity Utilization',
            ]}
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#ffffff', border: 'none', fontSize: '12px' }}
          />
          <Bar dataKey="utilization" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
