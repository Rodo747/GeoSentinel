// Settings context for app configuration
import { createContext, useState, useEffect, useContext } from 'react'
const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [alertThreshold, setAlertThreshold] = useState(0.45)
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true)
  const [iotInterval, setIotInterval] = useState(30)
  const [mapCircleRadius, setMapCircleRadius] = useState(12000)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load configuration from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('https://geosentinel-production.up.railway.app/settings')
        const data = await res.json()
        setAlertThreshold(data.alert_threshold)
        setEmailAlertsEnabled(data.email_alerts_enabled)
        setIotInterval(data.iot_interval_seconds)
        setMapCircleRadius(data.map_circle_radius || 12000)
      } catch (e) {
        console.error('Error loading settings:', e)
      } finally {
        setIsLoaded(true)
      }
    }
    fetchSettings()
  }, [])

  // Save configuration to backend
  const saveSettings = async (threshold, emailEnabled, interval, radius) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: threshold,
          email_enabled: emailEnabled,
          iot_interval: interval,
          map_circle_radius: radius
        })
      })
      if (res.ok) {
        if (threshold !== undefined) setAlertThreshold(threshold)
        if (emailEnabled !== undefined) setEmailAlertsEnabled(emailEnabled)
        if (interval !== undefined) setIotInterval(interval)
        if (radius !== undefined) setMapCircleRadius(radius)
        return true
      }
    } catch (e) {
      console.error('Error saving settings:', e)
    }
    return false
  }

  return (
    <SettingsContext.Provider value={{
      alertThreshold,
      emailAlertsEnabled,
      iotInterval,
      mapCircleRadius,
      isLoaded,
      saveSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
