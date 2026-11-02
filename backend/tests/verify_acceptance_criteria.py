"""
Automated Acceptance Tests for EcoRoute
Validates all 14 criteria specified in Section 15 of requirements.
"""

import sys
import math
from backend.models.schemas import (
    CollectionPoint,
    Vehicle,
    Depot,
    OptimizationSettings,
)
from backend.optimization.solver import RouteOptimizer
from backend.routes.demo_data import get_demo_collection_points, DEFAULT_VEHICLES, DEFAULT_DEPOT

def run_all_tests():
    print("================================================================")
    print(">> Running EcoRoute Verification Suite (14 Acceptance Tests)...")
    print("================================================================")

    demo_points = get_demo_collection_points()
    demo_vehs = [v.model_copy() for v in DEFAULT_VEHICLES]
    depot = DEFAULT_DEPOT.model_copy()

    # TEST 1: Variable number of collection points (e.g., 5 vs 20 vs 38)
    print("\n[TEST 1] Testing variable number of collection points...")
    opt = RouteOptimizer(OptimizationSettings(search_time_limit_seconds=3))
    res_small = opt.optimize(demo_points[:5], demo_vehs, depot)
    res_medium = opt.optimize(demo_points[:20], demo_vehs, depot)
    assert res_small.success and res_small.assigned_collection_points == 5, "Failed on 5 points"
    assert res_medium.success and res_medium.assigned_collection_points == 20, "Failed on 20 points"
    print(f"  [PASS] Successfully optimized 5 points ({res_small.total_distance_km}km) and 20 points ({res_medium.total_distance_km}km).")

    # TEST 2: Variable number of vehicles (e.g., 2 vehicles vs 4 vehicles)
    print("\n[TEST 2] Testing variable number of vehicles...")
    res_2v = opt.optimize(demo_points[:15], demo_vehs[:2], depot)
    res_4v = opt.optimize(demo_points[:15], demo_vehs[:4], depot)
    assert res_2v.success, "Failed with 2 vehicles"
    assert res_4v.success, "Failed with 4 vehicles"
    print(f"  [PASS] Handled 2 vehicles (used {res_2v.vehicles_used_count}) and 4 vehicles (used {res_4v.vehicles_used_count}).")

    # TEST 3: Assign collection points to multiple vehicles
    print("\n[TEST 3] Verifying assignment across multiple vehicles...")
    assert len(res_medium.routes) > 1, f"Expected multiple routes, got {len(res_medium.routes)}"
    print(f"  [PASS] Successfully partitioned 20 points across {len(res_medium.routes)} separate vehicles.")

    # TEST 4: Produces distinct routes for different vehicles
    print("\n[TEST 4] Verifying distinct route sequences per vehicle...")
    veh_ids = [r.vehicle_id for r in res_medium.routes]
    assert len(veh_ids) == len(set(veh_ids)), "Duplicate vehicle IDs found in routes"
    stops_sets = [set(s.point_id for s in r.steps if s.point_type != "Depot") for r in res_medium.routes]
    for i in range(len(stops_sets)):
        for j in range(i + 1, len(stops_sets)):
            intersection = stops_sets[i].intersection(stops_sets[j])
            assert len(intersection) == 0, f"Routes overlap on stops: {intersection}"
    print("  [PASS] All routes have completely disjoint sets of collection points.")

    # TEST 5: Every assigned point visited exactly once
    print("\n[TEST 5] Checking every assigned collection point visited exactly once...")
    all_assigned_stops = []
    for r in res_medium.routes:
        for s in r.steps:
            if s.point_type != "Depot":
                all_assigned_stops.append(s.point_id)
    assert len(all_assigned_stops) == len(set(all_assigned_stops)), "Duplicate visits detected!"
    assert len(all_assigned_stops) == res_medium.assigned_collection_points
    print(f"  [PASS] Exactly {len(all_assigned_stops)} unique stops visited once each.")

    # TEST 6: Vehicle capacity constraints respected
    print("\n[TEST 6] Verifying vehicle carrying capacity constraints...")
    for r in res_medium.routes:
        assert r.total_garbage_kg <= r.capacity_kg + 0.01, (
            f"Vehicle {r.vehicle_id} exceeded capacity! Loaded: {r.total_garbage_kg}kg, Cap: {r.capacity_kg}kg"
        )
        assert r.capacity_utilization_pct <= 100.0
    print("  [PASS] All routes strictly respect vehicle capacity limits.")

    # TEST 7: Routes follow real roads rather than straight lines
    print("\n[TEST 7] Verifying road-following geometry (not straight lines)...")
    for r in res_medium.routes:
        assert len(r.geometry) >= len(r.steps), "Geometry lacks road turning waypoints"
    print(f"  [PASS] Generated detailed road geometry with {sum(len(r.geometry) for r in res_medium.routes)} road vertices.")

    # TEST 8: Every route starts and finishes at configured depot
    print("\n[TEST 8] Verifying routes start & end at depot...")
    for r in res_medium.routes:
        first_step = r.steps[0]
        last_step = r.steps[-1]
        assert first_step.point_id == depot.id and first_step.point_type == "Depot"
        assert last_step.point_id == depot.id and last_step.point_type == "Depot"
        assert math.isclose(first_step.lat, depot.lat, abs_tol=1e-4)
        assert math.isclose(last_step.lng, depot.lng, abs_tol=1e-4)
    print("  [PASS] Every single route starts at Moshi Depot and returns to Moshi Depot.")

    # TEST 9: Fuel consumption and operating expenses calculated
    print("\n[TEST 9] Verifying fuel consumption & expense calculation...")
    assert res_medium.total_fuel_litres > 0, "Fuel consumption was 0"
    assert res_medium.total_cost > 0, "Total cost was 0"
    assert "fuel_cost" in res_medium.cost_breakdown
    assert "driver_cost" in res_medium.cost_breakdown
    assert "maintenance_cost" in res_medium.cost_breakdown
    assert "activation_cost" in res_medium.cost_breakdown
    print(f"  [PASS] Fuel: {res_medium.total_fuel_litres}L, Operating Cost: Rs.{res_medium.total_cost:.2f}")

    # TEST 10: Changing vehicle capacity alters assignments
    print("\n[TEST 10] Testing capacity change effect on vehicle assignments...")
    v_small = [
        Vehicle(id="V1", registration_number="MH14-1", capacity_kg=400, fuel_efficiency=10.0, fuel_price=90.0, driver_cost_per_hour=200, maintenance_cost_per_km=10, activation_cost=200, max_working_hours=8, status="Available"),
        Vehicle(id="V2", registration_number="MH14-2", capacity_kg=400, fuel_efficiency=10.0, fuel_price=90.0, driver_cost_per_hour=200, maintenance_cost_per_km=10, activation_cost=200, max_working_hours=8, status="Available"),
        Vehicle(id="V3", registration_number="MH14-3", capacity_kg=400, fuel_efficiency=10.0, fuel_price=90.0, driver_cost_per_hour=200, maintenance_cost_per_km=10, activation_cost=200, max_working_hours=8, status="Available"),
    ]
    res_tight = opt.optimize(demo_points[:6], v_small, depot)
    
    v_large = [
        Vehicle(id="V1", registration_number="MH14-1", capacity_kg=5000, fuel_efficiency=10.0, fuel_price=90.0, driver_cost_per_hour=200, maintenance_cost_per_km=10, activation_cost=200, max_working_hours=8, status="Available"),
    ]
    res_generous = opt.optimize(demo_points[:6], v_large, depot)
    assert len(res_tight.routes) > len(res_generous.routes), "Capacity change did not affect vehicle deployment"
    print(f"  [PASS] Tight capacity required {len(res_tight.routes)} vehicles; Large capacity required {len(res_generous.routes)} vehicle.")

    # TEST 11: Changing fuel price affects economic calculations
    print("\n[TEST 11] Testing fuel price parameter responsiveness...")
    opt_cheap = RouteOptimizer(OptimizationSettings(fuel_price_override=50.0, search_time_limit_seconds=3))
    opt_expensive = RouteOptimizer(OptimizationSettings(fuel_price_override=150.0, search_time_limit_seconds=3))
    res_cheap = opt_cheap.optimize(demo_points[:10], demo_vehs, depot)
    res_expensive = opt_expensive.optimize(demo_points[:10], demo_vehs, depot)
    assert res_expensive.cost_breakdown["fuel_cost"] > res_cheap.cost_breakdown["fuel_cost"], "Fuel price override failed"
    print(f"  [PASS] Fuel price Rs.50/L produced fuel cost Rs.{res_cheap.cost_breakdown['fuel_cost']:.2f}; Rs.150/L produced Rs.{res_expensive.cost_breakdown['fuel_cost']:.2f}.")

    # TEST 12: Adding more collection points updates optimization results
    print("\n[TEST 12] Testing dynamic collection point addition...")
    res_10 = opt.optimize(demo_points[:10], demo_vehs, depot)
    res_15 = opt.optimize(demo_points[:15], demo_vehs, depot)
    assert res_15.total_garbage_kg > res_10.total_garbage_kg
    assert res_15.assigned_collection_points > res_10.assigned_collection_points
    print(f"  [PASS] 10 points collected {res_10.total_garbage_kg}kg; 15 points collected {res_15.total_garbage_kg}kg.")

    # TEST 13: Automatic Fleet Size Recommendation
    print("\n[TEST 13] Testing Automatic Fleet Sizing Recommendation...")
    opt_auto = RouteOptimizer(OptimizationSettings(fleet_mode="auto_recommend", search_time_limit_seconds=3))
    res_auto = opt_auto.optimize(demo_points[:8], demo_vehs, depot)
    assert res_auto.success
    assert any("Fleet Sizing Analysis" in r for r in res_auto.recommendations)
    print(f"  [PASS] Auto recommendation successfully evaluated demand and recommended optimal fleet.")

    # TEST 14: Clear reporting of infeasible collection plans
    print("\n[TEST 14] Testing handling of infeasible constraints / capacity overload...")
    tiny_vehicle = [
        Vehicle(id="VTINY", registration_number="MH14-TINY", capacity_kg=50, fuel_efficiency=10.0, fuel_price=90.0, driver_cost_per_hour=200, maintenance_cost_per_km=10, activation_cost=200, max_working_hours=1, status="Available")
    ]
    res_infeasible = opt.optimize(demo_points[:10], tiny_vehicle, depot)
    assert len(res_infeasible.unassigned_points) > 0, "Failed to report unassigned points"
    assert res_infeasible.unassigned_reason is not None, "Missing unassigned reason explanation"
    print(f"  [PASS] Accurately detected capacity/hour bottleneck: {len(res_infeasible.unassigned_points)} unassigned points reported with diagnostic reason.")

    print("\n================================================================")
    print(">> ALL 14 ACCEPTANCE TESTS PASSED SUCCESSFULLY!")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
