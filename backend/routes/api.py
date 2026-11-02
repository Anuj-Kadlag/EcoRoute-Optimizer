import io
import csv
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Body
from fastapi.responses import Response

from ..models.schemas import (
    CollectionPoint,
    Vehicle,
    Depot,
    OptimizationSettings,
    OptimizationRequest,
    OptimizationResponse,
    BoundaryConfig,
    CoverageReport,
    RouteValidation,
)
from ..optimization.solver import RouteOptimizer
from .demo_data import get_demo_collection_points, DEFAULT_VEHICLES, DEFAULT_DEPOT
from ..services.routing_service import routing_service
from ..services.osm_household_detector import osm_detector

router = APIRouter()
logger = logging.getLogger("ecoroute.api")

# In-memory operational state initialized with Moshi OpenStreetMap Household Dataset
_collection_points: List[CollectionPoint] = osm_detector.get_moshi_osm_dataset()
_vehicles: List[Vehicle] = [v.model_copy() for v in DEFAULT_VEHICLES]
_depot: Depot = DEFAULT_DEPOT.model_copy()
_settings: OptimizationSettings = OptimizationSettings()
_boundary: BoundaryConfig = BoundaryConfig(
    center_lat=18.6794,
    center_lng=73.8492,
    radius_km=7.5,
    polygon=[
        [18.7050, 73.8150],
        [18.7050, 73.8750],
        [18.6550, 73.8750],
        [18.6550, 73.8150],
    ],
)
_last_optimization_result: Optional[OptimizationResponse] = None

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoRoute Optimization Engine",
        "region": "Moshi, Pimpri-Chinchwad, Maharashtra, India",
        "center_coordinates": {"lat": 18.6794, "lng": 73.8492},
        "routing_provider": routing_service.base_url,
        "collection_points_count": len(_collection_points),
        "vehicles_count": len(_vehicles),
    }

# ----------------- COLLECTION POINTS -----------------

@router.get("/collection-points", response_model=List[CollectionPoint])
def get_collection_points():
    return _collection_points

@router.post("/collection-points", response_model=CollectionPoint)
def add_collection_point(point: CollectionPoint):
    # Check duplicate ID
    if any(p.id == point.id for p in _collection_points):
        # Auto-generate unique ID if collision
        point.id = f"CP-{len(_collection_points) + 1:02d}"
    # Verify and snap to nearest accessible street
    point = osm_detector.snap_and_verify_point(point, max_snapping_dist_m=_settings.max_snapping_distance_m)
    _collection_points.append(point)
    return point

@router.put("/collection-points/{point_id}", response_model=CollectionPoint)
def update_collection_point(point_id: str, updated_point: CollectionPoint):
    for i, pt in enumerate(_collection_points):
        if pt.id == point_id:
            # Re-snap to road network if coordinates changed
            if pt.lat != updated_point.lat or pt.lng != updated_point.lng:
                updated_point = osm_detector.snap_and_verify_point(updated_point, max_snapping_dist_m=_settings.max_snapping_distance_m)
            _collection_points[i] = updated_point
            return updated_point
    raise HTTPException(status_code=404, detail=f"Collection point {point_id} not found.")

@router.delete("/collection-points/{point_id}")
def delete_collection_point(point_id: str):
    global _collection_points
    initial_len = len(_collection_points)
    _collection_points = [p for p in _collection_points if p.id != point_id]
    if len(_collection_points) == initial_len:
        raise HTTPException(status_code=404, detail=f"Collection point {point_id} not found.")
    return {"message": f"Collection point {point_id} deleted successfully."}

@router.post("/collection-points/reset-demo", response_model=List[CollectionPoint])
def reset_demo_points():
    global _collection_points
    _collection_points = osm_detector.get_moshi_osm_dataset()
    return _collection_points

@router.post("/collection-points/detect-osm", response_model=List[CollectionPoint])
def detect_osm_households(force_offline: bool = False):
    """
    Triggers OpenStreetMap Overpass extraction within the configured Moshi boundary.
    Falls back reliably to authentic Moshi residential dataset when Overpass is busy.
    """
    global _collection_points
    logger.info("Detecting OpenStreetMap residential properties in Moshi boundary...")
    detected = osm_detector.detect_households(_boundary, force_offline=force_offline)
    _collection_points = osm_detector.deduplicate(detected)
    return _collection_points

