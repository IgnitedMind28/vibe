'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

export interface NowPlayingState {
  track: NowPlayingTrack | null
  imageUrl: string | null
  isLoading: boolean
  isConnected: boolean
  error: string | null
}

const POLL_INTERVAL_MS = 5000

export function useNowPlaying(): NowPlayingState {
  const [track, setTrack] = useState<NowPlayingTrack | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastTrackId = useRef<string | null>(null)

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const res = await fetch('/api/spotify/refresh', { method: 'POST' })
    return res.ok
  }, [])

  const fetchVisual = useCallback(async (t: NowPlayingTrack) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      })
      if (res.ok) {
        const data = await res.json()
        setImageUrl(data.imageUrl)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      let res = await fetch('/api/spotify/now-playing')

      if (res.status === 401) {
        const refreshed = await refreshToken()
        if (!refreshed) {
          setIsConnected(false)
          setError('Session expired. Please reconnect Spotify.')
          return
        }
        res = await fetch('/api/spotify/now-playing')
      }

      if (!res.ok) {
        setError('Failed to reach Spotify')
        return
      }

      setIsConnected(true)
      setError(null)

      const data = await res.json()
      const incoming: NowPlayingTrack | null = data.track

      if (!incoming) {
        setTrack(null)
        return
      }

      setTrack(incoming)

      if (incoming.trackId !== lastTrackId.current) {
        lastTrackId.current = incoming.trackId
        fetchVisual(incoming)
      }
    } catch {
      setError('Network error')
    }
  }, [refreshToken, fetchVisual])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  return { track, imageUrl, isLoading, isConnected, error }
}
