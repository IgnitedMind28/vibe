'use client'

import { useMemo } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props {
  track: NowPlayingTrack | null
}

function getMusicColors(valence: number, energy: number) {
  // Valence maps to hue: 0 = blue-purple (240°), 1 = orange-yellow (30°)
  const h1 = Math.round(240 - valence * 210)
  const h2 = (h1 + 45) % 360
  const h3 = (h1 - 45 + 360) % 360
  const sat = Math.round(50 + energy * 40)
  const l1 = Math.round(20 + energy * 20)
  const l2 = Math.round(12 + energy * 18)
  const l3 = Math.round(25 + energy * 25)
  return {
    c1: `hsl(${h1}, ${sat}%, ${l1}%)`,
    c2: `hsl(${h2}, ${Math.round(sat * 0.85)}%, ${l2}%)`,
    c3: `hsl(${h3}, ${Math.round(sat * 0.7)}%, ${l3}%)`,
    bg: `hsl(${h1}, 30%, 5%)`,
  }
}

export default function VisualDisplay({ track }: Props) {
  const colors = useMemo(() => {
    if (!track) return null
    return getMusicColors(track.valence, track.energy)
  }, [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Faster animation for high-energy tracks
  const animSpeed = track ? Math.max(4, Math.round(18 - track.energy * 14)) : 12

  if (!track) return <div className="fixed inset-0 bg-black" />

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: colors!.bg }}>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(8%, 12%) scale(1.06); }
          66%       { transform: translate(-6%, 6%) scale(0.94); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-10%, -8%) scale(1.08); }
          66%       { transform: translate(4%, -10%) scale(0.92); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(7%, -7%) scale(1.1); }
        }
      `}</style>

      {/* Blob 1 — top-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: '75vw', height: '75vh',
          top: '-25%', left: '-20%',
          background: `radial-gradient(circle, ${colors!.c1} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: 0.75,
          animation: `blob1 ${animSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Blob 2 — bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: '70vw', height: '70vh',
          bottom: '-20%', right: '-15%',
          background: `radial-gradient(circle, ${colors!.c2} 0%, transparent 70%)`,
          filter: 'blur(50px)',
          opacity: 0.65,
          animation: `blob2 ${Math.round(animSpeed * 1.3)}s ease-in-out infinite`,
        }}
      />

      {/* Blob 3 — center-ish */}
      <div
        className="absolute rounded-full"
        style={{
          width: '60vw', height: '60vh',
          top: '25%', left: '25%',
          background: `radial-gradient(circle, ${colors!.c3} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: 0.55,
          animation: `blob3 ${Math.round(animSpeed * 0.75)}s ease-in-out infinite`,
        }}
      />
    </div>
  )
}