@router.post("/collection-points/import-geojson")
async def import_geojson_buildings(file: Optional[UploadFile] = File(None), payload: Optional[Dict[str, Any]] = Body(None)):
    """
    Imports building footprint polygons or address points from GeoJSON and converts them
    to road-snapped collection points.
    """
    global _collection_points
    try:
        data = None
        if file is not None:
            contents = await file.read()
            data = json.loads(contents.decode("utf-8"))
        elif payload is not None:
            data = payload
        else:
            raise HTTPException(status_code=400, detail="Provide GeoJSON via file upload or JSON payload.")

        imported = osm_detector.import_geojson(data)
        if not imported:
            raise HTTPException(status_code=400, detail="No valid building footprints or points found in GeoJSON.")

        _collection_points = osm_detector.deduplicate(_collection_points + imported)
        return {
            "message": f"Successfully imported {len(imported)} building/household collection points from GeoJSON.",
            "total_points": len(_collection_points),
            "imported_count": len(imported),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing GeoJSON: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse GeoJSON: {str(e)}")

@router.post("/collection-points/deduplicate")
def deduplicate_points(threshold_meters: float = 6.0):
    """
    Spatial deduplication: removes redundant points within threshold distance (default 6m),
    prioritizing verified points over unverified ones.
    """
    global _collection_points
    initial_count = len(_collection_points)
    _collection_points = osm_detector.deduplicate(_collection_points, threshold_meters=threshold_meters)
    removed = initial_count - len(_collection_points)
    return {
        "message": f"Deduplication complete. Removed {removed} duplicate points within {threshold_meters}m.",
        "total_points": len(_collection_points),
        "removed_count": removed,
    }

@router.post("/collection-points/{point_id}/verify")
def toggle_verify_point(point_id: str):
    """
    Toggles verification status of a collection point between 'Verified' and 'Unverified/Estimated'.
    """
    global _collection_points
    for pt in _collection_points:
        if pt.id == point_id:
            if pt.verification_status == "Verified":
                pt.verification_status = "Unverified/Estimated"
            else:
                pt.verification_status = "Verified"
            return {"point_id": point_id, "verification_status": pt.verification_status}
    raise HTTPException(status_code=404, detail=f"Collection point {point_id} not found.")

@router.post("/collection-points/snap-to-roads")
def snap_all_collection_points():
    """
    Snaps all collection points to the nearest vehicle-accessible road
    and performs full accessibility verification.
    """
    global _collection_points
    _collection_points, report = osm_detector.verify_all_points(
        _collection_points, max_snapping_dist_m=_settings.max_snapping_distance_m
    )
    return {
        "message": f"Successfully verified road connectivity for {len(_collection_points)} collection points.",
        "coverage_report": report,
        "total_points": len(_collection_points),
    }

@router.get("/coverage-report", response_model=CoverageReport)
def get_current_coverage_report():
    """
    Returns the comprehensive collection coverage report across Moshi.
    """
    if _last_optimization_result and _last_optimization_result.coverage_report:
        return _last_optimization_result.coverage_report
    _, report = osm_detector.verify_all_points(
        _collection_points, max_snapping_dist_m=_settings.max_snapping_distance_m
    )
    return report

@router.get("/collection-points/stats")
def get_household_stats():
    """
    Detailed statistics on detected Moshi households, apartments, verification rates, and waste estimates.
    """
    total = len(_collection_points)
    houses = sum(1 for p in _collection_points if not p.is_apartment)
    apts = sum(1 for p in _collection_points if p.is_apartment)
    total_units = sum(p.household_units_count for p in _collection_points)
    verified = sum(1 for p in _collection_points if p.verification_status == "Verified")
    unverified = sum(1 for p in _collection_points if p.verification_status != "Verified")
    total_demand = sum(p.garbage_quantity_kg for p in _collection_points)
    measured_demand = sum(p.garbage_quantity_kg for p in _collection_points if p.is_measured)
    estimated_demand = total_demand - measured_demand

    return {
        "total_points": total,
        "independent_houses": houses,
        "apartment_complexes": apts,
        "total_household_units": total_units,
        "verified_count": verified,
        "unverified_count": unverified,
        "verification_rate_pct": round((verified / total * 100.0) if total else 0.0, 1),
        "total_garbage_kg": round(total_demand, 1),
        "measured_garbage_kg": round(measured_demand, 1),
        "estimated_garbage_kg": round(estimated_demand, 1),
    }

@router.post("/collection-points/import-csv")
async def import_collection_points_csv(file: UploadFile = File(...)):
    global _collection_points
    try:
        contents = await file.read()
        decoded = contents.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))
        imported_points: List[CollectionPoint] = []
        
        for idx, row in enumerate(reader):
            # Normalize column names
            lower_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}
            
            pid = lower_row.get("id") or lower_row.get("point_id") or f"CP-IMP-{len(_collection_points) + idx + 1:04d}"
            name = lower_row.get("name") or lower_row.get("location_name") or lower_row.get("address") or f"Collection Point {pid}"
            lat_val = float(lower_row.get("lat") or lower_row.get("latitude") or 18.6794)
            lng_val = float(lower_row.get("lng") or lower_row.get("longitude") or 73.8492)
            c_type = lower_row.get("collection_type") or lower_row.get("type") or "Individual House"
            p_type = lower_row.get("property_type") or ("Apartment Building" if "apartment" in c_type.lower() else "Independent House")
            is_apt_str = lower_row.get("is_apartment", "").lower()
            is_apt = is_apt_str in ["true", "1", "yes"] or "apartment" in p_type.lower()
            units = int(lower_row.get("household_units_count") or lower_row.get("units") or (12 if is_apt else 1))
            ent_type = lower_row.get("entrance_type") or ("Mapped Access Gate" if is_apt else "Road-Snapped Pickup Point")
            qty = float(lower_row.get("garbage_quantity_kg") or lower_row.get("quantity") or lower_row.get("demand") or (30.0 if is_apt else 3.0))
            time_m = float(lower_row.get("collection_time_mins") or lower_row.get("time_mins") or (8.0 if is_apt else 2.0))
            prio = lower_row.get("priority") or ("High" if is_apt else "Medium")
            status = lower_row.get("status") or "Pending"
            v_status = lower_row.get("verification_status") or "Unverified/Estimated"
            d_source = lower_row.get("data_source") or "Imported CSV"
            bld_id = lower_row.get("building_id") or f"CSV-BLD-{idx + 1}"
            notes = lower_row.get("notes") or "Imported via CSV"

            pt = CollectionPoint(
                id=pid,
                building_id=bld_id,
                name=name,
                lat=lat_val,
                lng=lng_val,
                address=lower_row.get("address") or name,
                collection_type="Apartment Building" if is_apt else "Individual House",
                property_type=p_type,
                is_apartment=is_apt,
                household_units_count=units,
                entrance_type=ent_type,
                garbage_quantity_kg=qty,
                collection_time_mins=time_m,
                is_measured=lower_row.get("is_measured", "").lower() in ["true", "1", "yes"],
                priority=prio.capitalize(),
                status=status.capitalize(),
                verification_status=v_status,
                data_source=d_source,
                is_demo=False,
                notes=notes,
            )
            imported_points.append(pt)

        # Merge or replace
        for new_pt in imported_points:
            replaced = False
            for i, existing in enumerate(_collection_points):
                if existing.id == new_pt.id:
                    _collection_points[i] = new_pt
                    replaced = True
                    break
            if not replaced:
                _collection_points.append(new_pt)

        return {
            "message": f"Successfully imported {len(imported_points)} collection points.",
            "total_points": len(_collection_points),
        }
    except Exception as e:
        logger.error(f"Error importing CSV: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

# ----------------- VEHICLES -----------------

@router.get("/vehicles", response_model=List[Vehicle])
def get_vehicles():
    return _vehicles

@router.post("/vehicles", response_model=Vehicle)
def add_vehicle(vehicle: Vehicle):
    if any(v.id == vehicle.id for v in _vehicles):
        vehicle.id = f"VEH-{len(_vehicles) + 1:02d}"
    _vehicles.append(vehicle)
    return vehicle

@router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle(vehicle_id: str, updated_vehicle: Vehicle):
    for i, v in enumerate(_vehicles):
        if v.id == vehicle_id:
            _vehicles[i] = updated_vehicle
            return updated_vehicle
    raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found.")

@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: str):
    global _vehicles
    initial_len = len(_vehicles)
    _vehicles = [v for v in _vehicles if v.id != vehicle_id]
    if len(_vehicles) == initial_len:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found.")
    return {"message": f"Vehicle {vehicle_id} deleted successfully."}

