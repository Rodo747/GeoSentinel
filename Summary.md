# GeoSentinel

### Turning Earth Data into Life-Protecting Action

GEOSENTINEL
Turning Earth’s Data into Actions that Protect Life

Frostbyte Hackathon 2026 — Hydroclimatic Risk Intelligence Platform

The Problem
Every year, floods kill more than 5,000 people and cause $50 billion in damage worldwide.

But these deaths are not inevitable. Most don’t happen because we can’t predict them, but because the right people don’t get the information in time.

Wealthy countries have sophisticated early warning systems. The communities that need them most—river deltas in Mozambique, mountain cities in Bolivia, coastal areas of Southeast Asia—get nothing. No data. No alerts. No time to act.

That gap is what kills people.

The Solution
GeoSentinel is a real-time flood risk intelligence platform that works anywhere on Earth, without the need for expensive infrastructure. It combines satellite climate data, a machine learning model trained on 139,792 historical flood records across 16 global regions, and on-the-ground IoT sensors, providing a unique and actionable risk score to anyone who needs it, in seconds.

When the risk exceeds a critical threshold, the system automatically alerts authorities and communities with a comprehensive situation analysis and specific recommendations, not just a generic warning.

Inspiration
In Bolivia, my home country, seasonal floods displace thousands of people every year. Bolivia loses an average of $500 million annually due to climate disasters, and no one is immune. In the capital, La Paz, the streets turn into rivers in a matter of minutes. The city is built within a canyon, where every heavy rain is channeled directly into urban neighborhoods, overwhelming drainage systems and catching residents off guard. In the lowlands, entire rural communities are isolated for weeks. Indigenous villages along riverbanks watch the water rise without warning and with no way out. Farmers lose entire harvests overnight. The threat doesn't distinguish between city and countryside. It simply hits hardest where there is less information.

GeoSentinel was born from this reality: built in Bolivia, for Bolivia and the world, designed from day one to scale to all vulnerable communities on the planet that face the same gap between what the data tells us and what people know. Because the tools to save lives already exist. They just haven't reached the right hands yet.

Mission

To make flood risk information a universal right, not a privilege.

We believe that a community in Mozambique deserves the same quality of early warning information as a city in Germany. That a local emergency coordinator in Bolivia should have access to the same satellite data as NOAA. That the difference between a disaster and a managed evacuation should never depend on whether your country can afford the technology. GeoSentinel is the infrastructure that makes it possible.

What makes it different?
Most disaster early warning systems are designed for governments: they are complex, expensive, and require dedicated teams to operate.
GeoSentinel is designed for the moment before a disaster strikes: accessible via a web browser, it deploys in minutes and is designed for the field operator who needs to make an instant decision.

It requires no expensive hardware: it works with free satellite data from NASA and OpenMeteo.
It requires no API keys: it is fully operational right out of the box.
It requires no technical expertise: a single, color-coded risk score that anyone can understand.
It is IoT-ready: connect a $5 ESP32 sensor and start generating real-world ground data instantly.
It is global by design: trained on 16 regions across 6 continents, not optimized for a single geography.

The vision: GeoSentinel is today a flood risk platform adaptable to different regions.

GeoSentinel has the potential to become, within five years, the global early warning system for any natural disaster (floods, landslides, extreme heat, tropical storms), covering every country on the planet, integrating with national emergency systems, and accessible to any community that needs it.

Because the next Cyclone Idai is already forming somewhere.

And this time, those in its path will know it's coming.
---

## 1. How to Start the Application

### Backend Installation

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Installation

```bash
cd frontend
npm install
```

### Execution

