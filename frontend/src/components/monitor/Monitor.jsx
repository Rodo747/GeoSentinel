// Main monitor dashboard with KPIs, maps and charts
import { Bell, TrendingUp, Thermometer, Droplets, Wind, Waves, Mountain, BarChart2, MapPin } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Line } from 'recharts'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useProfile } from '../../context/ProfileContext'
import { useSettings } from '../../context/SettingsContext'
import { useState, useEffect } from 'react'

const RISK_COLOR = {
  GREEN:  { text: 'text-green-700',  bar: 'bg-green-600',  label: 'Low Risk',      border: 'border-green-200',  bg: 'bg-green-50' },
  YELLOW: { text: 'text-yellow-500',  bar: 'bg-yellow-500',  label: 'Moderate Risk', border: 'border-yellow-200',  bg: 'bg-yellow-50' },
  ORANGE: { text: 'text-orange-600', bar: 'bg-orange-500', label: 'High Risk',     border: 'border-orange-200', bg: 'bg-orange-50' },
  RED:    { text: 'text-red-700',    bar: 'bg-red-600',    label: 'Critical Risk', border: 'border-red-200',    bg: 'bg-red-50' },
}
const CIRCLE_COLOR = { GREEN: '#22c55e', YELLOW: '#f59e0b', ORANGE: '#f97316', RED: '#ef4444' }

function MapRecenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lon], 10) }, [lat, lon])
  return null
}

function KPICard({ title, value, subtitle, icon: Icon, accent, alert, cardBg, subtitleColor }) {
  return (
    <div className={`${cardBg || 'bg-white'} rounded-2xl p-5 shadow-sm border ${alert ? 'border-red-200' : 'border-gray-100'} flex flex-col gap-1.5`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold tracking-widest ${cardBg ? 'text-white/70' : 'text-gray-400'}`}>{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className={`text-2xl font-black ${alert ? 'text-red-700' : cardBg ? 'text-white' : 'text-[#006D6D]'}`}>{value}</div>
      <div className={`text-xs ${subtitleColor || (cardBg ? 'text-white/70' : 'text-gray-400')}`}>{subtitle}</div>
    </div>
  )
}

function RiskBar({ label, value, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${color.text}`}>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color.bar}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  )
}