@router.post("/vehicles/reset-demo", response_model=List[Vehicle])
def reset_demo_vehicles():
    global _vehicles
    _vehicles = [v.model_copy() for v in DEFAULT_VEHICLES]
    return _vehicles

# ----------------- DEPOT & BOUNDARY -----------------

@router.get("/depot", response_model=Depot)
def get_depot():
    return _depot

@router.post("/depot", response_model=Depot)
def update_depot(depot: Depot):
    global _depot
    _depot = depot
    return _depot

@router.get("/boundary", response_model=BoundaryConfig)
def get_boundary():
    return _boundary

@router.post("/boundary", response_model=BoundaryConfig)
def update_boundary(boundary: BoundaryConfig):
    global _boundary
    _boundary = boundary
    return _boundary

# ----------------- SETTINGS & ROUTING PROVIDER -----------------

@router.get("/settings", response_model=OptimizationSettings)
def get_settings():
    return _settings

@router.post("/settings", response_model=OptimizationSettings)
def update_settings(settings: OptimizationSettings):
    global _settings
    _settings = settings
    return _settings

@router.post("/routing-provider")
def update_routing_provider(payload: Dict[str, str] = Body(...)):
    new_url = payload.get("url")
    if not new_url:
        raise HTTPException(status_code=400, detail="Missing 'url' parameter.")
    routing_service.set_base_url(new_url)
    return {"message": f"Routing provider base URL updated to {routing_service.base_url}"}

