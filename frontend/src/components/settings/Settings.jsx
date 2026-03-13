// Settings page with profile and system configuration
import { Save, MapPin, Bell, Cpu, Globe, Plus, Trash2, Loader2, Circle } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'
import { useSettings } from '../../context/SettingsContext'

export default function Settings() {
  const [alertThreshold, setAlertThreshold] = useState(0.45)
  const [emailAlert, setEmailAlert] = useState(true)
  const [interval, setIoTInterval] = useState(30)
  const [mapRadius, setMapRadius] = useState(12000)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { profiles, activeProfile, setActiveProfile, updateProfile, addProfile, deleteProfile } = useProfile()
  const { alertThreshold: ctxAlertThreshold, emailAlertsEnabled, iotInterval, mapCircleRadius, saveSettings: saveSettingsContext } = useSettings()

  const [editingId, setEditingId] = useState(null)
  const [newProfile, setNewProfile] = useState({ name: '', location: '', lat: '', lon: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    setMapRadius(mapCircleRadius)
    setAlertThreshold(ctxAlertThreshold)
    setEmailAlert(emailAlertsEnabled)
    setIoTInterval(iotInterval)
  }, [mapCircleRadius, ctxAlertThreshold, emailAlertsEnabled, iotInterval])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        setAlertThreshold(data.alert_threshold)
        setEmailAlert(data.email_alerts_enabled)
        setIoTInterval(data.iot_interval_seconds)
        setMapRadius(data.map_circle_radius || 12000)
      } catch (e) {
        console.error('Error loading settings:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: alertThreshold,
          email_enabled: emailAlert,
          iot_interval: interval,
          map_circle_radius: mapRadius
        })
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      console.error('Error saving settings:', e)
    } finally {
      setSaving(false)
    }
  }

  const sliderStyle = (val, min, max) => ({
    background: `linear-gradient(to right, #006D6D 0%, #D4AF37 ${(val - min) / (max - min) * 100}%, #e5e7eb ${(val - min) / (max - min) * 100}%, #e5e7eb 100%)`
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#006D6D]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      <div>
        <h1 className="text-3xl font-black text-[#006D6D]">Settings</h1>
        <p className="text-base text-gray-400 mt-1">System configuration and alert preferences</p>
      </div>

      {/* ROW 1 — Zone Profiles (full width) */}
      <div className="bg-[#006D6D] rounded-2xl shadow-sm border border-[#006D6D] p-6 text-white">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[#D4AF37]" />
            <span className="font-bold text-lg text-white">Zone Profiles</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#B8962E] transition-colors"
          >
            <Plus size={14} /> Add Profile
          </button>
        </div>

        {/* Profiles grid — full width, 2 cols */}
        <div className="grid grid-cols-2 gap-4">
          {profiles.map(p => (
            <div key={p.id} className={`p-4 rounded-xl border transition-all ${activeProfile.id === p.id ? 'border-[#D4AF37] bg-white/10' : 'border-white/20 bg-white/5'}`}>
              {editingId === p.id ? (
                <div className="flex flex-col gap-2">
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Profile name" defaultValue={p.name} id={`name-${p.id}`} />
                  <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Location description" defaultValue={p.location} id={`loc-${p.id}`} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Latitude" defaultValue={p.lat} id={`lat-${p.id}`} />
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Longitude" defaultValue={p.lon} id={`lon-${p.id}`} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateProfile(p.id, {
                          name: document.getElementById(`name-${p.id}`).value,
                          location: document.getElementById(`loc-${p.id}`).value,
                          lat: parseFloat(document.getElementById(`lat-${p.id}`).value),
                          lon: parseFloat(document.getElementById(`lon-${p.id}`).value),
                        })
                        setEditingId(null)
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#D4AF37] text-white text-sm font-semibold"
                    >Save</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{p.name}</span>
                    </div>
                    <div className="text-sm text-white/70 mt-1">{p.location}</div>
                    <div className="text-xs font-mono text-white/50 mt-1">{p.lat}, {p.lon}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(p.id)} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10">Edit</button>
                    <button onClick={() => deleteProfile(p.id)} className="px-3 py-2 rounded-lg border border-red-300/50 text-red-200 hover:bg-red-500/20">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="mt-4 p-4 rounded-xl border border-dashed border-[#D4AF37]/30 bg-white/10 flex flex-col gap-2">
            <div className="text-sm font-bold text-[#D4AF37] mb-1">New Profile</div>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Profile name (e.g. Manila)" value={newProfile.name} onChange={e => setNewProfile(p => ({ ...p, name: e.target.value }))} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Location description" value={newProfile.location} onChange={e => setNewProfile(p => ({ ...p, location: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Latitude" value={newProfile.lat} onChange={e => setNewProfile(p => ({ ...p, lat: e.target.value }))} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Longitude" value={newProfile.lon} onChange={e => setNewProfile(p => ({ ...p, lon: e.target.value }))} />
            </div>
            <button
              onClick={() => {
                if (!newProfile.name || !newProfile.lat || !newProfile.lon) return
                addProfile({ ...newProfile, lat: parseFloat(newProfile.lat), lon: parseFloat(newProfile.lon) })
                setNewProfile({ name: '', location: '', lat: '', lon: '' })
                setShowAddForm(false)
              }}
              className="py-2 rounded-lg bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#B8962E]"
            >Add Profile</button>
          </div>
        )}
      </div>

      {/* ROW 2 — dos columnas */}
      <div className="grid grid-cols-2 gap-4">

        {/* Alert Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-[#006D6D]" />
            <span className="font-bold text-lg text-[#006D6D]">Alert Configuration</span>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-400 tracking-widest">ALERT THRESHOLD (RHVI)</label>
                <span className="text-base font-bold text-[#006D6D]">{alertThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={alertThreshold}
                onChange={e => setAlertThreshold(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={sliderStyle(alertThreshold, 0, 1)}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.0 — Always alert</span>
                <span>0.45 — Recommended</span>
                <span>1.0 — Never</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-base font-semibold text-[#006D6D]">Email Alerts via Resend</div>
                <div className="text-sm text-gray-400 mt-0.5">Send email when threshold is exceeded</div>
              </div>
              <button
                onClick={() => setEmailAlert(!emailAlert)}
                className={`w-12 h-6 rounded-full transition-colors relative ${emailAlert ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${emailAlert ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* IoT Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Cpu size={18} className="text-[#006D6D]" />
            <span className="font-bold text-lg text-[#006D6D]">IoT Node Configuration</span>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-gray-400 tracking-widest">READING INTERVAL</label>
              <span className="text-base font-bold text-[#006D6D]">{interval}s</span>
            </div>
            <input
              type="range" min={10} max={120} step={10}
              value={interval}
              onChange={e => setIoTInterval(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={sliderStyle(interval, 10, 120)}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10s</span><span>30s — Default</span><span>120s</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[#006D6D]/5 rounded-xl border border-[#006D6D]/10">
            <div className="text-sm font-semibold text-[#006D6D]">ESP32-LORA-E01 — Node Active</div>
            <div className="text-sm text-gray-400 mt-0.5">ESP32 will fetch this interval from backend on startup</div>
          </div>
        </div>

      </div>

      {/* ROW 3 — dos columnas */}
      <div className="grid grid-cols-2 gap-4">

        {/* Map Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Circle size={18} className="text-[#006D6D]" />
            <span className="font-bold text-lg text-[#006D6D]">Map Configuration</span>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-gray-400 tracking-widest">ALERT RADIUS</label>
              <span className="text-base font-bold text-[#006D6D]">{mapRadius > 1000 ? `${(mapRadius / 1000).toFixed(1)}km` : `${mapRadius}m`}</span>
            </div>
            <input
              type="range" min={5000} max={50000} step={1000}
              value={mapRadius}
              onChange={e => setMapRadius(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={sliderStyle(mapRadius, 5000, 50000)}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5km</span><span>12km — Default</span><span>50km</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[#006D6D]/5 rounded-xl border border-[#006D6D]/10">
            <div className="text-sm font-semibold text-[#006D6D]">Visual Alert Radius</div>
            <div className="text-sm text-gray-400 mt-0.5">Circle displayed on map when viewing risk levels</div>
          </div>
        </div>

        {/* Model Info */}
        <div className="bg-[#006D6D] rounded-2xl shadow-sm border border-[#006D6D] p-6 text-white">
          <div className="flex items-center gap-2 mb-5">
            <Globe size={18} className="text-[#D4AF37]" />
            <span className="font-bold text-lg text-white">Model Information</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-base">
            {[
              ['Algorithm',        'XGBoost Classifier'],
              ['AUC Score',        '0.9860'],
              ['Training Regions', '16 worldwide'],
              ['Training Records', '139,792 days'],
              ['Target Definition','precip_7d lagged 3d > p93'],
              ['Features',         '18 engineered'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-xs text-white/50 tracking-widest font-semibold">{k.toUpperCase()}</span>
                <span className="font-semibold text-[#D4AF37]">{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Save button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-colors ${
          saved ? 'bg-green-600 text-white' : 'bg-[#006D6D] text-white hover:bg-[#004D59]'
        } ${saving ? 'opacity-60' : ''}`}
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saved ? 'SAVED ✓' : 'SAVE SETTINGS'}
      </button>

    </div>
  )
}