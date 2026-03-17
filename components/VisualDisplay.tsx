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
  // Animals
  robot:      { character:'🤖', characterLabel:'Robot',       bg:['#0d0d2b','#1a0533'], horizonEmoji:'⚙️',  horizonCount:5, particleEmoji:['✨','⚡','🔷','💠'], particleCount:14 },
  alien:      { character:'👾', characterLabel:'Alien',       bg:['#000820','#0a0a2e'], horizonEmoji:'🌍',  horizonCount:3, particleEmoji:['⭐','🌟','💫','🛸'], particleCount:16 },
  fox:        { character:'🦊', characterLabel:'Fox',         bg:['#1a1a2e','#16213e'], horizonEmoji:'🏙️',  horizonCount:4, particleEmoji:['🎵','🎶','💿','✨'], particleCount:12 },
  unicorn:    { character:'🦄', characterLabel:'Unicorn',     bg:['#ff9de2','#c9b1ff'], horizonEmoji:'🌈',  horizonCount:4, particleEmoji:['⭐','🌸','💖','✨'], particleCount:18 },
  cat:        { character:'🐱', characterLabel:'Cat',         bg:['#2d1b33','#1a0d26'], horizonEmoji:'🎵',  horizonCount:5, particleEmoji:['🎵','🎶','🎤','✨'], particleCount:12 },
  swan:       { character:'🦢', characterLabel:'Swan',        bg:['#e8f4f8','#b8d4e8'], horizonEmoji:'🎼',  horizonCount:4, particleEmoji:['🎵','🌸','❄️','✨'], particleCount:13 },
  cowboy:     { character:'🤠', characterLabel:'Cowboy',      bg:['#d4884b','#8b4513'], horizonEmoji:'🌵',  horizonCount:5, particleEmoji:['🌟','⭐','☀️','✨'], particleCount:11 },
  bear:       { character:'🐻', characterLabel:'Bear',        bg:['#2d4a22','#1a2e12'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['🍂','🍁','🌿','⭐'], particleCount:12 },
  lion:       { character:'🦁', characterLabel:'Lion',        bg:['#d4884b','#8b6914'], horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','☀️','🦋','✨'], particleCount:13 },
  turtle:     { character:'🐢', characterLabel:'Turtle',      bg:['#1a4a2e','#0d2e1a'], horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','☀️','🎵'], particleCount:11 },
  parrot:     { character:'🦜', characterLabel:'Parrot',      bg:['#ff6b35','#f7931e'], horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','🦋','☀️'], particleCount:14 },
  butterfly:  { character:'🦋', characterLabel:'Butterfly',   bg:['#7b2d8b','#e91e8c'], horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','🌺','💖','✨'], particleCount:16 },
  hedgehog:   { character:'🦔', characterLabel:'Hedgehog',    bg:['#4a3728','#2d1f1a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🍂','🌿','⭐','🎵'], particleCount:11 },
  chick:      { character:'🐥', characterLabel:'Chick',       bg:['#fff9c4','#ffe082'], horizonEmoji:'🌼',  horizonCount:6, particleEmoji:['🌸','⭐','💛','🌼'], particleCount:15 },
  dragon:     { character:'🐉', characterLabel:'Dragon',      bg:['#1a0000','#2d0a00'], horizonEmoji:'🌋',  horizonCount:3, particleEmoji:['🔥','✨','⭐','💫'], particleCount:14 },
  moon:       { character:'🌙', characterLabel:'Moon',        bg:['#0d0d1a','#1a1a2e'], horizonEmoji:'⭐',  horizonCount:6, particleEmoji:['💫','✨','🌟','⭐'], particleCount:18 },
  flamingo:   { character:'🦩', characterLabel:'Flamingo',    bg:['#ff9de2','#ffb3c6'], horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','💖','🌺','✨'], particleCount:15 },
  dolphin:    { character:'🐬', characterLabel:'Dolphin',     bg:['#0077b6','#023e8a'], horizonEmoji:'🌊',  horizonCount:5, particleEmoji:['🐠','🐡','⭐','🫧'],  particleCount:14 },
  rocket:     { character:'🚀', characterLabel:'Rocket',      bg:['#020014','#0a0030'], horizonEmoji:'🪐',  horizonCount:3, particleEmoji:['⭐','🌟','💫','✨'], particleCount:20 },
  owl:        { character:'🦉', characterLabel:'Owl',         bg:['#0d1117','#161b22'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['✨','🌟','🍂','💫'], particleCount:12 },
  wolf:       { character:'🐺', characterLabel:'Wolf',        bg:['#1a2040','#0d1030'], horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['⭐','💨','🌑','✨'], particleCount:13 },
  koala:      { character:'🐨', characterLabel:'Koala',       bg:['#b8d4b8','#7aa87a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','⭐','🌸'], particleCount:12 },
  penguin:    { character:'🐧', characterLabel:'Penguin',     bg:['#c8e6ff','#e8f4ff'], horizonEmoji:'❄️',  horizonCount:5, particleEmoji:['❄️','⭐','🌨️','✨'], particleCount:14 },
  bat:        { character:'🦇', characterLabel:'Bat',         bg:['#0d0015','#1a0033'], horizonEmoji:'🦇',  horizonCount:4, particleEmoji:['✨','💫','🌑','⭐'], particleCount:12 },
  frog:       { character:'🐸', characterLabel:'Frog',        bg:['#2d5a2d','#1a3a1a'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['💧','🌿','⭐','🍃'], particleCount:12 },
  tiger:      { character:'🐯', characterLabel:'Tiger',       bg:['#cc5500','#8b3a00'], horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','☀️','✨','⭐'], particleCount:13 },
  panda:      { character:'🐼', characterLabel:'Panda',       bg:['#e8f5e9','#c8e6c9'], horizonEmoji:'🎋',  horizonCount:5, particleEmoji:['🌿','⭐','🌸','✨'], particleCount:12 },
  shark:      { character:'🦈', characterLabel:'Shark',       bg:['#003366','#001a33'], horizonEmoji:'🌊',  horizonCount:4, particleEmoji:['💧','🫧','⭐','🐟'], particleCount:14 },
  horse:      { character:'🐴', characterLabel:'Horse',       bg:['#8b6914','#5a4500'], horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','⭐','☀️','🌸'], particleCount:11 },
  dinosaur:   { character:'🦕', characterLabel:'Dinosaur',    bg:['#1a3300','#0d2200'], horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','⭐','🌺'], particleCount:13 },
  // Heroes & fantasy
  superhero:  { character:'🦸', characterLabel:'Superhero',   bg:['#1a1a3e','#0d0d2e'], horizonEmoji:'🏙️', horizonCount:4, particleEmoji:['⭐','💫','⚡','✨'], particleCount:16 },
  ninja:      { character:'🥷', characterLabel:'Ninja',       bg:['#0a0a0a','#1a0a00'], horizonEmoji:'⛩️', horizonCount:3, particleEmoji:['🌸','💫','⭐','🌟'], particleCount:14 },
  wizard:     { character:'🧙', characterLabel:'Wizard',      bg:['#1a0033','#0d001a'], horizonEmoji:'✨',  horizonCount:5, particleEmoji:['✨','💫','⭐','🌙'], particleCount:16 },
  princess:   { character:'👸', characterLabel:'Princess',    bg:['#ffb3d9','#ff80b3'], horizonEmoji:'🏰', horizonCount:3, particleEmoji:['💖','⭐','🌸','✨'], particleCount:15 },
  fairy:      { character:'🧚', characterLabel:'Fairy',       bg:['#c8e6c9','#a5d6a7'], horizonEmoji:'🌸', horizonCount:6, particleEmoji:['✨','🌸','💚','⭐'], particleCount:18 },
  mermaid:    { character:'🧜', characterLabel:'Mermaid',     bg:['#006994','#004d75'], horizonEmoji:'🌊', horizonCount:5, particleEmoji:['🐠','🐡','💧','🫧'], particleCount:14 },
  astronaut:  { character:'👨‍🚀', characterLabel:'Astronaut', bg:['#020014','#050028'], horizonEmoji:'🌍', horizonCount:3, particleEmoji:['⭐','🌟','💫','🪐'], particleCount:20 },
}

// ─── Character pools per vibe ─────────────────────────────────────────────────
// Each pool has 4-6 options — trackId seed picks one, so every song is different

const POOLS: Record<string, string[]> = {
  electronic:    ['robot', 'alien', 'ninja', 'rocket', 'astronaut'],
  metal_punk:    ['dragon', 'wolf', 'bat', 'shark', 'ninja'],
  hip_hop:       ['fox', 'ninja', 'lion', 'superhero', 'wolf', 'tiger'],
  pop_happy:     ['unicorn', 'flamingo', 'chick', 'princess', 'fairy', 'butterfly', 'panda'],
  pop_sad:       ['cat', 'butterfly', 'koala', 'penguin', 'moon'],
  jazz_blues:    ['cat', 'fox', 'owl', 'hedgehog', 'bear'],
  classical:     ['swan', 'wizard', 'butterfly', 'mermaid', 'fairy', 'unicorn'],
  country_folk:  ['cowboy', 'bear', 'horse', 'owl', 'frog'],
  rock:          ['lion', 'dragon', 'wolf', 'superhero', 'shark', 'tiger'],
  reggae:        ['turtle', 'parrot', 'frog', 'dolphin'],
  latin:         ['parrot', 'flamingo', 'tiger', 'butterfly', 'frog'],
  rnb_soul:      ['butterfly', 'flamingo', 'cat', 'fox', 'mermaid'],
  indie_alt:     ['hedgehog', 'fox', 'owl', 'penguin', 'cat', 'bear'],
  children:      ['chick', 'frog', 'panda', 'dinosaur', 'unicorn', 'bear', 'fairy', 'chick'],
  ambient:       ['moon', 'owl', 'fairy', 'mermaid', 'wizard', 'astronaut'],
  anime:         ['dragon', 'ninja', 'wizard', 'fairy', 'superhero', 'princess', 'cat'],
  // Audio-feature fallback pools
  intense_happy: ['lion', 'superhero', 'tiger', 'dragon', 'parrot', 'ninja'],
  intense_sad:   ['wolf', 'bat', 'shark', 'dragon', 'ninja'],
  calm_happy:    ['koala', 'fairy', 'panda', 'chick', 'butterfly', 'mermaid', 'swan'],
  calm_sad:      ['penguin', 'owl', 'moon', 'bear', 'koala'],
  danceable:     ['flamingo', 'parrot', 'unicorn', 'chick', 'frog', 'butterfly'],
  happy:         ['unicorn', 'flamingo', 'chick', 'panda', 'fairy', 'princess'],
  sad:           ['wolf', 'penguin', 'moon', 'koala', 'bat'],
  default:       ['frog', 'cat', 'hedgehog', 'koala', 'penguin', 'bear', 'owl', 'panda', 'superhero', 'wizard'],
}

function pickFromPool(pool: string[], seed: number): SceneConfig {
  const key = pool[Math.floor(seededFloat(seed, 9999) * pool.length)]
  return SCENES[key] ?? SCENES.frog
}

// ─── Scene selection ─────────────────────────────────────────────────────────

function selectScene(track: NowPlayingTrack, seed: number): SceneConfig {
  const g = track.genres.join(' ').toLowerCase()
  const t = track.title.toLowerCase()
  const { energy, valence, danceability } = track

  // Genre pools — each song picks a different character from the pool
  if (/metal|hardcore|punk/.test(g))                return pickFromPool(POOLS.metal_punk, seed)
  if (/electronic|edm|synth|techno|house/.test(g))  return pickFromPool(POOLS.electronic, seed)
  if (/hip.?hop|rap|trap|drill/.test(g))            return pickFromPool(POOLS.hip_hop, seed)
  if (/k-?pop|j-?pop|anime|vocaloid/.test(g))       return pickFromPool(POOLS.anime, seed)
  if (/pop/.test(g))                                return valence > 0.55 ? pickFromPool(POOLS.pop_happy, seed) : pickFromPool(POOLS.pop_sad, seed)
  if (/jazz|blues|soul|funk/.test(g))               return pickFromPool(POOLS.jazz_blues, seed)
  if (/classical|orchestra|piano|chamber/.test(g))  return pickFromPool(POOLS.classical, seed)
  if (/country|folk|bluegrass/.test(g))             return pickFromPool(POOLS.country_folk, seed)
  if (/rock/.test(g))                               return pickFromPool(POOLS.rock, seed)
  if (/reggae|ska|dancehall/.test(g))               return pickFromPool(POOLS.reggae, seed)
  if (/latin|salsa|cumbia|merengue/.test(g))        return pickFromPool(POOLS.latin, seed)
  if (/r&b|rnb|neo.?soul/.test(g))                 return pickFromPool(POOLS.rnb_soul, seed)
  if (/indie|alternative|shoegaze/.test(g))         return pickFromPool(POOLS.indie_alt, seed)
  if (/children|kids|nursery/.test(g))              return pickFromPool(POOLS.children, seed)
  if (/ambient|new.?age|meditation|sleep/.test(g))  return pickFromPool(POOLS.ambient, seed)

  // Title keyword overrides
  if (/ocean|sea|wave|surf|beach/.test(t))          return pickFromPool(['dolphin', 'mermaid', 'shark'], seed)
  if (/space|star|galaxy|cosmos|orbit/.test(t))     return pickFromPool(['rocket', 'astronaut', 'alien'], seed)
  if (/fire|flame|burn|inferno/.test(t))            return pickFromPool(['dragon', 'tiger', 'ninja'], seed)
  if (/love|heart|angel/.test(t))                   return pickFromPool(['butterfly', 'fairy', 'princess', 'unicorn'], seed)
  if (/night|dark|shadow|midnight/.test(t))         return pickFromPool(['bat', 'wolf', 'ninja', 'moon'], seed)
  if (/dream|sleep|cloud/.test(t))                  return pickFromPool(['moon', 'fairy', 'unicorn'], seed)
  if (/jungle|wild|safari|roar/.test(t))            return pickFromPool(['lion', 'tiger', 'parrot', 'dinosaur'], seed)
  if (/snow|ice|winter|freeze/.test(t))             return pickFromPool(['penguin', 'owl', 'bear'], seed)
  if (/magic|spell|wizard/.test(t))                 return pickFromPool(['wizard', 'fairy', 'unicorn', 'dragon'], seed)
  if (/hero|super|power|save/.test(t))              return pickFromPool(['superhero', 'ninja', 'lion', 'dragon'], seed)

  // Audio feature fallbacks
  if (energy > 0.75 && valence > 0.6)   return pickFromPool(POOLS.intense_happy, seed)
  if (energy > 0.75)                     return pickFromPool(POOLS.intense_sad, seed)
  if (energy < 0.35 && valence > 0.6)   return pickFromPool(POOLS.calm_happy, seed)
  if (energy < 0.35)                     return pickFromPool(POOLS.calm_sad, seed)
  if (danceability > 0.75)               return pickFromPool(POOLS.danceable, seed)
  if (valence > 0.7)                     return pickFromPool(POOLS.happy, seed)
  if (valence < 0.35)                    return pickFromPool(POOLS.sad, seed)

  return pickFromPool(POOLS.default, seed)
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
  // 1 beat = 1 full bounce cycle
  const beatSec = 60 / (tempo || 120)
  const charDuration = Math.max(0.3, Math.min(2.0, beatSec))

  // Bounce height: barely moves when calm, big jumps when energetic
  const bounceH  = Math.round(energy * 68)          // 0–68px
  const squishY  = +(1 - energy * 0.20).toFixed(3)  // scaleY on landing (squish)
  const stretchY = +(1 + energy * 0.24).toFixed(3)  // scaleY at peak (stretch)
  const squishX  = +(1 / squishY).toFixed(3)
  const stretchX = +(1 / stretchY).toFixed(3)

  const particleDuration = Math.max(1.2, 5 - energy * 3.5)
  const bgDuration = Math.max(1.5, 5 - energy * 3)

  let charAnim: 'Bounce' | 'Dance' | 'Pulse'
  if (energy < 0.25)                            charAnim = 'Pulse'
  else if (energy > 0.68 && danceability > 0.6) charAnim = 'Dance'
  else                                           charAnim = 'Bounce'

  return { charDuration, bounceH, squishY, squishX, stretchY, stretchX, particleDuration, bgDuration, charAnim }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisualDisplay({ track }: Props) {
  const seed    = useMemo(() => hashCode(track?.trackId ?? ''), [track?.trackId])
  const scene   = useMemo(() => track ? selectScene(track, seed) : null,         [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps
  const speeds  = useMemo(() => track ? getAnimationSpeeds(track) : null,        [track?.trackId]) // eslint-disable-line react-hooks/exhaustive-deps
  const particles = useMemo(
    () => scene && speeds ? buildParticles(scene, seed, speeds.particleDuration) : [],
    [track?.trackId] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!track || !scene || !speeds) return <div className="fixed inset-0 bg-black" />

  const { charDuration, bounceH, squishY, squishX, stretchY, stretchX, bgDuration, charAnim } = speeds
  const halfH = Math.round(bounceH * 0.55)

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <style>{`
        /* Beat-synced bounce with squish & stretch */
        @keyframes charBounce {
          0%,100% { transform: translateY(0)       scaleY(${squishY}) scaleX(${squishX}); }
          12%      { transform: translateY(0)       scaleY(1)          scaleX(1); }
          45%,55%  { transform: translateY(-${bounceH}px) scaleY(${stretchY}) scaleX(${stretchX}); }
          88%      { transform: translateY(0)       scaleY(1)          scaleX(1); }
        }
        @keyframes charDance {
          0%   { transform: translateY(0)          rotate(-8deg)  scaleX(1);    }
          18%  { transform: translateY(-${halfH}px) rotate(8deg)  scaleX(0.88); }
          38%  { transform: translateY(-${bounceH}px) rotate(-11deg) scaleX(${stretchX}); }
          58%  { transform: translateY(-${halfH}px) rotate(11deg) scaleX(0.9);  }
          78%  { transform: translateY(-${Math.round(bounceH*0.7)}px) rotate(-7deg) scaleX(1.05); }
          100% { transform: translateY(0)          rotate(-8deg)  scaleX(1);    }
        }
        @keyframes charPulse {
          0%,100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(${1 + (speeds.stretchY - 1) * 0.5}); opacity: 1; }
        }
        @keyframes popUp {
          0%   { transform: translateY(30px) scale(0) rotate(-20deg); opacity:0; }
          50%  { transform: translateY(-8px)  scale(1.3) rotate(5deg);  opacity:1; }
          70%  { transform: translateY(2px)   scale(0.92) rotate(-2deg); opacity:1; }
          100% { transform: translateY(-60px) scale(0.7) rotate(10deg);  opacity:0; }
        }
        @keyframes float1 {
          0%,100% { transform: translateY(0)    translateX(0)    rotate(0deg);   }
          33%      { transform: translateY(-24px) translateX(10px) rotate(13deg); }
          66%      { transform: translateY(-10px) translateX(-8px) rotate(-7deg); }
        }
        @keyframes float2 {
          0%,100% { transform: translateY(0)    translateX(0)     rotate(0deg); opacity:.8; }
          50%      { transform: translateY(-34px) translateX(-14px) rotate(17deg); opacity:1; }
        }
        @keyframes float3 {
          0%,100% { transform: scale(1)    rotate(0deg);  opacity:.7; }
          25%      { transform: scale(1.18) rotate(10deg); opacity:.9; }
          75%      { transform: scale(0.84) rotate(-10deg); opacity:1; }
        }
        @keyframes bgPulse {
          0%,100% { opacity:.9; }
          50%      { opacity:1;  }
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

      {/* Layer 2: Floating particles — popUp for high energy, float otherwise */}
      {particles.map((p, i) => {
        const usePopUp = track.energy > 0.65 && i % 3 === 0
        return (
          <span
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: usePopUp ? '90%' : `${p.y}%`,
              fontSize: `${p.size}px`,
              lineHeight: 1,
              animation: usePopUp
                ? `popUp ${p.duration.toFixed(2)}s ease-out ${p.delay.toFixed(2)}s infinite`
                : `float${p.variant} ${p.duration.toFixed(2)}s ease-in-out ${p.delay.toFixed(2)}s infinite`,
              willChange: 'transform',
            }}
          >
            {p.emoji}
          </span>
        )
      })}

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

      {/* Layer 4: Main character — re-mounts on each track for pop-in */}
      <div
        key={track.trackId}
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
