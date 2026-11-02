from typing import List
from ..models.schemas import CollectionPoint, Vehicle, Depot

DEFAULT_DEPOT = Depot(
    id="DEPOT-01",
    name="PCMC Moshi Waste Processing & Transfer Station",
    lat=18.6794,
    lng=73.8492,
    address="Spine Road, Moshi Gaothan, Pimpri-Chinchwad, Maharashtra 412105",
    service_radius_km=10.0,
)

DEFAULT_VEHICLES: List[Vehicle] = [
    Vehicle(
        id="VEH-01",
        registration_number="MH-14-GH-1011",
        vehicle_type="Small Tipper (Tata Ace)",
        capacity_kg=1000.0,
        fuel_type="Diesel",
        fuel_efficiency=12.0, # km/L
        fuel_price=94.0, # ₹/L
        driver_cost_per_hour=220.0, # ₹/hr
        maintenance_cost_per_km=8.0, # ₹/km
        activation_cost=350.0, # ₹ fixed cost per active day
        max_working_hours=8.0,
        status="Available",
        color="#2563eb", # Royal Blue
    ),
    Vehicle(
        id="VEH-02",
        registration_number="MH-14-GH-2042",
        vehicle_type="Medium Compactor (Eicher 2049)",
        capacity_kg=2200.0,
        fuel_type="Diesel",
        fuel_efficiency=7.5,
        fuel_price=94.0,
        driver_cost_per_hour=280.0,
        maintenance_cost_per_km=14.0,
        activation_cost=600.0,
        max_working_hours=8.0,
        status="Available",
        color="#059669", # Emerald Green
    ),
    Vehicle(
        id="VEH-03",
        registration_number="MH-14-GH-3158",
        vehicle_type="Heavy Compactor (Ashok Leyland 1415)",
        capacity_kg=3500.0,
        fuel_type="Diesel",
        fuel_efficiency=5.5,
        fuel_price=94.0,
        driver_cost_per_hour=320.0,
        maintenance_cost_per_km=18.0,
        activation_cost=850.0,
        max_working_hours=8.0,
        status="Available",
        color="#d97706", # Amber Orange
    ),
    Vehicle(
        id="VEH-04",
        registration_number="MH-14-EV-4099",
        vehicle_type="Electric Mini Tipper (Mahindra EV)",
        capacity_kg=750.0,
        fuel_type="Electric",
        fuel_efficiency=14.0, # km/kWh
        fuel_price=9.5, # ₹/kWh
        driver_cost_per_hour=200.0,
        maintenance_cost_per_km=4.5,
        activation_cost=250.0,
        max_working_hours=7.0,
        status="Available",
        color="#7c3aed", # Purple
    ),
    Vehicle(
        id="VEH-05",
        registration_number="MH-14-CN-5512",
        vehicle_type="CNG Refuse Collector (Tata Ultra)",
        capacity_kg=1800.0,
        fuel_type="CNG",
        fuel_efficiency=9.0, # km/kg
        fuel_price=86.0, # ₹/kg
        driver_cost_per_hour=260.0,
        maintenance_cost_per_km=11.0,
        activation_cost=500.0,
        max_working_hours=8.0,
        status="Available",
        color="#0891b2", # Cyan / Teal
    ),
]

