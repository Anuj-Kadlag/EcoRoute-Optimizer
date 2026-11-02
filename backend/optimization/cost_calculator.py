from typing import Dict, Any, List
from ..models.schemas import Vehicle

class CostCalculator:
    """
    Computes exact fuel consumption, driver wages, vehicle maintenance,
    and fixed activation costs based on actual distance and duration.
    Also computes the baseline comparison from an unoptimized naive plan.
    """

    @staticmethod
    def calculate_vehicle_cost(
        vehicle: Vehicle,
        distance_km: float,
        duration_mins: float,
        fuel_price_override: float = None,
    ) -> Dict[str, float]:
        fuel_price = fuel_price_override if fuel_price_override is not None else vehicle.fuel_price
        
        # If route has 0 distance (vehicle not used), costs are 0
        if distance_km <= 0.001:
            return {
                "fuel_consumed_litres": 0.0,
                "fuel_cost": 0.0,
                "driver_cost": 0.0,
                "maintenance_cost": 0.0,
                "activation_cost": 0.0,
                "total_cost": 0.0,
            }

        # Fuel consumption in Litres or kWh
        eff = max(vehicle.fuel_efficiency, 0.1)
        fuel_consumed = distance_km / eff
        fuel_cost = fuel_consumed * fuel_price

        # Driver cost based on total route duration (including driving + service time)
        hours = duration_mins / 60.0
        driver_cost = hours * vehicle.driver_cost_per_hour

        # Maintenance cost per km
        maintenance_cost = distance_km * vehicle.maintenance_cost_per_km

        # Fixed vehicle activation cost
        activation_cost = vehicle.activation_cost

        total_cost = fuel_cost + driver_cost + maintenance_cost + activation_cost

        return {
            "fuel_consumed_litres": round(fuel_consumed, 2),
            "fuel_cost": round(fuel_cost, 2),
            "driver_cost": round(driver_cost, 2),
            "maintenance_cost": round(maintenance_cost, 2),
            "activation_cost": round(activation_cost, 2),
            "total_cost": round(total_cost, 2),
        }

    @staticmethod
    def compute_baseline_plan(
        dist_matrix_m: List[List[float]],
        dur_matrix_s: List[List[float]],
        demands: List[int],
        service_times_s: List[int],
        vehicles: List[Vehicle],
        fuel_price_override: float = None,
    ) -> Dict[str, Any]:
        """
        Computes a genuine unoptimized baseline plan:
        Collection points are serviced in naive sequential order (as entered by users),
        filling vehicles sequentially and returning to depot when capacity is exceeded.
        Calculates exact road distance, duration, fuel, and cost.
        """
        n_points = len(demands) - 1 # excluding depot
        if n_points <= 0 or not vehicles:
            return {
                "distance_km": 0.0,
                "duration_mins": 0.0,
                "fuel_litres": 0.0,
                "total_cost": 0.0,
                "description": "No collection points or vehicles available.",
            }

        baseline_dist_m = 0.0
        baseline_dur_s = 0.0
        baseline_fuel_l = 0.0
        baseline_cost = 0.0
        vehicles_used = 0

        current_vehicle_idx = 0
        current_veh = vehicles[current_vehicle_idx]
        current_cap = current_veh.capacity_kg
        current_load = 0
        current_pos = 0 # starts at depot
        v_dist_km = 0.0
        v_dur_mins = 0.0

        for pt_idx in range(1, n_points + 1):
            pt_demand = demands[pt_idx]
            
            # If demand exceeds remaining vehicle capacity, vehicle returns to depot and next vehicle starts
            if current_load + pt_demand > current_cap:
                # Return to depot
                ret_dist_m = dist_matrix_m[current_pos][0]
                ret_dur_s = dur_matrix_s[current_pos][0]
                baseline_dist_m += ret_dist_m
                baseline_dur_s += ret_dur_s
                v_dist_km += ret_dist_m / 1000.0
                v_dur_mins += ret_dur_s / 60.0

                costs = CostCalculator.calculate_vehicle_cost(
                    current_veh, v_dist_km, v_dur_mins, fuel_price_override
                )
                baseline_fuel_l += costs["fuel_consumed_litres"]
                baseline_cost += costs["total_cost"]
                vehicles_used += 1

                # Next vehicle
                current_vehicle_idx = (current_vehicle_idx + 1) % len(vehicles)
                current_veh = vehicles[current_vehicle_idx]
                current_cap = current_veh.capacity_kg
                current_load = 0
                current_pos = 0
                v_dist_km = 0.0
                v_dur_mins = 0.0

            # Travel from current_pos to pt_idx
            step_dist_m = dist_matrix_m[current_pos][pt_idx]
            step_dur_s = dur_matrix_s[current_pos][pt_idx] + service_times_s[pt_idx]
            baseline_dist_m += step_dist_m
            baseline_dur_s += step_dur_s
            v_dist_km += step_dist_m / 1000.0
            v_dur_mins += step_dur_s / 60.0

            current_load += pt_demand
            current_pos = pt_idx

        # Return last vehicle to depot
        if current_pos != 0 or v_dist_km > 0:
            ret_dist_m = dist_matrix_m[current_pos][0]
            ret_dur_s = dur_matrix_s[current_pos][0]
            baseline_dist_m += ret_dist_m
            baseline_dur_s += ret_dur_s
            v_dist_km += ret_dist_m / 1000.0
            v_dur_mins += ret_dur_s / 60.0

            costs = CostCalculator.calculate_vehicle_cost(
                current_veh, v_dist_km, v_dur_mins, fuel_price_override
            )
            baseline_fuel_l += costs["fuel_consumed_litres"]
            baseline_cost += costs["total_cost"]
            vehicles_used += 1

        return {
            "distance_km": round(baseline_dist_m / 1000.0, 2),
            "duration_mins": round(baseline_dur_s / 60.0, 1),
            "fuel_litres": round(baseline_fuel_l, 2),
            "total_cost": round(baseline_cost, 2),
            "vehicles_used": vehicles_used,
            "description": "Unoptimized FIFO Sequential Dispatch baseline (vehicles service stops in order of entry without spatial clustering or global cost minimization).",
        }
