import os
import json
import resend
import threading
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")

ALERT_EMAIL  = os.getenv("ALERT_EMAIL_TO", "rod74azo@gmail.com")
FROM_EMAIL   = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

RISK_EMOJI   = { "GREEN": "🟢", "YELLOW": "🟡", "ORANGE": "🟠", "RED": "🔴" }
RISK_COLOR   = { "GREEN": "#22c55e", "YELLOW": "#eab308", "ORANGE": "#f97316", "RED": "#ef4444" }
RISK_DESC    = {
    "GREEN":  "Current conditions are stable. Hydro-climatic parameters are within normal ranges. No immediate action required.",
    "YELLOW": "Moderate risk detected. Precipitation and vulnerability indicators are elevated above baseline. Monitoring should be intensified.",
    "ORANGE": "High risk conditions identified. Multiple risk factors converging — flood probability is significant. Authorities should prepare response protocols.",
    "RED":    "CRITICAL — Extreme flood risk. Immediate evacuation and emergency response protocols must be activated. All vulnerable populations at risk.",
}
RISK_ACTIONS = {
    "GREEN":  ["Continue standard monitoring protocols", "Verify IoT sensor connectivity", "Review emergency contact lists"],
    "YELLOW": ["Increase monitoring frequency to every 15 minutes", "Notify local emergency coordinators", "Review and prepare evacuation routes", "Check early warning system status"],
    "ORANGE": ["Activate emergency response team immediately", "Issue public flood warnings", "Pre-position rescue equipment", "Begin voluntary evacuation of flood-prone zones", "Alert hospitals and emergency services"],
    "RED":    ["MANDATORY EVACUATION of all flood-risk zones", "Deploy all emergency response units", "Activate national disaster protocols", "Coordinate with military and civil defense", "Establish emergency shelters immediately"],
}

# Frequency control - prevents spam
# Uses file for persistence and thread-safety (multi-worker production)
ALERTS_TIMESTAMP_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "alert_timestamps.json")
_alert_lock = threading.Lock()