export default function Monitor() {
  const [prediction, setPrediction]   = useState(null)
  const [iotReadings, setIotReadings] = useState([])
  const [alertBubble, setAlertBubble] = useState(null)
  const { profiles, activeProfile, setActiveProfile } = useProfile()
  const { mapCircleRadius, alertThreshold } = useSettings()

  const lat = activeProfile.lat
  const lon = activeProfile.lon
  const isBolivia = activeProfile.id === 'bolivia'

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/predict?lat=${activeProfile.lat}&lon=${activeProfile.lon}&location_name=${encodeURIComponent(activeProfile.location)}`)
        const data = await res.json()
        setPrediction(data)
        const score = data?.rhvi?.rhvi_score || 0
        if (score >= alertThreshold) {
          setAlertBubble({
            level:    data.rhvi.risk_level,
            location: activeProfile.location,
            score:    score,
            action:   data.prediction?.recommended_action || '',
          })
          setTimeout(() => setAlertBubble(null), 8000)
        }
      } catch (e) { console.error(e) }
      if (isBolivia) {
        try {
          const res = await fetch('/api/iot/readings?limit=20')
          const data = await res.json()
          setIotReadings(data.readings || [])
        } catch (e) { console.error(e) }
      } else {
        setIotReadings([])
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [activeProfile.id, alertThreshold])

  const riskLevel   = prediction?.rhvi?.risk_level || 'GREEN'
  const riskColor   = RISK_COLOR[riskLevel] || RISK_COLOR.GREEN
  const circleColor = CIRCLE_COLOR[riskLevel] || CIRCLE_COLOR.GREEN
  const rhviScore   = prediction?.rhvi?.rhvi_score || 0
  const elevation   = prediction?.prediction?.elevation_meters || 0
  const precip      = prediction?.weather?.precipitation_now || 0
  const temp        = prediction?.weather?.temperature || 0
  const windspeed   = prediction?.weather?.windspeed || 0
  const humidity    = prediction?.weather?.humidity || 0
  const avgPrecip   = prediction?.historical?.avg_daily_precipitation || 0
  const forecast    = prediction?.weather?.forecast_7days || []
  const latestIoT   = iotReadings[0] || null

  const forecastChartData = forecast.map(([date, rain]) => {
    const riskScore = Math.min((rain / 20) * 0.6 + rhviScore * 0.4, 1)
    return {
      day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      rain: parseFloat(rain.toFixed(1)),
      risk: parseFloat((riskScore * 100).toFixed(0)),
    }
  })

  const maxRiskPoint = forecastChartData.length
    ? forecastChartData.reduce((max, curr) => (curr.risk > max.risk ? curr : max), forecastChartData[0])
    : null

  const maxRainPoint = forecastChartData.length
    ? forecastChartData.reduce((max, curr) => (curr.rain > max.rain ? curr : max), forecastChartData[0])
    : null

  const iotChartData = [...iotReadings].reverse().map((r, i) => ({
    index: i + 1,
    precipitation: parseFloat(r.precipitation),
    river: parseFloat(r.river_level),
    humidity: parseFloat(r.soil_humidity),
  }))

  const globalAlerts = [
    {
      level: rhviScore > 0.75 ? 'HIGH' : rhviScore > 0.5 ? 'MOD' : 'LOW',
      title: 'RHVI Assessment',
      desc: `Score ${rhviScore.toFixed(3)} — ${riskColor.label}`,
    },
    {
      level: precip > 10 ? 'HIGH' : precip > 3 ? 'MOD' : 'LOW',
      title: 'Precipitation',
      desc: `${precip}mm now | Avg: ${avgPrecip}mm/day`,
    },
    {
      level: elevation < 50 ? 'HIGH' : elevation < 200 ? 'MOD' : 'LOW',
      title: 'Elevation Risk',
      desc: `${elevation}m above sea level`,
    },
  ]

  const alertStyle = {
    HIGH: 'bg-red-50 text-red-700 border-red-200',
    MOD:  'bg-amber-50 text-amber-700 border-amber-200',
    LOW:  'bg-green-50 text-green-700 border-green-200',
    OK:   'bg-gray-50 text-gray-500 border-gray-200',
  }

  const zoneFields = [
    { icon: Thermometer, label: 'Temperature',   value: `${temp}°C` },
    { icon: Droplets,    label: 'Precipitation', value: `${precip}mm` },
    { icon: Wind,        label: 'Wind Speed',    value: `${windspeed}km/h` },
    { icon: Waves,       label: 'Humidity',      value: `${humidity}%` },
    { icon: Mountain,    label: 'Elevation',     value: `${elevation}m` },
    { icon: BarChart2,   label: 'Avg Precip/day',value: `${avgPrecip}mm` },
    { icon: MapPin,      label: 'Lat / Lon',     value: `${Math.abs(lat).toFixed(1)}° / ${Math.abs(lon).toFixed(1)}°` },
  ]

  return (
    <div className="flex flex-col gap-3 min-h-full">

      {/* Alert bubble */}
      {alertBubble && (
        <div className={`fixed bottom-20 right-6 z-50 max-w-sm shadow-2xl rounded-2xl border overflow-hidden transition-all duration-500 ${
          alertBubble.level === 'RED'    ? 'border-red-300 bg-red-50' :
          alertBubble.level === 'ORANGE' ? 'border-orange-300 bg-orange-50' :
          'border-amber-300 bg-amber-50'
        }`}>
          <div className={`px-4 py-2 flex items-center justify-between ${
            alertBubble.level === 'RED'    ? 'bg-red-600' :
            alertBubble.level === 'ORANGE' ? 'bg-orange-500' :
            'bg-amber-500'
          }`}>
            <span className="text-white text-xs font-black tracking-widest">⚠ RISK ALERT</span>
            <button onClick={() => setAlertBubble(null)} className="text-white text-xs font-bold opacity-70 hover:opacity-100">✕</button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-gray-800">{alertBubble.level} RISK</span>
              <span className="text-xs text-gray-500">— {alertBubble.location}</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">RHVI Score: <strong>{alertBubble.score.toFixed(3)}</strong></div>
            <div className="text-xs text-gray-700 bg-white rounded-lg p-2 border border-gray-200">{alertBubble.action}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#006D6D]">Monitor Dashboard</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-400">Active zone:</span>
            <span className="text-sm font-bold text-[#006D6D]">{activeProfile.location}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {profiles.map(p => (
            <button key={p.id} onClick={() => setActiveProfile(p)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                activeProfile.id === p.id
                  ? 'bg-[#006D6D] text-white border-[#006D6D] shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#006D6D] hover:text-[#006D6D]'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <KPICard title="RHVI INDEX"        value={rhviScore.toFixed(3)}  subtitle={`${riskLevel} — ${riskColor.label}`}             icon={TrendingUp}  accent="bg-[#D4AF37]"  alert={riskLevel === 'RED'} cardBg="bg-[#006D6D]" subtitleColor={riskColor.text} />
        <KPICard title="TEMPERATURE"       value={`${temp}°C`}          subtitle={`Humidity ${humidity}% | Wind ${windspeed}km/h`} icon={Thermometer} accent="bg-[#D4AF37]" cardBg="bg-[#006D6D]" />
        <KPICard title="PRECIPITATION NOW" value={`${precip}mm`}        subtitle={`Avg historical: ${avgPrecip}mm/day`}            icon={Droplets}    accent="bg-[#D4AF37]" cardBg="bg-[#006D6D]" />
        <KPICard title="ALERTS (24H)"
          value={globalAlerts.filter(a => a.level === 'HIGH').length || (riskLevel === 'RED' ? '⚠' : '0')}
          subtitle={`Elevation: ${elevation}m`} icon={Bell}
          accent={riskLevel === 'RED' ? 'bg-red-600' : 'bg-[#D4AF37]'} alert={riskLevel === 'RED'} cardBg="bg-[#006D6D]" />
      </div>

      {/* Row 2 */}
      <div className="flex gap-2 shrink-0">

        {/* 7-Day Risk Forecast */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-bold text-[#006D6D]">7-Day Risk Forecast</span>
              <span className="text-xs text-gray-400 ml-2">Precip + Estimated Risk</span>
            </div>
            <span className="text-xs text-gray-400">{activeProfile.name}</span>
          </div>
          {forecastChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                  <YAxis yAxisId="rain" tick={{ fontSize: 9 }} width={22} />
                  <YAxis yAxisId="risk" orientation="right" tick={{ fontSize: 9 }} width={22} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v, n) => (n === 'rain' ? [`${v}mm`, 'Precipitation'] : [`${v}%`, 'Est. Risk'])}
                  />
                  <Bar yAxisId="rain" dataKey="rain" fill="#004D59" fillOpacity={0.15} radius={[3, 3, 0, 0]} name="rain" />
                  <Line yAxisId="risk" type="monotone" dataKey="risk" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', r: 3 }} name="risk" />
                </ComposedChart>
              </ResponsiveContainer>
              {maxRiskPoint && maxRainPoint && (
                <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                  <span>Max risk: <strong className="text-[#006D6D]">{maxRiskPoint.risk}%</strong> — <span className="font-semibold">{maxRiskPoint.day}</span></span>
                  <span>Max rain: <strong className="text-[#004D59]">{maxRainPoint.rain}mm</strong> — <span className="font-semibold">{maxRainPoint.day}</span></span>
                </div>
              )}
            </>
          ) : (
            <div className="h-28 flex items-center justify-center text-gray-300 text-xs">Loading forecast...</div>
          )}
        </div>

        {/* ESP32 Live Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#006D6D]">ESP32 Live Feed</span>
              {isBolivia && latestIoT && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span className="text-[10px] text-[#D4AF37] font-semibold">LIVE</span>
                </div>
              )}
            </div>
          </div>
          {!isBolivia ? (
            <div className="h-28 flex flex-col items-center justify-center gap-1">
              <Bell size={22} className="text-gray-300" />
              <span className="text-xs text-gray-400">No IoT node in {activeProfile.name}</span>
              <span className="text-[10px] text-[#004D59] font-semibold">ESP32 active in Bolivia only</span>
            </div>
          ) : iotChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={iotChartData}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006D6D" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#006D6D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="index" hide />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="precipitation" stroke="#006D6D" strokeWidth={1.7} fill="url(#pGrad)" name="Precip mm" />
                  <Area type="monotone" dataKey="river" stroke="#D4AF37" strokeWidth={1.7} fill="url(#rGrad)" name="River m" />
                </AreaChart>
              </ResponsiveContainer>
              {latestIoT && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: 'Precipitation', value: `${latestIoT.precipitation ?? '-'}mm` },
                      { label: 'River Level',   value: `${latestIoT.river_level ?? '-'}m` },
                      { label: 'Soil Humidity', value: `${latestIoT.soil_humidity ?? '-'}%` },
                      { label: 'Temperature',   value: `${latestIoT.temperature ?? '-'}°C` },
                      { label: 'Humidity',      value: `${latestIoT.humidity ?? '-'}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                        <span className="text-sm font-bold text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-28 flex items-center justify-center text-gray-300 text-xs">Start IoT simulator</div>
          )}
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col w-60 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={13} className="text-[#006D6D]" />
            <span className="text-xs font-semibold text-gray-400 tracking-widest">ACTIVE ALERTS</span>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {globalAlerts.map((a, i) => (
              <div key={i} className={`flex flex-col gap-0.5 p-2.5 rounded-xl border flex-1 ${alertStyle[a.level]}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black">{a.level}</span>
                  <span className="text-sm font-bold">{a.title}</span>
                </div>
                <span className="text-xs opacity-70">{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="flex gap-2 flex-1 min-h-0">

        {/* Map */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ width: '38%' }}>
          <MapContainer center={[lat, lon]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter lat={lat} lon={lon} />
            <Circle center={[lat, lon]} radius={mapCircleRadius}
              pathOptions={{ color: circleColor, fillColor: circleColor, fillOpacity: 0.2, weight: 2 }}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-[#006D6D] mb-1">{activeProfile.location}</div>
                  <div>Risk: <strong>{riskLevel}</strong></div>
                  <div>RHVI: <strong>{rhviScore.toFixed(3)}</strong></div>
                  <div>Temp: <strong>{temp}°C</strong></div>
                  <div>Precip: <strong>{precip}mm</strong></div>
                </div>
              </Popup>
            </Circle>
          </MapContainer>
        </div>

        {/* Zone Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4" style={{ width: '22%' }}>
          <div className="text-xs font-semibold text-gray-400 tracking-widest mb-2">ZONE DATA</div>
          <div className="flex flex-col gap-3">
            {zoneFields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className="text-[#004D59]" />
                  <span className="text-sm text-gray-400">{label}</span>
                </div>
                <span className="text-sm font-bold text-[#006D6D]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Analytics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={14} className="text-[#006D6D]" />
            <span className="font-bold text-[#006D6D] text-sm">Live Analytics — {activeProfile.name}</span>
          </div>
          <div className="flex flex-col gap-3 mb-3">
            <RiskBar label="RHVI Score"         value={rhviScore}                                                         color={riskColor} />
            <RiskBar label="Elevation Factor"   value={prediction?.rhvi?.components?.elevation_factor || 0}              color={{ text: 'text-[#004D59]',  bar: 'bg-[#004D59]' }} />
            <RiskBar label="Population Density" value={prediction?.rhvi?.components?.population_density || 0}            color={{ text: 'text-[#D4AF37]',  bar: 'bg-[#D4AF37]' }} />
          </div>
          <div className="border-t border-gray-100 pt-3 mt-auto">
            <div className="text-[11px] font-semibold text-gray-400 tracking-widest mb-2">IPCC H×E×V</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Hazard',   value: prediction?.rhvi?.components?.flood_score || 0,        color: 'text-red-700',    bg: 'bg-red-50' },
                { label: 'Exposure', value: prediction?.rhvi?.components?.elevation_factor || 0,   color: 'text-[#C2652A]',  bg: 'bg-orange-50' },
                { label: 'Vuln.',    value: prediction?.rhvi?.components?.population_density || 0, color: 'text-[#006D6D]',  bg: 'bg-[#f0f7f7]' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-2 text-center`}>
                  <div className={`text-base font-black ${color}`}>{Math.round(value * 100)}%</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
