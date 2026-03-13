"""
GeoSentinel ESP32 IoT Node Firmware
Connects to WiFi and sends sensor readings to backend API.
"""
import network
import urequests
import ujson
import time
import math

# ============================================================
# CONFIGURATION - edit these values
# ============================================================
WIFI_SSID     = "HUAWEI-YkBD"
WIFI_PASSWORD = "79MK6dcA"
BACKEND_URL   = "http://192.168.100.8:8000"

SEND_INTERVAL = 30  # Default, overwritten by backend value

# ============================================================
# WIFI CONNECTION
# ============================================================
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print(f"Connecting to {WIFI_SSID}...")
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            time.sleep(1)
            timeout -= 1
            print(".")
    if wlan.isconnected():
        print(f"WiFi connected - IP: {wlan.ifconfig()[0]}")
        return True
    print("Failed to connect to WiFi")
    return False

# ============================================================
# GET BACKEND CONFIGURATION
# ============================================================
def fetch_config():
    global SEND_INTERVAL
    try:
        url = f"{BACKEND_URL}/iot/config"
        res = urequests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            SEND_INTERVAL = data.get("interval_seconds", 30)
            print(f"Config received - Interval: {SEND_INTERVAL}s")
        res.close()
    except Exception as e:
        print(f"Error getting config: {e}")
        print(f"Using default interval: {SEND_INTERVAL}s")

# ============================================================
# SENSOR SIMULATION
# Generates realistic data that varies over time
# ============================================================
cycle_count = 0

def simulate_sensors():
    global cycle_count
    cycle_count += 1

    # Simulate natural variation with sine so data
    # rises and falls realistically on the graph
    t = cycle_count * 0.3

    precipitation = round(max(0, 2.5 + 2.0 * math.sin(t) + 0.5 * math.sin(t * 3)), 2)
    river_level   = round(max(0, 2.8 + 0.8 * math.sin(t * 0.7) + 0.3 * math.cos(t)), 3)
    soil_humidity = round(max(0, min(100, 45 + 12 * math.sin(t * 0.5) + 5 * math.cos(t * 2))), 1)
    temperature   = round(13 + 2 * math.sin(t * 0.2), 1)
    humidity      = round(max(0, min(100, 50 + 10 * math.sin(t * 0.4))), 1)

    return {
        "node_id":       "ESP32-NODE-01",
        "precipitation": precipitation,
        "river_level":   river_level,
        "soil_humidity": soil_humidity,
        "temperature":   temperature,
        "humidity":      humidity,
        "lat":           -16.5,
        "lon":           -68.15,
    }

# ============================================================
# SEND TO BACKEND
# ============================================================
def send_data(data):
    try:
        payload = ujson.dumps(data)
        headers = {"Content-Type": "application/json"}
        res = urequests.post(f"{BACKEND_URL}/iot/readings", data=payload, headers=headers)
        if res.status_code == 200:
            print(f"Data sent successfully")
        else:
            print(f"Backend responded: {res.status_code}")
        res.close()
        return True
    except Exception as e:
        print(f"Error sending data: {e}")
        return False

# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 40)
    print("  GeoSentinel ESP32 Node v1.0")
    print("  Mode: SIMULATION")
    print("=" * 40)

    if not connect_wifi():
        print("No WiFi - restarting in 30s")
        time.sleep(30)
        main()
        return

    # Get configuration from backend
    print("Fetching configuration from backend...")
    fetch_config()

    print(f"Starting data transmission every {SEND_INTERVAL}s")

    while True:
        data = simulate_sensors()
        print(f"\n[Cycle {cycle_count}]")
        print(f"  Precip: {data['precipitation']} mm")
        print(f"  River:  {data['river_level']} m")
        print(f"  Soil:   {data['soil_humidity']} %")
        print(f"  Temp:   {data['temperature']} C")
        send_data(data)
        print(f"  Waiting {SEND_INTERVAL}s...")
        time.sleep(SEND_INTERVAL)

main()
