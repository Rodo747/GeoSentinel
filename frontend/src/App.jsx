// Main application component with routing
import { useState } from 'react'
import { ProfileProvider } from './context/ProfileContext'
import { SettingsProvider } from './context/SettingsContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Monitor from './components/monitor/Monitor'
import Simulator from './components/simulator/Simulator'
import Intelligence from './components/intelligence/Intelligence'
import Settings from './components/settings/Settings'
import Info from './components/info/Info'

export default function App() {
  const [activeView, setActiveView] = useState('monitor')

  const renderView = () => {
    switch (activeView) {
      case 'monitor':      return <Monitor />
      case 'simulator':    return <Simulator />
      case 'intelligence': return <Intelligence />
      case 'settings':     return <Settings />
      case 'info':         return <Info />
      default:             return <Monitor />
    }
  }

  return (
    <ProfileProvider>
      <SettingsProvider>
        <div className="flex flex-col h-screen bg-[#f0f4f8] text-[#1a2332] overflow-hidden">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 overflow-auto p-4 bg-[#f0f4f8]">
              {renderView()}
            </main>
          </div>
          <Footer />
        </div>
      </SettingsProvider>
    </ProfileProvider>
  )
}