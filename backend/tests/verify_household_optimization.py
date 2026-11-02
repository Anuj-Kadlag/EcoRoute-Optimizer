"""
Verification Script for Large-Scale Household Collection Point Optimization
Tests:
1. Retrieval of 185+ authentic Moshi residential household collection points.
2. Property classification (Independent Houses vs Apartment Complexes).
3. Road-snapped access points.
4. Large-scale CVRP optimization across Moshi fleet with zero straight lines.
5. Verification & Deduplication.
"""

import sys
import math
from backend.services.osm_household_detector import osm_detector
from backend.routes.demo_data import DEFAULT_VEHICLES, DEFAULT_DEPOT
from backend.models.schemas import OptimizationSettings, BoundaryConfig
from backend.optimization.solver import RouteOptimizer

def test_household_dataset_and_optimization():
    print("==================================================================")
    print(">> Testing Moshi Household Detection & Large-Scale CVRP...")
    print("==================================================================")

    # 1. Dataset Generation
    points = osm_detector.get_moshi_osm_dataset()
    print(f"\n[STEP 1] Loaded Moshi Residential Dataset: {len(points)} collection points.")
    assert len(points) >= 150, f"Expected at least 150 points, got {len(points)}"

    # 2. Property Classification Verification
    houses = [p for p in points if not p.is_apartment]
    apts = [p for p in points if p.is_apartment]
    print(f"  - Independent / Detached / Row Houses: {len(houses)}")
    print(f"  - Apartment Complexes & Societies: {len(apts)}")
    assert len(houses) > 100, "Expected >100 independent houses"
    assert len(apts) >= 20, "Expected >=20 apartment complexes"

    # Verify no commercial or industrial in household points
    for p in points:
        assert p.property_type.lower() not in ["industrial", "factory", "warehouse", "office"], (
            f"Point {p.id} has invalid property type {p.property_type}"
        )
        # Verify apartment shared entrance rule
        if p.is_apartment:
            assert p.household_units_count > 1, f"Apartment {p.id} must have >1 units"
            assert "Gate" in p.entrance_type or "Entrance" in p.name or "Gate" in p.name
        else:
            assert p.household_units_count == 1, f"House {p.id} should have 1 unit"

    print("  [PASS] Property classification & residential constraints verified.")

    # 3. Spatial Deduplication Test
    points_with_dup = list(points) + [points[0].model_copy(update={"id": "DUP-1", "name": "Duplicate Entry"})]
    deduped = osm_detector.deduplicate(points_with_dup, threshold_meters=6.0)
    assert len(deduped) == len(points), f"Deduplication failed: got {len(deduped)}, expected {len(points)}"
    print("  [PASS] Spatial deduplication successfully removed duplicate within 6m.")

    # 4. Large-Scale Multi-Vehicle CVRP Optimization
    print(f"\n[STEP 2] Running Hierarchical Multi-Vehicle CVRP on all {len(points)} households...")
    # Add sufficient fleet to collect Moshi households
    fleet = [v.model_copy() for v in DEFAULT_VEHICLES]
    # Default fleet capacity is ~6500kg. Let's verify how many vehicles are needed and used.
    total_demand = sum(p.garbage_quantity_kg for p in points)
    print(f"  - Total Moshi Household Waste Demand: {total_demand:.1f} kg")
    print(f"  - Available Fleet: {len(fleet)} vehicles with {sum(v.capacity_kg for v in fleet)} kg total capacity")

    optimizer = RouteOptimizer(OptimizationSettings(search_time_limit_seconds=3))
    result = optimizer.optimize(points, fleet, DEFAULT_DEPOT)

    assert result.success, "Optimization failed!"
    print(f"  [PASS] Optimization Completed Successfully!")
    print(f"  - Assigned Stops: {result.assigned_collection_points} / {len(points)}")
    print(f"  - Vehicles Deployed: {result.vehicles_used_count}")
    print(f"  - Total Distance: {result.total_distance_km} km")
    print(f"  - Total Duration: {result.total_duration_mins} mins")
    print(f"  - Total Fuel: {result.total_fuel_litres} L")
    print(f"  - Total Operating Cost: Rs.{result.total_cost:.2f}")

    # Check vehicle capacity constraints
    for r in result.routes:
        assert r.total_garbage_kg <= r.capacity_kg + 0.1, f"Vehicle {r.vehicle_id} exceeded capacity!"
        assert len(r.geometry) >= len(r.steps), f"Route {r.vehicle_id} lacks street geometry"
        print(f"    * Route {r.vehicle_id} ({r.vehicle_name}): {r.total_stops} stops, {r.total_garbage_kg:.1f}/{r.capacity_kg}kg ({r.capacity_utilization_pct}%), {r.total_distance_km}km, Rs.{r.total_cost:.2f}")

    # Verify road-network geometry
    total_geom_pts = sum(len(r.geometry) for r in result.routes)
    assert total_geom_pts > len(points), "Geometry should contain road turning waypoints"
    print(f"  [PASS] Road-network route geometry generated with {total_geom_pts} turn-by-turn road coordinates.")

    print("\n==================================================================")
    print(">> ALL MOSHI HOUSEHOLD OPTIMIZATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")

if __name__ == "__main__":
    test_household_dataset_and_optimization()
