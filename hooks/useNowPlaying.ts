'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

export interface NowPlayingState {
  track: NowPlayingTrack | null
  isConnected: boolean
  error: string | null
}

const POLL_INTERVAL_MS = 5000

export function useNowPlaying(): NowPlayingState {
  const [track, setTrack] = useState<NowPlayingTrack | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastTrackId = useRef<string | null>(null)

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const res = await fetch('/api/spotify/refresh', { method: 'POST' })
    return res.ok
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
        lastTrackId.current = null
        return
      }

      if (incoming.trackId !== lastTrackId.current) {
        lastTrackId.current = incoming.trackId
        setTrack(incoming)
      }
    } catch {
      setError('Network error')
    }
  }, [refreshToken])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  return { track, isConnected, error }
}