# ----------------- OPTIMIZE -----------------

@router.post("/optimize", response_model=OptimizationResponse)
def optimize_routes(request: Optional[OptimizationRequest] = None):
    global _last_optimization_result

    # Use supplied request objects or fall back to system memory state
    points = request.collection_points if request and request.collection_points else _collection_points
    vehs = request.vehicles if request and request.vehicles else _vehicles
    depot_loc = request.depot if request and request.depot else _depot
    opt_settings = request.settings if request and request.settings else _settings

    optimizer = RouteOptimizer(settings=opt_settings)
    result = optimizer.optimize(
        collection_points=points,
        vehicles=vehs,
        depot=depot_loc,
    )
    _last_optimization_result = result
    return result

@router.get("/last-results", response_model=Optional[OptimizationResponse])
def get_last_results():
    return _last_optimization_result

@router.get("/route-validations", response_model=List[RouteValidation])
def get_current_route_validations():
    """
    Returns automated road routing validation audits for the current optimized routes.
    """
    if _last_optimization_result and _last_optimization_result.route_validations:
        return _last_optimization_result.route_validations
    return []

# ----------------- EXPORTING -----------------

@router.get("/export/routes-csv")
def export_routes_csv():
    if not _last_optimization_result or not _last_optimization_result.routes:
        raise HTTPException(status_code=400, detail="No optimization result available to export.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Vehicle ID",
        "Vehicle Registration",
        "Stop Number",
        "Stop Name",
        "Stop Type",
        "Latitude",
        "Longitude",
        "Garbage Picked (kg)",
        "Cumulative Garbage (kg)",
        "Leg Distance (km)",
        "Cumulative Distance (km)",
        "Arrival Time",
        "Departure Time"
    ])

    for route in _last_optimization_result.routes:
        for step in route.steps:
            writer.writerow([
                route.vehicle_id,
                route.registration_number,
                step.step_index,
                step.point_name,
                step.point_type,
                step.lat,
                step.lng,
                step.garbage_picked_kg,
                step.cumulative_garbage_kg,
                step.distance_from_prev_km,
                step.cumulative_distance_km,
                step.arrival_time_str or "",
                step.departure_time_str or ""
            ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ecoroute_optimized_routes.csv"}
    )

@router.get("/export/collection-points-csv")
def export_collection_points_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Point ID",
        "Building ID",
        "Location Name",
        "Address",
        "Latitude",
        "Longitude",
        "Collection Type",
        "Property Type",
        "Is Apartment",
        "Household Units",
        "Entrance Type",
        "Garbage Quantity (kg)",
        "Is Measured",
        "Collection Time (mins)",
        "Priority",
        "Status",
        "Verification Status",
        "Data Source",
        "Notes"
    ])

    for pt in _collection_points:
        writer.writerow([
            pt.id,
            pt.building_id or "",
            pt.name,
            pt.address or "",
            pt.lat,
            pt.lng,
            pt.collection_type,
            pt.property_type,
            "Yes" if pt.is_apartment else "No",
            pt.household_units_count,
            pt.entrance_type,
            pt.garbage_quantity_kg,
            "Yes" if pt.is_measured else "No",
            pt.collection_time_mins,
            pt.priority,
            pt.status,
            pt.verification_status,
            pt.data_source,
            pt.notes or ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ecoroute_moshi_households.csv"}
    )
