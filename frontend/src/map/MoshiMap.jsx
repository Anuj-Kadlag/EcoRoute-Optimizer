import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import {
  MapPin,
  Trash2,
  Clock,
  Weight,
  Layers,
  Eye,
  EyeOff,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle,
  Home,
  Building2,
  ShieldCheck,
  CheckSquare,
  Filter,
} from 'lucide-react';

// Create custom SVG Leaflet DivIcons
const createDepotIcon = () => {
  return L.divIcon({
    className: 'custom-depot-div-icon',
    html: `
      <div style="
        background: #0f172a;
        color: #ffffff;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #10b981;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const createNumberedMarkerIcon = (number, color) => {
  return L.divIcon({
    className: 'custom-numbered-div-icon',
    html: `
      <div style="
        background: ${color};
        color: #ffffff;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        ${number}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -15],
  });
};

const createHouseholdIcon = (pt, isSelected = false) => {
  const isApt = pt.is_apartment || (pt.property_type && pt.property_type.toLowerCase().includes('apartment'));
  const isCollected = pt.status === 'Collected';
  const isVerified = pt.verification_status === 'Verified';

  // Base theme colors
  let bg = isApt ? '#7c3aed' : '#2563eb'; // Purple for Apartments, Blue for Houses
  let borderColor = '#ffffff';
  let badgeColor = isVerified ? '#10b981' : '#f59e0b';

  if (isCollected) {
    bg = '#64748b'; // Muted grey for collected
  }

  const selectedRing = isSelected
    ? 'box-shadow: 0 0 0 4px #fbbf24, 0 4px 14px rgba(0,0,0,0.5); transform: scale(1.2);'
    : 'box-shadow: 0 2px 8px rgba(0,0,0,0.3);';

  // Icon SVG
  const iconSvg = isApt
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="9" y1="22" x2="9" y2="22.01"></line>
        <line x1="15" y1="22" x2="15" y2="22.01"></line>
        <line x1="8" y1="6" x2="8" y2="6.01"></line>
        <line x1="16" y1="6" x2="16" y2="6.01"></line>
        <line x1="8" y1="10" x2="8" y2="10.01"></line>
        <line x1="16" y1="10" x2="16" y2="10.01"></line>
        <line x1="8" y1="14" x2="8" y2="14.01"></line>
        <line x1="16" y1="14" x2="16" y2="14.01"></line>
      </svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>`;

  const unitsPill = isApt && pt.household_units_count > 1
    ? `<span style="
        position: absolute;
        top: -6px;
        right: -8px;
        background: #0f172a;
        color: #ffffff;
        border: 1.5px solid #ffffff;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 800;
        padding: 1px 4px;
        line-height: 1;
      ">${pt.household_units_count}u</span>`
    : '';

  const verifiedDot = `
    <span style="
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${badgeColor};
      border: 1px solid #ffffff;
    "></span>
  `;

  return L.divIcon({
    className: 'custom-household-div-icon',
    html: `
      <div style="
        position: relative;
        background: ${bg};
        width: 24px;
        height: 24px;
        border-radius: ${isApt ? '6px' : '50%'};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${borderColor};
        ${selectedRing}
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${iconSvg}
        ${unitsPill}
        ${verifiedDot}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

// Icon Caches to prevent memory leak and repeated DOM rebuilding
const numberedIconCache = new Map();
const getNumberedMarkerIcon = (number, color) => {
  const key = `${number}_${color}`;
  let icon = numberedIconCache.get(key);
  if (!icon) {
    icon = createNumberedMarkerIcon(number, color);
    numberedIconCache.set(key, icon);
  }
  return icon;
};

const householdIconCache = new Map();
const getHouseholdIcon = (pt, isSelected = false) => {
  const isApt = Boolean(pt.is_apartment || (pt.property_type && pt.property_type.toLowerCase().includes('apartment')));
  const isCollected = pt.status === 'Collected';
  const isVerified = pt.verification_status === 'Verified';
  const units = pt.household_units_count || 1;
  const key = `${isApt ? 'apt' : 'house'}_${units}_${isCollected}_${isVerified}_${isSelected}`;
  let icon = householdIconCache.get(key);
  if (!icon) {
    icon = createHouseholdIcon(pt, isSelected);
    householdIconCache.set(key, icon);
  }
  return icon;
};

const unassignedWarningIcon = L.divIcon({
  className: 'unassigned-warning-icon',
  html: `
    <div style="
      background: #dc2626;
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      border: 2px solid #ffffff;
      box-shadow: 0 0 8px rgba(220,38,38,0.8);
      cursor: pointer;
    ">!</div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getRouteStopPopupHtml = (step, route, routeColor) => `
  <div style="padding: 6px; max-width: 270px; font-family: system-ui, -apple-system, sans-serif;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <span style="
        background: ${routeColor};
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 800;
      ">
        Stop #${step.step_index} • ${route.vehicle_name || route.vehicle_id}
      </span>
      <span style="font-size: 11px; color: #64748b; font-weight: 600;">
        ETA ${step.arrival_time_str || ''}
      </span>
    </div>
    <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 4px;">
      ${step.point_name}
    </strong>
    <div style="font-size: 11px; color: #475569; line-height: 1.4;">
      <div>Pickup: <strong>${step.garbage_picked_kg} kg</strong> (Cumul: ${step.cumulative_garbage_kg} kg)</div>
      <div>Leg Dist: <strong>${step.distance_from_prev_km} km</strong></div>
      <div>Service: <strong>${step.service_time_mins} mins</strong></div>
      ${step.snapped_road_name ? `
        <div style="margin-top: 3px; color: #047857; font-weight: 600;">
          🛣️ ${step.snapped_road_name} (${step.snapping_distance_m || 2.0}m snapped)
        </div>
      ` : ''}
    </div>
  </div>
`;

// Native Leaflet Layer for Vehicle Route Stop Sequence Markers (Prevents React virtual DOM thrashing)
function RouteStopsNativeLayer({
  routes,
  activeVehicleId,
  hiddenVehicleIds = [],
  showRouteStops,
  onSelectVehicle,
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !showRouteStops || !routes || routes.length === 0) return;

    const group = L.layerGroup();
    const isAnySelected = Boolean(activeVehicleId);

    routes.forEach((route) => {
      if (hiddenVehicleIds && hiddenVehicleIds.includes(route.vehicle_id)) return;
      const isSelected = activeVehicleId === route.vehicle_id;

      // When a vehicle is selected, highlight ONLY its route and stops!
      if (isAnySelected && !isSelected) return;

      const routeColor = route.color || '#2563eb';
      (route.steps || []).forEach((step) => {
        if (step.point_type === 'Depot' || step.step_index === 0) return;
        const icon = getNumberedMarkerIcon(step.step_index, routeColor);
        const stepLat = step.road_snapped_lat || step.lat;
        const stepLng = step.road_snapped_lng || step.lng;
        const marker = L.marker([stepLat, stepLng], { icon, zIndexOffset: isSelected ? 600 : 150 });

        // Lazy popup rendering prevents freezing on initial load
        marker.bindPopup(() => getRouteStopPopupHtml(step, route, routeColor));
        marker.on('click', () => {
          if (onSelectVehicle) onSelectVehicle(route.vehicle_id);
        });
        group.addLayer(marker);
      });
    });

    group.addTo(map);

    return () => {
      try {
        if (map && map.hasLayer(group)) {
          map.removeLayer(group);
        }
        group.clearLayers();
      } catch (e) {
        // ignore unmount errors
      }
    };
  }, [map, routes, activeVehicleId, hiddenVehicleIds, showRouteStops, onSelectVehicle]);

  return null;
}

const getHouseholdPopupHtml = (pt) => {
  const isApt = pt.is_apartment || (pt.property_type && pt.property_type.toLowerCase().includes('apartment'));
  const isVerified = pt.verification_status === 'Verified';

  return `
    <div style="padding: 6px; max-width: 270px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <span style="font-weight: 800; font-size: 11px; color: ${isApt ? '#7c3aed' : '#2563eb'}; background: ${isApt ? '#f5f3ff' : '#eff6ff'}; padding: 2px 6px; border-radius: 4px;">
          ${pt.id}
        </span>
        <span style="
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: ${isVerified ? '#ecfdf5' : '#fffbeb'};
          color: ${isVerified ? '#047857' : '#b45309'};
          border: 1px solid ${isVerified ? '#a7f3d0' : '#fde68a'};
        ">
          ${isVerified ? '✓ Verified' : '⚠ Estimated'}
        </span>
      </div>

      <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px; line-height: 1.3;">
        ${pt.name}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
        ${pt.address || 'Moshi, PCMC'}
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
        <span style="background: #f1f5f9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
          ${pt.property_type || pt.collection_type}
        </span>
        ${isApt ? `
          <span style="background: #ede9fe; color: #6d28d9; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
            🏢 ${pt.household_units_count || 12} Units
          </span>
        ` : `
          <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
            🏠 Independent House
          </span>
        `}
        <span style="
          background: ${pt.status === 'Collected' ? '#f1f5f9' : '#ecfdf5'};
          color: ${pt.status === 'Collected' ? '#64748b' : '#059669'};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        ">
          ${pt.status}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; color: #334155; background: #f8fafc; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div>Waste Demand: <strong style="color: #0f172a;">${pt.garbage_quantity_kg} kg</strong> ${pt.is_measured ? '(Measured)' : '(Est.)'}</div>
        <div>Stop Duration: <strong style="color: #0f172a;">${pt.collection_time_mins} mins</strong></div>
        <div style="grid-column: span 2;">Street: <span style="font-weight: 600; color: #047857;">🛣️ ${pt.snapped_road_name || 'Moshi Road Network'}</span></div>
      </div>

      <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Source: ${pt.data_source || 'OpenStreetMap'}</span>
        <span>Bld: ${pt.building_id || 'N/A'}</span>
      </div>
    </div>
  `;
};

// Leaflet Marker Cluster Layer Subcomponent
function HouseholdClusterLayer({
  collectionPoints,
  onSelectPoint,
  filterProperty,
  filterStatus,
  filterVerified,
  selectedPointId,
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const isClusterAvailable = typeof L.markerClusterGroup === 'function';
    const clusterGroup = isClusterAvailable
      ? L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 35,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let cSize = 34;
            let bgColor = '#047857';
            let borderColor = '#34d399';

            if (count > 50) {
              cSize = 44;
              bgColor = '#0f172a';
              borderColor = '#10b981';
            } else if (count > 20) {
              cSize = 38;
              bgColor = '#065f46';
              borderColor = '#6ee7b7';
            }

            return L.divIcon({
              html: `<div style="
                width: ${cSize}px;
                height: ${cSize}px;
                border-radius: 50%;
                background: ${bgColor};
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: ${count > 99 ? '11px' : '12px'};
                border: 3px solid ${borderColor};
                box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              "><span>${count}</span></div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(cSize, cSize),
            });
          },
        })
      : L.layerGroup();

    // Filter points based on user active filters
    const filtered = (collectionPoints || []).filter((pt) => {
      const isApt = pt.is_apartment || (pt.property_type && pt.property_type.toLowerCase().includes('apartment'));
      if (filterProperty === 'houses' && isApt) return false;
      if (filterProperty === 'apartments' && !isApt) return false;

      if (filterStatus === 'pending' && pt.status === 'Collected') return false;
      if (filterStatus === 'collected' && pt.status !== 'Collected') return false;

      const isVer = pt.verification_status === 'Verified';
      if (filterVerified === 'verified' && !isVer) return false;
      if (filterVerified === 'unverified' && isVer) return false;

      return true;
    });

    const markers = [];
    filtered.forEach((pt) => {
      const isSelected = selectedPointId === pt.id;
      const icon = getHouseholdIcon(pt, isSelected);
      // Ensure marker sits precisely on the vehicle-accessible street curb
      const markerLat = pt.road_snapped_lat || pt.lat;
      const markerLng = pt.road_snapped_lng || pt.lng;
      const marker = L.marker([markerLat, markerLng], { icon });

      // Lazy popup evaluation on user click only
      marker.bindPopup(() => getHouseholdPopupHtml(pt));
      marker.on('click', () => {
        if (onSelectPoint) onSelectPoint(pt);
      });
      markers.push(marker);
    });

    if (isClusterAvailable) {
      clusterGroup.addLayers(markers);
    } else {
      markers.forEach((m) => clusterGroup.addLayer(m));
    }
    map.addLayer(clusterGroup);

    return () => {
      try {
        if (map && map.hasLayer(clusterGroup)) {
          map.removeLayer(clusterGroup);
        }
        clusterGroup.clearLayers();
      } catch (e) {
        // ignore unmount errors
      }
    };
  }, [map, collectionPoints, onSelectPoint, filterProperty, filterStatus, filterVerified, selectedPointId]);

  return null;
}

