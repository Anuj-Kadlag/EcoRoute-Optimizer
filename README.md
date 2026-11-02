# EcoRoute – Intelligent Waste Collection Route Optimization System

> Modern, full-stack route optimization platform for municipal solid waste collection fleets operating in **Moshi, Pimpri-Chinchwad, Maharashtra, India**.

---

## 🌟 Overview

**EcoRoute** solves the genuine **Multi-Vehicle Capacitated Vehicle Routing Problem (CVRP)** with heterogeneous fleet capacities, maximum shift durations, and operational cost functions.

Rather than relying on basic straight-line Euclidean approximations or frontend toy algorithms, EcoRoute employs **Google OR-Tools** in a **Python FastAPI** backend combined with real road-network distance and duration matrices, producing street-following routes displayed on an interactive **Leaflet.js / OpenStreetMap** interface.

---

## 📍 Operational Region: Moshi, Pimpri-Chinchwad

- **Default Center Coordinates**: Latitude `18.6794`, Longitude `73.8492`
- **Primary Arteries & Neighborhoods**: Spine Road, Moshi Gaothan, Pune-Nashik Highway (NH 60), Moshi-Alandi Road, Borhade Wadi, Gandharv Nagari, Woodsville, River Residency, Dudulgaon Link, Moshi International Convention Centre (PIECC).
- **Primary Depot**: PCMC Moshi Waste Processing & Transfer Station on Spine Road.
- **Preloaded Authentic Moshi Dataset**: 182 real residential locations representing 662+ household family units (152 independent bungalows and 30 apartment complexes) with road-snapped entrance access points.

---

## 🏡 Automatic Household-Level Collection System

EcoRoute moves beyond arbitrary simulated markers to true **household-level collection point detection**:

1. **OpenStreetMap Residential Detection**:
   - Queries building footprints and residential nodes via Overpass API within the Moshi boundary.
   - Strictly filters for residential types (`detached`, `house`, `residential`, `apartments`, `row_house`).
   - Ignores industrial facilities, warehouses, commercial complexes, and offices.
2. **Road-Network Access Snapping**:
   - Instead of inaccessible building polygon centroids, pickup coordinates are snapped toward the nearest road-network access point or gate.
3. **Unit-Level Demand & Apartments**:
   - Independent houses: single collection point per house (default ~3.5 kg/day).
   - Apartment buildings: aggregated demand based on verified household unit count (e.g. 15 flats × 3.5 kg = 52.5 kg) at a single accessible street gate.
4. **Data Management & Verification**:
   - Tracks data source: `Automatically Detected (OSM)`, `Manually Added`, `Verified`, or `Unverified/Estimated`.
   - 1-click verification toggles directly on map popups and table rows.
   - Built-in spatial deduplication tool (default 6.0m threshold) to clean overlapping footprints.
   - GeoJSON building footprint import & CSV import/export.
5. **High-Performance Map Visualization**:
   - Leaflet Marker Clustering (`leaflet.markercluster`) for smooth rendering of hundreds/thousands of houses.
   - Custom SVG DivIcons distinguishing Independent Houses (blue bungalow glyph) from Apartment Complexes (purple tower with unit count pill).
   - Quick filters for Property Type (*All / Houses / Apartments*), Status (*All / Pending / Collected*), and Verification (*All / Verified / Estimated*).

---

## 🚀 Large-Scale CVRP Optimization Engine

- **Dual-Mode Solver Architecture**:
  - **Monolithic CVRP**: Guided Local Search (GLS) for datasets up to 70 stops.
  - **Hierarchical Sector Decomposition**: Divides large-scale service areas into angular polar sectors centered at the Moshi Depot, performs vehicle bin-packing with operational capacity buffers, and solves per-vehicle OR-Tools CVRP subproblems with full OSRM road geometry.
- **100% Road-Following Routes**: Turn-by-turn road network coordinates without Euclidean straight-line shortcuts.
- **Auto Fleet Sizing Recommendation**: Mathematically calculates minimum viable vehicle count and fleet distribution to fulfill total waste demand within working hour limits.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Leaflet.js, React-Leaflet, OpenStreetMap, Recharts, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic, Python-Multipart |
| **Optimization Engine** | Google OR-Tools (Capacitated Vehicle Routing Problem with Guided Local Search) |
| **Road Routing** | OSRM-compatible routing service + PCMC calibrated urban road network model |

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Install Dependencies
```bash
# Backend dependencies
pip install fastapi uvicorn ortools pydantic requests python-multipart

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Run the Entire System with One Command
```bash
python run.py
```
This automatically launches:
- **FastAPI Backend**: `http://127.0.0.1:8000` (API documentation at `/docs`)
- **React Frontend**: `http://127.0.0.1:5173`
- Opens your default web browser directly to the EcoRoute dashboard.

