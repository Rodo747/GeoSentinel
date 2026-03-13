// Scenario simulator component with sliders
import { Sliders, RotateCcw, Zap, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'


const RISK_LEVELS = {
  GREEN:  { label: 'Low Risk',      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200', bar: 'bg-green-500' },
  YELLOW: { label: 'Moderate Risk', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  ORANGE: { label: 'High Risk',     color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
  RED:    { label: 'Critical Risk', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    bar: 'bg-red-500' },
}

function SliderInput({ label, value, onChange, min, max, unit, markers }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-[#006D6D]">{label}</span>
        <span className="text-xl font-black text-[#006D6D]">{value}<span className="text-sm font-medium text-gray-400 ml-1">{unit}</span></span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #006D6D 0%, #D4AF37 ${(value - min) / (max - min) * 100}%, #e5e7eb ${(value - min) / (max - min) * 100}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        {markers.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  )
}

function HistoryItem({ sim, index }) {
  const r = RISK_LEVELS[sim.risk_level] || RISK_LEVELS.GREEN
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${r.border} ${r.bg}`}>
      <div className="flex flex-col gap-0.5 shrink-0">
        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
        <span className="text-[11px] font-semibold text-[#006D6D]">{sim.profile || '—'}</span>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
        <span className="text-gray-500">Rain: <strong>{sim.rainfall}mm</strong></span>
        <span className="text-gray-500">River: <strong>{sim.river}m</strong></span>
        <span className="text-gray-500">Soil: <strong>{sim.soil}%</strong></span>
      </div>
      <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
      <span className="text-xs font-mono text-gray-400">{(sim.score ?? sim.flood_score ?? 0).toFixed(3)}</span>
    </div>
  )
}

export default function Simulator() {
  const [rainfall, setRainfall]   = useState(50)
  const [river, setRiver]         = useState(3)
  const [soil, setSoil]           = useState(40)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [history, setHistory]     = useState([])
  const { profiles, activeProfile, setActiveProfile } = useProfile()

  const LAT = activeProfile.lat
  const LON = activeProfile.lon

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/simulate?lat=${LAT}&lon=${LON}&rainfall=${rainfall}&river_level=${river}&soil_saturation=${soil}`)
      const data = await res.json()
      setResult(data)
      setHistory(prev => [{ rainfall, river, soil, profile: activeProfile.name, location: activeProfile.location, ...data }, ...prev].slice(0, 3))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRainfall(50)
    setRiver(3)
    setSoil(40)
    setResult(null)
  }

  const riskLevel = result?.risk_level || 'GREEN'
  const r = RISK_LEVELS[riskLevel]

  return (
    <div className="flex flex-col gap-4 min-h-full">

      {/* Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#006D6D]">Impact Simulator</h1>
          <p className="text-sm text-gray-400 mt-0.5">Simulate extreme weather scenarios and see real-time impact on population and infrastructure</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-gray-400">Active zone:</span>
            <span className="text-sm font-bold text-[#006D6D]">{activeProfile.location}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                activeProfile.id === p.id
                  ? 'bg-[#006D6D] text-white border-[#006D6D] shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#006D6D] hover:text-[#006D6D]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Control panel */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#006D6D]" />
              <span className="font-bold text-[#006D6D]">Scenario Controls</span>
            </div>

            <SliderInput
              label="Rainfall Intensity"
              value={rainfall}
              onChange={setRainfall}
              min={0} max={300} unit="mm"
              markers={['0', 'Moderate 50', 'Heavy 100', 'Extreme 200', '300']}
            />

            <SliderInput
              label="River Level"
              value={river}
              onChange={setRiver}
              min={0} max={15} unit="m"
              markers={['0', 'Normal 3m', 'Alert 7m', 'Flood 12m', '15m']}
            />

            <SliderInput
              label="Soil Saturation"
              value={soil}
              onChange={setSoil}
              min={0} max={100} unit="%"
              markers={['Dry 0%', '25%', '50%', '75%', 'Sat. 100%']}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={runSimulation}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#006D6D] text-white font-bold text-sm hover:bg-[#055a5a] transition-colors disabled:opacity-60"
              >
                <Zap size={15} className={loading ? 'animate-pulse' : ''} />
                {loading ? 'SIMULATING...' : 'SIMULATE IMPACT'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
              <span className="text-xs font-semibold text-gray-400 tracking-widest">SIMULATION HISTORY</span>
              {history.map((s, i) => <HistoryItem key={i} sim={s} index={i} />)}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="flex-1 flex flex-col gap-4">
          {!result ? (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Zap size={28} className="text-gray-300" />
              </div>
              <div>
                <div className="font-bold text-gray-400">No simulation run yet</div>
                <div className="text-sm text-gray-300 mt-1">Adjust the sliders and press Simulate Impact</div>
              </div>
            </div>
          ) : (
            <>
              {/* Main score */}
              <div className={`bg-white rounded-2xl shadow-sm border ${r.border} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-400 tracking-widest">SIMULATION RESULT</span>
                  {riskLevel === 'RED'
                    ? <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                    : <CheckCircle size={18} className="text-green-500" />
                  }
                </div>
                <div className="flex items-end gap-4">
                  <div className={`text-6xl font-black ${r.color}`}>
                    {(result.flood_score * 100).toFixed(1)}%
                  </div>
                  <div className="mb-2">
                    <div className={`text-lg font-bold ${r.color}`}>{r.label}</div>
                    <div className="text-sm text-gray-400">Flood Risk Score</div>
                  </div>
                </div>
                <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${r.bar}`}
                    style={{ width: `${result.flood_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Impact metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="text-xs font-semibold text-gray-400 tracking-widest mb-2">POPULATION AT RISK</div>
                  <div className="text-3xl font-black text-[#006D6D]">
                    {result.flood_score > 0.8 ? '12,400' : result.flood_score > 0.5 ? '4,200' : result.flood_score > 0.25 ? '1,100' : '< 200'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">estimated people</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="text-xs font-semibold text-gray-400 tracking-widest mb-2">AFFECTED AREA</div>
                  <div className="text-3xl font-black text-[#006D6D]">
                    {result.flood_score > 0.8 ? '125' : result.flood_score > 0.5 ? '45' : result.flood_score > 0.25 ? '12' : '< 5'} km²
                  </div>
                  <div className="text-xs text-gray-400 mt-1">estimated zone</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="text-xs font-semibold text-gray-400 tracking-widest mb-2">RHVI INDEX</div>
                  <div className="text-3xl font-black text-[#006D6D]">{result.rhvi_score?.toFixed(3) || '—'}</div>
                  <div className="text-xs text-gray-400 mt-1">vulnerability index</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1">
                <div className="text-xs font-semibold text-gray-400 tracking-widest mb-4">RECOMMENDED ACTIONS</div>
                <div className="flex flex-col gap-3">
                  {(result.recommendations || [result.recommended_action]).map((rec, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${r.bg} border ${r.border}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${r.bar}`}>
                        {i + 1}
                      </div>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}