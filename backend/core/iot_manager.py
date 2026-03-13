from sqlalchemy.orm import Session
from core.database import IoTReading, SessionLocal
from datetime import datetime

# Save IoT sensor reading to database

def save_iot_reading(precipitation: float, soil_humidity: float,
                     river_level: float, lat: float, lon: float,
                     temperature: float = None, humidity: float = None):
    db: Session = SessionLocal()
    try:
        reading = IoTReading(
            timestamp=datetime.utcnow(),
            precipitation=precipitation,
            soil_humidity=soil_humidity,
            river_level=river_level,
            temperature=temperature,
            humidity=humidity,
            latitude=lat,
            longitude=lon
        )
        db.add(reading)
        db.commit()
        return True
    except Exception as e:
        print(f"Error saving reading: {e}")
        return False
    finally:
        db.close()

def get_latest_readings(limit: int = 20):
    db: Session = SessionLocal()
    try:
        readings = db.query(IoTReading)\
            .order_by(IoTReading.timestamp.desc())\
            .limit(limit)\
            .all()
        return [
            {
                "timestamp": r.timestamp.isoformat(),
                "precipitation": r.precipitation,
                "soil_humidity": r.soil_humidity,
                "river_level": r.river_level,
                "temperature": r.temperature,
                "humidity": r.humidity,
                "latitude": r.latitude,
                "longitude": r.longitude
            }
            for r in readings
        ]
    finally:
        db.close()