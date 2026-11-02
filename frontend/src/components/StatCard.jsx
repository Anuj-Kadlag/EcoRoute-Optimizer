import React from 'react';

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = '#059669',
  bgTint = '#ecfdf5',
  badge = null,
  badgeType = 'positive', // 'positive', 'neutral', 'warning'
}) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: bgTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {value}
          </span>
          {unit && (
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
              {unit}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          {subtitle && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {subtitle}
            </span>
          )}
          {badge && (
            <span style={{
              background: badgeType === 'positive' ? '#ecfdf5' : badgeType === 'warning' ? '#fef3c7' : '#f1f5f9',
              color: badgeType === 'positive' ? '#047857' : badgeType === 'warning' ? '#92400e' : '#475569',
              border: `1px solid ${badgeType === 'positive' ? '#a7f3d0' : badgeType === 'warning' ? '#fde68a' : '#cbd5e1'}`,
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
