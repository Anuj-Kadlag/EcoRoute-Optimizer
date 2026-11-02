import React, { useState, useMemo } from 'react';
import {
  Plus,
  Upload,
  Download,
  RotateCcw,
  Search,
  Filter,
  Trash2,
  Edit2,
  MapPin,
  Clock,
  Weight,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Home,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  CheckSquare,
  FileCode,
} from 'lucide-react';
import { api } from '../services/api';

export default function CollectionPointsPage({
  collectionPoints = [],
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onResetDemo,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');

  // Loading & notification states
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // GeoJSON Modal
  const [isGeojsonModalOpen, setIsGeojsonModalOpen] = useState(false);
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [geojsonLoading, setGeojsonLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    building_id: '',
    name: '',
    address: '',
    lat: 18.6794,
    lng: 73.8492,
    collection_type: 'Individual House',
    property_type: 'Independent House',
    is_apartment: false,
    household_units_count: 1,
    entrance_type: 'Road-Snapped Pickup Point',
    garbage_quantity_kg: 3.0,
    is_measured: false,
    collection_time_mins: 2.0,
    priority: 'Medium',
    status: 'Pending',
    verification_status: 'Automatically Detected',
    data_source: 'OpenStreetMap Footprints',
    notes: '',
  });

  // Calculate KPIs
  const stats = useMemo(() => {
    const total = collectionPoints.length;
    const houses = collectionPoints.filter(p => !p.is_apartment).length;
    const apts = collectionPoints.filter(p => p.is_apartment).length;
    const totalUnits = collectionPoints.reduce((acc, p) => acc + (p.household_units_count || 1), 0);
    const verified = collectionPoints.filter(p => p.verification_status === 'Verified').length;
    const totalDemand = collectionPoints.reduce((acc, p) => acc + (p.garbage_quantity_kg || 0), 0);
    const measuredDemand = collectionPoints.filter(p => p.is_measured).reduce((acc, p) => acc + (p.garbage_quantity_kg || 0), 0);
    const estimatedDemand = totalDemand - measuredDemand;

    return {
      total,
      houses,
      apts,
      totalUnits,
      verified,
      unverified: total - verified,
      verificationPct: total > 0 ? ((verified / total) * 100).toFixed(1) : 0,
      totalDemand: totalDemand.toFixed(1),
      measuredDemand: measuredDemand.toFixed(1),
      estimatedDemand: estimatedDemand.toFixed(1),
    };
  }, [collectionPoints]);

  const showNotification = (msg, isError = false) => {
    setStatusMessage({ text: msg, isError });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Handlers
  const handleDetectOsm = async () => {
    setActionLoading(true);
    try {
      const updated = await api.detectOsmHouseholds();
      showNotification(`Successfully refreshed ${updated.length} Moshi residential building and household collection points from OpenStreetMap.`);
      window.location.reload();
    } catch (err) {
      showNotification(`Error detecting OSM households: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeduplicate = async () => {
    setActionLoading(true);
    try {
      const res = await api.deduplicatePoints(6.0);
      showNotification(res.message);
      window.location.reload();
    } catch (err) {
      showNotification(`Error during deduplication: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVerify = async (ptId) => {
    try {
      const res = await api.toggleVerifyPoint(ptId);
      // Update local state without full reload
      const updated = collectionPoints.map(p => {
        if (p.id === ptId) {
          return { ...p, verification_status: res.verification_status };
        }
        return p;
      });
      onUpdatePoint(ptId, updated.find(p => p.id === ptId));
      showNotification(`Point ${ptId} verification updated to: ${res.verification_status}`);
    } catch (err) {
      showNotification(`Failed to toggle verification: ${err.message}`, true);
    }
  };

  const openAddModal = () => {
    setEditingPoint(null);
    setFormData({
      id: `HH-MOSHI-${(collectionPoints.length + 1).toString().padStart(4, '0')}`,
      building_id: `OSM-WAY-${8900000 + collectionPoints.length + 1}`,
      name: '',
      address: '',
      lat: 18.6794,
      lng: 73.8492,
      collection_type: 'Individual House',
      property_type: 'Independent House',
      is_apartment: false,
      household_units_count: 1,
      entrance_type: 'Road-Snapped Pickup Point',
      garbage_quantity_kg: 3.0,
      is_measured: false,
      collection_time_mins: 2.0,
      priority: 'Medium',
      status: 'Pending',
      verification_status: 'Manually Added',
      data_source: 'Manual Municipal Entry',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pt) => {
    setEditingPoint(pt);
    setFormData({ ...pt });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingPoint) {
      await onUpdatePoint(editingPoint.id, formData);
      showNotification(`Updated collection point ${editingPoint.id}`);
    } else {
      await onAddPoint(formData);
      showNotification(`Created collection point ${formData.id}`);
    }
    setIsModalOpen(false);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvLoading(true);
    try {
      const res = await api.importCollectionPointsCSV(csvFile);
      showNotification(res.message);
      window.location.reload();
    } catch (err) {
      showNotification(`Error importing CSV: ${err.message}`, true);
    } finally {
      setCsvLoading(false);
      setIsCsvModalOpen(false);
    }
  };

  const handleGeojsonUpload = async (e) => {
    e.preventDefault();
    if (!geojsonFile) return;
    setGeojsonLoading(true);
    try {
      const res = await api.importGeojsonFile(geojsonFile);
      showNotification(res.message);
      window.location.reload();
    } catch (err) {
      showNotification(`Error importing GeoJSON: ${err.message}`, true);
    } finally {
      setGeojsonLoading(false);
      setIsGeojsonModalOpen(false);
    }
  };

  // Filtered List
  const filteredPoints = collectionPoints.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      (p.address && p.address.toLowerCase().includes(term)) ||
      (p.building_id && p.building_id.toLowerCase().includes(term));

    const isApt = p.is_apartment || (p.property_type && p.property_type.toLowerCase().includes('apartment'));
    let matchesProperty = true;
    if (propertyFilter === 'Houses') matchesProperty = !isApt;
    else if (propertyFilter === 'Apartments') matchesProperty = isApt;

    const matchesStatus = statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'All' || p.priority.toLowerCase() === priorityFilter.toLowerCase();

    let matchesVerification = true;
    if (verificationFilter === 'Verified') matchesVerification = p.verification_status === 'Verified';
    else if (verificationFilter === 'Estimated') matchesVerification = p.verification_status !== 'Verified';

    return matchesSearch && matchesProperty && matchesStatus && matchesPriority && matchesVerification;
  });

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {statusMessage && (
        <div style={{
          background: statusMessage.isError ? '#fef2f2' : '#ecfdf5',
          color: statusMessage.isError ? '#b91c1c' : '#047857',
          border: `1px solid ${statusMessage.isError ? '#fecaca' : '#a7f3d0'}`,
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          {statusMessage.isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Moshi Household Collection Points
            </h2>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {collectionPoints.length} Locations ({stats.totalUnits} Households & Flats)
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            OpenStreetMap residential building footprints, road-snapped entrance gates, and waste demand records across Moshi, PCMC.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDetectOsm}
            title="Detect residential buildings and households from OpenStreetMap"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #93c5fd',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <Sparkles size={14} />
            Auto-Detect OSM Moshi
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDeduplicate}
            title="Deduplicate collection points within 6 meters"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <Layers size={14} />
            Deduplicate (6m)
          </button>

          <button
            type="button"
            onClick={() => setIsGeojsonModalOpen(true)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <FileCode size={14} />
            Import GeoJSON
          </button>

          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Upload size={14} />
            Import CSV
          </button>

          <a
            href={api.getCollectionPointsCSVUrl()}
            download
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export CSV
          </a>

          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            <Plus size={15} />
            Add Point
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Household Footprints</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {stats.total} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>stops</span>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            {stats.totalUnits} Total Family Units
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Property Types</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
            🏠 {stats.houses} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>houses</span>
          </div>
          <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px', fontWeight: 600 }}>
            🏢 {stats.apts} Apartment Societies
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Verification Status</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {stats.verificationPct}% <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>verified</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            ✓ {stats.verified} Verified • ⚠ {stats.unverified} Estimated
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Waste Demand</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {Number(stats.totalDemand).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Est: {stats.estimatedDemand} kg • Meas: {stats.measuredDemand} kg
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by ID, Building, Street (e.g. Spine Road, Woodsville)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Property:</span>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="All">All Properties</option>
              <option value="Houses">🏠 Independent Houses</option>
              <option value="Apartments">🏢 Apartment Buildings</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="All">All Verification</option>
              <option value="Verified">✓ Verified Only</option>
              <option value="Estimated">⚠ Estimated Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Collected">Collected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', padding: '0 4px' }}>
        <span>Showing <strong>{filteredPoints.length}</strong> of {collectionPoints.length} collection points</span>
        <span>Filtered Waste Demand: <strong>{filteredPoints.reduce((acc, p) => acc + p.garbage_quantity_kg, 0).toFixed(1)} kg</strong></span>
      </div>

      {/* Collection Points Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '11px' }}>
                <th style={{ padding: '10px 14px' }}>Household ID</th>
                <th style={{ padding: '10px 14px' }}>Property Name & Street Address</th>
                <th style={{ padding: '10px 14px' }}>Property Type</th>
                <th style={{ padding: '10px 14px' }}>Units</th>
                <th style={{ padding: '10px 14px' }}>Accessible Entrance</th>
                <th style={{ padding: '10px 14px' }}>Demand</th>
                <th style={{ padding: '10px 14px' }}>Time</th>
                <th style={{ padding: '10px 14px' }}>Verification</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No collection points match your filters.
                  </td>
                </tr>
              ) : (
                filteredPoints.map((pt) => {
                  const isApt = pt.is_apartment || (pt.property_type && pt.property_type.toLowerCase().includes('apartment'));
                  const isVerified = pt.verification_status === 'Verified';

                  return (
                    <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 800, color: isApt ? '#7c3aed' : '#2563eb' }}>{pt.id}</span>
                        {pt.building_id && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{pt.building_id}</div>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{pt.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{pt.address || 'Moshi, PCMC'}</div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: isApt ? '#f5f3ff' : '#eff6ff',
                          color: isApt ? '#6d28d9' : '#1d4ed8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {isApt ? <Building2 size={12} /> : <Home size={12} />}
                          {pt.property_type || pt.collection_type}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#334155' }}>
                        {pt.household_units_count || (isApt ? 12 : 1)}
                      </td>

                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: '11px' }}>
                        {pt.entrance_type || 'Road-Snapped Pickup Point'}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{pt.garbage_quantity_kg} kg</span>
                        <div style={{ fontSize: '10px', color: pt.is_measured ? '#059669' : '#b45309' }}>
                          {pt.is_measured ? 'Measured' : 'Estimated'}
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {pt.collection_time_mins} min
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleVerify(pt.id)}
                          title="Click to toggle verification status"
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            border: `1px solid ${isVerified ? '#a7f3d0' : '#fde68a'}`,
                            background: isVerified ? '#ecfdf5' : '#fffbeb',
                            color: isVerified ? '#047857' : '#b45309',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          {isVerified ? 'Verified' : 'Estimated'}
                        </button>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: pt.status === 'Collected' ? '#10b981' : '#f59e0b',
                        }}>
                          {pt.status === 'Collected' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                          {pt.status}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(pt)}
                            title="Edit Household"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#475569',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePoint(pt.id)}
                            title="Delete Point"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Point Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            width: '520px',
            maxWidth: '92%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
              {editingPoint ? `Edit Household: ${editingPoint.id}` : 'Add Residential Collection Point'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Household ID</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Building ID (OSM / Muni)</label>
                  <input
                    type="text"
                    value={formData.building_id}
                    onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Property / Building Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Woodsville Tower 3 Gate A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Street Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, Spine Road, Moshi, PCMC"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Property Type</label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isApt = val.includes('Apartment');
                      setFormData({
                        ...formData,
                        property_type: val,
                        is_apartment: isApt,
                        collection_type: isApt ? 'Apartment Building' : 'Individual House',
                        household_units_count: isApt ? Math.max(formData.household_units_count, 12) : 1,
                        entrance_type: isApt ? 'Mapped Access Gate' : 'Road-Snapped Pickup Point',
                      });
                    }}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  >
                    <option value="Independent House">Independent House</option>
                    <option value="Apartment Building">Apartment Building</option>
                    <option value="Row House">Row House</option>
                    <option value="Detached House">Detached House</option>
                    <option value="Semi-Detached House">Semi-Detached House</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Household Units Count</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formData.household_units_count}
                    onChange={(e) => setFormData({ ...formData, household_units_count: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Road-Accessible Pickup Location</label>
                <select
                  value={formData.entrance_type}
                  onChange={(e) => setFormData({ ...formData, entrance_type: e.target.value })}
                  style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                >
                  <option value="Road-Snapped Pickup Point">Road-Snapped Pickup Point (Street Frontage)</option>
                  <option value="Mapped Access Gate">Mapped Access Gate (Apartment Perimeter)</option>
                  <option value="Building Main Entrance">Building Main Entrance</option>
                  <option value="Service Lane Access">Service Lane Access</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Waste Demand (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5000"
                    required
                    value={formData.garbage_quantity_kg}
                    onChange={(e) => setFormData({ ...formData, garbage_quantity_kg: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Service Time (mins)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="120"
                    required
                    value={formData.collection_time_mins}
                    onChange={(e) => setFormData({ ...formData, collection_time_mins: parseFloat(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Verification Status</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  >
                    <option value="Verified">Verified Real-World Location</option>
                    <option value="Automatically Detected">Automatically Detected (OSM)</option>
                    <option value="Manually Added">Manually Added</option>
                    <option value="Unverified/Estimated">Unverified or Estimated</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '3px' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Collected">Collected</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingPoint ? 'Update Household' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            width: '460px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Import Households via CSV
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Upload a municipal CSV containing: ID, Name, Latitude, Longitude, Property Type, Units, Demand (kg), Time (mins).
            </p>

            <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setCsvFile(e.target.files[0])}
                style={{
                  padding: '12px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={csvLoading || !csvFile}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: csvLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {csvLoading ? 'Uploading...' : 'Upload & Merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GeoJSON Import Modal */}
      {isGeojsonModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            width: '460px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Import GeoJSON Building Footprints
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Upload GeoJSON polygon or point layer containing Moshi residential buildings. Footprints will automatically snap to accessible street pickup points.
            </p>

            <form onSubmit={handleGeojsonUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="file"
                accept=".geojson,.json"
                required
                onChange={(e) => setGeojsonFile(e.target.files[0])}
                style={{
                  padding: '12px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsGeojsonModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={geojsonLoading || !geojsonFile}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: geojsonLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {geojsonLoading ? 'Importing GeoJSON...' : 'Import Buildings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
