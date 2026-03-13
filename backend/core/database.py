from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./geosentinel.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Table: IoT readings
class IoTReading(Base):
    __tablename__ = "iot_readings"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    precipitation = Column(Float)
    soil_humidity = Column(Float)
    river_level = Column(Float)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)

# Table: predictions
class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float)
    longitude = Column(Float)
    flood_score = Column(Float)
    rhvi_score = Column(Float)
    risk_level = Column(String)
    confidence = Column(Float)

# Table: global system settings
class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)

def create_tables():
    Base.metadata.create_all(bind=engine)

# Default configuration values
DEFAULT_SETTINGS = {
    "alert_threshold": "0.45",
    "email_alerts_enabled": "true",
    "iot_interval_seconds": "30",
}

def get_setting(key: str) -> str:
    db = SessionLocal()
    try:
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        if setting:
            return setting.value
        return DEFAULT_SETTINGS.get(key, "")
    finally:
        db.close()

def set_setting(key: str, value: str) -> bool:
    db = SessionLocal()
    try:
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        if setting:
            setting.value = value
        else:
            setting = SystemSettings(key=key, value=value)
            db.add(setting)
        db.commit()
        return True
    except Exception as e:
        print(f"Error guardando setting {key}: {e}")
        return False
    finally:
        db.close()