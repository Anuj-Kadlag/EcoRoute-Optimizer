import urllib.request
import json

def test_api():
    print("==================================================================")
    print(">> Testing Live EcoRoute API Endpoints & Road Routing Engine...")
    print("==================================================================")

    # 1. Health
    print("\n[TEST 1] Testing /api/health...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print(f"  Health Response: {data}")
        assert data["status"] == "healthy"
        assert data["collection_points_count"] >= 150, f"Expected >= 150 points, got {data['collection_points_count']}"

    # 2. Household Stats
    print("\n[TEST 2] Testing /api/collection-points/stats...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/collection-points/stats", timeout=5) as resp:
        stats = json.loads(resp.read().decode())
        print(f"  Household Stats: {stats}")
        assert stats["total_points"] >= 150
        assert stats["independent_houses"] > 100
        assert stats["apartment_complexes"] >= 20
        assert stats["total_household_units"] > 200

    # 3. Road-snapping verification
    print("\n[TEST 3] Testing /api/collection-points/snap-to-roads...")
    req_snap = urllib.request.Request(
        "http://127.0.0.1:8000/api/collection-points/snap-to-roads",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_snap, timeout=15) as resp:
        snap_res = json.loads(resp.read().decode())
        print(f"  Snap Result: {snap_res['message']}")
        assert snap_res["total_points"] >= 150
        cov = snap_res["coverage_report"]
        assert cov["successfully_road_connected_points"] >= 150

    # 4. Multi-Vehicle CVRP Optimization
    print("\n[TEST 4] Testing /api/optimize with large Moshi household dataset...")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/optimize",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        opt = json.loads(resp.read().decode())
        print(f"  Optimization Success: {opt['success']}")
        print(f"  Assigned Points: {opt['assigned_collection_points']} / {opt['total_collection_points']}")
        print(f"  Vehicles Deployed: {opt['vehicles_used_count']}")
        print(f"  Total Distance: {opt['total_distance_km']} km")
        print(f"  Total Cost: Rs.{opt['total_cost']}")
        assert opt["success"] == True
        assert opt["assigned_collection_points"] == opt["total_collection_points"]
        assert len(opt["routes"]) == 5

        # Check coverage report inside optimization response
        cov_rep = opt.get("coverage_report")
        assert cov_rep is not None
        print(f"  Coverage Report: {cov_rep['coverage_percentage']}% coverage ({cov_rep['successfully_assigned_points']} assigned, {cov_rep['unassigned_points_count']} unassigned)")
        assert cov_rep["coverage_percentage"] == 100.0
        assert cov_rep["is_full_coverage"] == True

        # Check route validations inside optimization response
        r_vals = opt.get("route_validations")
        assert r_vals is not None and len(r_vals) == 5
        total_geom = sum(r["road_geometry_points_count"] for r in r_vals)
        print(f"  Total Road Geometry Waypoints: {total_geom} points across 5 routes")
        assert total_geom > 1500
        for rv in r_vals:
            assert rv["starts_at_depot"] == True
            assert rv["ends_at_depot"] == True
            assert rv["no_straight_lines"] == True
            assert rv["legs_connected"] == True

    # 5. Route Validations API endpoint
    print("\n[TEST 5] Testing /api/route-validations...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/route-validations", timeout=5) as resp:
        validations = json.loads(resp.read().decode())
        print(f"  Fetched {len(validations)} route validations.")
        assert len(validations) == 5
        assert all(v["no_straight_lines"] for v in validations)

    # 6. Coverage Report API endpoint
    print("\n[TEST 6] Testing /api/coverage-report...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/coverage-report", timeout=5) as resp:
        report = json.loads(resp.read().decode())
        print(f"  Report Coverage: {report['coverage_percentage']}%, Full Coverage: {report['is_full_coverage']}")
        assert report["coverage_percentage"] == 100.0
        assert report["is_full_coverage"] == True

    print("\n==================================================================")
    print(">> ALL LIVE API TESTS PASSED SUCCESSFULLY (100% COVERAGE & ROAD ROUTING)!")
    print("==================================================================")

if __name__ == "__main__":
    test_api()
