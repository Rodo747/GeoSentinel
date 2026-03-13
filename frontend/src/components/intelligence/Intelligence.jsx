// Intelligence page with historical analysis and IoT feed
import { TrendingUp, Shield, Activity, Droplets, Thermometer, Wind, Radio, Database } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useProfile } from '../../context/ProfileContext'
import { useState, useEffect } from 'react'

const RISK_COLOR = {
  GREEN:  { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Low Risk' },
  YELLOW: { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'Moderate' },
  ORANGE: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'High Risk' },
  RED:    { text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Critical' },
}

const levelStyle = {
  HIGH:     'bg-red-50 text-red-700 border-red-200',
  MODERATE: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW:      'bg-green-50 text-green-700 border-green-200',
}

export default function Intelligence() {
  const [readings, setReadings]     = useState([])
  const [prediction, setPrediction] = useState(null)
  const [activeTab, setActiveTab]   = useState('overview')
  const { profiles, activeProfile, setActiveProfile } = useProfile()

  const isBolivia = activeProfile.id === 'bolivia'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [fetch(`/api/predict?lat=${activeProfile.lat}&lon=${activeProfile.lon}`)]
        if (isBolivia) requests.push(fetch('/api/iot/readings?limit=50'))
        const results = await Promise.all(requests)
        const predData = await results[0].json()
        setPrediction(predData)
        if (isBolivia && results[1]) {
          const iotData = await results[1].json()
          setReadings(iotData.readings || [])
        } else {
          setReadings([])
        }
      } catch (e) { console.error(e) }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [activeProfile.id])

  const chartData = [...readings].reverse().map((r, i) => ({
    index: i + 1,
    precipitation: r.precipitation,
    river: r.river_level,
    humidity: r.soil_humidity,
  }))

  const floodScore  = prediction?.prediction?.flood_score || 0
  const rhvi        = prediction?.rhvi?.rhvi_score || 0
  const confidence  = prediction?.prediction?.confidence || 0
  const riskLevel   = prediction?.prediction?.risk_level || 'GREEN'
  const riskColor   = RISK_COLOR[riskLevel] || RISK_COLOR.GREEN
  const temp        = prediction?.weather?.temperature || 0
  const precip      = prediction?.weather?.precipitation_now || 0
  const windspeed   = prediction?.weather?.windspeed || 0
  const humidity    = prediction?.weather?.humidity || 0
  const avgPrecip   = prediction?.historical?.avg_daily_precipitation || 0
  const elevation   = prediction?.prediction?.elevation_meters || 0
  const forecast    = prediction?.weather?.forecast_7days || []

  const alerts = readings.slice(0, 10).map((r) => ({
    timestamp: r.timestamp,
    zone: activeProfile.location,
    level: r.precipitation > 5 ? 'HIGH' : r.precipitation > 2 ? 'MODERATE' : 'LOW',
    precip: r.precipitation,
    river: r.river_level,
    humidity: r.soil_humidity,
    email: r.precipitation > 5,
  }))

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'iot',        label: `IoT Feed${!isBolivia ? ' (Bolivia only)' : ''}` },
    { key: 'forecast',   label: '7-Day Forecast' },
    { key: 'history',    label: 'Alert History' },
    { key: 'historical', label: 'Historical Data' },
  ]

  const NoIoT = ({ name }) => (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Radio size={36} className="text-gray-200" />
      <div className="font-bold text-gray-400">No IoT node deployed in {name}</div>
      <div className="text-sm text-gray-300">Physical sensor nodes are currently active in Bolivia only</div>
      <div className="text-xs text-[#006D6D] font-semibold">Switch to Bolivia profile to see live IoT data</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#006D6D]">Intelligence</h1>
          <p className="text-sm text-gray-400 mt-0.5">Historical analysis, trends and predictive intelligence</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-gray-400">Active zone:</span>
            <span className="text-sm font-bold text-[#006D6D]">{activeProfile.location}</span>
          </div>
        </div>
        <div className="flex gap-2">
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
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'RISK LEVEL',    value: riskLevel,        sub: riskColor.label,           color: riskColor.text,    icon: Shield },
          { label: 'RHVI SCORE',    value: rhvi.toFixed(3),  sub: 'Vulnerability index',     color: 'text-[#006D6D]',  icon: TrendingUp },
          { label: 'TEMPERATURE',   value: `${temp}°C`,      sub: `Humidity ${humidity}%`,   color: 'text-[#C2652A]',  icon: Thermometer },
          { label: 'PRECIPITATION', value: `${precip} mm`,   sub: `Avg: ${avgPrecip} mm/day`,color: 'text-[#004D59]',  icon: Droplets },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 tracking-widest">{label}</span>
              <Icon size={16} className="text-gray-300" />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === t.key ? 'bg-[#006D6D] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="flex gap-4 flex-1">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="font-bold text-[#006D6D] mb-1">Risk Assessment — {activeProfile.name}</div>
            <div className="text-xs text-gray-400 mb-4">Based on current weather + historical data + RHVI</div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'RHVI Score',        value: rhvi,        color: { text: riskColor.text, bar: riskColor.text.replace('text-', 'bg-') } },
                { label: 'Elevation Factor',  value: prediction?.rhvi?.components?.elevation_factor || 0,         color: { text: 'text-[#004D59]', bar: 'bg-[#004D59]' } },
                { label: 'Population Density',value: prediction?.rhvi?.components?.population_density || 0,     color: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]' } },
                { label: 'Flood Score',       value: floodScore,  color: { text: 'text-red-700',  bar: 'bg-red-600' } },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <span className={`text-xs font-bold ${color.text}`}>{Math.round(value * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color.bar}`} style={{ width: `${value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Hazard H',   value: prediction?.rhvi?.components?.flood_score || 0,        color: 'text-red-700',   bg: 'bg-red-50' },
                { label: 'Exposure E', value: prediction?.rhvi?.components?.elevation_factor || 0,   color: 'text-[#C2652A]', bg: 'bg-orange-50' },
                { label: 'Vuln. V',    value: prediction?.rhvi?.components?.population_density || 0, color: 'text-[#006D6D]', bg: 'bg-[#f0f7f7]' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <div className={`text-xl font-black ${color}`}>{Math.round(value * 100)}%</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-80 flex flex-col gap-4 shrink-0">
            <div className="bg-[#D4AF37] rounded-2xl shadow-sm border border-[#D4AF37] p-5">
              <div className="text-xs font-semibold text-white/80 tracking-widest mb-3">CURRENT STATUS</div>
              <div className={`text-3xl font-black ${riskColor.text} mb-1`}>{riskLevel}</div>
              <div className="text-sm text-white/90">{prediction?.prediction?.recommended_action || 'Standard monitoring'}</div>
              <div className="mt-3 text-xs text-white/80">
                Peak risk window: <strong className="text-[#006D6D]">
                  {floodScore > 0.5 ? 'Next 6h' : floodScore > 0.25 ? 'Next 24h' : 'Next 72h'}
                </strong>
              </div>
              <div className="mt-1 text-xs text-white/80">Elevation: <strong className="text-[#006D6D]">{elevation}m</strong></div>
              <div className="mt-1 text-xs text-white/80">Wind: <strong className="text-[#006D6D]">{windspeed} km/h</strong></div>
            </div>
            <div className="bg-[#006D6D] rounded-2xl shadow-sm border border-[#006D6D] p-5 flex-1">
              <div className="text-xs font-semibold text-white/80 tracking-widest mb-3">MODEL INFO</div>
              {[
                ['Algorithm', 'XGBoost'],
                ['AUC Score', '0.9860'],
                ['Regions', '16 worldwide'],
                ['Confidence', `${(confidence * 100).toFixed(0)}%`],
                ['Data Source', isBolivia ? 'IoT + APIs' : 'Global APIs'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-xs text-white/70">{k}</span>
                  <span className="text-sm font-semibold text-[#D4AF37]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: IoT Feed */}
      {activeTab === 'iot' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {!isBolivia ? <NoIoT name={activeProfile.name} /> : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[#006D6D]">IoT Live Feed — La Paz, Bolivia</div>
                  <div className="text-xs text-gray-400 mt-0.5">ESP32 node — {readings.length} readings</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span className="text-xs text-[#D4AF37] font-semibold">LIVE</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gPrecip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006D6D" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#006D6D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRiver" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="precipitation" stroke="#006D6D" strokeWidth={2} fill="url(#gPrecip)" name="Precipitation mm" />
                  <Area type="monotone" dataKey="river" stroke="#D4AF37" strokeWidth={2} fill="url(#gRiver)" name="River Level m" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 tracking-widest border-b border-gray-100">
                      <th className="pb-2">TIMESTAMP</th><th className="pb-2">PRECIP mm</th>
                      <th className="pb-2">RIVER m</th><th className="pb-2">HUMIDITY %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 font-mono text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td className="py-1.5 font-semibold text-[#006D6D]">{r.precipitation}</td>
                        <td className="py-1.5 font-semibold text-[#006D6D]">{r.river_level}</td>
                        <td className="py-1.5 font-semibold text-[#006D6D]">{r.soil_humidity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: 7-Day Forecast */}
      {activeTab === 'forecast' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="font-bold text-[#006D6D] mb-1">7-Day Precipitation Forecast</div>
          <div className="text-xs text-gray-400 mb-4">{activeProfile.location} — Open-Meteo API</div>
          {forecast.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={forecast.map(([date, rain]) => ({
                  date: new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
                  rain: parseFloat(rain.toFixed(2))
                }))}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006D6D" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#006D6D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="rain" stroke="#006D6D" strokeWidth={2} fill="url(#forecastGrad)" name="Precipitation mm" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {forecast.map(([date, rain], i) => (
                  <div key={i} className={`rounded-xl p-3 text-center ${rain > 10 ? 'bg-[#f0f7f7] border border-[#006D6D]/20' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="text-[10px] text-gray-400 mb-1">{new Date(date).toLocaleDateString('en', { weekday: 'short' })}</div>
                    <div className={`text-sm font-black ${rain > 10 ? 'text-[#006D6D]' : 'text-gray-400'}`}>{rain.toFixed(0)}</div>
                    <div className="text-[9px] text-gray-400">mm</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Loading forecast data...</div>
          )}
        </div>
      )}

      {/* Tab: Alert History */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="font-bold text-[#006D6D] mb-1">Alert History</div>
          <div className="text-xs text-gray-400 mb-4">
            {isBolivia ? 'IoT sensor readings + API data — La Paz, Bolivia' : `API data only — ${activeProfile.location}`}
          </div>
          {!isBolivia ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Database size={36} className="text-gray-200" />
              <div className="font-bold text-gray-400">No IoT history for {activeProfile.name}</div>
              <div className="text-sm text-gray-300">Alert history is based on IoT readings — available for Bolivia only</div>
            </div>
          ) : alerts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 tracking-widest border-b border-gray-100">
                  <th className="pb-3 font-semibold">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">ZONE</th>
                  <th className="pb-3 font-semibold">LEVEL</th>
                  <th className="pb-3 font-semibold">PRECIP</th>
                  <th className="pb-3 font-semibold">RIVER</th>
                  <th className="pb-3 font-semibold">EMAIL</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-mono text-xs text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-xs font-medium text-[#006D6D]">{a.zone}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${levelStyle[a.level]}`}>{a.level}</span>
                    </td>
                    <td className="py-2.5 font-mono text-xs text-gray-600">{a.precip} mm</td>
                    <td className="py-2.5 font-mono text-xs text-gray-600">{a.river} m</td>
                    <td className="py-2.5">
                      {a.email
                        ? <span className="text-xs text-green-700 font-semibold">✓ Sent</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No alerts yet — start the IoT simulator</div>
          )}
        </div>
      )}

      {/* Tab: Historical Data */}
      {activeTab === 'historical' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="font-bold text-[#006D6D] mb-1">Historical Sensor Data</div>
          <div className="text-xs text-gray-400 mb-4">{activeProfile.location} — all recorded readings</div>
          {!isBolivia ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Radio size={36} className="text-gray-200" />
              <div className="font-bold text-gray-400">No IoT history for {activeProfile.name}</div>
              <div className="text-sm text-gray-300">Historical sensor data is available for Bolivia only</div>
            </div>
          ) : readings.length > 0 ? (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 tracking-widest border-b border-gray-100">
                    <th className="pb-3 font-semibold">TIMESTAMP</th>
                    <th className="pb-3 font-semibold">PRECIP mm</th>
                    <th className="pb-3 font-semibold">RIVER m</th>
                    <th className="pb-3 font-semibold">HUMIDITY %</th>
                    <th className="pb-3 font-semibold">LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => {
                    const level = r.precipitation > 5 ? 'HIGH' : r.precipitation > 2 ? 'MOD' : 'LOW'
                    const style = {
                      HIGH: 'bg-red-50 text-red-700 border-red-200',
                      MOD:  'bg-amber-50 text-amber-700 border-amber-200',
                      LOW:  'bg-green-50 text-green-700 border-green-200',
                    }[level]
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 font-mono text-gray-400">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="py-2 font-semibold text-[#006D6D]">{r.precipitation}</td>
                        <td className="py-2 font-semibold text-[#006D6D]">{r.river_level}</td>
                        <td className="py-2 font-semibold text-[#006D6D]">{r.soil_humidity}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${style}`}>{level}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet — start the IoT simulator</div>
          )}
        </div>
      )}

    </div>
  )
}
