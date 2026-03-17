'use client'

import { useMemo } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props { track: NowPlayingTrack | null }

// ─── Deterministic random ──────────────────────────────────────────────────────
function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function rng(seed: number, n: number) {
  let s = ((seed + n * 6364136) >>> 0)
  s = ((1664525 * s + 1013904223) >>> 0)
  return s / 0x100000000
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type TraversalType = 'fly' | 'jump' | 'wave' | 'gallop' | 'float'

interface Scene {
  char: string; label: string
  traversal: TraversalType
  trail: [string, string, string]   // 3 emojis that follow behind
  midBurst: string                   // emoji explosion when character reaches center
  yBase: string                      // CSS bottom% — the traversal lane height
  baseDur: number                    // traversal seconds at 120bpm, energy=0.5
  bg: [string, string, string]       // 3-stop animated gradient
  glow: string
  horizon: string; horizonN: number  // ground/sky decoration row
  particles: string[]; particleN: number
}

interface SceneResult { key: string; scene: Scene }
interface Particle { e: string; x: number; y: number; sz: number; delay: number; dur: number }

// ─── Scene library — 37 characters with personality-driven traversal ───────────
const S: Record<string, Scene> = {
  // ── fly: arc across screen (swooping, soaring, wing-flapping) ──────────────
  dragon:    { char:'🐉', label:'Dragon',    traversal:'fly',    trail:['🔥','💨','✨'], midBurst:'🔥', yBase:'50%', baseDur:5,  bg:['#3a0000','#1a0000','#2d0a00'], glow:'#ff4400', horizon:'🌋', horizonN:3, particles:['🔥','✨','⭐','💫'], particleN:16 },
  rocket:    { char:'🚀', label:'Rocket',    traversal:'fly',    trail:['💨','🔥','⭐'], midBurst:'💥', yBase:'48%', baseDur:4,  bg:['#020014','#0a0030','#030020'], glow:'#0088ff', horizon:'🪐', horizonN:4, particles:['⭐','🌟','💫','✨'], particleN:24 },
  superhero: { char:'🦸', label:'Superhero', traversal:'fly',    trail:['💨','⚡','⭐'], midBurst:'⚡', yBase:'48%', baseDur:5,  bg:['#1a1a4e','#2a2a6e','#0d0d2e'], glow:'#4488ff', horizon:'🏙️', horizonN:4, particles:['⭐','💫','⚡','✨'], particleN:20 },
  fairy:     { char:'🧚', label:'Fairy',     traversal:'fly',    trail:['✨','🌸','💫'], midBurst:'✨', yBase:'50%', baseDur:7,  bg:['#c8e6c9','#88d8aa','#a5d6a7'], glow:'#44ff88', horizon:'🌸', horizonN:6, particles:['✨','🌸','💚','⭐'], particleN:22 },
  bat:       { char:'🦇', label:'Bat',       traversal:'fly',    trail:['💨','🌑','✨'], midBurst:'💜', yBase:'46%', baseDur:5,  bg:['#1a0033','#0d0015','#2a0044'], glow:'#aa44ff', horizon:'🦇', horizonN:4, particles:['✨','💫','🌑','⭐'], particleN:14 },
  flamingo:  { char:'🦩', label:'Flamingo',  traversal:'fly',    trail:['🌸','💖','✨'], midBurst:'🌸', yBase:'44%', baseDur:7,  bg:['#ff9de2','#ff6eb4','#ffb3c6'], glow:'#ff44aa', horizon:'🌸', horizonN:6, particles:['🌸','💖','🌺','✨'], particleN:18 },
  parrot:    { char:'🦜', label:'Parrot',    traversal:'fly',    trail:['🌺','✨','🌸'], midBurst:'💛', yBase:'46%', baseDur:5,  bg:['#ff6b35','#ffaa22','#f7931e'], glow:'#ff6600', horizon:'🌴', horizonN:4, particles:['🌺','🌸','🦋','☀️'], particleN:18 },
  alien:     { char:'👾', label:'Alien',     traversal:'fly',    trail:['💫','✨','🌟'], midBurst:'🛸', yBase:'46%', baseDur:5,  bg:['#001a3a','#000820','#0a1a2e'], glow:'#00ff88', horizon:'🌍', horizonN:3, particles:['⭐','🌟','💫','🛸'], particleN:20 },

  // ── jump: multi-bounce arcs across screen (parkour, leaping, hopping) ───────
  ninja:     { char:'🥷', label:'Ninja',     traversal:'jump',   trail:['💫','🌸','⭐'], midBurst:'⚡', yBase:'18%', baseDur:5,  bg:['#0a0a0a','#1a0a00','#050505'], glow:'#cc0000', horizon:'⛩️', horizonN:3, particles:['🌸','💫','⭐','🌟'], particleN:16 },
  frog:      { char:'🐸', label:'Frog',      traversal:'jump',   trail:['💧','🌿','✨'], midBurst:'💚', yBase:'18%', baseDur:6,  bg:['#1a5a1a','#2d5a2d','#0d3a0d'], glow:'#88ff44', horizon:'🌿', horizonN:5, particles:['💧','🌿','⭐','🍃'], particleN:14 },
  tiger:     { char:'🐯', label:'Tiger',     traversal:'jump',   trail:['⭐','✨','🌟'], midBurst:'🔥', yBase:'18%', baseDur:5,  bg:['#cc5500','#ff7722','#8b3a00'], glow:'#ff8800', horizon:'🌾', horizonN:6, particles:['🌟','☀️','✨','⭐'], particleN:15 },
  chick:     { char:'🐥', label:'Chick',     traversal:'jump',   trail:['🌸','💛','✨'], midBurst:'⭐', yBase:'18%', baseDur:6,  bg:['#ffe066','#fff176','#ffe082'], glow:'#ffee00', horizon:'🌼', horizonN:6, particles:['🌸','⭐','💛','🌼'], particleN:20 },
  dinosaur:  { char:'🦕', label:'Dinosaur',  traversal:'jump',   trail:['🌿','🍃','✨'], midBurst:'💚', yBase:'18%', baseDur:7,  bg:['#1a3300','#2a5500','#0d2200'], glow:'#66cc44', horizon:'🌿', horizonN:5, particles:['🌿','🍃','⭐','🌺'], particleN:15 },
  lion:      { char:'🦁', label:'Lion',      traversal:'jump',   trail:['⭐','🌟','✨'], midBurst:'👑', yBase:'18%', baseDur:5,  bg:['#d4884b','#ffaa33','#8b6914'], glow:'#ffcc00', horizon:'🌾', horizonN:6, particles:['🌟','☀️','🦋','✨'], particleN:16 },

  // ── wave: sinusoidal S-curve (swimming, gliding on wind currents) ────────────
  dolphin:   { char:'🐬', label:'Dolphin',   traversal:'wave',   trail:['💧','🫧','✨'], midBurst:'🌊', yBase:'36%', baseDur:8,  bg:['#0077b6','#0096c7','#023e8a'], glow:'#44aaff', horizon:'🌊', horizonN:5, particles:['🐠','🐡','⭐','🫧'], particleN:16 },
  butterfly: { char:'🦋', label:'Butterfly', traversal:'wave',   trail:['🌸','✨','💖'], midBurst:'🌸', yBase:'40%', baseDur:9,  bg:['#9b2d9b','#e91e8c','#7b2d8b'], glow:'#ff44ff', horizon:'🌸', horizonN:6, particles:['🌸','🌺','💖','✨'], particleN:20 },
  mermaid:   { char:'🧜', label:'Mermaid',   traversal:'wave',   trail:['💧','🐠','✨'], midBurst:'🌊', yBase:'38%', baseDur:8,  bg:['#006994','#0096c7','#004d75'], glow:'#00ccaa', horizon:'🌊', horizonN:5, particles:['🐠','🐡','💧','🫧'], particleN:16 },
  shark:     { char:'🦈', label:'Shark',     traversal:'wave',   trail:['💧','🫧','⭐'], midBurst:'💙', yBase:'32%', baseDur:6,  bg:['#003366','#004488','#001a33'], glow:'#0088cc', horizon:'🌊', horizonN:4, particles:['💧','🫧','⭐','🐟'], particleN:16 },
  cat:       { char:'🐱', label:'Cat',       traversal:'wave',   trail:['🎵','✨','💫'], midBurst:'🎵', yBase:'34%', baseDur:8,  bg:['#2d1b33','#4a1a66','#1a0d26'], glow:'#cc88ff', horizon:'🎵', horizonN:5, particles:['🎵','🎶','🎤','✨'], particleN:16 },
  swan:      { char:'🦢', label:'Swan',      traversal:'wave',   trail:['🌸','✨','❄️'], midBurst:'🎼', yBase:'36%', baseDur:9,  bg:['#c8e6ff','#e8f4f8','#b8d4e8'], glow:'#44aaff', horizon:'🎼', horizonN:4, particles:['🎵','🌸','❄️','✨'], particleN:15 },

  // ── gallop: ground-level power stride (thundering hooves, quick scurry) ─────
  unicorn:   { char:'🦄', label:'Unicorn',   traversal:'gallop', trail:['⭐','🌈','💖'], midBurst:'🌈', yBase:'20%', baseDur:5,  bg:['#ff9de2','#d4aaff','#c9b1ff'], glow:'#ff44ff', horizon:'🌈', horizonN:4, particles:['⭐','🌸','💖','✨'], particleN:22 },
  horse:     { char:'🐴', label:'Horse',     traversal:'gallop', trail:['💨','✨','⭐'], midBurst:'🌟', yBase:'18%', baseDur:5,  bg:['#8b6914','#aa8833','#5a4500'], glow:'#cc9944', horizon:'🌾', horizonN:6, particles:['🌟','⭐','☀️','🌸'], particleN:13 },
  fox:       { char:'🦊', label:'Fox',       traversal:'gallop', trail:['✨','🎵','⭐'], midBurst:'🎵', yBase:'18%', baseDur:5,  bg:['#1a1a2e','#2a1a0e','#16213e'], glow:'#ff8c00', horizon:'🏙️', horizonN:4, particles:['🎵','🎶','💿','✨'], particleN:16 },
  koala:     { char:'🐨', label:'Koala',     traversal:'gallop', trail:['🌿','🍃','✨'], midBurst:'💚', yBase:'18%', baseDur:8,  bg:['#b8d4b8','#88aa88','#7aa87a'], glow:'#66aa66', horizon:'🌿', horizonN:5, particles:['🌿','🍃','⭐','🌸'], particleN:14 },
  panda:     { char:'🐼', label:'Panda',     traversal:'gallop', trail:['🌿','⭐','✨'], midBurst:'🎋', yBase:'18%', baseDur:7,  bg:['#c8e6c9','#e8f5e9','#a8d6a9'], glow:'#44aa44', horizon:'🎋', horizonN:5, particles:['🌿','⭐','🌸','✨'], particleN:14 },
  cowboy:    { char:'🤠', label:'Cowboy',    traversal:'gallop', trail:['💨','⭐','🌵'], midBurst:'🌟', yBase:'18%', baseDur:5,  bg:['#d4884b','#ff9944','#8b4513'], glow:'#ffcc44', horizon:'🌵', horizonN:5, particles:['🌟','⭐','☀️','✨'], particleN:14 },
  hedgehog:  { char:'🦔', label:'Hedgehog',  traversal:'gallop', trail:['🌿','✨','⭐'], midBurst:'⭐', yBase:'16%', baseDur:6,  bg:['#4a3728','#6a4a38','#2d1f1a'], glow:'#cc8844', horizon:'🌿', horizonN:5, particles:['🍂','🌿','⭐','🎵'], particleN:13 },
  bear:      { char:'🐻', label:'Bear',      traversal:'gallop', trail:['🍂','🌿','✨'], midBurst:'🐾', yBase:'18%', baseDur:6,  bg:['#2d4a22','#4a6a2a','#1a2e12'], glow:'#ff9944', horizon:'🌲', horizonN:5, particles:['🍂','🍁','🌿','⭐'], particleN:14 },
  wolf:      { char:'🐺', label:'Wolf',      traversal:'gallop', trail:['💨','⭐','✨'], midBurst:'🌕', yBase:'18%', baseDur:5,  bg:['#1a2040','#2a3060','#0d1030'], glow:'#8899cc', horizon:'🌲', horizonN:5, particles:['⭐','💨','🌑','✨'], particleN:15 },
  penguin:   { char:'🐧', label:'Penguin',   traversal:'gallop', trail:['❄️','⭐','✨'], midBurst:'❄️', yBase:'16%', baseDur:8,  bg:['#a8d8ff','#c8e6ff','#e8f4ff'], glow:'#aaccff', horizon:'❄️', horizonN:5, particles:['❄️','⭐','🌨️','✨'], particleN:16 },
  turtle:    { char:'🐢', label:'Turtle',    traversal:'gallop', trail:['🌺','✨','⭐'], midBurst:'💚', yBase:'14%', baseDur:12, bg:['#1a4a2e','#2a6a3e','#0d2e1a'], glow:'#44cc44', horizon:'🌴', horizonN:4, particles:['🌺','🌸','☀️','🎵'], particleN:14 },

  // ── float: dreamy undulating drift (levitation, zero-G, mystical gliding) ────
  astronaut: { char:'👨‍🚀', label:'Astronaut', traversal:'float',  trail:['💨','🌟','✨'], midBurst:'💫', yBase:'48%', baseDur:9,  bg:['#020014','#050028','#030020'], glow:'#0099ff', horizon:'🌍', horizonN:3, particles:['⭐','🌟','💫','🪐'], particleN:24 },
  wizard:    { char:'🧙', label:'Wizard',    traversal:'float',  trail:['✨','💫','⭐'], midBurst:'✨', yBase:'46%', baseDur:9,  bg:['#1a0033','#2a0055','#0d001a'], glow:'#8844ff', horizon:'✨', horizonN:5, particles:['✨','💫','⭐','🌙'], particleN:20 },
  moon:      { char:'🌙', label:'Moon',      traversal:'float',  trail:['⭐','💫','🌟'], midBurst:'⭐', yBase:'52%', baseDur:12, bg:['#0d0d2a','#1a1a3e','#0a0a20'], glow:'#aabbff', horizon:'⭐', horizonN:7, particles:['💫','✨','🌟','⭐'], particleN:22 },
  owl:       { char:'🦉', label:'Owl',       traversal:'float',  trail:['✨','🍂','💫'], midBurst:'🦉', yBase:'46%', baseDur:10, bg:['#0d1117','#1a2030','#161b22'], glow:'#ffaa00', horizon:'🌲', horizonN:5, particles:['✨','🌟','🍂','💫'], particleN:14 },
  princess:  { char:'👸', label:'Princess',  traversal:'float',  trail:['💖','⭐','✨'], midBurst:'💖', yBase:'48%', baseDur:9,  bg:['#ffb3d9','#ff80b3','#ffccee'], glow:'#ff88cc', horizon:'🏰', horizonN:3, particles:['💖','⭐','🌸','✨'], particleN:18 },
  robot:     { char:'🤖', label:'Robot',     traversal:'float',  trail:['⚙️','✨','💠'], midBurst:'⚡', yBase:'44%', baseDur:7,  bg:['#0d1b4b','#0d0d2b','#1a0533'], glow:'#00f5ff', horizon:'⚙️', horizonN:5, particles:['✨','⚡','🔷','💠'], particleN:18 },
}

// ─── Genre/mood pools ──────────────────────────────────────────────────────────
const POOLS: Record<string, string[]> = {
  electronic:    ['robot','alien','ninja','rocket','astronaut'],
  metal_punk:    ['dragon','wolf','bat','shark','ninja'],
  hip_hop:       ['fox','ninja','lion','superhero','wolf','tiger'],
  pop_happy:     ['unicorn','flamingo','chick','princess','fairy','butterfly','panda'],
  pop_sad:       ['cat','butterfly','koala','penguin','moon'],
  jazz_blues:    ['cat','fox','owl','hedgehog','bear'],
  classical:     ['swan','wizard','butterfly','mermaid','fairy','unicorn'],
  country_folk:  ['cowboy','bear','horse','owl','frog'],
  rock:          ['lion','dragon','wolf','superhero','shark','tiger'],
  reggae:        ['turtle','parrot','frog','dolphin'],
  latin:         ['parrot','flamingo','tiger','butterfly','frog'],
  rnb_soul:      ['butterfly','flamingo','cat','fox','mermaid'],
  indie_alt:     ['hedgehog','fox','owl','penguin','cat','bear'],
  children:      ['chick','frog','panda','dinosaur','unicorn','bear','fairy'],
  ambient:       ['moon','owl','fairy','mermaid','wizard','astronaut'],
  anime:         ['dragon','ninja','wizard','fairy','superhero','princess','cat'],
  intense_happy: ['lion','superhero','tiger','dragon','parrot','ninja'],
  intense_sad:   ['wolf','bat','shark','dragon','ninja'],
  calm_happy:    ['koala','fairy','panda','chick','butterfly','mermaid','swan'],
  calm_sad:      ['penguin','owl','moon','bear','koala'],
  danceable:     ['flamingo','parrot','unicorn','chick','frog','butterfly'],
  happy:         ['unicorn','flamingo','chick','panda','fairy','princess'],
  sad:           ['wolf','penguin','moon','koala','bat'],
  default:       ['frog','cat','hedgehog','koala','penguin','bear','owl','panda','superhero','wizard'],
}

function pick(pool: string[], seed: number): SceneResult {
  const key = pool[Math.floor(rng(seed, 9999) * pool.length)] ?? pool[0]
  return { key, scene: S[key] ?? S.frog }
}

function selectScene(t: NowPlayingTrack, seed: number): SceneResult {
  const g = t.genres.join(' ').toLowerCase(), ti = t.title.toLowerCase()
  const { energy: e, valence: v, danceability: d } = t
  if (/metal|hardcore|punk/.test(g))               return pick(POOLS.metal_punk, seed)
  if (/electronic|edm|synth|techno|house/.test(g)) return pick(POOLS.electronic, seed)
  if (/hip.?hop|rap|trap|drill/.test(g))           return pick(POOLS.hip_hop, seed)
  if (/k-?pop|j-?pop|anime|vocaloid/.test(g))      return pick(POOLS.anime, seed)
  if (/pop/.test(g))                               return pick(v > 0.55 ? POOLS.pop_happy : POOLS.pop_sad, seed)
  if (/jazz|blues|soul|funk/.test(g))              return pick(POOLS.jazz_blues, seed)
  if (/classical|orchestra|piano|chamber/.test(g)) return pick(POOLS.classical, seed)
  if (/country|folk|bluegrass/.test(g))            return pick(POOLS.country_folk, seed)
  if (/rock/.test(g))                              return pick(POOLS.rock, seed)
  if (/reggae|ska|dancehall/.test(g))              return pick(POOLS.reggae, seed)
  if (/latin|salsa|cumbia|merengue/.test(g))       return pick(POOLS.latin, seed)
  if (/r&b|rnb|neo.?soul/.test(g))                return pick(POOLS.rnb_soul, seed)
  if (/indie|alternative|shoegaze/.test(g))        return pick(POOLS.indie_alt, seed)
  if (/children|kids|nursery/.test(g))             return pick(POOLS.children, seed)
  if (/ambient|new.?age|meditation|sleep/.test(g)) return pick(POOLS.ambient, seed)
  if (/ocean|sea|wave|surf|beach/.test(ti))        return pick(['dolphin','mermaid','shark'], seed)
  if (/space|star|galaxy|cosmos|orbit/.test(ti))   return pick(['rocket','astronaut','alien'], seed)
  if (/fire|flame|burn|inferno/.test(ti))          return pick(['dragon','tiger','ninja'], seed)
  if (/love|heart|angel/.test(ti))                 return pick(['butterfly','fairy','princess','unicorn'], seed)
  if (/night|dark|shadow|midnight/.test(ti))       return pick(['bat','wolf','ninja','moon'], seed)
  if (/dream|sleep|cloud/.test(ti))                return pick(['moon','fairy','unicorn'], seed)
  if (/jungle|wild|safari|roar/.test(ti))          return pick(['lion','tiger','parrot','dinosaur'], seed)
  if (/snow|ice|winter|freeze/.test(ti))           return pick(['penguin','owl','bear'], seed)
  if (/magic|spell|wizard/.test(ti))               return pick(['wizard','fairy','unicorn','dragon'], seed)
  if (/hero|super|power|save/.test(ti))            return pick(['superhero','ninja','lion','dragon'], seed)
  if (e > 0.75 && v > 0.6)  return pick(POOLS.intense_happy, seed)
  if (e > 0.75)              return pick(POOLS.intense_sad, seed)
  if (e < 0.35 && v > 0.6)  return pick(POOLS.calm_happy, seed)
  if (e < 0.35)              return pick(POOLS.calm_sad, seed)
  if (d > 0.75)              return pick(POOLS.danceable, seed)
  if (v > 0.7)               return pick(POOLS.happy, seed)
  if (v < 0.35)              return pick(POOLS.sad, seed)
  return pick(POOLS.default, seed)
}

// ─── Speed calculation ─────────────────────────────────────────────────────────
// Duration = how many seconds to cross the entire screen
// High energy → faster (lower duration). High tempo → faster.
function getTraversalDur(scene: Scene, track: NowPlayingTrack): number {
  const tempoFactor = 120 / (track.tempo || 120)
  const energyFactor = 1.4 - track.energy * 0.8   // energy 0→1 gives factor 1.4→0.6
  return Math.max(3, Math.min(13, scene.baseDur * tempoFactor * energyFactor))
}

// ─── Particles ─────────────────────────────────────────────────────────────────
function buildParticles(sc: Scene, seed: number, energy: number): Particle[] {
  return Array.from({ length: sc.particleN }, (_, i): Particle => {
    const r = (n: number) => rng(seed, i * 20 + n)
    return {
      e:     sc.particles[Math.floor(r(0) * sc.particles.length)],
      x:     r(1) * 94,
      y:     r(2) * 82,
      sz:    20 + Math.floor(r(3) * 34),
      delay: r(4) * 10,
      dur:   3 + r(5) * (7 - energy * 4),
    }
  })
}

// ─── CSS factory ───────────────────────────────────────────────────────────────
// Returns all @keyframes and utility rules for this track.
// Traversal keyframes are all static (only timing changes per track).
function buildCSS(glow: string, dur: number, bgFlowDur: string): string {
  const gL = `${glow}44`, gM = `${glow}99`, gH = `${glow}ee`

  return `
    /* ────── traversal paths ────── */

    /* fly: arc from lower-left → peaks high at center → lower-right */
    @keyframes tfly {
      0%   { transform: translateX(-18vw) translateY(15vh) rotate(-5deg); }
      20%  { transform: translateX(10vw) translateY(0vh) rotate(-12deg); }
      40%  { transform: translateX(32vw) translateY(-24vh) rotate(-8deg); }
      55%  { transform: translateX(50vw) translateY(-26vh) rotate(0deg); }
      70%  { transform: translateX(70vw) translateY(-14vh) rotate(10deg); }
      85%  { transform: translateX(90vw) translateY(4vh) rotate(12deg); }
      100% { transform: translateX(118vw) translateY(14vh) rotate(5deg); }
    }

    /* jump: 6 big gravity arcs across screen (physics-based ease-in/out per arc) */
    @keyframes tjump {
      0%   { transform: translateX(-18vw) translateY(0vh); animation-timing-function: ease-out; }
      7%   { transform: translateX(-5vw) translateY(-24vh); animation-timing-function: ease-in; }
      15%  { transform: translateX(10vw) translateY(0vh); animation-timing-function: ease-out; }
      23%  { transform: translateX(22vw) translateY(-26vh); animation-timing-function: ease-in; }
      32%  { transform: translateX(35vw) translateY(0vh); animation-timing-function: ease-out; }
      40%  { transform: translateX(44vw) translateY(-22vh); animation-timing-function: ease-in; }
      50%  { transform: translateX(50vw) translateY(0vh); animation-timing-function: ease-out; }
      60%  { transform: translateX(62vw) translateY(-20vh); animation-timing-function: ease-in; }
      68%  { transform: translateX(74vw) translateY(0vh); animation-timing-function: ease-out; }
      77%  { transform: translateX(86vw) translateY(-18vh); animation-timing-function: ease-in; }
      85%  { transform: translateX(96vw) translateY(0vh); animation-timing-function: ease-out; }
      93%  { transform: translateX(106vw) translateY(-14vh); animation-timing-function: ease-in; }
      100% { transform: translateX(118vw) translateY(0vh); }
    }

    /* wave: smooth S-curve (ocean leaps / wind-drift) */
    @keyframes twave {
      0%   { transform: translateX(-18vw) translateY(0vh) rotate(-12deg); }
      12%  { transform: translateX(0vw)   translateY(-20vh) rotate(-8deg); }
      25%  { transform: translateX(18vw)  translateY(0vh) rotate(0deg); }
      37%  { transform: translateX(35vw)  translateY(20vh) rotate(8deg); }
      50%  { transform: translateX(50vw)  translateY(0vh) rotate(0deg); }
      62%  { transform: translateX(65vw)  translateY(-20vh) rotate(-8deg); }
      75%  { transform: translateX(80vw)  translateY(0vh) rotate(0deg); }
      87%  { transform: translateX(95vw)  translateY(20vh) rotate(8deg); }
      100% { transform: translateX(118vw) translateY(0vh) rotate(-12deg); }
    }

    /* gallop: rapid ground-level stride with squash/stretch */
    @keyframes tgallop {
      0%   { transform: translateX(-18vw) translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      5%   { transform: translateX(-9vw)  translateY(-8vh) scaleX(0.90); animation-timing-function: ease-in; }
      10%  { transform: translateX(0vw)   translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      16%  { transform: translateX(10vw)  translateY(-9vh) scaleX(0.90); animation-timing-function: ease-in; }
      22%  { transform: translateX(20vw)  translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      28%  { transform: translateX(30vw)  translateY(-8vh) scaleX(0.90); animation-timing-function: ease-in; }
      34%  { transform: translateX(40vw)  translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      41%  { transform: translateX(48vw)  translateY(-9vh) scaleX(0.90); animation-timing-function: ease-in; }
      47%  { transform: translateX(53vw)  translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      53%  { transform: translateX(61vw)  translateY(-8vh) scaleX(0.90); animation-timing-function: ease-in; }
      59%  { transform: translateX(70vw)  translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      65%  { transform: translateX(78vw)  translateY(-8vh) scaleX(0.90); animation-timing-function: ease-in; }
      71%  { transform: translateX(86vw)  translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      77%  { transform: translateX(94vw)  translateY(-7vh) scaleX(0.90); animation-timing-function: ease-in; }
      83%  { transform: translateX(102vw) translateY(0vh) scaleX(1.08); animation-timing-function: ease-out; }
      91%  { transform: translateX(110vw) translateY(-6vh) scaleX(0.90); animation-timing-function: ease-in; }
      100% { transform: translateX(118vw) translateY(0vh) scaleX(1.0); }
    }

    /* float: dreamy irregular undulation (zero-G levitation) */
    @keyframes tfloat {
      0%   { transform: translateX(-18vw) translateY(5vh) rotate(-4deg); }
      15%  { transform: translateX(5vw)   translateY(-13vh) rotate(3deg); }
      30%  { transform: translateX(25vw)  translateY(8vh) rotate(-2deg); }
      45%  { transform: translateX(42vw)  translateY(-15vh) rotate(5deg); }
      55%  { transform: translateX(57vw)  translateY(6vh) rotate(-3deg); }
      70%  { transform: translateX(74vw)  translateY(-11vh) rotate(4deg); }
      85%  { transform: translateX(91vw)  translateY(4vh) rotate(-2deg); }
      100% { transform: translateX(118vw) translateY(5vh) rotate(-4deg); }
    }

    /* ────── character pop-in on new song ────── */
    @keyframes charPopin {
      0%   { transform: scale(0) rotate(-28deg); opacity: 0; }
      55%  { transform: scale(1.35) rotate(8deg);  opacity: 1; }
      75%  { transform: scale(0.88) rotate(-4deg); opacity: 1; }
      100% { transform: scale(1.00) rotate(0deg);  opacity: 1; }
    }

    /* ────── glow pulse synced to traversal (brightest at screen center = 50%) ────── */
    @keyframes charGlow {
      0%, 38%, 62%, 100% { filter: drop-shadow(0 0 10px ${gL}); }
      50%                 { filter: drop-shadow(0 0 55px ${gH}) drop-shadow(0 0 110px ${gM}); }
    }

    /* ────── mid-burst: large emoji explosion appears only when char is at center ────── */
    @keyframes midBurst {
      0%, 42%   { transform: translate(-50%, -50%) scale(0) rotate(0deg);    opacity: 0; }
      48%       { transform: translate(-50%, -50%) scale(2.5) rotate(90deg);  opacity: 1; filter: drop-shadow(0 0 40px ${gH}); }
      53%       { transform: translate(-50%, -50%) scale(4.0) rotate(200deg); opacity: 0.7; filter: drop-shadow(0 0 80px ${gM}); }
      60%, 100% { transform: translate(-50%, -50%) scale(0) rotate(360deg);   opacity: 0; }
    }

    /* ────── background animation ────── */
    @keyframes bgFlow {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }

    /* ────── ambient glow blobs ────── */
    @keyframes gBlob1 {
      0%   { transform: translate(0%,   0%);  opacity: 0.20; }
      33%  { transform: translate(18%, -10%); opacity: 0.32; }
      66%  { transform: translate(-4%, -18%); opacity: 0.14; }
      100% { transform: translate(0%,   0%);  opacity: 0.20; }
    }
    @keyframes gBlob2 {
      0%   { transform: translate(0%,   0%);  opacity: 0.14; }
      40%  { transform: translate(-22%, 12%); opacity: 0.26; }
      80%  { transform: translate(10%,  -6%); opacity: 0.10; }
      100% { transform: translate(0%,   0%);  opacity: 0.14; }
    }

    /* ────── particles ────── */
    @keyframes pDrift {
      0%, 100% { transform: translateY(0px)   translateX(0px)   rotate(0deg);   opacity: 0.7; }
      33%      { transform: translateY(-30px)  translateX(14px)  rotate(20deg);  opacity: 1.0; }
      66%      { transform: translateY(-14px)  translateX(-10px) rotate(-10deg); opacity: 0.8; }
    }
    @keyframes pSparkle {
      0%   { transform: scale(0) rotate(-45deg);   opacity: 0; }
      12%  { transform: scale(1.9) rotate(14deg);  opacity: 1; }
      55%  { transform: scale(1.0) rotate(-7deg);  opacity: 0.8; }
      85%  { transform: scale(0.3) rotate(-25deg); opacity: 0.15; }
      100% { transform: scale(0) rotate(-45deg);   opacity: 0; }
    }

    /* ────── horizon sway ────── */
    @keyframes horizonSway {
      0%, 100% { transform: rotate(-2deg) scale(1.00); }
      50%      { transform: rotate( 2deg) scale(1.05); }
    }

    /* ── suppress unused-var warnings ── */
    .vbg { --dur: ${dur}; --bgf: ${bgFlowDur}; --gH: ${gH}; }
  `
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function VisualDisplay({ track }: Props) {
  // All hooks must run unconditionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seed  = useMemo(() => hashCode(track?.trackId ?? 'idle'), [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res   = useMemo(() => track ? selectScene(track, seed) : null,  [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dur   = useMemo(() => (res && track) ? getTraversalDur(res.scene, track) : 8, [track?.trackId])
  const parts = useMemo(
    () => res ? buildParticles(res.scene, seed, track?.energy ?? 0.5) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track?.trackId]
  )
  const bgFlowDur = useMemo(() => (16 + rng(seed, 888) * 10).toFixed(0), [seed])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const css   = useMemo(() => buildCSS(res?.scene.glow ?? '#ffffff', dur, bgFlowDur), [track?.trackId])

  // ── Idle state ───────────────────────────────────────────────────────────────
  if (!track || !res) {
    return (
      <div className="fixed inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, #0d0d2a, #000000)' }}>
        <style>{'@keyframes idlePulse{0%,100%{opacity:0.2}50%{opacity:0.5}}'}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: '100px', animation: 'idlePulse 4s ease-in-out infinite' }}>🌙</span>
        </div>
      </div>
    )
  }

  const { scene } = res
  const traversal = scene.traversal   // 'fly' | 'jump' | 'wave' | 'gallop' | 'float'
  const durStr = dur.toFixed(2)

  // Trail gap: each trail element is 7% of the traversal duration behind
  // This produces a fixed ~9.5vw spatial gap regardless of speed
  const trailGap = dur * 0.07

  // Trail visual properties (back-to-front render order = largest to smallest)
  const trailSizes   = ['clamp(58px, 8.5vw, 96px)', 'clamp(42px, 6vw, 70px)', 'clamp(30px, 4.5vw, 52px)']
  const trailOpacity = [0.75, 0.50, 0.28]

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <style>{css}</style>

      {/* ── Background: animated 3-stop gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${scene.bg[0]}, ${scene.bg[1]}, ${scene.bg[2]}, ${scene.bg[0]})`,
        backgroundSize: '300% 300%',
        animation: `bgFlow ${bgFlowDur}s ease-in-out infinite`,
      }} />

      {/* ── Ambient glow blobs */}
      <div className="absolute pointer-events-none" style={{
        width: '70vw', height: '70vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${scene.glow}55 0%, transparent 68%)`,
        top: '4%', left: '12%',
        animation: `gBlob1 ${(16 + rng(seed, 777) * 8).toFixed(0)}s ease-in-out infinite`,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: `radial-gradient(circle, ${scene.bg[2]}66 0%, transparent 65%)`,
        bottom: '8%', right: '8%',
        animation: `gBlob2 ${(20 + rng(seed, 666) * 8).toFixed(0)}s ease-in-out infinite`,
      }} />

      {/* ── Ambient particles */}
      {parts.map((p, i) => (
        <span
          key={`p-${i}-${track.trackId}`}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            fontSize: `${p.sz}px`, lineHeight: 1,
            animation: `${i % 3 === 0 ? 'pSparkle' : 'pDrift'} ${p.dur.toFixed(2)}s ease-in-out ${p.delay.toFixed(2)}s infinite`,
            willChange: 'transform,opacity',
          }}
        >{p.e}</span>
      ))}

      {/* ── Ground/horizon decoration row */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-around items-end pb-1"
        style={{ height: '13vh', pointerEvents: 'none' }}
      >
        {Array.from({ length: scene.horizonN }, (_, i) => (
          <span key={i} style={{
            fontSize: `${36 + rng(seed, 900 + i) * 26}px`, lineHeight: 1,
            animation: `horizonSway ${2.2 + rng(seed, 910 + i) * 2.2}s ease-in-out ${(rng(seed, 920 + i) * 2).toFixed(2)}s infinite`,
          }}>{scene.horizon}</span>
        ))}
      </div>

      {/* ── Trail elements (rendered back-to-front so smallest is furthest behind) */}
      {[2, 1, 0].map(ti => (
        <span
          key={`trail-${ti}-${track.trackId}`}
          className="absolute pointer-events-none"
          style={{
            bottom: scene.yBase,
            left: 0,
            fontSize: trailSizes[ti],
            lineHeight: 1,
            opacity: trailOpacity[ti],
            // Positive delay = starts later = appears BEHIND the main character
            // animationFillMode 'backwards' keeps element at first keyframe (off-screen left) during delay
            animation: `t${traversal} ${durStr}s linear ${(trailGap * (ti + 1)).toFixed(2)}s infinite`,
            animationFillMode: 'backwards',
            willChange: 'transform',
            filter: `drop-shadow(0 0 6px ${scene.glow}88)`,
          }}
        >{scene.trail[ti]}</span>
      ))}

      {/* ── Main character: traversal container + pop-in inner span */}
      {/* key forces full remount on track change → restarts both traversal + pop-in */}
      <div
        key={track.trackId}
        className="absolute pointer-events-none"
        style={{
          bottom: scene.yBase,
          left: 0,
          animation: `t${traversal} ${durStr}s linear 0s infinite`,
          willChange: 'transform',
        }}
      >
        <span
          role="img"
          aria-label={scene.label}
          style={{
            display: 'block',
            fontSize: 'clamp(88px, 13vw, 155px)',
            lineHeight: 1,
            // charPopin: one-shot bounce-in on mount
            // charGlow: continuous filter pulse synced to traversal (brightest at 50% = screen center)
            animation: `charPopin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, charGlow ${durStr}s linear 0s infinite`,
            willChange: 'transform,filter',
          }}
        >{scene.char}</span>
      </div>

      {/* ── Mid-burst: emoji explosion that fires when character reaches screen center */}
      {/* Synced to same duration as traversal — triggers at 50% keyframe = character at center */}
      <div
        key={`burst-${track.trackId}`}
        className="absolute pointer-events-none"
        style={{ left: '50%', top: '50%', fontSize: '100px', lineHeight: 1 }}
      >
        <span style={{
          display: 'block',
          animation: `midBurst ${durStr}s linear 0s infinite`,
          willChange: 'transform,opacity,filter',
        }}>{scene.midBurst}</span>
      </div>

      {/* ── Vignette: softens screen edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.48) 100%)',
      }} />
    </div>
  )
}
