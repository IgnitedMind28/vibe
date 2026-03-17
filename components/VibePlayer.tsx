'use client'

import { useCallback } from 'react'
import { useNowPlaying } from '@/hooks/useNowPlaying'
import VisualDisplay from './VisualDisplay'
import NowPlayingOverlay from './NowPlayingOverlay'

export default function VibePlayer() {
  const { track, isConnected, error } = useNowPlaying()

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.()
  }, [])

  return (
    <>
      <VisualDisplay track={track} />
      <NowPlayingOverlay track={track} isLoading={false} />

      {/* Fullscreen button — fades out when a visual is showing */}
      <button
        onClick={enterFullscreen}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/80 transition-colors backdrop-blur-sm"
        title="Enter fullscreen"
      >
        ⛶ fullscreen
      </button>

      {/* Disconnect link */}
      <a
        href="/api/spotify/logout"
        className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg text-xs text-white/20 hover:text-white/60 transition-colors"
      >
        disconnect
      </a>

      {/* Status / error */}
      {error && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <p className="text-white/60 text-sm mb-3">{error}</p>
          <a
            href="/api/spotify/login"
            className="px-4 py-2 rounded-full bg-[#1DB954] text-black text-sm font-semibold"
          >
            Reconnect Spotify
          </a>
        </div>
      )}

      {!error && isConnected && !track && (
        <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-white/30 text-lg">Play something on Spotify…</p>
        </div>
      )}
    </>
  )
}
