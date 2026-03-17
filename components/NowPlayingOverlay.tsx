'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props {
  track: NowPlayingTrack | null
  isLoading: boolean
}

const HIDE_AFTER_MS = 5000

export default function NowPlayingOverlay({ track, isLoading }: Props) {
  const [visible, setVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = () => {
    setVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS)
  }

  // Show overlay whenever track changes
  useEffect(() => {
    if (track) resetTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.trackId])

  // Show on mouse move
  useEffect(() => {
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!track && !isLoading) return null

  return (
    <div
      className="fixed bottom-6 left-6 z-50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md bg-black/40 border border-white/10 max-w-xs">
        {track?.albumArt && (
          <Image
            src={track.albumArt}
            alt="Album art"
            width={48}
            height={48}
            className="rounded-lg flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          {track ? (
            <>
              <p className="text-white text-sm font-semibold truncate">{track.title}</p>
              <p className="text-white/60 text-xs truncate">{track.artist}</p>
            </>
          ) : (
            <p className="text-white/40 text-sm">Generating visual…</p>
          )}
        </div>

        {/* Playing indicator */}
        {track?.isPlaying && (
          <div className="flex items-end gap-0.5 h-4 flex-shrink-0 ml-auto">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-green-400 rounded-full animate-bounce"
                style={{
                  height: `${40 + i * 20}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
