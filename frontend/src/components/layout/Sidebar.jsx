import { LayoutDashboard, Sliders, Brain, Settings, Info } from 'lucide-react'

const MAIN_NAV = [
  { id: 'monitor',      label: 'Monitor',      icon: LayoutDashboard },
  { id: 'simulator',    label: 'Simulator',    icon: Sliders },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
]

const BOTTOM_NAV = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'info',     label: 'Info',     icon: Info },
]

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      style={{ width: 'calc(100% - 16px)', marginLeft: '8px' }}
      className={`flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-all duration-200 rounded-xl ${
        isActive
          ? 'bg-black/20 text-white border-l-4 border-[#D4AF37]'
          : 'text-teal-100 hover:text-white hover:bg-black/10 border-l-4 border-transparent'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
        isActive ? 'bg-[#D4AF37]' : 'bg-white/5'
      }`}>
        <Icon size={16} className={isActive ? 'text-[#004b4b]' : 'text-teal-100'} />
      </div>
      <span>{item.label}</span>
    </button>
  )
}

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="w-56 bg-[#006D6D] flex flex-col shrink-0 overflow-hidden relative">

      {/* Decorative triangles - absolute position, occupy full center space */}
      <div className="absolute inset-0 pointer-events-none" style={{ top: '130px', bottom: '130px' }}>
        <svg
          width="100%" height="100%"
          viewBox="0 0 224 300"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#006D6D" stopOpacity="1"/>
              <stop offset="20%" stopColor="#006D6D" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="80%" stopColor="#006D6D" stopOpacity="0"/>
              <stop offset="100%" stopColor="#006D6D" stopOpacity="1"/>
            </linearGradient>
          </defs>

          {/* Triangle 1 - large, occupies all */}
          <polygon points="224,0 224,300 0,300"   fill="#D4AF37" opacity="0.22"/>
          {/* Triangle 2 - medium, brighter */}
          <polygon points="224,80 224,300 24,300"  fill="#D4AF37" opacity="0.18"/>
          {/* Triangle 3 - small, corner */}
          <polygon points="224,160 224,300 104,300" fill="#D4AF37" opacity="0.15"/>

          <rect width="224" height="300" fill="url(#tg)"/>
          <rect width="224" height="300" fill="url(#bg)"/>
        </svg>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 relative z-10">
        {MAIN_NAV.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>

      <div className="pb-4 flex flex-col gap-1 border-t border-white/10 pt-4 relative z-10">
        {BOTTOM_NAV.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
        <div className="flex items-center gap-2 px-4 pt-3 mt-1 border-t border-white/10">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          <span className="text-[11px] text-teal-100 tracking-wider">ESP32 Connected</span>
        </div>
      </div>

    </aside>
  )
}