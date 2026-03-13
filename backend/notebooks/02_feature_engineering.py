import pandas as pd
import numpy as np
import os

# Feature engineering for climate data
BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(BASE_PATH, exist_ok=True)
def load_and_clean(filepath, region):
    df = pd.read_csv(filepath)
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").reset_index(drop=True)
    df["region"] = region
    print(f"{region}: {len(df)} rows loaded")
    return df

def engineer_features(df):
    # Precipitation totals in time windows
    df["precip_3d"]  = df["precipitation_sum"].rolling(3).sum()
    df["precip_7d"]  = df["precipitation_sum"].rolling(7).sum()
    df["precip_14d"] = df["precipitation_sum"].rolling(14).sum()
    df["precip_30d"] = df["precipitation_sum"].rolling(30).sum()

    # Anomaly relative to monthly historical average
    df["month"] = df["time"].dt.month
    monthly_avg = df.groupby("month")["precipitation_sum"].transform("mean")
    df["precip_anomaly"] = df["precipitation_sum"] - monthly_avg

    # Consecutive rainy days
    df["rainy_day"] = (df["precipitation_sum"] > 1.0).astype(int)
    df["consecutive_rain"] = (
        df["rainy_day"]
        .groupby((df["rainy_day"] != df["rainy_day"].shift()).cumsum())
        .cumsum() * df["rainy_day"]
    )

    # Temperature features
    df["temp_range"]   = df["temperature_2m_max"] - df["temperature_2m_min"]
    df["temp_7d_avg"]  = df["temperature_2m_max"].rolling(7).mean()

    # Wind features
    df["wind_7d_avg"]  = df["windspeed_10m_max"].rolling(7).mean()

    # Temporal features with annual cycle
    df["day_of_year"]  = df["time"].dt.dayofyear
    df["week_of_year"] = df["time"].dt.isocalendar().week.astype(int)
    df["season_sin"]   = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["season_cos"]   = np.cos(2 * np.pi * df["day_of_year"] / 365)

    # =========================================================
    # CORRECTED TARGET
    # Using precip_7d with 3-day lag to avoid data leakage
    # between features and target
    # =========================================================
    df["precip_7d_lagged"] = df["precipitation_sum"].rolling(7).sum().shift(3)
    threshold = df["precip_7d_lagged"].quantile(0.93)
    df["flood_event"] = (df["precip_7d_lagged"] > threshold).astype(int)

    print(f"  Threshold: {threshold:.1f}mm | Events: {df['flood_event'].sum()} ({df['flood_event'].mean()*100:.1f}%)")
    return df

def prepare_final_dataset(df):
    feature_cols = [
        "precipitation_sum",
        "precip_3d", "precip_7d", "precip_14d", "precip_30d",
        "precip_anomaly", "consecutive_rain",
        "temperature_2m_max", "temperature_2m_min", "temp_range", "temp_7d_avg",
        "windspeed_10m_max", "wind_7d_avg",
        "season_sin", "season_cos",
        "month", "week_of_year",
        "region", "time", "flood_event"
    ]
    df = df[feature_cols].dropna()
    print(f"  Final dataset: {len(df)} rows, {len(feature_cols)-3} features")
    return df

# All regions
regions = [
    ("bolivia",           "bolivia_climate.csv"),
    ("bangladesh",        "bangladesh_climate.csv"),
    ("germany",           "germany_climate.csv"),
    ("peru_lima",         "peru_lima_climate.csv"),
    ("peru_amazonia",     "peru_amazonia_climate.csv"),
    ("colombia_bogota",   "colombia_bogota_climate.csv"),
    ("colombia_caribe",   "colombia_caribe_climate.csv"),
    ("texas_houston",     "texas_houston_climate.csv"),
    ("brasil_saopaulo",   "brasil_saopaulo_climate.csv"),
    ("brasil_manaus",     "brasil_manaus_climate.csv"),
    ("usa_new_orleans",   "usa_new_orleans_climate.csv"),
    ("usa_miami",         "usa_miami_climate.csv"),
    ("africa_mozambique", "africa_mozambique_climate.csv"),
    ("oceania_queensland","oceania_queensland_climate.csv"),
    ("europa_rotterdam",  "europa_rotterdam_climate.csv"),
    ("asia_manila",       "asia_manila_climate.csv"),
]

print("Loading datasets...")
dfs = []
for region_name, filename in regions:
    df = load_and_clean(f"{BASE_PATH}/{filename}", region_name)
    df = engineer_features(df)
    dfs.append(df)

print("\nMerging datasets...")
combined = pd.concat(dfs, ignore_index=True)
combined = prepare_final_dataset(combined)

output_path = f"{BASE_PATH}/features_dataset.csv"
combined.to_csv(output_path, index=False)

print(f"\nfeatures_dataset.csv saved")
print(f"Total rows: {len(combined)}")
print(f"Regions: {combined['region'].nunique()}")
print(f"Balance flood_event: {combined['flood_event'].value_counts().to_dict()}")
