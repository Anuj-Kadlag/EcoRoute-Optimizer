import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed'];

export default function CostBreakdownChart({ costBreakdown }) {
  if (!costBreakdown || !costBreakdown.total_cost) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
        No cost breakdown data available. Run route optimization first.
      </div>
    );
  }

  const data = [
    { name: 'Fuel Cost', value: costBreakdown.fuel_cost || 0 },
    { name: 'Driver Wages', value: costBreakdown.driver_cost || 0 },
    { name: 'Maintenance', value: costBreakdown.maintenance_cost || 0 },
    { name: 'Vehicle Activation', value: costBreakdown.activation_cost || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [`₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Amount']}
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#ffffff', border: 'none', fontSize: '12px' }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => <span style={{ color: '#334155', fontSize: '12px', fontWeight: 600 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
