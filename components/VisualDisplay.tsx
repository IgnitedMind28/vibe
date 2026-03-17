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
  glowColor: string
  horizonEmoji: string
  horizonCount: number
  particleEmoji: string[]
  particleCount: number
}

interface SceneResult {
  sceneKey: string
  scene: SceneConfig
  pool: string[]
}

interface Particle {
  emoji: string
  x: number
  y: number
  size: number
  delay: number
  duration: number
  variant: 1 | 2 | 3 | 4 | 5
}

interface Companion {
  emoji: string
  orbitRadius: number
  orbitDuration: number
  startAngle: number
  size: number
}

type CharAnimName = 'grooveDance' | 'zipZag' | 'spinJump' | 'flappyFloat' | 'wobbleDream' | 'pulseDream'

// ─── Scene library ───────────────────────────────────────────────────────────

const SCENES: Record<string, SceneConfig> = {
  robot:     { character:'🤖', characterLabel:'Robot',     bg:['#0d0d2b','#1a0533'], glowColor:'#00f5ff', horizonEmoji:'⚙️',  horizonCount:5, particleEmoji:['✨','⚡','🔷','💠'], particleCount:14 },
  alien:     { character:'👾', characterLabel:'Alien',     bg:['#000820','#0a0a2e'], glowColor:'#00ff88', horizonEmoji:'🌍',  horizonCount:3, particleEmoji:['⭐','🌟','💫','🛸'], particleCount:16 },
  fox:       { character:'🦊', characterLabel:'Fox',       bg:['#1a1a2e','#16213e'], glowColor:'#ff8c00', horizonEmoji:'🏙️', horizonCount:4, particleEmoji:['🎵','🎶','💿','✨'], particleCount:12 },
  unicorn:   { character:'🦄', characterLabel:'Unicorn',   bg:['#ff9de2','#c9b1ff'], glowColor:'#ff80ff', horizonEmoji:'🌈',  horizonCount:4, particleEmoji:['⭐','🌸','💖','✨'], particleCount:18 },
  cat:       { character:'🐱', characterLabel:'Cat',       bg:['#2d1b33','#1a0d26'], glowColor:'#cc88ff', horizonEmoji:'🎵',  horizonCount:5, particleEmoji:['🎵','🎶','🎤','✨'], particleCount:12 },
  swan:      { character:'🦢', characterLabel:'Swan',      bg:['#e8f4f8','#b8d4e8'], glowColor:'#88ccff', horizonEmoji:'🎼',  horizonCount:4, particleEmoji:['🎵','🌸','❄️','✨'], particleCount:13 },
  cowboy:    { character:'🤠', characterLabel:'Cowboy',    bg:['#d4884b','#8b4513'], glowColor:'#ffcc44', horizonEmoji:'🌵',  horizonCount:5, particleEmoji:['🌟','⭐','☀️','✨'], particleCount:11 },
  bear:      { character:'🐻', characterLabel:'Bear',      bg:['#2d4a22','#1a2e12'], glowColor:'#ff9944', horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['🍂','🍁','🌿','⭐'], particleCount:12 },
  lion:      { character:'🦁', characterLabel:'Lion',      bg:['#d4884b','#8b6914'], glowColor:'#ffcc00', horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','☀️','🦋','✨'], particleCount:13 },
  turtle:    { character:'🐢', characterLabel:'Turtle',    bg:['#1a4a2e','#0d2e1a'], glowColor:'#44cc44', horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','☀️','🎵'], particleCount:11 },
  parrot:    { character:'🦜', characterLabel:'Parrot',    bg:['#ff6b35','#f7931e'], glowColor:'#ff6600', horizonEmoji:'🌴',  horizonCount:4, particleEmoji:['🌺','🌸','🦋','☀️'], particleCount:14 },
  butterfly: { character:'🦋', characterLabel:'Butterfly', bg:['#7b2d8b','#e91e8c'], glowColor:'#cc44ff', horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','🌺','💖','✨'], particleCount:16 },
  hedgehog:  { character:'🦔', characterLabel:'Hedgehog',  bg:['#4a3728','#2d1f1a'], glowColor:'#cc8844', horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🍂','🌿','⭐','🎵'], particleCount:11 },
  chick:     { character:'🐥', characterLabel:'Chick',     bg:['#fff9c4','#ffe082'], glowColor:'#ffee00', horizonEmoji:'🌼',  horizonCount:6, particleEmoji:['🌸','⭐','💛','🌼'], particleCount:15 },
  dragon:    { character:'🐉', characterLabel:'Dragon',    bg:['#1a0000','#2d0a00'], glowColor:'#ff4400', horizonEmoji:'🌋',  horizonCount:3, particleEmoji:['🔥','✨','⭐','💫'], particleCount:14 },
  moon:      { character:'🌙', characterLabel:'Moon',      bg:['#0d0d1a','#1a1a2e'], glowColor:'#ccddff', horizonEmoji:'⭐',  horizonCount:6, particleEmoji:['💫','✨','🌟','⭐'], particleCount:18 },
  flamingo:  { character:'🦩', characterLabel:'Flamingo',  bg:['#ff9de2','#ffb3c6'], glowColor:'#ff44aa', horizonEmoji:'🌸',  horizonCount:6, particleEmoji:['🌸','💖','🌺','✨'], particleCount:15 },
  dolphin:   { character:'🐬', characterLabel:'Dolphin',   bg:['#0077b6','#023e8a'], glowColor:'#44aaff', horizonEmoji:'🌊',  horizonCount:5, particleEmoji:['🐠','🐡','⭐','🫧'],  particleCount:14 },
  rocket:    { character:'🚀', characterLabel:'Rocket',    bg:['#020014','#0a0030'], glowColor:'#0088ff', horizonEmoji:'🪐',  horizonCount:3, particleEmoji:['⭐','🌟','💫','✨'], particleCount:20 },
  owl:       { character:'🦉', characterLabel:'Owl',       bg:['#0d1117','#161b22'], glowColor:'#ffaa00', horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['✨','🌟','🍂','💫'], particleCount:12 },
  wolf:      { character:'🐺', characterLabel:'Wolf',      bg:['#1a2040','#0d1030'], glowColor:'#8899cc', horizonEmoji:'🌲',  horizonCount:5, particleEmoji:['⭐','💨','🌑','✨'], particleCount:13 },
  koala:     { character:'🐨', characterLabel:'Koala',     bg:['#b8d4b8','#7aa87a'], glowColor:'#88bb88', horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','⭐','🌸'], particleCount:12 },
  penguin:   { character:'🐧', characterLabel:'Penguin',   bg:['#c8e6ff','#e8f4ff'], glowColor:'#aaccff', horizonEmoji:'❄️', horizonCount:5, particleEmoji:['❄️','⭐','🌨️','✨'], particleCount:14 },
  bat:       { character:'🦇', characterLabel:'Bat',       bg:['#0d0015','#1a0033'], glowColor:'#8833cc', horizonEmoji:'🦇',  horizonCount:4, particleEmoji:['✨','💫','🌑','⭐'], particleCount:12 },
  frog:      { character:'🐸', characterLabel:'Frog',      bg:['#2d5a2d','#1a3a1a'], glowColor:'#88ff44', horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['💧','🌿','⭐','🍃'], particleCount:12 },
  tiger:     { character:'🐯', characterLabel:'Tiger',     bg:['#cc5500','#8b3a00'], glowColor:'#ff8800', horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','☀️','✨','⭐'], particleCount:13 },
  panda:     { character:'🐼', characterLabel:'Panda',     bg:['#e8f5e9','#c8e6c9'], glowColor:'#cceecc', horizonEmoji:'🎋',  horizonCount:5, particleEmoji:['🌿','⭐','🌸','✨'], particleCount:12 },
  shark:     { character:'🦈', characterLabel:'Shark',     bg:['#003366','#001a33'], glowColor:'#0066cc', horizonEmoji:'🌊',  horizonCount:4, particleEmoji:['💧','🫧','⭐','🐟'], particleCount:14 },
  horse:     { character:'🐴', characterLabel:'Horse',     bg:['#8b6914','#5a4500'], glowColor:'#cc9944', horizonEmoji:'🌾',  horizonCount:6, particleEmoji:['🌟','⭐','☀️','🌸'], particleCount:11 },
  dinosaur:  { character:'🦕', characterLabel:'Dinosaur',  bg:['#1a3300','#0d2200'], glowColor:'#66cc44', horizonEmoji:'🌿',  horizonCount:5, particleEmoji:['🌿','🍃','⭐','🌺'], particleCount:13 },
  superhero: { character:'🦸', characterLabel:'Superhero', bg:['#1a1a3e','#0d0d2e'], glowColor:'#4488ff', horizonEmoji:'🏙️', horizonCount:4, particleEmoji:['⭐','💫','⚡','✨'], particleCount:16 },
  ninja:     { character:'🥷', characterLabel:'Ninja',     bg:['#0a0a0a','#1a0a00'], glowColor:'#cc0000', horizonEmoji:'⛩️', horizonCount:3, particleEmoji:['🌸','💫','⭐','🌟'], particleCount:14 },
  wizard:    { character:'🧙', characterLabel:'Wizard',    bg:['#1a0033','#0d001a'], glowColor:'#8844ff', horizonEmoji:'✨',  horizonCount:5, particleEmoji:['✨','💫','⭐','🌙'], particleCount:16 },
  princess:  { character:'👸', characterLabel:'Princess',  bg:['#ffb3d9','#ff80b3'], glowColor:'#ff88cc', horizonEmoji:'🏰', horizonCount:3, particleEmoji:['💖','⭐','🌸','✨'], particleCount:15 },
  fairy:     { character:'🧚', characterLabel:'Fairy',     bg:['#c8e6c9','#a5d6a7'], glowColor:'#44ff88', horizonEmoji:'🌸', horizonCount:6, particleEmoji:['✨','🌸','💚','⭐'], particleCount:18 },
  mermaid:   { character:'🧜', characterLabel:'Mermaid',   bg:['#006994','#004d75'], glowColor:'#00ccaa', horizonEmoji:'🌊', horizonCount:5, particleEmoji:['🐠','🐡','💧','🫧'], particleCount:14 },
  astronaut: { character:'👨‍🚀', characterLabel:'Astronaut', bg:['#020014','#050028'], glowColor:'#0099ff', horizonEmoji:'🌍', horizonCount:3, particleEmoji:['⭐','🌟','💫','🪐'], particleCount:20 },
}

// ─── Character pools per vibe ─────────────────────────────────────────────────

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
  children:      ['chick', 'frog', 'panda', 'dinosaur', 'unicorn', 'bear', 'fairy'],
  ambient:       ['moon', 'owl', 'fairy', 'mermaid', 'wizard', 'astronaut'],
  anime:         ['dragon', 'ninja', 'wizard', 'fairy', 'superhero', 'princess', 'cat'],
  intense_happy: ['lion', 'superhero', 'tiger', 'dragon', 'parrot', 'ninja'],
  intense_sad:   ['wolf', 'bat', 'shark', 'dragon', 'ninja'],
  calm_happy:    ['koala', 'fairy', 'panda', 'chick', 'butterfly', 'mermaid', 'swan'],
  calm_sad:      ['penguin', 'owl', 'moon', 'bear', 'koala'],
  danceable:     ['flamingo', 'parrot', 'unicorn', 'chick', 'frog', 'butterfly'],
  happy:         ['unicorn', 'flamingo', 'chick', 'panda', 'fairy', 'princess'],
  sad:           ['wolf', 'penguin', 'moon', 'koala', 'bat'],
  default:       ['frog', 'cat', 'hedgehog', 'koala', 'penguin', 'bear', 'owl', 'panda', 'superhero', 'wizard'],
}

function pickFromPool(pool: string[], seed: number): SceneResult {
  const idx = Math.floor(seededFloat(seed, 9999) * pool.length)
  const key = pool[idx] ?? pool[0]
  return { sceneKey: key, scene: SCENES[key] ?? SCENES.frog, pool }
}

// ─── Scene selection ─────────────────────────────────────────────────────────

function selectScene(track: NowPlayingTrack, seed: number): SceneResult {
  const g = track.genres.join(' ').toLowerCase()
  const t = track.title.toLowerCase()
  const { energy, valence, danceability } = track

  if (/metal|hardcore|punk/.test(g))               return pickFromPool(POOLS.metal_punk, seed)
  if (/electronic|edm|synth|techno|house/.test(g)) return pickFromPool(POOLS.electronic, seed)
  if (/hip.?hop|rap|trap|drill/.test(g))           return pickFromPool(POOLS.hip_hop, seed)
  if (/k-?pop|j-?pop|anime|vocaloid/.test(g))      return pickFromPool(POOLS.anime, seed)
  if (/pop/.test(g))                               return valence > 0.55 ? pickFromPool(POOLS.pop_happy, seed) : pickFromPool(POOLS.pop_sad, seed)
  if (/jazz|blues|soul|funk/.test(g))              return pickFromPool(POOLS.jazz_blues, seed)
  if (/classical|orchestra|piano|chamber/.test(g)) return pickFromPool(POOLS.classical, seed)
  if (/country|folk|bluegrass/.test(g))            return pickFromPool(POOLS.country_folk, seed)
  if (/rock/.test(g))                              return pickFromPool(POOLS.rock, seed)
  if (/reggae|ska|dancehall/.test(g))              return pickFromPool(POOLS.reggae, seed)
  if (/latin|salsa|cumbia|merengue/.test(g))       return pickFromPool(POOLS.latin, seed)
  if (/r&b|rnb|neo.?soul/.test(g))                return pickFromPool(POOLS.rnb_soul, seed)
  if (/indie|alternative|shoegaze/.test(g))        return pickFromPool(POOLS.indie_alt, seed)
  if (/children|kids|nursery/.test(g))             return pickFromPool(POOLS.children, seed)
  if (/ambient|new.?age|meditation|sleep/.test(g)) return pickFromPool(POOLS.ambient, seed)

  if (/ocean|sea|wave|surf|beach/.test(t))         return pickFromPool(['dolphin', 'mermaid', 'shark'], seed)
  if (/space|star|galaxy|cosmos|orbit/.test(t))    return pickFromPool(['rocket', 'astronaut', 'alien'], seed)
  if (/fire|flame|burn|inferno/.test(t))           return pickFromPool(['dragon', 'tiger', 'ninja'], seed)
  if (/love|heart|angel/.test(t))                  return pickFromPool(['butterfly', 'fairy', 'princess', 'unicorn'], seed)
  if (/night|dark|shadow|midnight/.test(t))        return pickFromPool(['bat', 'wolf', 'ninja', 'moon'], seed)
  if (/dream|sleep|cloud/.test(t))                 return pickFromPool(['moon', 'fairy', 'unicorn'], seed)
  if (/jungle|wild|safari|roar/.test(t))           return pickFromPool(['lion', 'tiger', 'parrot', 'dinosaur'], seed)
  if (/snow|ice|winter|freeze/.test(t))            return pickFromPool(['penguin', 'owl', 'bear'], seed)
  if (/magic|spell|wizard/.test(t))                return pickFromPool(['wizard', 'fairy', 'unicorn', 'dragon'], seed)
  if (/hero|super|power|save/.test(t))             return pickFromPool(['superhero', 'ninja', 'lion', 'dragon'], seed)

  if (energy > 0.75 && valence > 0.6)   return pickFromPool(POOLS.intense_happy, seed)
  if (energy > 0.75)                     return pickFromPool(POOLS.intense_sad, seed)
  if (energy < 0.35 && valence > 0.6)   return pickFromPool(POOLS.calm_happy, seed)
  if (energy < 0.35)                     return pickFromPool(POOLS.calm_sad, seed)
  if (danceability > 0.75)               return pickFromPool(POOLS.danceable, seed)
  if (valence > 0.7)                     return pickFromPool(POOLS.happy, seed)
  if (valence < 0.35)                    return pickFromPool(POOLS.sad, seed)

  return pickFromPool(POOLS.default, seed)
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function getCharAnim(track: NowPlayingTrack): CharAnimName {
  const { energy, danceability, valence } = track
  if (energy < 0.18)                         return 'pulseDream'
  if (energy < 0.38)                         return 'wobbleDream'
  if (energy > 0.78)                         return 'zipZag'
  if (energy > 0.55 && danceability > 0.70) return 'grooveDance'
  if (valence > 0.72 && danceability > 0.5) return 'flappyFloat'
  if (energy > 0.5)                          return 'spinJump'
  return 'wobbleDream'
}

function buildParticles(scene: SceneConfig, seed: number, baseDuration: number, energy: number): Particle[] {
  return Array.from({ length: scene.particleCount }, (_, i): Particle => {
    const r = (n: number) => seededFloat(seed, i * 20 + n)

    let variant: 1 | 2 | 3 | 4 | 5
    if (energy > 0.68 && i % 4 === 0)      variant = 1  // confettiFall
    else if (energy < 0.38 && i % 3 === 0) variant = 2  // bubbleRise
    else if (i % 6 === 0)                   variant = 4  // sparkleFlash
    else                                    variant = r(7) > 0.5 ? 3 : 5

    const yBase = variant === 1 ? r(2) * 8
                : variant === 2 ? 88 + r(2) * 10
                : r(2) * 80

    return {
      emoji:    scene.particleEmoji[Math.floor(r(0) * scene.particleEmoji.length)],
      x:        r(1) * 93,
      y:        yBase,
      size:     20 + Math.floor(r(3) * 34),
      delay:    r(4) * 8,
      duration: baseDuration * (0.5 + r(5) * 0.8),
      variant,
    }
  })
}

function buildCompanions(result: SceneResult, seed: number, beatSec: number): Companion[] {
  const others = result.pool.filter(k => k !== result.sceneKey && SCENES[k])
  if (others.length === 0) return []

  const count = Math.min(2, others.length)
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.floor(seededFloat(seed, 500 + i * 77) * others.length)
    const key = others[idx % others.length]
    return {
      emoji: SCENES[key].character,
      orbitRadius: 128 + i * 58,
      orbitDuration: Math.max(4, beatSec * (10 + i * 5)),
      startAngle: Math.floor(seededFloat(seed, 600 + i) * 360),
      size: 50 + i * 7,
    }
  })
}

function getAnimSpeeds(track: NowPlayingTrack) {
  const beatSec      = 60 / (track.tempo || 120)
  const charDuration = Math.max(0.4, Math.min(2.2, beatSec))
  const { energy }   = track
  const bounceH      = Math.round(energy * 72)
  const squishY      = +(1 - energy * 0.22).toFixed(3)
  const stretchY     = +(1 + energy * 0.28).toFixed(3)
  const squishX      = +(1 / squishY).toFixed(3)
  const stretchX     = +(1 / stretchY).toFixed(3)
  const particleDur  = Math.max(1.0, 5.5 - energy * 3.5)
  return { beatSec, charDuration, bounceH, squishY, squishX, stretchY, stretchX, particleDur }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisualDisplay({ track }: Props) {
  const seed       = useMemo(() => hashCode(track?.trackId ?? ''), [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result     = useMemo(() => track ? selectScene(track, seed) : null,       [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const speeds     = useMemo(() => track ? getAnimSpeeds(track) : null,           [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const charAnim   = useMemo(() => track ? getCharAnim(track) : 'wobbleDream',    [track?.trackId])
  const particles  = useMemo(
    () => result && speeds ? buildParticles(result.scene, seed, speeds.particleDur, track?.energy ?? 0.5) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track?.trackId]
  )
  const companions = useMemo(
    () => result && speeds ? buildCompanions(result, seed, speeds.beatSec) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track?.trackId]
  )

  if (!track || !result || !speeds) return <div className="fixed inset-0 bg-black" />

  const { scene }                                                    = result
  const { charDuration, bounceH, squishY, squishX, stretchY, stretchX } = speeds
  const halfH   = Math.round(bounceH * 0.5)
  const hh70    = Math.round(bounceH * 0.7)
  const hh40    = Math.round(bounceH * 0.4)
  const { glowColor } = scene
  const glowLow  = `${glowColor}33`
  const glowMed  = `${glowColor}88`
  const glowHigh = `${glowColor}cc`
  const orbDur   = (14 + seededFloat(seed, 777) * 8).toFixed(1)
  const bgDur    = Math.max(1.8, charDuration * 4).toFixed(2)

  const particleAnimName = (v: number) =>
    v === 1 ? 'confettiFall' :
    v === 2 ? 'bubbleRise'   :
    v === 3 ? 'sideFloat'    :
    v === 4 ? 'sparkleFlash' : 'spinFloat'

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <style>{`
        /* ══ Character animations ══════════════════════════════════════ */

        /* Groove Dance — figure-8 shuffle, beat-synced */
        @keyframes grooveDance {
          0%   { transform: translate(-35px,  6px)        rotate(-16deg) scaleX(0.87); }
          18%  { transform: translate(-12px, -${halfH}px) rotate(-4deg)  scaleY(${stretchY}); }
          36%  { transform: translate( 14px, -${bounceH}px) rotate( 9deg) scaleX(${stretchX}) scaleY(${stretchY}); }
          54%  { transform: translate( 35px,  6px)        rotate( 16deg) scaleX(0.87); }
          72%  { transform: translate( 12px, -${halfH}px) rotate(  4deg) scaleY(${stretchY}); }
          90%  { transform: translate(-14px, -${hh40}px)  rotate( -9deg) scaleX(${stretchX}); }
          100% { transform: translate(-35px,  6px)        rotate(-16deg) scaleX(0.87); }
        }

        /* Zip Zag — explosive diagonal burst for very high energy */
        @keyframes zipZag {
          0%   { transform: translate(-56px, 14px)        rotate(-23deg) scaleY(${squishY}) scaleX(${squishX}); }
          14%  { transform: translate(-18px, -${bounceH}px) rotate( 8deg) scaleY(${stretchY}) scaleX(${stretchX}); }
          28%  { transform: translate( 10px,   4px)       rotate(  2deg) scale(1); }
          42%  { transform: translate( 38px, -${hh70}px)  rotate(-15deg) scaleY(${stretchY}); }
          57%  { transform: translate( 56px, 14px)        rotate( 23deg) scaleY(${squishY}) scaleX(${squishX}); }
          71%  { transform: translate( 18px, -${bounceH}px) rotate(-8deg) scaleY(${stretchY}) scaleX(${stretchX}); }
          85%  { transform: translate(-10px,   4px)       rotate( -2deg) scale(1); }
          100% { transform: translate(-56px, 14px)        rotate(-23deg) scaleY(${squishY}) scaleX(${squishX}); }
        }

        /* Spin Jump — bouncing 360° spin */
        @keyframes spinJump {
          0%   { transform: translateY(0)           scaleY(${squishY}) scaleX(${squishX}) rotate(0deg); }
          22%  { transform: translateY(-${hh40}px)  scale(1)                               rotate(90deg); }
          50%  { transform: translateY(-${bounceH}px) scaleY(${stretchY}) scaleX(${stretchX}) rotate(180deg); }
          75%  { transform: translateY(-${hh40}px)  scale(1)                               rotate(270deg); }
          88%  { transform: translateY(0)           scaleY(${squishY}) scaleX(${squishX}) rotate(360deg); }
          100% { transform: translateY(0)           scaleY(${squishY}) scaleX(${squishX}) rotate(360deg); }
        }

        /* Flappy Float — wide flying arc, side-to-side */
        @keyframes flappyFloat {
          0%   { transform: translate(-54px, 14px)        rotate(-24deg) scaleY(0.87); }
          20%  { transform: translate(-16px, -${halfH}px) rotate( -7deg) scaleY(${stretchY}); }
          40%  { transform: translate(  6px, -${bounceH}px) rotate(  0deg) scaleY(${+(stretchY + 0.06).toFixed(3)}); }
          60%  { transform: translate( 54px, 14px)        rotate( 24deg) scaleY(0.87); }
          80%  { transform: translate( 16px, -${halfH}px) rotate(  7deg) scaleY(${stretchY}); }
          100% { transform: translate(-54px, 14px)        rotate(-24deg) scaleY(0.87); }
        }

        /* Wobble Dream — slow drifting figure for calm / low energy */
        @keyframes wobbleDream {
          0%   { transform: translate(   0px,   0px)      rotate(-6deg) scale(0.95); }
          20%  { transform: translate(  28px, -${halfH}px) rotate( 2deg) scale(1.02); }
          40%  { transform: translate(   8px, -${bounceH}px) rotate(-3deg) scale(1.06); }
          60%  { transform: translate( -24px, -${halfH}px) rotate( 5deg) scale(1.00); }
          80%  { transform: translate( -10px, -${hh40}px) rotate(-4deg) scale(0.98); }
          100% { transform: translate(   0px,   0px)      rotate(-6deg) scale(0.95); }
        }

        /* Pulse Dream — magical slow breathing, for near-silent tracks */
        @keyframes pulseDream {
          0%,100% { transform: scale(0.87) rotate(-4deg); opacity: 0.72; }
          35%     { transform: scale(1.15) rotate( 2deg); opacity: 1.00; }
          65%     { transform: scale(0.96) rotate( 4deg); opacity: 0.90; }
        }

        /* ══ Glow pulse ════════════════════════════════════════════════ */
        @keyframes glowPulse {
          0%,100% { filter: drop-shadow(0 0 16px ${glowLow})  drop-shadow(0 14px 30px rgba(0,0,0,0.55)); }
          50%     { filter: drop-shadow(0 0 50px ${glowHigh}) drop-shadow(0 14px 30px rgba(0,0,0,0.55)); }
        }

        /* ══ Particle animations ═══════════════════════════════════════ */

        /* 1 — confettiFall: cascade from top */
        @keyframes confettiFall {
          0%   { transform: translateY(-24px) rotate(  0deg); opacity: 1.0; }
          80%  { opacity: 1.0; }
          100% { transform: translateY(118vh) rotate(840deg); opacity: 0.0; }
        }
        /* 2 — bubbleRise: float up from bottom */
        @keyframes bubbleRise {
          0%   { transform: translateY(0)      translateX(  0px) scale(0.80); opacity: 0.5; }
          45%  { transform: translateY(-38vh)  translateX( 18px) scale(1.12); opacity: 0.9; }
          80%  { transform: translateY(-72vh)  translateX(-12px) scale(0.86); opacity: 0.6; }
          100% { transform: translateY(-97vh)  translateX(  5px) scale(0.60); opacity: 0.0; }
        }
        /* 3 — sideFloat: gentle drift */
        @keyframes sideFloat {
          0%,100% { transform: translateY(   0px) translateX(  0px) rotate(  0deg); opacity: 0.80; }
          30%     { transform: translateY( -30px) translateX( 14px) rotate( 16deg); opacity: 1.00; }
          65%     { transform: translateY( -14px) translateX(-10px) rotate( -9deg); opacity: 0.90; }
        }
        /* 4 — sparkleFlash: pop in and vanish */
        @keyframes sparkleFlash {
          0%   { transform: scale(0.0) rotate(-36deg); opacity: 0.0; }
          14%  { transform: scale(1.5) rotate( 10deg); opacity: 1.0; }
          35%  { transform: scale(0.9) rotate( -5deg); opacity: 0.9; }
          55%  { transform: scale(1.1) rotate(  6deg); opacity: 0.7; }
          80%  { transform: scale(0.5) rotate(-20deg); opacity: 0.3; }
          100% { transform: scale(0.0) rotate(-36deg); opacity: 0.0; }
        }
        /* 5 — spinFloat: slow spinning orbit in place */
        @keyframes spinFloat {
          0%,100% { transform: translateY(   0px) rotate(  0deg) scale(1.00); opacity: 0.75; }
          25%     { transform: translateY( -22px) rotate( 90deg) scale(1.16); opacity: 1.00; }
          50%     { transform: translateY( -40px) rotate(180deg) scale(0.90); opacity: 0.85; }
          75%     { transform: translateY( -18px) rotate(270deg) scale(1.10); opacity: 1.00; }
        }

        /* ══ Background ════════════════════════════════════════════════ */
        @keyframes bgPulse {
          0%,100% { opacity: 0.92; }
          50%     { opacity: 1.00; }
        }
        @keyframes orbDrift {
          0%   { transform: translate( -8%,   5%); opacity: 0.18; }
          30%  { transform: translate( 18%,  -6%); opacity: 0.26; }
          60%  { transform: translate( -3%, -14%); opacity: 0.14; }
          100% { transform: translate( -8%,   5%); opacity: 0.18; }
        }
        @keyframes horizonSway {
          0%,100% { transform: rotate(-2deg); }
          50%     { transform: rotate( 2deg); }
        }

        /* ══ Companion orbits ══════════════════════════════════════════ */
        ${companions.map((c, i) => `
        @keyframes orbit${i} {
          from { transform: rotate(${c.startAngle}deg)       translateX(${c.orbitRadius}px) rotate(-${c.startAngle}deg); }
          to   { transform: rotate(${c.startAngle + 360}deg) translateX(${c.orbitRadius}px) rotate(-${c.startAngle + 360}deg); }
        }`).join('')}
      `}</style>

      {/* ── Layer 1: Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(155deg, ${scene.bg[0]}, ${scene.bg[1]})`,
          animation: `bgPulse ${bgDur}s ease-in-out infinite`,
        }}
      />

      {/* ── Layer 2: Drifting colour orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '68vw', height: '68vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${glowMed} 0%, transparent 70%)`,
          top: '6%', left: '16%',
          animation: `orbDrift ${orbDur}s ease-in-out infinite`,
        }}
      />

      {/* ── Layer 3: Floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            lineHeight: 1,
            animation: `${particleAnimName(p.variant)} ${p.duration.toFixed(2)}s ease-in-out ${p.delay.toFixed(2)}s infinite`,
            willChange: 'transform',
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* ── Layer 4: Horizon decoration */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-around items-end pb-2"
        style={{ height: '18vh' }}
      >
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

      {/* ── Layer 5: Companion characters (orbit centre) */}
      <div
        className="absolute pointer-events-none"
        style={{ left: '50%', top: '42%', width: 0, height: 0 }}
      >
        {companions.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              animation: `orbit${i} ${c.orbitDuration.toFixed(2)}s linear ${(seededFloat(seed, 700 + i) * 2).toFixed(2)}s infinite`,
              willChange: 'transform',
            }}
          >
            {/* inner span centres the emoji at the orbit arm's endpoint */}
            <span
              style={{
                display: 'block',
                fontSize: `${c.size}px`,
                lineHeight: 1,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {c.emoji}
            </span>
          </div>
        ))}
      </div>

      {/* ── Layer 6: Main character */}
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
          animation: `${charAnim} ${charDuration.toFixed(2)}s ease-in-out infinite, glowPulse ${(charDuration * 2).toFixed(2)}s ease-in-out infinite`,
          willChange: 'transform, filter',
        }}
      >
        {scene.character}
      </div>

      {/* ── Layer 7: Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  )
}
