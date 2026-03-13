"""
GeoSentinel — Climate Data Downloader
Downloads 24 years of historical climate data (2000-2023) from the Open-Meteo
Archive API for 16 flood-prone regions across 6 continents.

Usage:
    python 01_download_data.py

Output:
    CSV files saved to ../data/<region_name>_climate.csv
"""

import os
import time
import requests
import pandas as pd

# Output directory — relative to this script's location
BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(BASE_PATH, exist_ok=True)

# All 16 regions covered by GeoSentinel's training dataset
REGIONS = [
    # South America — Andean and tropical zones
    {"name": "bolivia",          "lat": -16.50, "lon": -68.15},
    {"name": "peru_lima",        "lat": -12.04, "lon": -77.03},
    {"name": "peru_amazonia",    "lat":  -3.74, "lon": -73.25},
    {"name": "colombia_bogota",  "lat":   4.71, "lon": -74.07},
    {"name": "colombia_caribe",  "lat":  10.39, "lon": -75.48},
    {"name": "brasil_saopaulo",  "lat": -23.55, "lon": -46.63},
    {"name": "brasil_manaus",    "lat":  -3.10, "lon": -60.02},

    # North America — Gulf Coast flood zones
    {"name": "texas_houston",    "lat":  29.76, "lon": -95.36},
    {"name": "usa_new_orleans",  "lat":  29.95, "lon": -90.07},
    {"name": "usa_miami",        "lat":  25.77, "lon": -80.19},

    # Africa — coastal and delta zones
    {"name": "africa_mozambique","lat": -19.84, "lon":  34.84},

    # Asia — monsoon and delta regions
    {"name": "bangladesh",       "lat":  23.80, "lon":  90.40},
    {"name": "asia_manila",      "lat":  14.59, "lon": 120.98},

    # Europe — major river delta
    {"name": "europa_rotterdam", "lat":  51.92, "lon":   4.47},

    # Oceania — subtropical flood zone
    {"name": "oceania_queensland","lat": -27.47, "lon": 153.02},

    # Europe — temperate reference zone
    {"name": "germany",          "lat":  52.52, "lon":  13.40},
]


def download_region(lat: float, lon: float, region_name: str,
                    start: str = "2000-01-01", end: str = "2023-12-31") -> pd.DataFrame | None:
    """
    Fetch daily climate data for a single region from the Open-Meteo Archive API.

    Parameters
    ----------
    lat, lon      : Geographic coordinates of the region center.
    region_name   : Identifier string stored in the 'region' column.
    start, end    : ISO date strings defining the download window.

    Returns
    -------
    DataFrame with daily climate variables, or None on API error.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude":  lat,
        "longitude": lon,
        "start_date": start,
        "end_date":   end,
        "daily": [
            "precipitation_sum",
            "temperature_2m_max",
            "temperature_2m_min",
            "windspeed_10m_max",
            "et0_fao_evapotranspiration",
        ],
        "timezone": "UTC",
    }

    response = requests.get(url, params=params, timeout=30)
    data = response.json()

    if "daily" not in data:
        print(f"  [ERROR] {region_name}: {data.get('reason', 'Unknown API error')}")
        return None

    df = pd.DataFrame(data["daily"])
    df["region"]    = region_name
    df["latitude"]  = lat
    df["longitude"] = lon

    print(f"  {region_name}: {len(df)} days downloaded")
    return df


def download_all_regions(delay: float = 65.0) -> None:
    """
    Iterate over all defined regions, download climate data, and save to CSV.

    A delay is applied between requests to respect Open-Meteo's rate limits
    on the free tier (approximately 1 request per minute for archive data).

    Parameters
    ----------
    delay : Seconds to wait between API calls. Default 65s for rate limit compliance.
    """
    total   = len(REGIONS)
    success = 0
    failed  = []

    for i, region in enumerate(REGIONS, start=1):
        print(f"[{i}/{total}] Downloading {region['name']}...")

        df = download_region(
            lat=region["lat"],
            lon=region["lon"],
            region_name=region["name"],
        )

        if df is not None:
            output_path = os.path.join(BASE_PATH, f"{region['name']}_climate.csv")
            df.to_csv(output_path, index=False)
            print(f"  Saved: {region['name']}_climate.csv")
            success += 1
        else:
            failed.append(region["name"])

        # Apply rate limit delay between requests, skip after last region
        if i < total:
            print(f"  Waiting {delay}s (rate limit)...")
            time.sleep(delay)

    # Summary report
    print("\n" + "=" * 50)
    print(f"Download complete: {success}/{total} regions successful")
    if failed:
        print(f"Failed regions: {', '.join(failed)}")
    print("=" * 50)


if __name__ == "__main__":
    print("=" * 50)
    print("  GeoSentinel — Climate Data Downloader")
    print(f"  Regions: {len(REGIONS)} | Period: 2000-2023")
    print(f"  Output:  {os.path.abspath(BASE_PATH)}")
    print("=" * 50 + "\n")

    download_all_regions()