import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Building2,
  Route,
  BarChart3,
  PieChart,
  Settings,
  FileText,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'route-planner', label: 'Route Planner', icon: Route, badge: 'Main' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'collection-points', label: 'Collection Points', icon: MapPin },
    { id: 'vehicles', label: 'Vehicle Fleet', icon: Truck },
    { id: 'depot', label: 'Depot Management', icon: Building2 },
    { id: 'results', label: 'Optimization Results', icon: BarChart3 },
    { id: 'analytics', label: 'Cost & Savings', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px 12px',
      height: 'calc(100vh - 68px)',
      position: 'sticky',
      top: '68px',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          padding: '6px 12px 10px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Navigation
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ecfdf5' : 'transparent',
                color: isActive ? '#059669' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? '#059669' : '#64748b'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  background: isActive ? '#059669' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Fleet quick info box at bottom of sidebar */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '11px',
        color: '#64748b',
      }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          EcoRoute Moshi Hub
        </div>
        <p style={{ lineHeight: '1.4' }}>
          Real Road CVRP Engine via Google OR-Tools. OpenStreetMap routing active.
        </p>
      </div>
    </aside>
  );
}
