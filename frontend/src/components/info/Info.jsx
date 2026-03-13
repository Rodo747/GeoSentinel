// Info page component with project details

const REGIONS = [
  'Bolivia', 'Bangladesh', 'Germany', 'Peru Lima', 'Peru Amazonia',
  'Colombia Bogotá', 'Colombia Caribe', 'Texas Houston', 'Brasil São Paulo',
  'Brasil Manaus', 'USA New Orleans', 'USA Miami', 'Africa Mozambique',
  'Oceania Queensland', 'Europa Rotterdam', 'Asia Manila'
]

const STACK = [
  ['IoT Edge',    'ESP32 + MicroPython',         'bg-[#004D59]/10 text-[#004D59]'],
  ['Backend',     'FastAPI + Python',            'bg-[#006D6D]/10 text-[#006D6D]'],
  ['ML Engine',   'XGBoost + Scikit-learn',      'bg-[#D4AF37]/10 text-[#A07D20]'],
  ['Geodata',     'GeoPandas + Shapely',         'bg-[#006D6D]/5  text-[#004D59]'],
  ['Database',    'SQLite',                      'bg-gray-100     text-gray-500'],
  ['Climate API', 'Open-Meteo + NASA POWER',     'bg-[#C2652A]/10 text-[#C2652A]'],
  ['Geo APIs',    'OpenTopoData + WorldPop',     'bg-[#D4AF37]/10 text-[#A07D20]'],
  ['Frontend',    'React + Tailwind + Recharts', 'bg-[#004D59]/10 text-[#004D59]'],
  ['Alerts',      'Resend Email API',            'bg-[#C2652A]/10 text-[#C2652A]'],
  ['Deploy',      'Railway',                     'bg-gray-100     text-gray-500'],
]

export default function Info() {
  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ROW 1 — Developer + Mission, side by side */}
      <div className="grid grid-cols-2 gap-4">

        {/* Developer */}
        <div className="bg-[#006D6D] rounded-2xl shadow-sm border border-[#006D6D] p-6 text-white">
          <div className="text-base font-bold tracking-widest text-[#D4AF37] mb-4">DEVELOPERS</div>
          <div className="w-full mb-3">
            <h2 className="text-3xl font-black text-white leading-tight mb-1">
              Rodolfo Soliz Barrientos
            </h2>
            <p className="text-base text-[#D4AF37] font-semibold">Lead Interaction Architect and Developer</p>
          </div>
          <div className="w-full">
            <h2 className="text-3xl font-black text-white leading-tight mb-1">
              Pablo Espinoza Soliz
            </h2>
            <p className="text-base text-[#D4AF37] font-semibold">Lead Graphic Design</p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-[#006D6D] rounded-2xl p-8 text-white">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} className="text-[#D4AF37]" />
            <span className="text-xs font-bold tracking-widest text-white/60">MISSION</span>
          </div>
          <p className="text-base text-white/90 leading-relaxed">
            GeoSentinel is a modular digital infrastructure for climate resilience, focused today on hydro risk.
            Designed to integrate new threats without redesigning the system. Built for vulnerable communities
            that cannot afford proprietary disaster management systems.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              ['AUC',     '0.986'],
              ['Records', '139K'],
              ['Regions', '16'],
              ['Features','18'],
            ].map(([label, val]) => (
              <div key={label} className="text-center p-3 bg-white/10 rounded-xl">
                <div className="text-lg font-black text-[#D4AF37]">{val}</div>
                <div className="text-[10px] text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROW 2 — Tech Stack + Model Performance, side by side */}
      <div className="grid grid-cols-2 gap-4">

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-[#006D6D]" />
            <span className="font-bold text-lg text-[#006D6D]">Tech Stack</span>
          </div>
          <div className="flex flex-col gap-2">
            {STACK.map(([layer, tech, style]) => (
              <div key={layer} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold tracking-wider shrink-0 ${style}`}>
                  {layer.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600 font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: Model Performance + Roadmap */}
        <div className="flex flex-col gap-4">

          {/* Model Performance — Training Regions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-[#006D6D]" />
              <span className="font-bold text-lg text-[#006D6D]">Model Performance</span>
            </div>
            <div className="text-xs font-semibold text-gray-400 tracking-widest mb-3">TRAINING REGIONS</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {REGIONS.map(r => (
                <span key={r} className="px-2 py-1 bg-[#006D6D]/5 border border-[#006D6D]/10 rounded-lg text-xs font-medium text-[#006D6D]">
                  {r}
                </span>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="flex flex-wrap gap-2">
                {['Sendai Framework 2015–2030', 'IPCC Risk Framework', 'RISK = H × E × V'].map(t => (
                  <span key={t} className="px-2.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg text-xs font-bold text-[#D4AF37]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-[#006D6D]" />
              <span className="font-bold text-lg text-[#006D6D]">Roadmap</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ['Phase 1', 'Current', 'Hydro Risk — FloodRiskEngine + RHVI + IoT', true],
                ['Phase 2', 'Next',    'LandslideEngine + DroughtEngine',           false],
                ['Phase 3', 'Future',  'WildfireEngine — NASA FIRMS data',          false],
                ['Phase 4', 'Future',  'EpidemicEngine — WHO + SIR/SEIR models',    false],
                ['Phase 5', 'Vision',  'Technological & social threats',            false],
              ].map(([phase, status, desc, active]) => (
                <div key={phase} className={`flex items-start gap-3 p-3 rounded-xl border ${active ? 'bg-[#006D6D]/5 border-[#006D6D]/20' : 'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${active ? 'bg-[#D4AF37]' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${active ? 'text-[#006D6D]' : 'text-gray-400'}`}>{phase}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}