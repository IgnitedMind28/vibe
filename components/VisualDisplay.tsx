'use client'

import { useMemo } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props {
  track: NowPlayingTrack | null
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getMusicColors(track: NowPlayingTrack) {
  const { valence, energy, trackId } = track
  const seed = hashCode(trackId)
  // Valence → hue: 0 = blue-purple (220°), 1 = orange-yellow (30°)
  const baseHue = Math.round(220 - valence * 190)
  // Add per-song variation so every track looks different
  const h1 = (baseHue + (seed % 40) - 20 + 360) % 360
  const h2 = (h1 + 60) % 360
  const h3 = (h1 + 120) % 360
  const h4 = (h1 + 180) % 360
  const sat = Math.round(60 + energy * 35)
  const l1 = Math.round(25 + energy * 25)
  const l2 = Math.round(15 + energy * 20)
  const l3 = Math.round(30 + energy * 30)
  return { h1, h2, h3, h4, sat, l1, l2, l3 }
}

export default function VisualDisplay({ track }: Props) {
  const colors = useMemo(() => {
    if (!track) return null
    return getMusicColors(track)
  }, [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2s for max energy, 7s for min energy
  const speed = track ? Math.max(2, Math.round(7 - track.energy * 5)) : 4
  const spinSpeed = track ? Math.max(6, Math.round(18 - track.energy * 12)) : 12

  if (!track) return <div className="fixed inset-0 bg-black" />

  const { h1, h2, h3, h4, sat, l1, l2, l3 } = colors!

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: `hsl(${h1}, ${Math.round(sat * 0.3)}%, 4%)` }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25%       { transform: translate(18%, 22%) scale(1.12); }
          50%       { transform: translate(-12%, 16%) scale(0.88); }
          75%       { transform: translate(22%, -12%) scale(1.08); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25%       { transform: translate(-22%, -18%) scale(1.15); }
          50%       { transform: translate(18%, -22%) scale(0.85); }
          75%       { transform: translate(-18%, 22%) scale(1.1); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33%       { transform: translate(14%, -18%) scale(1.2); }
          66%       { transform: translate(-18%, 12%) scale(0.82); }
        }
        @keyframes blob4 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50%       { transform: translate(-10%, 16%) scale(1.18); }
        }
      `}</style>

      {/* Rotating conic gradient — creates a swirling aurora feel */}
      <div
        className="absolute"
        style={{
          width: '150vw', height: '150vh',
          top: '-25%', left: '-25%',
          background: `conic-gradient(
            hsl(${h1}, ${sat}%, ${l1}%) 0deg,
            hsl(${h2}, ${sat}%, ${l2}%) 90deg,
            hsl(${h3}, ${sat}%, ${l3}%) 180deg,
            hsl(${h4}, ${Math.round(sat * 0.7)}%, ${l2}%) 270deg,
            hsl(${h1}, ${sat}%, ${l1}%) 360deg
          )`,
          opacity: 0.12,
          animation: `spin ${spinSpeed}s linear infinite`,
          transformOrigin: 'center center',
        }}
      />

      {/* Blob 1 — top-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: '85vw', height: '85vh',
          top: '-30%', left: '-25%',
          background: `radial-gradient(circle, hsl(${h1}, ${sat}%, ${l1}%) 0%, transparent 65%)`,
          filter: 'blur(30px)',
          opacity: 0.85,
          animation: `blob1 ${speed}s ease-in-out infinite`,
        }}
      />

      {/* Blob 2 — bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: '80vw', height: '80vh',
          bottom: '-25%', right: '-20%',
          background: `radial-gradient(circle, hsl(${h2}, ${sat}%, ${l2}%) 0%, transparent 65%)`,
          filter: 'blur(35px)',
          opacity: 0.8,
          animation: `blob2 ${Math.round(speed * 1.2)}s ease-in-out infinite`,
        }}
      />

      {/* Blob 3 — top-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: '70vw', height: '70vh',
          top: '-15%', right: '-15%',
          background: `radial-gradient(circle, hsl(${h3}, ${Math.round(sat * 0.85)}%, ${l3}%) 0%, transparent 65%)`,
          filter: 'blur(40px)',
          opacity: 0.7,
          animation: `blob3 ${Math.round(speed * 0.85)}s ease-in-out infinite`,
        }}
      />

      {/* Blob 4 — bottom-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: '65vw', height: '65vh',
          bottom: '-15%', left: '-10%',
          background: `radial-gradient(circle, hsl(${h4}, ${Math.round(sat * 0.65)}%, ${l1}%) 0%, transparent 65%)`,
          filter: 'blur(45px)',
          opacity: 0.65,
          animation: `blob4 ${Math.round(speed * 1.5)}s ease-in-out infinite`,
        }}
      />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)',
        }}
      />
    </div>
  )
}
