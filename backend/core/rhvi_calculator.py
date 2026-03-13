import numpy as np

def calculate_rhvi(flood_score: float, elevation: float, population_density: float) -> dict:
    """
    RHVI (Rainfall-Hydrological-Vulnerability Index)

    Calculates combined flood risk based on:
    - flood_score: Heavy rain probability (0-1)
    - elevation: Terrain elevation in meters (lower = higher risk)
    - population_density: Population density (higher = higher vulnerability)
    """
    # Normalize elevation (lower elevation = higher exposure)
    # Using realistic range 0-1000m (most cities below 500m)
    # Beira is ~10m, La Paz is ~3600m
    elevation_clamped = max(0, min(elevation, 1000))
    elevation_factor = 1 - (elevation_clamped / 1000)

    # Normalize population density (using realistic range 0-1000000 per km²)
    # Low: <100, Medium: 100-1000, High: 1000-10000, Very high: >10000
    # Using 0-1000000 range to allow very dense cities like Mumbai
    pop_clamped = max(0, min(population_density, 1000000))
    pop_normalized = pop_clamped / 1000000

    # Improved RHVI formula with adjusted weights
    # flood_score has more weight as it's the trigger
    # Elevation has medium weight as high ground can mitigate floods
    # Population has lower but critical weight for vulnerability
    rhvi = (
        (flood_score       * 0.50) +
        (elevation_factor  * 0.25) +
        (pop_normalized    * 0.25)
    )

    rhvi = round(float(np.clip(rhvi, 0, 1)), 4)

    # Risk level classification
    # Adjusted thresholds for realism
    if rhvi >= 0.70:
        level = "RED"
        label = "Critical Risk"
        action = "Immediate evacuation of critical zones"
    elif rhvi >= 0.50:
        level = "ORANGE"
        label = "High Risk"
        action = "Activate evacuation protocols"
    elif rhvi >= 0.30:
        level = "YELLOW"
        label = "Moderate Risk"
        action = "Intensive monitoring"
    else:
        level = "GREEN"
        label = "Low Risk"
        action = "Standard monitoring"

    return {
        "rhvi_score": rhvi,
        "risk_level": level,
        "risk_label": label,
        "recommended_action": action,
        "components": {
            "flood_score":        round(flood_score, 4),
            "elevation_factor":   round(elevation_factor, 4),
            "population_density": round(pop_normalized, 4)
        }
    }