const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `Request failed: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.detail || errorData.message || errMsg;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Collection Points
  getCollectionPoints: () => request('/collection-points'),
  addCollectionPoint: (point) => request('/collection-points', {
    method: 'POST',
    body: JSON.stringify(point),
  }),
  updateCollectionPoint: (id, point) => request(`/collection-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(point),
  }),
  deleteCollectionPoint: (id) => request(`/collection-points/${id}`, {
    method: 'DELETE',
  }),
  resetDemoPoints: () => request('/collection-points/reset-demo', {
    method: 'POST',
  }),
  detectOsmHouseholds: (forceOffline = false) => request(`/collection-points/detect-osm?force_offline=${forceOffline}`, {
    method: 'POST',
  }),
  deduplicatePoints: (thresholdMeters = 6.0) => request(`/collection-points/deduplicate?threshold_meters=${thresholdMeters}`, {
    method: 'POST',
  }),
  toggleVerifyPoint: (id) => request(`/collection-points/${id}/verify`, {
    method: 'POST',
  }),
  snapToRoads: () => request('/collection-points/snap-to-roads', {
    method: 'POST',
  }),
  getCoverageReport: () => request('/coverage-report'),
  getHouseholdStats: () => request('/collection-points/stats'),
  importGeojson: (payload) => request('/collection-points/import-geojson', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  importGeojsonFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/collection-points/import-geojson`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'GeoJSON upload failed');
    }
    return await res.json();
  },
  importCollectionPointsCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/collection-points/import-csv`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'CSV upload failed');
    }
    return await res.json();
  },

  // Vehicles
  getVehicles: () => request('/vehicles'),
  addVehicle: (vehicle) => request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicle),
  }),
  updateVehicle: (id, vehicle) => request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicle),
  }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, {
    method: 'DELETE',
  }),
  resetDemoVehicles: () => request('/vehicles/reset-demo', {
    method: 'POST',
  }),

  // Depot & Boundary
  getDepot: () => request('/depot'),
  updateDepot: (depot) => request('/depot', {
    method: 'POST',
    body: JSON.stringify(depot),
  }),
  getBoundary: () => request('/boundary'),
  updateBoundary: (boundary) => request('/boundary', {
    method: 'POST',
    body: JSON.stringify(boundary),
  }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  }),
  updateRoutingProvider: (url) => request('/routing-provider', {
    method: 'POST',
    body: JSON.stringify({ url }),
  }),

  // Optimization
  optimize: (payload) => request('/optimize', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  }),
  getLastResults: () => request('/last-results'),
  getRouteValidations: () => request('/route-validations'),

  // Export URLs
  getRoutesCSVUrl: () => `${API_BASE}/export/routes-csv`,
  getCollectionPointsCSVUrl: () => `${API_BASE}/export/collection-points-csv`,
};