def _load_alert_timestamps():
    """Load timestamps from file (thread-safe)."""
    if not os.path.exists(ALERTS_TIMESTAMP_FILE):
        return {}
    try:
        with open(ALERTS_TIMESTAMP_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def _save_alert_timestamps(timestamps):
    """Save timestamps to file (thread-safe)."""
    try:
        os.makedirs(os.path.dirname(ALERTS_TIMESTAMP_FILE), exist_ok=True)
        with open(ALERTS_TIMESTAMP_FILE, "w") as f:
            json.dump(timestamps, f)
    except Exception as e:
        print(f"[AlertEngine] Warning: could not save timestamps: {e}")

def should_send_alert(rhvi_score: float, location: str, threshold: float = None) -> bool:
    from core.database import get_setting

    # If threshold not specified, get from config
    if threshold is None:
        threshold_str = get_setting("alert_threshold")
        threshold = float(threshold_str) if threshold_str else 0.45

    if rhvi_score < threshold:
        return False

    # Check if email alerts are enabled
    email_enabled = get_setting("email_alerts_enabled")
    if email_enabled and email_enabled.lower() != "true":
        print(f"[AlertEngine] Email alerts disabled — skipping")
        return False

    with _alert_lock:
        now = datetime.now(timezone.utc).timestamp()
        timestamps = _load_alert_timestamps()
        last = timestamps.get(location, 0)
        if now - last < 600:  # 10 minutos
            print(f"[AlertEngine] Skipping — last alert for {location} was {int(now - last)}s ago")
            return False
        timestamps[location] = now
        _save_alert_timestamps(timestamps)
    return True

def send_alert_email(
    location: str,
    lat: float,
    lon: float,
    risk_level: str,
    rhvi_score: float,
    flood_score: float,
    recommended_action: str,
    temperature: float = 0,
    precipitation: float = 0,
    elevation: float = 0,
):
    if not resend.api_key:
        print(f"[AlertEngine] ⚠️ No RESEND_API_KEY configured — skipping email")
        return False

    emoji     = RISK_EMOJI.get(risk_level, "⚪")
    color     = RISK_COLOR.get(risk_level, "#6b7280")
    desc      = RISK_DESC.get(risk_level, "")
    actions   = RISK_ACTIONS.get(risk_level, [recommended_action])
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    coords    = f"{abs(lat):.4f}°{'S' if lat < 0 else 'N'}, {abs(lon):.4f}°{'W' if lon < 0 else 'E'}"

    actions_html = "".join([
        f'<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">'
        f'<div style="min-width:22px;height:22px;background:{color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900;">{i+1}</div>'
        f'<p style="margin:0;font-size:13px;color:#334155;line-height:1.4;">{action}</p>'
        f'</div>'
        for i, action in enumerate(actions)
    ])

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:24px;">
      <div style="max-width:580px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- Header -->
        <div style="background:#085161;padding:28px 32px;">
          <p style="color:white;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">⚡ GEOSENTINEL</p>
          <p style="color:#00c896;font-size:11px;margin:4px 0 0;letter-spacing:2px;font-weight:700;">HYDRO-CLIMATE RISK INTELLIGENCE SYSTEM</p>
        </div>

        <!-- Alert band -->
        <div style="background:{color}18;border-left:5px solid {color};padding:20px 32px;">
          <p style="color:{color};font-size:32px;font-weight:900;margin:0;">{emoji} {risk_level} RISK ALERT</p>
          <p style="color:#085161;font-size:18px;font-weight:800;margin:6px 0 2px;">📍 {location}</p>
          <p style="color:#64748b;font-size:12px;font-family:monospace;margin:0;">{coords}</p>
        </div>

        <div style="padding:24px 32px;">

          <!-- Descripción -->
          <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
            <p style="color:#085161;font-size:11px;font-weight:700;letter-spacing:1.5px;margin:0 0 8px;">SITUATION ANALYSIS</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">{desc}</p>
          </div>

          <!-- Métricas -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:1px;margin:0 0 6px;">RHVI INDEX</p>
              <p style="color:{color};font-size:28px;font-weight:900;margin:0;">{rhvi_score:.3f}</p>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Vulnerability score</p>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:1px;margin:0 0 6px;">FLOOD PROBABILITY</p>
              <p style="color:{color};font-size:28px;font-weight:900;margin:0;">{flood_score * 100:.1f}%</p>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">XGBoost model output</p>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:1px;margin:0 0 6px;">TEMPERATURE</p>
              <p style="color:#085161;font-size:28px;font-weight:900;margin:0;">{temperature}°C</p>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Current conditions</p>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:16px;">
              <p style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:1px;margin:0 0 6px;">PRECIPITATION</p>
              <p style="color:#085161;font-size:28px;font-weight:900;margin:0;">{precipitation}mm</p>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Current intensity</p>
            </div>
          </div>

          <!-- Acciones -->
          <div style="background:#085161;border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="color:#00c896;font-size:11px;font-weight:700;letter-spacing:1.5px;margin:0 0 14px;">RECOMMENDED ACTIONS</p>
            {actions_html}
          </div>

          <!-- Info adicional -->
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Elevation: <strong style="color:#085161;">{elevation}m</strong> above sea level &nbsp;•&nbsp;
            Generated: <strong style="color:#085161;">{timestamp}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">GeoSentinel — Turning Earth Data into Life-Protecting Action</p>
          <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">Frostbyte Hackathon 2026 • IPCC Risk Framework H×E×V</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        response = resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [ALERT_EMAIL],
            "subject": f"{emoji} GeoSentinel — {risk_level} Risk Alert in {location}",
            "html":    html,
        })
        print(f"[AlertEngine] ✅ Email sent to {ALERT_EMAIL} — {location} {risk_level}")
        return True
    except Exception as e:
        print(f"[AlertEngine] ❌ Error: {e}")
        return False