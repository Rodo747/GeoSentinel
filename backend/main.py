import warnings
import os
import startup
warnings.filterwarnings('ignore')

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from core.database import create_tables, get_setting, set_setting
from core.geo_connector import geo_connector
from core.iot_manager import save_iot_reading, get_latest_readings
from core.rhvi_calculator import calculate_rhvi
from core.alert_engine import send_alert_email, should_send_alert
from engines.flood_engine import FloodRiskEngine


MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "flood_model.pkl")
flood_engine = FloodRiskEngine(MODEL_PATH)

app = FastAPI(
    title="GeoSentinel",
    description="Turning Earth Data into Life-Protecting Action",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PYDANTIC MODELS
# ============================================================

class IoTPayload(BaseModel):
    node_id:        str   = "ESP32-NODE-01"
    precipitation:  float = 0.0
    river_level:    float = 0.0
    soil_humidity:  float = 0.0
    temperature:    float = 0.0
    humidity:       float = 0.0
    lat:            float = -16.5
    lon:            float = -68.15


class SettingsPayload(BaseModel):
    threshold:            Optional[float] = None
    email_enabled:        Optional[bool] = None
    iot_interval:         Optional[int] = None
    map_circle_radius:    Optional[int] = None


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    create_tables()
    print("✅ GeoSentinel database ready")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "GeoSentinel",
        "slogan": "Turning Earth Data into Life-Protecting Action",
        "version": "1.0.0"
    }


@app.get("/")
def root():
    return {"message": "GeoSentinel API is running"}


# ============================================================
# GEO / CLIMATE DATA
# ============================================================

@app.get("/geo/weather")
async def get_weather(lat: float, lon: float):
    data = await geo_connector.get_current_weather(lat, lon)
    return {"location": {"lat": lat, "lon": lon}, "weather": data}


@app.get("/geo/elevation")
async def get_elevation(lat: float, lon: float):
    elevation = await geo_connector.get_elevation(lat, lon)
    return {"location": {"lat": lat, "lon": lon}, "elevation_meters": elevation}


@app.get("/geo/all")
async def get_all_geo_data(lat: float, lon: float):
    weather, elevation, nasa = await asyncio.gather(
        geo_connector.get_current_weather(lat, lon),
        geo_connector.get_elevation(lat, lon),
        geo_connector.get_nasa_historical(lat, lon)
    )
    return {
        "location": {"lat": lat, "lon": lon},
        "weather": weather,
        "elevation_meters": elevation,
        "historical": nasa
    }


# ============================================================
# IoT ENDPOINTS (UNIFIED)
# ============================================================

@app.post("/iot/readings")
async def receive_iot_reading(payload: IoTPayload):
    """Receives IoT sensor readings (ESP32 and simulator)."""
    success = save_iot_reading(
        precipitation = payload.precipitation,
        soil_humidity = payload.soil_humidity,
        river_level   = payload.river_level,
        lat           = payload.lat,
        lon           = payload.lon,
        temperature   = payload.temperature,
        humidity      = payload.humidity,
    )
    if success:
        print(f"[IoT] ✅ {payload.node_id} — P:{payload.precipitation}mm R:{payload.river_level}m H:{payload.soil_humidity}% T:{payload.temperature}°C")
        return {"status": "ok", "node_id": payload.node_id}
    return {"status": "error"}


@app.get("/iot/readings")
async def get_iot_readings(limit: int = 20):
    """Gets latest IoT readings."""
    readings = get_latest_readings(limit)
    return {"count": len(readings), "readings": readings}


# ============================================================
# RHVI CALCULATOR
# ============================================================

@app.get("/rhvi")
async def get_rhvi(lat: float, lon: float):
    elevation, weather, population = await asyncio.gather(
        geo_connector.get_elevation(lat, lon),
        geo_connector.get_current_weather(lat, lon),
        geo_connector.get_population_density(lat, lon)
    )

    # Use current precipitation as flood_score proxy
    precip = weather.get("precipitation_now", 0) or 0
    flood_score = min(precip / 50.0, 1.0)

    result = calculate_rhvi(flood_score, elevation, population)
    result["location"] = {"lat": lat, "lon": lon}
    result["elevation_meters"] = elevation

    return result


# ============================================================
# FLOOD PREDICTION
# ============================================================

