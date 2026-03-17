'use client'

import { useMemo } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props {
  track: NowPlayingTrack | null
}

// ─── Deterministic random ────────────────────────────────────────────────────

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function seededFloat(seed: number, n: number): number {
  let s = ((seed + n * 6364136) >>> 0)
  s = ((1664525 * s + 1013904223) >>> 0)
  return s / 0x100000000
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SceneConfig {
  character: string
  characterLabel: string
  bg: [string, string]
  horizonEmoji: string
  horizonCount: number
  particleEmoji: string[]
  particleCount: number
}

interface Particle {
  emoji: string
  x: number
  y: number
  size: number
  delay: number
  duration: number
  variant: 1 | 2 | 3
}

// ─── Scene library ───────────────────────────────────────────────────────────

const SCENES: Record<string, SceneConfig> = {
  robot:      { character:'🤖', characterLabel:'Robot',      bg:['#0d0d2b','#1a0533'], horizonEmoji:'⚙️',  horizonCount:5, particleEmoji:['✨','⚡','🔷','💠'], particleCount:14 },
  alien:      { character:'👾', characterLabel:'Alien',      bg:['#000820','#0a0a2e'], horizonEmoji:'🌍',  horizonCount:3, particleEmoji:['⭐','🌟','💫','🛸'], particleCount:16 },
  fox:        { character:'🦊', characterLabel:'Cool Fox',   bg:['#1a1a2e','#16213e'], horizonEmoji:'🏙️',  horizonCount:4, particleEmoji:['🎵','🎶','💿','✨'], particleCount:12 },
  unicorn:    { character:'🦄', characterLabel:'Unicorn',    bg:['#ff9de2','#c9b1ff'], horizonEmoji:'🌈',  horizonCount:4, particleEmoji:['⭐','🌸','💖','✨'], particleCount:18 },
  cat:        { character:'🐱', characterLabel:'Cat',        bg:['#2d1b33','#1a0d26'], horizonEmoji:'🎵',  horizonCount:5, particleEmoji:['🎵','🎶','🎤','✨'], particleCount:12 },
  swan:       { character:'🦢', characterLabel:'Swan',       bg:['#e8f4f8','#b8d4e8'], horizonEmoji:'🎼',  horizonCount:4, particleEmoji:['🎵','🌸','❄️','✨'], particleCount:13 },
  cowboy:     { character:'🤠', characterLabel:'Cowboy',     bg:['#d4884b','#8b4513'], horizonEmoji:'🌵',  horizonCount:5, particleEmoji:['🌟','⭐','☀️','✨'], particleCount:11 },
  bear:       { character:'🐻', characterLabel:'Bear',       bg:['#2d4a22','#1a2e12'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['🍂','🍁','🌿','⭐'], particleCount:12 },
  lion:       { character:'🦁', characterLabel:'Lion',       bg:['#d4884b','#8b6914'], horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','☀️','🦋','✨'], particleCount:13 },
  turtle:     { character:'🐢', characterLabel:'Turtle',     bg:['#1a4a2e','#0d2e1a'], horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','☀️','🎵'], particleCount:11 },
  parrot:     { character:'🦜', characterLabel:'Parrot',     bg:['#ff6b35','#f7931e'], horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','🦋','☀️'], particleCount:14 },
  butterfly:  { character:'🦋', characterLabel:'Butterfly',  bg:['#7b2d8b','#e91e8c'], horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','🌺','💖','✨'], particleCount:16 },
  hedgehog:   { character:'🦔', characterLabel:'Hedgehog',   bg:['#4a3728','#2d1f1a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🍂','🌿','⭐','🎵'], particleCount:11 },
  chick:      { character:'🐥', characterLabel:'Chick',      bg:['#fff9c4','#ffe082'], horizonEmoji:'🌼',  horizonCount:6, particleEmoji:['🌸','⭐','💛','🌼'], particleCount:15 },
  dragon:     { character:'🐉', characterLabel:'Dragon',     bg:['#1a0000','#2d0a00'], horizonEmoji:'🌋',  horizonCount:3, particleEmoji:['🔥','✨','⭐','💫'], particleCount:14 },
  moon:       { character:'🌙', characterLabel:'Moon',       bg:['#0d0d1a','#1a1a2e'], horizonEmoji:'⭐',  horizonCount:6, particleEmoji:['💫','✨','🌟','⭐'], particleCount:18 },
  flamingo:   { character:'🦩', characterLabel:'Flamingo',   bg:['#ff9de2','#ffb3c6'], horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','💖','🌺','✨'], particleCount:15 },
  dolphin:    { character:'🐬', characterLabel:'Dolphin',    bg:['#0077b6','#023e8a'], horizonEmoji:'🌊',  horizonCount:5, particleEmoji:['🐠','🐡','⭐','🫧'],  particleCount:14 },
  rocket:     { character:'🚀', characterLabel:'Rocket',     bg:['#020014','#0a0030'], horizonEmoji:'🪐',  horizonCount:3, particleEmoji:['⭐','🌟','💫','✨'], particleCount:20 },
  owl:        { character:'🦉', characterLabel:'Owl',        bg:['#0d1117','#161b22'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['✨','🌟','🍂','💫'], particleCount:12 },
  wolf:       { character:'🐺', characterLabel:'Wolf',       bg:['#1a2040','#0d1030'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['⭐','💨','🌑','✨'], particleCount:13 },
  koala:      { character:'🐨', characterLabel:'Koala',      bg:['#b8d4b8','#7aa87a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','⭐','🌸'], particleCount:12 },
  penguin:    { character:'🐧', characterLabel:'Penguin',    bg:['#c8e6ff','#e8f4ff'], horizonEmoji:'❄️',  horizonCount:5, particleEmoji:['❄️','⭐','🌨️','✨'], particleCount:14 },
  bat:        { character:'🦇', characterLabel:'Bat',        bg:['#0d0015','#1a0033'], horizonEmoji:'🦇',  horizonCount:4, particleEmoji:['✨','💫','🌑','⭐'], particleCount:12 },
  crocodile:  { character:'🐊', characterLabel:'Crocodile',  bg:['#1a3a1a','#0d2010'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','💧','⭐'], particleCount:11 },
  frog:       { character:'🐸', characterLabel:'Frog',       bg:['#2d5a2d','#1a3a1a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['💧','🌿','⭐','🍃'], particleCount:12 },
}

// ─── Scene selection ─────────────────────────────────────────────────────────

function selectScene(track: NowPlayingTrack): SceneConfig {
  const g = track.genres.join(' ').toLowerCase()
  const t = track.title.toLowerCase()
  const { energy, valence, danceability } = track

  // Genre-first matching
  if (/metal|hardcore|punk/.test(g))               return SCENES.dragon
  if (/electronic|edm|synth|techno|house/.test(g)) return SCENES.robot
  if (/hip.?hop|rap|trap|drill/.test(g))           return SCENES.fox
  if (/k-?pop|j-?pop|anime|vocaloid/.test(g))      return SCENES.dragon
  if (/pop/.test(g))                               return valence > 0.55 ? SCENES.unicorn : SCENES.cat
  if (/jazz|blues|soul|funk/.test(g))              return SCENES.cat
  if (/classical|orchestra|piano|chamber/.test(g)) return SCENES.swan
  if (/country|folk|bluegrass/.test(g))            return valence > 0.5 ? SCENES.cowboy : SCENES.bear
  if (/rock/.test(g))                              return energy > 0.65 ? SCENES.lion : SCENES.hedgehog
  if (/reggae|ska|dancehall/.test(g))              return SCENES.turtle
  if (/latin|salsa|cumbia|merengue/.test(g))       return SCENES.parrot
  if (/r&b|rnb|neo.?soul/.test(g))                return SCENES.butterfly
  if (/indie|alternative|shoegaze/.test(g))        return SCENES.hedgehog
  if (/children|kids|nursery/.test(g))             return SCENES.chick
  if (/ambient|new.?age|meditation|sleep/.test(g)) return valence > 0.5 ? SCENES.moon : SCENES.owl

  // Title keyword overrides
  if (/ocean|sea|wave|surf|beach|coral/.test(t))   return SCENES.dolphin
  if (/space|star|galaxy|cosmos|orbit/.test(t))    return SCENES.rocket
  if (/fire|flame|burn|inferno/.test(t))           return SCENES.dragon
  if (/love|heart|angel|rose/.test(t))             return SCENES.butterfly
  if (/night|dark|shadow|midnight/.test(t))        return SCENES.bat
  if (/dream|sleep|pillow|cloud/.test(t))          return SCENES.moon
  if (/jungle|wild|safari|roar/.test(t))           return SCENES.lion
  if (/snow|ice|winter|freeze|cold/.test(t))       return SCENES.penguin
  if (/magic|spell|wizard|enchant/.test(t))        return SCENES.unicorn

  // Audio feature fallbacks
  if (energy > 0.75 && valence > 0.6)   return SCENES.lion
  if (energy > 0.75)                     return SCENES.dragon
  if (energy < 0.35 && valence > 0.6)   return SCENES.koala
  if (energy < 0.35)                     return SCENES.penguin
  if (danceability > 0.75)               return SCENES.flamingo
  if (valence > 0.7)                     return SCENES.unicorn
  if (valence < 0.35)                    return SCENES.wolf

  return SCENES.frog
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildParticles(scene: SceneConfig, seed: number, baseDuration: number): Particle[] {
  return Array.from({ length: scene.particleCount }, (_, i): Particle => {
    const r = (n: number) => seededFloat(seed, i * 20 + n)
    return {
      emoji:    scene.particleEmoji[Math.floor(r(0) * scene.particleEmoji.length)],
      x:        r(1) * 95,
      y:        r(2) * 85,
      size:     22 + Math.floor(r(3) * 36),
      delay:    r(4) * 7,
      duration: baseDuration * (0.65 + r(5) * 0.7),
      variant:  ([1, 2, 3] as const)[Math.floor(r(6) * 3)],
    }
  })
}

function getAnimationSpeeds(track: NowPlayingTrack) {
  const { tempo, energy, danceability } = track
  const beatSec = 60 / (tempo || 120)
  const charDuration = Math.max(0.45, Math.min(2.8, beatSec * 2))
  const particleDuration = Math.max(2.5, 8 - energy * 5)
  const bgDuration = Math.max(2, 7 - energy * 4)

  let charAnim: 'Bounce' | 'Dance' | 'Wobble' | 'Pulse'
  if (energy > 0.72 && danceability > 0.65) charAnim = 'Dance'
  else if (energy > 0.58)                   charAnim = 'Bounce'
  else if (energy < 0.32)                   charAnim = 'Pulse'
  else                                       charAnim = 'Wobble'

  return { charDuration, particleDuration, bgDuration, charAnim }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisualDisplay({ track }: Props) {
  const seed    = useMemo(() => hashCode(track?.trackId ?? ''), [track?.trackId])
  const scene   = useMemo(() => track ? selectScene(track) : null,               [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps
  const speeds  = useMemo(() => track ? getAnimationSpeeds(track) : null,        [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps
  const particles = useMemo(
    () => scene && speeds ? buildParticles(scene, seed, speeds.particleDuration) : [],
    [track?.trackId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!track || !scene || !speeds) return <div className="fixed inset-0 bg-black" />

  const { charDuration, bgDuration, charAnim } = speeds

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <style>{`
        @keyframes charBounce {
          0%,100% { transform: translateY(0) scale(1) rotate(-2deg); }
          25%      { transform: translateY(-22px) scale(1.09) rotate(2deg); }
          50%      { transform: translateY(-10px) scale(1.04) rotate(-1deg); }
          75%      { transform: translateY(-26px) scale(1.11) rotate(3deg); }
        }
        @keyframes charDance {
          0%   { transform: translateY(0)    rotate(-6deg) scaleX(1);    }
          20%  { transform: translateY(-18px) rotate(6deg) scaleX(0.94); }
          40%  { transform: translateY(-28px) rotate(-9deg) scaleX(1.06);}
          60%  { transform: translateY(-12px) rotate(7deg) scaleX(0.96); }
          80%  { transform: translateY(-22px) rotate(-5deg) scaleX(1.04);}
          100% { transform: translateY(0)    rotate(-6deg) scaleX(1);    }
        }
        @keyframes charWobble {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes charPulse {
          0%,100% { transform: scale(1);    opacity: 0.9; }
          50%      { transform: scale(1.09); opacity: 1;   }
        }
        @keyframes float1 {
          0%,100% { transform: translateY(0)    translateX(0)    rotate(0deg);  }
          33%      { transform: translateY(-22px) translateX(10px) rotate(12deg); }
          66%      { transform: translateY(-10px) translateX(-8px) rotate(-6deg); }
        }
        @keyframes float2 {
          0%,100% { transform: translateY(0)    translateX(0)     rotate(0deg); opacity:.8; }
          50%      { transform: translateY(-32px) translateX(-14px) rotate(16deg); opacity:1; }
        }
        @keyframes float3 {
          0%,100% { transform: scale(1)    rotate(0deg);  opacity:.7; }
          25%      { transform: scale(1.16) rotate(9deg);  opacity:.9; }
          75%      { transform: scale(0.86) rotate(-9deg); opacity:1;  }
        }
        @keyframes bgPulse {
          0%,100% { opacity:.92; }
          50%      { opacity:1;   }
        }
        @keyframes horizonSway {
          0%,100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg);  }
        }
      `}</style>

      {/* Layer 1: Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${scene.bg[0]}, ${scene.bg[1]})`,
          animation: `bgPulse ${bgDuration}s ease-in-out infinite`,
        }}
      />

      {/* Layer 2: Floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            lineHeight: 1,
            animation: `float${p.variant} ${p.duration.toFixed(2)}s ease-in-out ${p.delay.toFixed(2)}s infinite`,
            willChange: 'transform',
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Layer 3: Horizon decoration */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end pb-2" style={{ height: '18vh' }}>
        {Array.from({ length: scene.horizonCount }, (_, i) => (
          <span
            key={i}
            style={{
              fontSize: `${38 + seededFloat(seed, 900 + i) * 28}px`,
              lineHeight: 1,
              animation: `horizonSway ${2.5 + seededFloat(seed, 910 + i) * 2}s ease-in-out ${(seededFloat(seed, 920 + i) * 2).toFixed(2)}s infinite`,
            }}
          >
            {scene.horizonEmoji}
          </span>
        ))}
      </div>

      {/* Layer 4: Main character */}
      <div
        className="absolute pointer-events-none"
        role="img"
        aria-label={scene.characterLabel}
        style={{
          left: '50%',
          top: '42%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(130px, 18vw, 200px)',
          lineHeight: 1,
          filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
          animation: `char${charAnim} ${charDuration.toFixed(2)}s ease-in-out infinite`,
          willChange: 'transform',
        }}
      >
        {scene.character}
      </div>

      {/* Layer 5: Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  )
}
