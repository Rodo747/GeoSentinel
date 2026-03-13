import os
import subprocess

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "flood_model.pkl")
DATA_PATH  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "features_dataset.csv")

if not os.path.exists(MODEL_PATH):
    print("[Startup] Model not found — training now...")
    subprocess.run(["python", "notebooks/03_model_training.py"], check=True)
    print("[Startup] Model trained and ready.")
else:
    print("[Startup] Model found — skipping training.")