---

## 🧪 Acceptance Test Suite (14 Tests)

To run the automated verification test suite verifying all 14 criteria:
```bash
python -m backend.tests.verify_acceptance_criteria
```

### Test Results Summary:
1. ✅ **Variable collection points**: Dynamically solves 5, 20, 38 points.
2. ✅ **Variable vehicle counts**: Handles 2, 4, 6+ vehicles dynamically.
3. ✅ **Multi-vehicle assignment**: Correctly partitions stops across vehicles.
4. ✅ **Disjoint routes**: Every vehicle receives an independent route.
5. ✅ **Visited once**: Every assigned stop is visited exactly once.
6. ✅ **Capacity constraints**: No vehicle ever exceeds maximum capacity.
7. ✅ **Road-following geometry**: Street-following waypoints instead of straight lines.
8. ✅ **Depot start and finish**: Every route originates and terminates at the configured Moshi Depot.
9. ✅ **Economic expense calculations**: Computes fuel, driver wages, maintenance, and activation costs.
10. ✅ **Capacity sensitivity**: Changing carrying capacities alters route assignments.
11. ✅ **Fuel price sensitivity**: Changing fuel rates adjusts economic routing tradeoffs.
12. ✅ **Dynamic updates**: Adding stops dynamically updates optimization solutions.
13. ✅ **Automatic Fleet Sizing**: Analyzes demand and recommends the minimal cost feasible fleet with an operational buffer.
14. ✅ **Infeasible plan diagnostics**: Clearly flags capacity bottlenecks and provides diagnostic recommendations.

---

## 📊 Core Modules & Architecture

```
evs-optimal-path-finder/
├── backend/
│   ├── main.py                       # FastAPI application entrypoint & CORS
│   ├── models/
│   │   └── schemas.py                # Pydantic schemas (CollectionPoint, Vehicle, Depot, Routes)
│   ├── routes/
│   │   ├── api.py                    # RESTful endpoints (/api/optimize, /api/collection-points, etc.)
│   │   └── demo_data.py              # 38 realistic Moshi demo points & 5 default fleet vehicles
│   ├── optimization/
│   │   ├── solver.py                 # Google OR-Tools CVRP solver (GLS metaheuristic)
│   │   ├── cost_calculator.py        # Fuel, driver wage, maintenance, activation & baseline logic
│   │   └── distance_matrix.py        # Coordinate collation and integer matrix scaling
│   ├── services/
│   │   └── routing_service.py        # OSRM routing provider with fallback road network modeling
│   └── tests/
│       └── verify_acceptance_criteria.py # Automated test suite (14 criteria)
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, StatCard
│   │   ├── pages/                    # RoutePlanner, Dashboard, CollectionPoints, Vehicles, Depot, Results, CostAnalytics, Settings
│   │   ├── map/                      # MoshiMap (Leaflet interactive map with custom DivIcons & polylines)
│   │   ├── charts/                   # Recharts CostBreakdown, SavingsComparison, VehicleUtilization
│   │   └── services/                 # api.js API client
│   └── package.json
├── run.py                            # One-click startup orchestrator
└── README.md
```

---

## 📈 Optimization Objectives Supported

1. **Minimum Operating Cost**: Optimizes weighted total cost:
   $$\text{Total Cost} = \text{Activation Cost} + \text{Fuel Cost} + \text{Driver Cost} + \text{Maintenance Cost}$$
   where $\text{Fuel Cost} = \left(\frac{\text{Distance}}{\text{Efficiency}}\right) \times \text{Fuel Price}$.
2. **Minimum Number of Vehicles**: Applies vehicle fixed activation penalties to consolidate pickups into the smallest feasible fleet.
3. **Fastest Collection Completion**: Minimizes the makespan (maximum duration of any single vehicle).
4. **Balanced Workload**: Equalizes distance and time across the active fleet.

---

## 🖨️ Export & Manifests
- **Export Routes as CSV**: Detailed stop-by-stop schedule with arrival/departure ETAs, leg distances, and load quantities.
- **Export Collection Points as CSV**: Complete inventory of stops with coordinates and priorities.
- **Export Full Solution as JSON**: Machine-readable coordinates, turn vertices, and metrics.
- **Print Driver Manifests**: Clean print-optimized layout for drivers.
