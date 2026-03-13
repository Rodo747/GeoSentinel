// Header component with logo and live clock
import logo from '../../logo.png'
import { useState, useEffect } from 'react'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const utcTime = time.toUTCString().split(' ')[4] + ' UTC'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <img src={logo} alt="GeoSentinel" className="h-14 w-auto object-contain" />
        <div className="flex flex-col">
          <div className="font-extrabold text-[#006D6D] tracking-widest text-xl leading-tight">GEOSENTINEL</div>
          <div className="text-[#D4AF37] text-xs tracking-widest font-semibold">Turning Earth Data into Life-Protecting Action</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <div className="w-2 h-2 bg-[#006D6D] rounded-full animate-pulse"></div>
          <span className="text-[#006D6D] text-xs font-semibold tracking-wider">LIVE</span>
        </div>

        <span className="text-gray-500 text-xs font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{utcTime}</span>
      </div>
    </header>
  )
}
