import pandas as pd
import pickle
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import LabelEncoder
import os

# Load features dataset
import os
BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
MODELS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(MODELS_PATH, exist_ok=True)

df = pd.read_csv(os.path.join(BASE_PATH, "features_dataset.csv"))

le = LabelEncoder()
df["region_encoded"] = le.fit_transform(df["region"])

FEATURE_COLS = [
    "precipitation_sum",
    "precip_3d", "precip_7d", "precip_14d", "precip_30d",
    "precip_anomaly", "consecutive_rain",
    "temperature_2m_max", "temperature_2m_min", "temp_range", "temp_7d_avg",
    "windspeed_10m_max", "wind_7d_avg",
    "season_sin", "season_cos",
    "month", "week_of_year",
    "region_encoded"
]

X = df[FEATURE_COLS]
y = df["flood_event"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")
print(f"Flood events in train: {y_train.sum()} ({y_train.mean()*100:.1f}%)")

scale = (y_train == 0).sum() / (y_train == 1).sum()

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=scale,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric="auc",
    early_stopping_rounds=20
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_prob)

print("\n--- Results ---")
print(f"AUC-ROC: {auc:.4f}")
print(classification_report(y_test, y_pred, target_names=["No flood", "Flood"]))

model_data = {
    "model": model,
    "feature_cols": FEATURE_COLS,
    "label_encoder": le,
    "auc_score": auc,
    "regions": le.classes_.tolist()
}

with open("D:/Rodo/Dev/GeoSentinel/backend/models/flood_model.pkl", "wb") as f:
    pickle.dump(model_data, f)
    
model.save_model("D:/Rodo/Dev/GeoSentinel/backend/models/flood_model.json")
print(f"Model saved | AUC: {auc:.4f} | Regions: {le.classes_.tolist()}")
