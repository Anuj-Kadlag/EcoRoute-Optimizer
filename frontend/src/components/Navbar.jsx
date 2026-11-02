import React from 'react';
import {
  Truck,
  Leaf,
  Play,
  RotateCw,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function Navbar({
  onQuickOptimize,
  isOptimizing,
  collectionPointsCount,
  vehiclesCount,
  lastOptimizedTime,
}) {
  return (
    <header style={{
      height: '68px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
        }}>
          <Leaf size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              EcoRoute
            </h1>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              v1.0 • CVRP Optimizer
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <Compass size={13} color="#059669" />
            <span>Operational Zone: <strong>Moshi, Pimpri-Chinchwad, MH</strong></span>
          </div>
        </div>
      </div>

      {/* Operational Status Badges & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
        }}>
          <div style={{ color: '#475569' }}>
            Points: <strong style={{ color: '#0f172a' }}>{collectionPointsCount}</strong>
          </div>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
          <div style={{ color: '#475569' }}>
            Fleet: <strong style={{ color: '#0f172a' }}>{vehiclesCount} Vehicles</strong>
          </div>
        </div>

        {/* Primary Optimize CTA Button */}
        <button
          type="button"
          onClick={onQuickOptimize}
          disabled={isOptimizing}
          style={{
            background: isOptimizing ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: isOptimizing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          {isOptimizing ? (
            <>
              <RotateCw size={16} className="animate-spin" />
              Solving CVRP Model...
            </>
          ) : (
            <>
              <Play size={16} fill="#ffffff" />
              Optimize Routes
            </>
          )}
        </button>
      </div>
    </header>
  );
}
