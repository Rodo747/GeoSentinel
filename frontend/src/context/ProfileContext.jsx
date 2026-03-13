// Profile context for managing zone profiles
import { createContext, useState } from 'react'
const DEFAULT_PROFILES = [
  {
    id: 'bolivia',
    name: 'Bolivia',
    location: 'La Paz, Bolivia',
    lat: -16.5,
    lon: -68.15,
    badge: 'Pilot Mode',
    badgeColor: 'bg-[#006D6D] text-white',
  },
  {
    id: 'houston',
    name: 'Houston',
    location: 'Houston, Texas — USA',
    lat: 29.76,
    lon: -95.36,
    badge: 'Global Live',
    badgeColor: 'bg-blue-500 text-white',
  },
  {
    id: 'beira',
    name: 'Beira',
    location: 'Beira, Mozambique',
    lat: -19.84,
    lon: 34.84,
    badge: 'Critical Zone',
    badgeColor: 'bg-red-500 text-white',
  },
]

const STORAGE_KEY = 'geosentinel_profiles'
const ACTIVE_KEY = 'geosentinel_active_profile'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  // Initialize with defaults to avoid null
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES)
  const [activeProfile, setActiveProfile] = useState(DEFAULT_PROFILES[0])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load profiles from localStorage on init
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(STORAGE_KEY)
      const savedActive = localStorage.getItem(ACTIVE_KEY)

      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles)
        if (parsed && parsed.length > 0) {
          setProfiles(parsed)

          if (savedActive) {
            const active = parsed.find(p => p.id === savedActive)
            setActiveProfile(active || parsed[0])
          } else {
            setActiveProfile(parsed[0])
          }
        }
      }
    } catch (e) {
      console.error('Error loading profiles from localStorage:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save profiles when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    }
  }, [profiles, isLoaded])

  // Save active profile when it changes
  useEffect(() => {
    if (isLoaded && activeProfile) {
      localStorage.setItem(ACTIVE_KEY, activeProfile.id)
    }
  }, [activeProfile, isLoaded])

  const updateProfile = (id, data) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    if (activeProfile && activeProfile.id === id) {
      setActiveProfile(prev => ({ ...prev, ...data }))
    }
  }

  const addProfile = (profile) => {
    const newProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      badge: 'Custom',
      badgeColor: 'bg-gray-500 text-white'
    }
    setProfiles(prev => [...prev, newProfile])
    return newProfile
  }

  const deleteProfile = (id) => {
    if (profiles.length <= 1) return
    setProfiles(prev => prev.filter(p => p.id !== id))
    if (activeProfile && activeProfile.id === id) {
      const remaining = profiles.filter(p => p.id !== id)
      setActiveProfile(remaining[0])
    }
  }

  return (
    <ProfileContext.Provider value={{
      profiles,
      activeProfile,
      setActiveProfile,
      updateProfile,
      addProfile,
      deleteProfile,
      isLoaded
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
