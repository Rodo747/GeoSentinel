// Footer component with IoT readings status

export default function Footer() {
  const [readings, setReadings] = useState([])

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const res = await fetch('/api/iot/readings?limit=3')
        const data = await res.json()
        setReadings(data.readings || [])
      } catch {
        // silent if backend not responding
      }
    }
    fetchReadings()
    const interval = setInterval(fetchReadings, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="h-10 bg-white border-t border-gray-200 flex items-center px-6 gap-8 shrink-0">
    <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#006D6D] rounded-full animate-pulse"></div>
        <span className="text-gray-400 text-xs tracking-widest font-mono">GLOBAL GRID STATUS</span>
    </div>

    {readings.length > 0 ? readings.map((r, i) => (
        <div key={i} className="flex items-center gap-3 text-xs font-mono">
        <span className="text-gray-400">[NODE-{String(i + 1).padStart(2, '0')}]</span>
        <span className="text-gray-400">PRECIP: <span className="text-[#006D6D] font-semibold">{r.precipitation}mm</span></span>
        <span className="text-gray-400">HUM: <span className="text-[#006D6D] font-semibold">{r.soil_humidity}%</span></span>
        <span className="text-gray-400">RIVER: <span className="text-[#006D6D] font-semibold">{r.river_level}m</span></span>
        </div>
    )) : (
        <span className="text-gray-300 text-xs font-mono">WAITING FOR NODE DATA...</span>
    )}

    <div className="ml-auto flex items-center gap-2">
        <div className="w-2 h-2 bg-[#006D6D] rounded-full animate-pulse"></div>
        <span className="text-[#006D6D] text-xs font-mono tracking-wider font-semibold">LIVE SYNC</span>
    </div>
    </footer>
  )
}