```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 2. Project Overview

**GeoSentinel** is a hydro-meteorological risk intelligence platform that combines:

- **Machine Learning** (XGBoost) for flood prediction
- **External APIs** (Open-Meteo, NASA POWER, OpenTopoData, WorldPop)
- **IoT** (ESP32 with MicroPython) for real-time data
- **Frontend** (React + Vite) with interactive dashboard
- **RHVI Index** (Regional Hydro-climate Vulnerability Index)

---

---

## 3. Complete File Structure

```
GeoSentinel/
|
|-- README.md                          # Main project documentation
|-- logo.png                          # Official GeoSentinel logo
|
|-- backend/                              # Backend API (FastAPI + Python)
|   |-- main.py                           # Main FastAPI server (endpoints, routes)
|   |-- requirements.txt                 # Python dependencies
|   |-- .env.example                      # Example environment variables
|   |
|   |-- core/                             # Business logic core
|   |   |-- __init__.py
|   |   |-- alert_engine.py               # Alert system (email + in-app)
|   |   |-- database.py                   # SQLite connection (SQLAlchemy)
|   |   |-- geo_connector.py              # External APIs connector (Open-Meteo, NASA, etc.)
|   |   |-- iot_manager.py                # IoT data manager
|   |   |-- rhvi_calculator.py           # RHVI index calculator
|   |
|   |-- engines/                          # Specialized engines
|   |   |-- flood_engine.py               # Flood prediction engine
|   |   |-- __init__.py
|   |
|   |-- models/                           # ML models (placeholder for .pkl)
|   |   |-- __init__.py
|   |
|   |-- data/                             # Climate and training data
|   |   |-- features_dataset.csv          # Features dataset (30MB)
|   |   |-- africa_mozambique_climate.csv
|   |   |-- asia_manila_climate.csv
|   |   |-- bangladesh_climate.csv
|   |   |-- bolivia_climate.csv
|   |   |-- brasil_manaus_climate.csv
|   |   |-- brasil_saopaulo_climate.csv
|   |   |-- colombia_bogota_climate.csv
|   |   |-- colombia_caribe_climate.csv
|   |   |-- europa_rotterdam_climate.csv
|   |   |-- germany_climate.csv
|   |   |-- oceania_queensland_climate.csv
|   |   |-- peru_amazonia_climate.csv
|   |   |-- peru_lima_climate.csv
|   |   |-- texas_houston_climate.csv
|   |   |-- usa_miami_climate.csv
|   |   |-- usa_new_orleans_climate.csv
|   |   |-- alert_timestamps.json          # Alert history
|   |
|   |-- notebooks/                        # Development and ML notebooks
|   |   |-- 01_download_data.py           # Climate data download
|   |   |-- 01b_download_extra_regions.py # Additional regions download
|   |   |-- 01c_download_extra_regions2.py
|   |   |-- 02_feature_engineering.py    # Feature engineering
|   |   |-- 03_model_training.py         # XGBoost model training
|   |
|   |-- tests/                           # Unit tests
|       |-- __init__.py
|
|-- frontend/                             # Frontend Application (React + Vite)
|   |-- package.json                      # Dependencies (React, Leaflet, Recharts, etc.)
|   |-- package-lock.json                 # Version lock
|   |-- vite.config.js                    # Vite configuration
|   |-- eslint.config.js                   # ESLint configuration
|   |-- index.html                        # HTML entry point
|   |-- .gitignore                        # Git ignored files
|   |
|   |-- public/                          # Public static files
|   |   |-- favicon.ico                   # Application icon
|   |   |-- index.html                    # (reference copy)
|   |
|   |-- src/                             # React source code
|       |-- main.jsx                      # React entry point
|       |-- App.jsx                       # Main component with routes
|       |-- index.css                     # Global styles
|       |
|       |-- assets/                       # Static resources
|       |   |-- (images, fonts, global CSS)
|       |
|       |-- components/                   # Reusable components
|       |   |-- layout/                   # Design components
|       |   |   |-- Header.jsx           # Top bar with title and badge
|       |   |   |-- Sidebar.jsx           # Side navigation
|       |   |   |-- Footer.jsx            # Footer
|       |   |
|       |   |-- monitor/                  # Monitor View (Main Dashboard)
|       |   |   |-- Monitor.jsx           # KPI cards, charts, Leaflet map
|       |   |
|       |   |-- simulator/               # Scenario Simulator View
|       |   |   |-- Simulator.jsx         # Sliders, results, history
|       |   |
|       |   |-- intelligence/             # Intelligence View (Analysis)
|       |   |   |-- Intelligence.jsx     # 5 tabs: Overview, IoT, Forecast, Alerts, History
|       |   |
|       |   |-- settings/                # Settings View (Profiles)
|       |   |   |-- Settings.jsx         # Profile CRUD
|       |   |
|       |   |-- info/                    # Project Info View
|       |       |-- Info.jsx             # Description, methodology, credits
|       |
|       |-- context/                     # React global contexts
|       |   |-- ProfileContext.jsx       # Active profiles management
|       |   |-- SettingsContext.jsx      # App configuration
|       |
|       |-- services/                    # API communication logic
|           |-- (REST API services)
|
|-- iot/                                  # IoT Hardware Code
|   |-- mainESP32.py                     # MicroPython firmware for ESP32
|   |
|   |-- (hardware: ESP32 + sensors)
|       |-- Rain sensor (analogic)
|       |-- Water level sensor (analogic)
|       |-- Soil humidity (capacitive)
|       |-- DHT22 (temperature + humidity)
|
|-- .gitignore                           # Project-wide ignored files
```

---

## 4. Layer Summary

### 4.1 Backend (FastAPI)

| File | Function |
|------|---------|
| `main.py` | API server, 12+ endpoints, orchestrator |
| `core/alert_engine.py` | Email alerts (Resend API) + in-app |
| `core/database.py` | SQLite + SQLAlchemy for IoT |
| `core/geo_connector.py` | Open-Meteo, NASA POWER, OpenTopoData |
| `core/iot_manager.py` | IoT readings management |
| `core/rhvi_calculator.py` | RHVI calculation = Hx0.5 + Ex0.3 + Vx0.2 |
| `engines/flood_engine.py` | XGBoost prediction |
| `notebooks/03_model_training.py` | ML training |

### 4.2 Frontend (React + Vite)

| Component | File | Description |
|-----------|------|-------------|
| **Monitor** | `components/monitor/Monitor.jsx` | Main dashboard: KPIs, charts, Leaflet map |
| **Simulator** | `components/simulator/Simulator.jsx` | Scenario simulation with sliders |
| **Intelligence** | `components/intelligence/Intelligence.jsx` | Analysis in 5 tabs (IoT feed, forecast, etc.) |
| **Settings** | `components/settings/Settings.jsx` | Profile management |
| **Info** | `components/info/Info.jsx` | Project information |
| **Layout** | `components/layout/*` | Header, Sidebar, Footer |
| **Contexts** | `context/ProfileContext.jsx` | Global profile state |

### 4.3 IoT (ESP32 + MicroPython)

The IoT node is based on an ESP32 microcontroller with MicroPython firmware. Connected sensors measure precipitation, water level, soil humidity, temperature and ambient humidity. The device sends data to the backend every 30 seconds via WiFi.

| Hardware Component | Purpose |
|--------------------|----------|
| ESP32 | Main processing + WiFi |
| Rain sensor | Precipitation intensity |
| Water level sensor | River/water level |
| Soil humidity sensor | Soil saturation |
| DHT22 | Temperature and ambient humidity |
| Built-in LED (GPIO 2) | Status indicator |

---

## 5. Complete Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.x, SQLAlchemy, SQLite |
| **ML** | XGBoost, Scikit-learn, Pandas, NumPy |
| **External APIs** | Open-Meteo, NASA POWER, OpenTopoData, WorldPop |
| **Alerts** | Resend (email), Toast in-app |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Maps** | Leaflet (OpenStreetMap) |
| **Charts** | Recharts |
| **IoT** | ESP32, MicroPython, analog/digital sensors |
| **Deployment** | Railway (backend), Vercel/Netlify (frontend) |

---

## 6. Project Metrics

| Metric | Value |
|--------|-------|
| AUC-ROC Model | **0.9860** |
| Training records | **139,792** |
| Trained regions | **16** (6 continents) |
| Integrated external APIs | **4** |
| Development days | **10** |
| API endpoints | **12+** |

---

## 7. Default Profiles

| Profile | Coordinates | Badge | Meaning |
|---------|-------------|-------|----------|
| Bolivia - La Paz | -16.5, -68.15 | Bolivia Pilot | Active IoT (physical ESP32) |
| Houston, TX | 29.76, -95.36 | Global Live | Hurricane Harvey, low elevation |
| Beira, Mozambique | -19.84, 34.84 | Critical Zone | Most affected globally (Cyclone Idai) |

---

## 8. Data Flows

```
+--------------+     +--------------+     +--------------+
|   ESP32      |---->|   Backend    |---->|   Frontend   |
|  (Sensors)   | POST|  (FastAPI)   | JSON|  (React)     |
|  every 30s   |     |  SQLite      | GET |  Dashboard   |
+--------------+     +--------------+     +--------------+
                            |
                     +------+------+
                     | XGBoost ML  |
                     | RHVI Calc   |
                     | Alert Engine|
                     +-------------+
```

---

## 9. Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | GET | Main prediction (RHVI, flood score) |
| `/simulate` | GET | Scenario simulation |
| `/iot/readings` | POST | IoT reception (ESP32) |
| `/iot/readings` | GET | IoT readings for dashboard |
| `/rhvi` | GET | Standalone RHVI calculation |
| `/geo/weather` | GET | Current weather (Open-Meteo) |
| `/geo/elevation` | GET | Elevation (OpenTopoData) |
| `/geo/all` | GET | Combined data |
| `/health` | GET | Health check |

---

## 10. Data Files (Climate CSVs)

The following files contain historical climate data by region:

- `africa_mozambique_climate.csv` - Mozambique
- `asia_manila_climate.csv` - Philippines
- `bangladesh_climate.csv` - Bangladesh
- `bolivia_climate.csv` - Bolivia
- `brasil_manaus_climate.csv` - Brazil (Amazon)
- `brasil_saopaulo_climate.csv` - Brazil (Sao Paulo)
- `colombia_bogota_climate.csv` - Colombia (Andes)
- `colombia_caribe_climate.csv` - Colombia (Caribbean)
- `europa_rotterdam_climate.csv` - Netherlands
- `germany_climate.csv` - Germany
- `oceania_queensland_climate.csv` - Australia
- `peru_amazonia_climate.csv` - Peru (Amazon)
- `peru_lima_climate.csv` - Peru (Lima)
- `texas_houston_climate.csv` - USA (Texas)
- `usa_miami_climate.csv` - USA (Florida)
- `usa_new_orleans_climate.csv` - USA (Louisiana)

---

## 11. Dependencies

### Backend (`requirements.txt`)

```
fastapi
uvicorn
sqlalchemy
pandas
numpy
xgboost
scikit-learn
httpx
python-dotenv
resend
```

### Frontend (`package.json`)

```
react
react-dom
react-router-dom
leaflet
react-leaflet
recharts
axios
```
## 12. Long term — The GeoSentinel Roadmap

GeoSentinel is designed as an expandable multi-hazard intelligence platform. Each phase adds a new risk engine while sharing the same RHVI framework, data pipeline, and alert infrastructure:

| Phase | Status | Engine | Data Sources |
|-------|--------|--------|-------------|
| 1 |  Current | FloodRiskEngine + RHVI + IoT | Open-Meteo, NASA, WorldPop, ESP32 |
| 2 |  Next | LandslideEngine + DroughtEngine | Soil moisture, slope gradient, NDVI |
| 3 |  Future | WildfireEngine | NASA FIRMS real-time fire data |
| 4 |  Future | EpidemicEngine | WHO data + SIR/SEIR models |
| 5 |  Vision | Technological & social threats | Multi-source risk fusion |

The unified risk score across all engines follows the same formula structure:

$$GeoSentinel_{global} = \sum_{k=1}^{n} w_k \cdot Engine_k(H, E, V)$$

Where each engine contributes a weighted hazard component to a **global vulnerability score** for any point on Earth.

The vision: a single platform that tells any community, anywhere, what threats are approaching — floods, droughts, fires, disease outbreaks — and what to do about it.

---

Because the next Cyclone Idai is already forming somewhere.

And this time, the people in its path will know it's coming.

---

*Document generated for Frostbyte Hackathon 2026*
*GeoSentinel - Turning Earth Data into Life-Protecting Action*