def get_demo_collection_points() -> List[CollectionPoint]:
    """
    Returns 38 realistic simulated collection points situated around Moshi,
    Pimpri-Chinchwad, covering housing societies, commercial hubs, village areas,
    and public bins. Clearly marked with is_demo=True.
    """
    raw_data = [
        # Moshi Gaothan & Central Moshi
        ("CP-01", "Moshi Gaothan Main Chowk [DEMO DATA]", 18.6782, 73.8480, "Public Garbage Collection Point", 180.0, 12.0, "High"),
        ("CP-02", "Bhairavnath Mandir Lane, Moshi [DEMO DATA]", 18.6769, 73.8465, "Residential Building", 120.0, 10.0, "Medium"),
        ("CP-03", "Moshi Gram Panchayat Office Perimeter [DEMO DATA]", 18.6798, 73.8471, "Community Garbage Bin", 250.0, 15.0, "High"),
        ("CP-04", "Shree Ram Nagar Society, Moshi [DEMO DATA]", 18.6812, 73.8505, "Residential Building", 210.0, 12.0, "Medium"),
        ("CP-05", "Santosh Nagar Market Yard, Moshi [DEMO DATA]", 18.6755, 73.8440, "Commercial Establishment", 380.0, 18.0, "High"),

        # Spine Road Corridor
        ("CP-06", "Spine Road Moshi Junction Bin [DEMO DATA]", 18.6710, 73.8395, "Community Garbage Bin", 420.0, 20.0, "High"),
        ("CP-07", "Woodsville Phase 1 Residential Gate [DEMO DATA]", 18.6738, 73.8340, "Residential Building", 310.0, 15.0, "Medium"),
        ("CP-08", "Woodsville Phase 2 & 3 Hub [DEMO DATA]", 18.6751, 73.8322, "Residential Building", 280.0, 14.0, "Medium"),
        ("CP-09", "Spine City Mall Commercial Frontage [DEMO DATA]", 18.6685, 73.8370, "Commercial Establishment", 450.0, 22.0, "High"),
        ("CP-10", "Sector 4 PCMC Pradhikaran Bin [DEMO DATA]", 18.6652, 73.8410, "Community Garbage Bin", 260.0, 14.0, "Medium"),
        ("CP-11", "Sector 6 Garden Colony [DEMO DATA]", 18.6628, 73.8385, "Individual Household", 85.0, 8.0, "Low"),

        # Gandharv Nagari & Borhade Wadi
        ("CP-12", "Gandharv Nagari Main Road Point [DEMO DATA]", 18.6835, 73.8420, "Residential Building", 220.0, 12.0, "Medium"),
        ("CP-13", "Gandharv Swara Enclave [DEMO DATA]", 18.6852, 73.8405, "Residential Building", 160.0, 10.0, "Low"),
        ("CP-14", "Borhade Wadi Primary School Corner [DEMO DATA]", 18.6870, 73.8455, "Public Garbage Collection Point", 190.0, 12.0, "Medium"),
        ("CP-15", "Borhade Wadi Commercial Complex [DEMO DATA]", 18.6892, 73.8432, "Commercial Establishment", 320.0, 16.0, "High"),
        ("CP-16", "Radha Krishna Residency, Borhade Wadi [DEMO DATA]", 18.6910, 73.8470, "Residential Building", 175.0, 10.0, "Medium"),

        # Pune-Nashik Highway (NH 60) & Moshi Toll Belt
        ("CP-17", "Moshi Toll Plaza Service Road Point [DEMO DATA]", 18.6925, 73.8560, "Public Garbage Collection Point", 310.0, 16.0, "High"),
        ("CP-18", "Hotel Vishnukrupa Dhaba Belt [DEMO DATA]", 18.6960, 73.8590, "Commercial Establishment", 290.0, 15.0, "Medium"),
        ("CP-19", "Moshi High Street Retail Complex [DEMO DATA]", 18.6845, 73.8530, "Commercial Establishment", 410.0, 20.0, "High"),
        ("CP-20", "D-Mart Moshi Branch Rear Waste Bay [DEMO DATA]", 18.6815, 73.8565, "Commercial Establishment", 520.0, 25.0, "High"),
        ("CP-21", "Fortune Plaza Commercial Hub [DEMO DATA]", 18.6790, 73.8580, "Commercial Establishment", 230.0, 12.0, "Medium"),

        # Alandi Road & Dudulgaon Link
        ("CP-22", "Moshi-Alandi Road Octroi Naka [DEMO DATA]", 18.6740, 73.8610, "Community Garbage Bin", 340.0, 18.0, "High"),
        ("CP-23", "Dudulgaon Phata Corner Point [DEMO DATA]", 18.6720, 73.8685, "Public Garbage Collection Point", 210.0, 12.0, "Medium"),
        ("CP-24", "Silver Crest Society, Alandi Road [DEMO DATA]", 18.6765, 73.8650, "Residential Building", 195.0, 11.0, "Low"),
        ("CP-25", "Vrundavan Gardens Residential Enclave [DEMO DATA]", 18.6788, 73.8690, "Residential Building", 150.0, 10.0, "Low"),

        # River Residency & Chikhali Border
        ("CP-26", "River Residency Phase 1 Gate [DEMO DATA]", 18.6660, 73.8240, "Residential Building", 360.0, 18.0, "High"),
        ("CP-27", "River Residency Commercial Court [DEMO DATA]", 18.6675, 73.8215, "Commercial Establishment", 270.0, 14.0, "Medium"),
        ("CP-28", "Indrayani Riverfront Community Bin [DEMO DATA]", 18.6705, 73.8205, "Community Garbage Bin", 440.0, 20.0, "High"),
        ("CP-29", "Shree Siddhivinayak Nagari, Moshi West [DEMO DATA]", 18.6730, 73.8260, "Residential Building", 185.0, 11.0, "Low"),

        # Moshi Exhibition Centre & International Convention Belt
        ("CP-30", "PIECC Pune International Exhibition Gate 2 [DEMO DATA]", 18.6860, 73.8650, "Public Garbage Collection Point", 380.0, 20.0, "High"),
        ("CP-31", "International Convention Staff Housing [DEMO DATA]", 18.6885, 73.8680, "Residential Building", 160.0, 10.0, "Low"),
        ("CP-32", "Exhibition Centre South Car Park Bin [DEMO DATA]", 18.6830, 73.8675, "Community Garbage Bin", 290.0, 15.0, "Medium"),

        # Northern Moshi Townships
        ("CP-33", "Crystal City Phase 1 Towers, Moshi [DEMO DATA]", 18.6940, 73.8490, "Residential Building", 280.0, 14.0, "Medium"),
        ("CP-34", "Crystal City Green Acres [DEMO DATA]", 18.6970, 73.8475, "Residential Building", 210.0, 12.0, "Low"),
        ("CP-35", "Moshi Safari Park Perimeter Stand [DEMO DATA]", 18.6995, 73.8520, "Public Garbage Collection Point", 180.0, 10.0, "Low"),
        ("CP-36", "Majestic Landmarks Township [DEMO DATA]", 18.6915, 73.8380, "Residential Building", 310.0, 15.0, "Medium"),
        ("CP-37", "Royal Palms Row Houses [DEMO DATA]", 18.6865, 73.8345, "Individual Household", 95.0, 8.0, "Low"),
        ("CP-38", "Moshi Sub-Market Vegetable Yard [DEMO DATA]", 18.6770, 73.8535, "Commercial Establishment", 560.0, 26.0, "High"),
    ]

    points: List[CollectionPoint] = []
    for pid, name, lat, lng, c_type, kg, mins, prio in raw_data:
        points.append(
            CollectionPoint(
                id=pid,
                name=name,
                lat=lat,
                lng=lng,
                collection_type=c_type,
                garbage_quantity_kg=kg,
                collection_time_mins=mins,
                priority=prio,
                status="Pending",
                is_demo=True,
                notes="Simulated demo collection point in Moshi operational boundary",
            )
        )
    return points
