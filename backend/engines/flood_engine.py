import warnings
warnings.filterwarnings('ignore')

import pickle
import numpy as np
import pandas as pd
from datetime import datetime

# Training regions and their climate characteristics
TRAINING_REGIONS = {
    "bolivia":           {"lat": -16.5,  "lon": -68.15, "climate": "highland"},
    "bangladesh":        {"lat": 23.8,   "lon": 90.4,   "climate": "monsoon"},
    "germany":           {"lat": 52.52,  "lon": 13.40,  "climate": "temperate"},
    "peru_lima":         {"lat": -12.04, "lon": -77.03, "climate": "arid_coastal"},
    "peru_amazonia":     {"lat": -3.74,  "lon": -73.25, "climate": "tropical"},
    "colombia_bogota":   {"lat": 4.71,   "lon": -74.07, "climate": "highland"},
    "colombia_caribe":   {"lat": 10.39,  "lon": -75.48, "climate": "tropical"},
    "texas_houston":     {"lat": 29.76,  "lon": -95.36, "climate": "subtropical"},
    "brasil_saopaulo":   {"lat": -23.55, "lon": -46.63, "climate": "subtropical"},
    "brasil_manaus":     {"lat": -3.10,  "lon": -60.02, "climate": "tropical"},
    "usa_new_orleans":   {"lat": 29.95,  "lon": -90.07, "climate": "subtropical"},
    "usa_miami":         {"lat": 25.77,  "lon": -80.19, "climate": "subtropical"},
    "africa_mozambique": {"lat": -19.84, "lon": 34.84,  "climate": "tropical"},
    "oceania_queensland":{"lat": -27.47, "lon": 153.02, "climate": "subtropical"},
    "europa_rotterdam":  {"lat": 51.92,  "lon": 4.47,   "climate": "temperate"},
    "asia_manila":       {"lat": 14.59,  "lon": 120.98, "climate": "tropical"},
}

class FloodRiskEngine:

    def __init__(self, model_path: str):
        with open(model_path, "rb") as f:
            data = pickle.load(f)
        self.model         = data["model"]
        self.feature_cols  = data["feature_cols"]
        self.label_encoder = data["label_encoder"]
        self.auc_score     = data["auc_score"]
        print(f"FloodRiskEngine loaded | AUC: {self.auc_score:.4f}")

    def _calculate_confidence(self, lat: float, lon: float) -> float:
        # Calculate confidence based on distance to training regions
        min_distance = float("inf")
        for region in TRAINING_REGIONS.values():
            dist = np.sqrt((lat - region["lat"])**2 + (lon - region["lon"])**2)
            if dist < min_distance:
                min_distance = dist

        if min_distance < 5:
            return 0.95
        elif min_distance < 15:
            return 0.85
        elif min_distance < 30:
            return 0.75
        elif min_distance < 60:
            return 0.65
        else:
            return 0.55

    def _build_features(self, weather: dict) -> pd.DataFrame:
        # Build feature vector from real-time climate data
        precip    = weather.get("precipitation_now", 0) or 0
        temp_max  = weather.get("temperature", 25) or 25
        temp_min  = temp_max - 8
        windspeed = weather.get("windspeed", 10) or 10

        forecast = weather.get("forecast_7days", [])
        precip_values = [p for _, p in forecast] if forecast else [precip] * 7

        precip_3d  = sum(precip_values[:3])
        precip_7d  = sum(precip_values[:7])
        precip_14d = precip_7d * 1.5
        precip_30d = precip_7d * 3.0

        now = datetime.utcnow()
        day_of_year  = now.timetuple().tm_yday
        week_of_year = now.isocalendar()[1]
        month        = now.month

        features = {
            "precipitation_sum": precip,
            "precip_3d":         precip_3d,
            "precip_7d":         precip_7d,
            "precip_14d":        precip_14d,
            "precip_30d":        precip_30d,
            "precip_anomaly":    precip - (precip_7d / 7),
            "consecutive_rain":  sum(1 for p in precip_values if p > 1.0),
            "temperature_2m_max": temp_max,
            "temperature_2m_min": temp_min,
            "temp_range":        temp_max - temp_min,
            "temp_7d_avg":       temp_max,
            "windspeed_10m_max": windspeed,
            "wind_7d_avg":       windspeed,
            "season_sin":        np.sin(2 * np.pi * day_of_year / 365),
            "season_cos":        np.cos(2 * np.pi * day_of_year / 365),
            "month":             month,
            "week_of_year":      week_of_year,
            "region_encoded":    0
        }

        return pd.DataFrame([features])[self.feature_cols]

    def predict(self, lat: float, lon: float, weather: dict, 
                elevation: float, population: float) -> dict:
        
        features   = self._build_features(weather)
        flood_prob = float(self.model.predict_proba(features)[0][1])
        confidence = self._calculate_confidence(lat, lon)

        # Risk level based on probability
        if flood_prob >= 0.80:
            risk_level = "RED"
            risk_label = "Critical Risk"
            action     = "Immediate evacuation of critical zones"
        elif flood_prob >= 0.50:
            risk_level = "ORANGE"
            risk_label = "High Risk"
            action     = "Activate evacuation protocols"
        elif flood_prob >= 0.25:
            risk_level = "YELLOW"
            risk_label = "Moderate Risk"
            action     = "Intensive monitoring"
        else:
            risk_level = "GREEN"
            risk_label = "Low Risk"
            action     = "Standard monitoring"

        return {
            "flood_score":          round(flood_prob, 4),
            "risk_level":           risk_level,
            "risk_label":           risk_label,
            "recommended_action":   action,
            "confidence":           confidence,
            "elevation_meters":     elevation,
            "location": {"lat": lat, "lon": lon}
        }