// Map click handler helper component
function MapClickHandler({ onMapClick, isClickToAddActive }) {
  useMapEvents({
    click(e) {
      if (isClickToAddActive && onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Map center / bounds helper
function MapViewUpdater({ center, zoom, boundsToFit }) {
  const map = useMap();
  const lastViewRef = useRef({ lat: null, lng: null, zoom: null });

  useEffect(() => {
    if (!map) return;
    if (boundsToFit && boundsToFit.length > 0) {
      map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 16 });
      return;
    }
    if (center && Array.isArray(center) && center.length >= 2) {
      const targetLat = center[0];
      const targetLng = center[1];
      const targetZoom = zoom || 14;

      const prev = lastViewRef.current;
      const latDiff = prev.lat !== null ? Math.abs(prev.lat - targetLat) : 999;
      const lngDiff = prev.lng !== null ? Math.abs(prev.lng - targetLng) : 999;
      const zoomDiff = prev.zoom !== null ? Math.abs(prev.zoom - targetZoom) : 999;

      if (latDiff > 0.0001 || lngDiff > 0.0001 || zoomDiff > 0) {
        lastViewRef.current = { lat: targetLat, lng: targetLng, zoom: targetZoom };
        map.setView([targetLat, targetLng], targetZoom);
      }
    }
  }, [center?.[0], center?.[1], zoom, boundsToFit, map]);

  return null;
}

export default function MoshiMap({
  center = [18.6794, 73.8492],
  zoom = 14,
  collectionPoints = [],
  depot = null,
  boundary = null,
  routes = [],
  activeVehicleId = null,
  hiddenVehicleIds = [],
  onMapClick = null,
  isClickToAddActive = false,
  onSelectPoint = null,
  onSelectVehicle = null,
  boundsToFit = null,
  selectedPointId = null,
}) {
  console.log('MoshiMap: render called', {
    routesCount: routes?.length,
    pointsCount: collectionPoints?.length,
    depotName: depot?.name,
  });
  const depotIcon = useRef(createDepotIcon()).current;
  const [showBoundary, setShowBoundary] = useState(true);
  const [showHouseholds, setShowHouseholds] = useState(true);
  const [showRouteStops, setShowRouteStops] = useState(true);

  // Household Map Filters
  const [filterProperty, setFilterProperty] = useState('all'); // 'all', 'houses', 'apartments'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'collected'
  const [filterVerified, setFilterVerified] = useState('all'); // 'all', 'verified', 'unverified'

  // Computed summary
  const summaryStats = useMemo(() => {
    const total = collectionPoints.length;
    const houses = collectionPoints.filter(p => !p.is_apartment).length;
    const apts = collectionPoints.filter(p => p.is_apartment).length;
    const units = collectionPoints.reduce((acc, p) => acc + (p.household_units_count || 1), 0);
    const verified = collectionPoints.filter(p => p.verification_status === 'Verified').length;
    return { total, houses, apts, units, verified };
  }, [collectionPoints]);

  // Unassigned points check
  const unassignedPoints = useMemo(() => {
    if (!routes || routes.length === 0 || !collectionPoints || collectionPoints.length === 0) return [];
    const assignedIds = new Set();
    routes.forEach((r) => {
      (r.steps || []).forEach((s) => {
        if (s.point_type !== 'Depot') assignedIds.add(s.point_id);
      });
    });
    return collectionPoints.filter((p) => !assignedIds.has(p.id));
  }, [routes, collectionPoints]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
      >
        <MapViewUpdater center={center} zoom={zoom} boundsToFit={boundsToFit} />
        <MapClickHandler onMapClick={onMapClick} isClickToAddActive={isClickToAddActive} />

        {/* OpenStreetMap Standard Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Operational Boundary Circle / Area */}
        {showBoundary && boundary && (
          <Circle
            center={[boundary.center_lat || center[0], boundary.center_lng || center[1]]}
            radius={(boundary.radius_km || 7.5) * 1000}
            pathOptions={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.05,
              weight: 2,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* Depot Marker */}
        {depot && (
          <Marker position={[depot.lat, depot.lng]} icon={depotIcon}>
            <Popup>
              <div style={{ padding: '6px', maxWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ background: '#0f172a', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                    DEPOT
                  </span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{depot.name}</strong>
                </div>
                <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>{depot.address}</p>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Coords: {depot.lat.toFixed(5)}, {depot.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clustered Household Collection Points (Always rendered when showHouseholds is active) */}
        {showHouseholds && (
          <HouseholdClusterLayer
            collectionPoints={collectionPoints}
            onSelectPoint={onSelectPoint}
            filterProperty={filterProperty}
            filterStatus={filterStatus}
            filterVerified={filterVerified}
            selectedPointId={selectedPointId}
          />
        )}

        {/* Warning Markers for any Unassigned or Unreachable Households */}
        {showHouseholds && unassignedPoints.map((pt) => (
          <Marker
            key={`unassigned-${pt.id}`}
            position={[pt.road_snapped_lat || pt.lat, pt.road_snapped_lng || pt.lng]}
            icon={unassignedWarningIcon}
          >
            <Popup>
              <div style={{ padding: '6px', maxWidth: '240px' }}>
                <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '11px', marginBottom: '2px' }}>
                  ⚠️ UNASSIGNED HOUSEHOLD
                </div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{pt.name}</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Demand: {pt.garbage_quantity_kg} kg • {pt.property_type || 'Residential'}
                </div>
                <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '4px' }}>
                  Requires additional fleet capacity to achieve 100% coverage.
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Optimized Vehicle Routes with Road Polylines */}
        {routes &&
          routes.map((route) => {
            const isHidden = hiddenVehicleIds && hiddenVehicleIds.includes(route.vehicle_id);
            if (isHidden) return null;

            const isSelected = activeVehicleId === route.vehicle_id;
            const isAnySelected = Boolean(activeVehicleId);
            const routeColor = route.color || '#2563eb';

            // Ensure coordinates are strictly [lat, lng] for Leaflet
            const safePositions = (route.geometry || []).map((pt) => {
              if (Array.isArray(pt) && pt.length >= 2) {
                if (pt[0] > 50 && pt[1] < 30) {
                  return [pt[1], pt[0]];
                }
                return [pt[0], pt[1]];
              }
              return pt;
            });

            // If another vehicle is active, dim this route
            const polylineWeight = isSelected ? 6 : (isAnySelected ? 2.5 : 4);
            const polylineOpacity = isSelected ? 1.0 : (isAnySelected ? 0.22 : 0.85);
            const dashStyle = isAnySelected && !isSelected ? '4, 4' : undefined;

            return (
              <Polyline
                key={`route-polyline-${route.vehicle_id}`}
                positions={safePositions}
                pathOptions={{
                  color: routeColor,
                  weight: polylineWeight,
                  opacity: polylineOpacity,
                  dashArray: dashStyle,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => onSelectVehicle && onSelectVehicle(route.vehicle_id),
                }}
              >
                <Popup>
                  <div style={{ padding: '6px', maxWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: routeColor }}></span>
                      <strong style={{ fontSize: '13px' }}>{route.vehicle_name}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                      <div>Stops: <strong>{route.total_stops}</strong></div>
                      <div>Distance: <strong>{route.total_distance_km} km</strong></div>
                      <div>Garbage: <strong>{route.total_garbage_kg} kg</strong> ({route.capacity_utilization_pct}%)</div>
                      <div>Cost: <strong>₹{route.total_cost}</strong></div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* Numbered Route Stops (Managed in native Leaflet layer for 60fps performance) */}
        <RouteStopsNativeLayer
          routes={routes}
          activeVehicleId={activeVehicleId}
          hiddenVehicleIds={hiddenVehicleIds}
          showRouteStops={showRouteStops}
          onSelectVehicle={onSelectVehicle}
        />
      </MapContainer>

      {/* Top Header Banner: Moshi Coverage Info */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '60px',
        zIndex: 400,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        color: '#ffffff',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <strong style={{ color: '#ffffff' }}>Moshi Operational Area</strong>
        </div>
        <div style={{ color: '#cbd5e1' }}>
          <strong>{summaryStats.total}</strong> Pickup Locations (<strong>{summaryStats.units}</strong> Households & Units)
        </div>
        <div style={{ color: '#94a3b8' }}>
          🏠 {summaryStats.houses} Houses • 🏢 {summaryStats.apts} Apartments • ✓ {summaryStats.verified} Verified
        </div>
      </div>

      {/* Floating Map Controls & Overlays */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '240px',
      }}>
        {/* Toggle Boundary, Households & Stops */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowBoundary(!showBoundary)}
            title="Toggle Moshi operational boundary"
            style={{
              flex: 1,
              background: showBoundary ? '#ecfdf5' : '#ffffff',
              color: showBoundary ? '#059669' : '#64748b',
              border: `1px solid ${showBoundary ? '#a7f3d0' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Compass size={13} />
            Boundary
          </button>

          <button
            type="button"
            onClick={() => {
              const anyVisible = showHouseholds || showRouteStops;
              setShowHouseholds(!anyVisible);
              setShowRouteStops(!anyVisible);
            }}
            title={showHouseholds || showRouteStops ? "Hide all collection points & stops on map" : "Show all collection points & stops on map"}
            style={{
              flex: 1.2,
              background: (showHouseholds || showRouteStops) ? '#ecfdf5' : '#f8fafc',
              color: (showHouseholds || showRouteStops) ? '#047857' : '#64748b',
              border: `1px solid ${(showHouseholds || showRouteStops) ? '#10b981' : '#cbd5e1'}`,
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.15s ease',
            }}
          >
            {(showHouseholds || showRouteStops) ? <Eye size={13} /> : <EyeOff size={13} />}
            {(showHouseholds || showRouteStops) ? `Points: On (${collectionPoints.length})` : 'Points: Off'}
          </button>

          {routes && routes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRouteStops(!showRouteStops)}
              title={showRouteStops ? "Hide numbered route stop pins" : "Show numbered route stop pins"}
              style={{
                flex: 1,
                background: showRouteStops ? '#eff6ff' : '#f8fafc',
                color: showRouteStops ? '#1d4ed8' : '#64748b',
                border: `1px solid ${showRouteStops ? '#3b82f6' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '6px 8px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease',
              }}
            >
              <MapPin size={13} />
              {showRouteStops ? 'Stops: On' : 'Stops: Off'}
            </button>
          )}
        </div>

        {/* Map Filter Controls (when showing collection points) */}
        {showHouseholds && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} color="#059669" />
              <span>Map Filters</span>
            </div>

            {/* Property Filter */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>Property Type:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setFilterProperty('all')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterProperty === 'all' ? '#2563eb' : '#cbd5e1',
                    background: filterProperty === 'all' ? '#eff6ff' : '#ffffff',
                    color: filterProperty === 'all' ? '#1d4ed8' : '#475569',
                    fontWeight: filterProperty === 'all' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterProperty('houses')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterProperty === 'houses' ? '#2563eb' : '#cbd5e1',
                    background: filterProperty === 'houses' ? '#eff6ff' : '#ffffff',
                    color: filterProperty === 'houses' ? '#1d4ed8' : '#475569',
                    fontWeight: filterProperty === 'houses' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  🏠 Houses
                </button>
                <button
                  type="button"
                  onClick={() => setFilterProperty('apartments')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterProperty === 'apartments' ? '#7c3aed' : '#cbd5e1',
                    background: filterProperty === 'apartments' ? '#f5f3ff' : '#ffffff',
                    color: filterProperty === 'apartments' ? '#6d28d9' : '#475569',
                    fontWeight: filterProperty === 'apartments' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  🏢 Apts
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>Collection Status:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterStatus === 'all' ? '#059669' : '#cbd5e1',
                    background: filterStatus === 'all' ? '#ecfdf5' : '#ffffff',
                    color: filterStatus === 'all' ? '#047857' : '#475569',
                    fontWeight: filterStatus === 'all' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('pending')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterStatus === 'pending' ? '#059669' : '#cbd5e1',
                    background: filterStatus === 'pending' ? '#ecfdf5' : '#ffffff',
                    color: filterStatus === 'pending' ? '#047857' : '#475569',
                    fontWeight: filterStatus === 'pending' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('collected')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterStatus === 'collected' ? '#64748b' : '#cbd5e1',
                    background: filterStatus === 'collected' ? '#f1f5f9' : '#ffffff',
                    color: filterStatus === 'collected' ? '#334155' : '#475569',
                    fontWeight: filterStatus === 'collected' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Verification Filter */}
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>Verification:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setFilterVerified('all')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterVerified === 'all' ? '#0f172a' : '#cbd5e1',
                    background: filterVerified === 'all' ? '#f8fafc' : '#ffffff',
                    color: filterVerified === 'all' ? '#0f172a' : '#475569',
                    fontWeight: filterVerified === 'all' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVerified('verified')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterVerified === 'verified' ? '#059669' : '#cbd5e1',
                    background: filterVerified === 'verified' ? '#ecfdf5' : '#ffffff',
                    color: filterVerified === 'verified' ? '#047857' : '#475569',
                    fontWeight: filterVerified === 'verified' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  ✓ Verified
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVerified('unverified')}
                  style={{
                    padding: '3px 4px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: filterVerified === 'unverified' ? '#d97706' : '#cbd5e1',
                    background: filterVerified === 'unverified' ? '#fffbeb' : '#ffffff',
                    color: filterVerified === 'unverified' ? '#b45309' : '#475569',
                    fontWeight: filterVerified === 'unverified' ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  ⚠ Est.
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click to add notice banner */}
      {isClickToAddActive && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 400,
          background: '#0f172a',
          color: '#34d399',
          padding: '8px 16px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
          border: '1px solid #10b981',
        }}>
          <MapPin size={16} />
          Click anywhere in Moshi to place a new household collection point!
        </div>
      )}
    </div>
  );
}