@app.get("/predict")
async def predict_risk(lat: float, lon: float, location_name: str = "Unknown Location"):
    weather, elevation, nasa, population = await asyncio.gather(
        geo_connector.get_current_weather(lat, lon),
        geo_connector.get_elevation(lat, lon),
        geo_connector.get_nasa_historical(lat, lon),
        geo_connector.get_population_density(lat, lon)
    )

    prediction = flood_engine.predict(lat, lon, weather, elevation, population)
    rhvi       = calculate_rhvi(prediction["flood_score"], elevation, population)

    # Send alert if threshold exceeded (uses configured threshold)
    print(f"[Monitor] RHVI score: {rhvi['rhvi_score']} | Population: {population}")
    if should_send_alert(rhvi["rhvi_score"], location=location_name):
        print(f"[Monitor] Threshold exceeded — sending alert email")
        await asyncio.to_thread(send_alert_email,
            location           = location_name,
            lat                = lat,
            lon                = lon,
            risk_level         = rhvi["risk_level"],
            rhvi_score         = rhvi["rhvi_score"],
            flood_score        = prediction["flood_score"],
            recommended_action = prediction["recommended_action"],
            temperature        = weather.get("temperature", 0),
            precipitation      = weather.get("precipitation_now", 0),
            elevation          = elevation,
        )

    return {
        "location":   {"lat": lat, "lon": lon},
        "prediction": prediction,
        "rhvi":       rhvi,
        "weather":    weather,
        "historical": nasa,
        "model_info": {"auc": flood_engine.auc_score, "regions_trained": 16}
    }


# ============================================================
# SIMULATOR
# ============================================================

@app.get("/simulate")
async def simulate(
    lat: float,
    lon: float,
    rainfall: float,
    river_level: float,
    soil_saturation: float
):
    # Get real zone data to combine with simulation
    try:
        real_weather, elevation, population = await asyncio.gather(
            geo_connector.get_current_weather(lat, lon),
            geo_connector.get_elevation(lat, lon),
            geo_connector.get_population_density(lat, lon)
        )
        real_temp = real_weather.get("temperature", 15.0)
        real_wind = real_weather.get("windspeed", 10.0)
        real_precip_base = real_weather.get("precipitation_now", 0.0)
    except:
        real_temp = 15.0
        real_wind = 10.0
        real_precip_base = 0.0
        elevation = 0
        population = 50000

    # Combine simulated precipitation with real zone base
    combined_precip = rainfall + real_precip_base

    simulated_weather = {
        "precipitation_now": combined_precip,
        "temperature": real_temp,
        "windspeed": real_wind,
        "humidity": soil_saturation,
        "forecast_7days": [(f"day-{i}", combined_precip * 0.8) for i in range(7)]
    }

    prediction = flood_engine.predict(lat, lon, simulated_weather, elevation, population)
    rhvi = calculate_rhvi(prediction["flood_score"], elevation, population)

    recs = {
        "RED":    ["Immediate evacuation of critical zones", "Pre-position emergency resources", "Activate emergency broadcast system", "Close bridges and flood-prone roads"],
        "ORANGE": ["Activate evacuation protocols", "Intensive monitoring every 15 minutes", "Prepare emergency shelters", "Alert local authorities"],
        "YELLOW": ["Intensive monitoring", "Review evacuation routes", "Notify vulnerable communities", "Prepare emergency equipment"],
        "GREEN":  ["Standard monitoring", "No immediate action required", "Continue normal operations"],
    }

    level = prediction["risk_level"]
    return {
        "flood_score":        prediction["flood_score"],
        "risk_level":         level,
        "risk_label":         prediction["risk_label"],
        "rhvi_score":         rhvi["rhvi_score"],
        "recommended_action": prediction["recommended_action"],
        "recommendations":    recs.get(level, []),
        "confidence":         prediction["confidence"],
        "real_base_precip":   real_precip_base,
        "real_temp":          real_temp,
        "inputs": {
            "rainfall": rainfall,
            "river_level": river_level,
            "soil_saturation": soil_saturation,
            "combined_precip": combined_precip,
        }
    }


# ============================================================
# SETTINGS ENDPOINTS
# ============================================================

@app.get("/settings")
async def get_all_settings():
    """Gets all global system configuration."""
    return {
        "alert_threshold": float(get_setting("alert_threshold") or "0.45"),
        "email_alerts_enabled": get_setting("email_alerts_enabled") == "true",
        "iot_interval_seconds": int(get_setting("iot_interval_seconds") or "30"),
        "map_circle_radius": int(get_setting("map_circle_radius") or "12000"),
    }


@app.post("/settings")
async def update_settings(payload: SettingsPayload):
    """Updates global system configuration."""
    if payload.threshold is not None:
        set_setting("alert_threshold", str(payload.threshold))
    if payload.email_enabled is not None:
        set_setting("email_alerts_enabled", "true" if payload.email_enabled else "false")
    if payload.iot_interval is not None:
        set_setting("iot_interval_seconds", str(payload.iot_interval))
    if payload.map_circle_radius is not None:
        set_setting("map_circle_radius", str(payload.map_circle_radius))
    return {"status": "ok", "message": "Settings updated"}


@app.get("/iot/config")
async def get_iot_config():
    """Endpoint for ESP32 to get its interval configuration."""
    interval = int(get_setting("iot_interval_seconds") or "30")
    return {"interval_seconds": interval}


# ============================================================
# RUN INSTRUCTIONS
# ============================================================
# D:\Rodo\Dev\GeoSentinel>venv\Scripts\activate
# D:\Rodo\Dev\GeoSentinel\backend>uvicorn main:app --reload
# D:\Rodo\Dev\GeoSentinel\frontend>npm run dev
