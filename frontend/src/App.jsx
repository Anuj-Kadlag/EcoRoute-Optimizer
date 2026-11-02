import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RoutePlannerPage from './pages/RoutePlannerPage';
import DashboardPage from './pages/DashboardPage';
import CollectionPointsPage from './pages/CollectionPointsPage';
import VehiclesPage from './pages/VehiclesPage';
import DepotManagementPage from './pages/DepotManagementPage';
import OptimizationResultsPage from './pages/OptimizationResultsPage';
import CostAnalyticsPage from './pages/CostAnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('route-planner'); // Main screen is Route Planner as requested
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [depot, setDepot] = useState(null);
  const [boundary, setBoundary] = useState(null);
  const [settings, setSettings] = useState({
    objective: 'min_cost',
    fleet_mode: 'manual',
    search_time_limit_seconds: 8,
  });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [pts, vehs, dep, bnd, setts, lastRes] = await Promise.all([
          api.getCollectionPoints(),
          api.getVehicles(),
          api.getDepot(),
          api.getBoundary(),
          api.getSettings(),
          api.getLastResults().catch(() => null),
        ]);
        if (cancelled) return;
        setCollectionPoints(pts || []);
        setVehicles(vehs || []);
        setDepot(dep || null);
        setBoundary(bnd || null);
        if (setts) setSettings(setts);
        if (lastRes) setOptimizationResult(lastRes);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load initial data:', err);
        setErrorNotice(`Backend connection error: ${err.message}. Make sure the FastAPI backend is running.`);
      } finally {
        if (!cancelled) {
          // Allow the browser event loop to process initial state batching cleanly
          setTimeout(() => {
            if (!cancelled) {
              setLoadingInitial(false);
            }
          }, 60);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Run Optimization handler
  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    setErrorNotice(null);
    try {
      const payload = {
        collection_points: collectionPoints,
        vehicles: vehicles,
        depot: depot,
        settings: settings,
      };
      const res = await api.optimize(payload);
      setOptimizationResult(res);
      if (!res.success) {
        setErrorNotice(res.unassigned_reason || res.message || 'Optimization could not find a feasible route.');
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setErrorNotice(`Optimization failed: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Collection Points Handlers
  const handleAddPoint = async (pt) => {
    try {
      const added = await api.addCollectionPoint(pt);
      setCollectionPoints((prev) => [...prev, added]);
    } catch (err) {
      alert(`Failed to add collection point: ${err.message}`);
    }
  };

  const handleUpdatePoint = async (id, pt) => {
    try {
      const updated = await api.updateCollectionPoint(id, pt);
      setCollectionPoints((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      alert(`Failed to update point: ${err.message}`);
    }
  };

  const handleDeletePoint = async (id) => {
    if (!window.confirm(`Delete collection point ${id}?`)) return;
    try {
      await api.deleteCollectionPoint(id);
      setCollectionPoints((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(`Failed to delete point: ${err.message}`);
    }
  };

  const handleResetDemoPoints = async () => {
    if (!window.confirm('Reset collection points to the authentic Moshi OpenStreetMap household dataset (180+ locations)?')) return;
    try {
      const demoPts = await api.resetDemoPoints();
      setCollectionPoints(demoPts);
    } catch (err) {
      alert(`Failed to reset collection points: ${err.message}`);
    }
  };

  // Vehicle Handlers
  const handleAddVehicle = async (v) => {
    try {
      const added = await api.addVehicle(v);
      setVehicles((prev) => [...prev, added]);
    } catch (err) {
      alert(`Failed to add vehicle: ${err.message}`);
    }
  };

  const handleUpdateVehicle = async (id, v) => {
    try {
      const updated = await api.updateVehicle(id, v);
      setVehicles((prev) => prev.map((veh) => (veh.id === id ? updated : veh)));
    } catch (err) {
      alert(`Failed to update vehicle: ${err.message}`);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm(`Delete vehicle ${id}?`)) return;
    try {
      await api.deleteVehicle(id);
      setVehicles((prev) => prev.filter((veh) => veh.id !== id));
    } catch (err) {
      alert(`Failed to delete vehicle: ${err.message}`);
    }
  };

  const handleResetDemoVehicles = async () => {
    if (!window.confirm('Reset fleet to default 5 vehicles?')) return;
    try {
      const demoVehs = await api.resetDemoVehicles();
      setVehicles(demoVehs);
    } catch (err) {
      alert(`Failed to reset demo vehicles: ${err.message}`);
    }
  };

  // Depot & Boundary Handlers
  const handleUpdateDepot = async (dep) => {
    try {
      const updated = await api.updateDepot(dep);
      setDepot(updated);
    } catch (err) {
      alert(`Failed to update depot: ${err.message}`);
    }
  };

  const handleUpdateBoundary = async (bnd) => {
    try {
      const updated = await api.updateBoundary(bnd);
      setBoundary(updated);
    } catch (err) {
      alert(`Failed to update boundary: ${err.message}`);
    }
  };

  const handleUpdateSettings = async (setts) => {
    try {
      const updated = await api.updateSettings(setts);
      setSettings(updated);
    } catch (err) {
      alert(`Failed to update settings: ${err.message}`);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        gap: '16px',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid #e2e8f0',
          borderTopColor: '#059669',
          animation: 'spin 1s linear infinite',
        }} />
        <strong style={{ fontSize: '16px', color: '#0f172a' }}>
          Loading EcoRoute System...
        </strong>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Initializing Moshi, PCMC Waste Optimization Network
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onQuickOptimize={handleRunOptimization}
        isOptimizing={isOptimizing}
        collectionPointsCount={collectionPoints.length}
        vehiclesCount={vehicles.length}
      />

      {errorNotice && (
        <div style={{
          background: '#fee2e2',
          borderBottom: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '10px 24px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b91c1c',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{ flex: 1, overflowX: 'hidden' }}>
          {activeTab === 'route-planner' && (
            <RoutePlannerPage
              collectionPoints={collectionPoints}
              vehicles={vehicles}
              depot={depot}
              boundary={boundary}
              optimizationResult={optimizationResult}
              isOptimizing={isOptimizing}
              onRunOptimization={handleRunOptimization}
              onAddPoint={handleAddPoint}
              onResetPoints={handleResetDemoPoints}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              collectionPoints={collectionPoints}
              vehicles={vehicles}
              depot={depot}
              boundary={boundary}
              optimizationResult={optimizationResult}
              setActiveTab={setActiveTab}
              onRunOptimization={handleRunOptimization}
              isOptimizing={isOptimizing}
            />
          )}

          {activeTab === 'collection-points' && (
            <CollectionPointsPage
              collectionPoints={collectionPoints}
              onAddPoint={handleAddPoint}
              onUpdatePoint={handleUpdatePoint}
              onDeletePoint={handleDeletePoint}
              onResetDemo={handleResetDemoPoints}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesPage
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onResetDemoVehicles={handleResetDemoVehicles}
              collectionPoints={collectionPoints}
            />
          )}

          {activeTab === 'depot' && (
            <DepotManagementPage
              depot={depot}
              onUpdateDepot={handleUpdateDepot}
              boundary={boundary}
              collectionPoints={collectionPoints}
            />
          )}

          {activeTab === 'results' && (
            <OptimizationResultsPage
              optimizationResult={optimizationResult}
              onRunOptimization={handleRunOptimization}
              isOptimizing={isOptimizing}
            />
          )}

          {activeTab === 'analytics' && (
            <CostAnalyticsPage
              optimizationResult={optimizationResult}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              boundary={boundary}
              onUpdateBoundary={handleUpdateBoundary}
            />
          )}
        </main>
      </div>
    </div>
  );
}
