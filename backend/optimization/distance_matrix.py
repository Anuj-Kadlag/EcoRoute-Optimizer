from typing import List, Tuple, Dict, Any
from ..models.schemas import CollectionPoint, Depot
from ..services.routing_service import routing_service

class DistanceMatrixManager:
    """
    Manages coordinate collation, matrix requests to the routing service,
    and integer scaling for Google OR-Tools routing model.
    """

    @staticmethod
    def build_matrices(
        depot: Depot,
        collection_points: List[CollectionPoint],
    ) -> Dict[str, Any]:
        """
        Builds distance and time matrices where index 0 is always the Depot,
        and indices 1..N correspond to collection_points[0..N-1].
        """
        # Index 0 is the depot
        coordinates: List[Tuple[float, float]] = [(depot.lat, depot.lng)]
        demands: List[int] = [0] # depot demand is 0
        service_times_sec: List[int] = [0] # depot service time is 0
        point_ids: List[str] = [depot.id]

        for pt in collection_points:
            # Use road-snapped coordinates directly to ensure 100% road network alignment
            pt_lat = pt.road_snapped_lat if pt.road_snapped_lat else pt.lat
            pt_lng = pt.road_snapped_lng if pt.road_snapped_lng else pt.lng
            coordinates.append((pt_lat, pt_lng))
            demands.append(int(round(pt.garbage_quantity_kg)))
            service_times_sec.append(int(round(pt.collection_time_mins * 60)))
            point_ids.append(pt.id)

        # Retrieve distance (meters) and duration (seconds) matrices
        dist_matrix_m, dur_matrix_s = routing_service.get_distance_and_time_matrix(coordinates)

        # OR-Tools routing requires integer matrices
        # Distance matrix in integer meters
        int_dist_matrix = [[int(round(d)) for d in row] for row in dist_matrix_m]
        # Duration matrix in integer seconds
        int_dur_matrix = [[int(round(t)) for t in row] for row in dur_matrix_s]

        return {
            "coordinates": coordinates,
            "demands": demands,
            "service_times_sec": service_times_sec,
            "point_ids": point_ids,
            "distance_matrix_meters": int_dist_matrix,
            "duration_matrix_seconds": int_dur_matrix,
            "raw_dist_matrix": dist_matrix_m,
            "raw_dur_matrix": dur_matrix_s,
        }
