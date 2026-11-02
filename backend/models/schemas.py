from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CollectionPoint(BaseModel):
    id: str # Unique Household / Building ID (e.g. HH-MOSHI-0001 or APT-MOSHI-0012)
    building_id: Optional[str] = None # OpenStreetMap Building ID (e.g. OSM-WAY-102931)
    name: str # e.g. "House #14, Moshi Gaothan" or "Woodsville Tower A Entrance"
    lat: float
    lng: float
    address: Optional[str] = None # Street / Landmark address in Moshi
    collection_type: str = "Residential Building" # "Individual House", "Apartment Building", "Detached House", "Semi-Detached House", "Row House", "Residential Building", "Community Garbage Bin", "Commercial Establishment"
    property_type: Optional[str] = "Independent House" # "Independent House", "Apartment Building", "Row House", "Detached House", "Residential Building"
    is_apartment: bool = False
    household_units_count: int = 1 # 1 for individual house, N for apartment building
    entrance_type: str = "Road-Accessible Gate" # "Building Entrance", "Mapped Access Gate", "Road-Snapped Pickup Point"
    garbage_quantity_kg: float = 2.5 # Estimated garbage quantity
    collection_time_mins: float = 2.0 # Estimated pickup duration (minutes)
    is_measured: bool = False # False = algorithmic estimate, True = actual scale measurement
    priority: str = "Medium" # "High", "Medium", "Low"
    status: str = "Pending" # "Pending", "Collected"
    verification_status: str = "Automatically Detected" # "Automatically Detected", "Manually Added", "Verified", "Unverified/Estimated"
    data_source: str = "OpenStreetMap Footprints" # "OpenStreetMap Footprints", "Overpass API", "GeoJSON Import", "CSV Import", "Manual Input"
    is_demo: bool = False
    notes: Optional[str] = None

    # Road-snapping and accessibility attributes
    is_road_connected: bool = True
    road_snapped_lat: Optional[float] = None
    road_snapped_lng: Optional[float] = None
    snapping_distance_m: Optional[float] = None
    snapped_road_name: Optional[str] = None
    is_unreachable: bool = False
    unreachable_reason: Optional[str] = None

class Vehicle(BaseModel):
    id: str
    registration_number: str
    vehicle_type: str = "Medium Compactor" # "Small Tipper", "Medium Compactor", "Heavy Compactor", "Electric Mini Tipper"
    capacity_kg: float = 1500.0
    fuel_type: str = "Diesel" # "Diesel", "CNG", "Electric"
    fuel_efficiency: float = 8.0 # km/litre or km/kWh
    fuel_price: float = 94.0 # ₹/litre or ₹/kWh
    driver_cost_per_hour: float = 250.0 # ₹/hr
    maintenance_cost_per_km: float = 12.0 # ₹/km
    activation_cost: float = 500.0 # ₹ fixed cost per active vehicle deployed
    max_working_hours: float = 8.0 # hours
    status: str = "Available" # "Available", "Maintenance", "Inactive"
    color: Optional[str] = None

class Depot(BaseModel):
    id: str = "DEPOT-01"
    name: str = "PCMC Moshi Waste Processing & Transfer Station"
    lat: float = 18.6794
    lng: float = 73.8492
    address: str = "Spine Road, Moshi Gaothan, Pimpri-Chinchwad, Maharashtra 412105"
    service_radius_km: float = 10.0

class OptimizationSettings(BaseModel):
    objective: str = "min_cost" # "min_cost", "min_vehicles", "fastest", "balanced"
    fuel_price_override: Optional[float] = None
    working_hours_override: Optional[float] = None
    search_time_limit_seconds: int = 8
    fleet_mode: str = "manual" # "manual", "auto_recommend"
    max_recommended_fleet_size: int = 10
    default_house_garbage_kg: float = 2.5 # default kg per individual house
    default_apartment_unit_garbage_kg: float = 2.0 # default kg per apartment flat
    cluster_threshold: int = 120 # threshold for hierarchical sector decomposition
    max_snapping_distance_m: float = 100.0 # Max distance for house-to-road snapping

class RouteStep(BaseModel):
    step_index: int
    point_id: str
    point_name: str
    point_type: str
    lat: float
    lng: float
    garbage_picked_kg: float
    cumulative_garbage_kg: float
    distance_from_prev_km: float
    cumulative_distance_km: float
    travel_time_from_prev_mins: float
    service_time_mins: float
    cumulative_time_mins: float
    arrival_time_str: Optional[str] = None
    departure_time_str: Optional[str] = None
    road_snapped_lat: Optional[float] = None
    road_snapped_lng: Optional[float] = None
    snapped_road_name: Optional[str] = None
    snapping_distance_m: Optional[float] = None

class VehicleRoute(BaseModel):
    vehicle_id: str
    vehicle_name: str
    registration_number: str
    color: str
    total_stops: int
    total_distance_km: float
    total_duration_mins: float
    total_garbage_kg: float
    capacity_kg: float
    capacity_utilization_pct: float
    fuel_consumed_litres: float
    fuel_cost: float
    driver_cost: float
    maintenance_cost: float
    activation_cost: float
    total_cost: float
    steps: List[RouteStep]
    geometry: List[List[float]] # [[lat, lng], [lat, lng], ...]

class CoverageReport(BaseModel):
    total_detected_points: int = 0
    total_eligible_points: int = 0
    successfully_assigned_points: int = 0
    successfully_road_connected_points: int = 0
    unassigned_points_count: int = 0
    unassigned_points: List[CollectionPoint] = []
    unreachable_points_count: int = 0
    unreachable_points: List[CollectionPoint] = []
    coverage_percentage: float = 0.0
    is_full_coverage: bool = False
    verification_notes: List[str] = []

class RouteValidation(BaseModel):
    vehicle_id: str
    vehicle_name: str
    is_valid: bool = True
    starts_at_depot: bool = True
    ends_at_depot: bool = True
    follows_road_network: bool = True
    legs_connected: bool = True
    no_straight_lines: bool = True
    road_geometry_points_count: int = 0
    assigned_stops_count: int = 0
    distance_verified: bool = True
    capacity_verified: bool = True
    duration_verified: bool = True
    warnings: List[str] = []

class OptimizationRequest(BaseModel):
    collection_points: Optional[List[CollectionPoint]] = None
    vehicles: Optional[List[Vehicle]] = None
    depot: Optional[Depot] = None
    settings: Optional[OptimizationSettings] = None

class OptimizationResponse(BaseModel):
    success: bool
    message: str
    objective_used: str
    fleet_mode_used: str
    total_collection_points: int
    assigned_collection_points: int
    unassigned_points: List[CollectionPoint]
    unassigned_reason: Optional[str] = None
    vehicles_available_count: int
    vehicles_used_count: int
    total_distance_km: float
    total_duration_mins: float
    total_fuel_litres: float
    total_cost: float
    total_garbage_kg: float
    routes: List[VehicleRoute]
    cost_breakdown: Dict[str, float]
    baseline_comparison: Dict[str, Any]
    recommendations: List[str]

    # Added coverage verification and route validation
    coverage_report: Optional[CoverageReport] = None
    route_validations: Optional[List[RouteValidation]] = None
    validation_warnings: Optional[List[str]] = None

class BoundaryConfig(BaseModel):
    center_lat: float = 18.6794
    center_lng: float = 73.8492
    radius_km: float = 7.5
    polygon: Optional[List[List[float]]] = None # list of [lat, lng]
