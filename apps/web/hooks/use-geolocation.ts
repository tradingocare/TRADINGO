'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeoLocation {
  lat: number
  lng: number
  accuracy: number
}

interface UseGeoLocationReturn {
  location: GeoLocation | null
  error: string | null
  loading: boolean
  requestLocation: () => void
}

export function useGeoLocation(): UseGeoLocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('tradingo_geo')
    if (stored) {
      try {
        setLocation(JSON.parse(stored))
      } catch { }
    }
  }, [])

  useEffect(() => {
    if (location) {
      sessionStorage.setItem('tradingo_geo', JSON.stringify(location))
    }
  }, [location])

  return { location, error, loading, requestLocation }
}
