import httpx
import asyncio
from typing import Optional

class GeoDataConnector:
    
    # --- REAL TIME CLIMATE (Open-Meteo) ---
    async def get_current_weather(self, lat: float, lon: float) -> dict:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "precipitation",
                "windspeed_10m",
                "relative_humidity_2m"
            ],
            "daily": [
                "precipitation_sum",
                "temperature_2m_max"
            ],
            "forecast_days": 7,
            "timezone": "UTC"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            data = response.json()
            
        current = data.get("current", {})
        daily = data.get("daily", {})
        
        return {
            "temperature": current.get("temperature_2m"),
            "precipitation_now": current.get("precipitation"),
            "windspeed": current.get("windspeed_10m"),
            "humidity": current.get("relative_humidity_2m"),
            "forecast_7days": list(zip(
                daily.get("time", []),
                daily.get("precipitation_sum", [])
            ))
        }

    # --- TOPOGRAPHIC ELEVATION (OpenTopoData SRTM) ---
    async def get_elevation(self, lat: float, lon: float) -> float:
        url = f"https://api.opentopodata.org/v1/srtm30m"
        params = {"locations": f"{lat},{lon}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            data = response.json()
        
        results = data.get("results", [])
        if results:
            return results[0].get("elevation", 0)
        return 0

    # --- POPULATION DENSITY (WorldPop) ---
    async def get_population_density(self, lat: float, lon: float) -> float:
        # WorldPop API - population within 5km radius
        url = "https://api.worldpop.org/v1/services/stats"
        params = {
            "dataset": "wpgpas",
            "year": 2020,
            "geojson": f'{{"type":"Point","coordinates":[{lon},{lat}]}}',
            "r": 5000,
            "runasyncly": False
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=15)
                data = response.json()
            return data.get("data", {}).get("total_population", 50000)
        except:
            # Fallback if WorldPop not responding
            return 50000

    # --- NASA POWER HISTORICAL DATA ---
    async def get_nasa_historical(self, lat: float, lon: float) -> dict:
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "PRECTOTCORR,T2M,WS10M",
            "community": "RE",
            "longitude": lon,
            "latitude": lat,
            "start": "20200101",
            "end": "20231231",
            "format": "JSON"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=20)
                data = response.json()
            properties = data.get("properties", {}).get("parameter", {})
            precip_data = properties.get("PRECTOTCORR", {})
            avg_precip = sum(precip_data.values()) / len(precip_data) if precip_data else 0
            return {"avg_daily_precipitation": round(avg_precip, 3)}
        except:
            return {"avg_daily_precipitation": 0}


# Instancia global
geo_connector = GeoDataConnector()