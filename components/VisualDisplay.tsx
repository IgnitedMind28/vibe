'use client'

import { useMemo } from 'react'
import type { NowPlayingTrack } from '@/lib/spotify'

interface Props { track: NowPlayingTrack | null }

// ─── Deterministic random ─────────────────────────────────────────────────────
function hashCode(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function rng(seed: number, n: number) {
  let s = ((seed + n * 6364136) >>> 0); s = ((1664525 * s + 1013904223) >>> 0)
  return s / 0x100000000
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scene {
  char: string; label: string
  bg: [string, string, string]   // 3 stops → animated gradient
  glow: string
  horizon: string; horizonN: number
  particles: string[]; particleN: number
}
interface SceneResult { key: string; scene: Scene; pool: string[] }
interface Particle { e: string; x: number; y: number; sz: number; delay: number; dur: number; v: 1|2|3|4|5 }
interface Companion { e: string; sz: number; dur: number; delay: number; pts: [number,number][]; rots: number[]; scls: number[] }

// ─── Scene library ────────────────────────────────────────────────────────────
const S: Record<string, Scene> = {
  robot:     { char:'🤖', label:'Robot',     bg:['#0d1b4b','#0d0d2b','#1a0533'], glow:'#00f5ff', horizon:'⚙️',  horizonN:5, particles:['✨','⚡','🔷','💠'], particleN:18 },
  alien:     { char:'👾', label:'Alien',     bg:['#001a3a','#000820','#0a1a2e'], glow:'#00ff88', horizon:'🌍',  horizonN:3, particles:['⭐','🌟','💫','🛸'], particleN:20 },
  fox:       { char:'🦊', label:'Fox',       bg:['#1a1a2e','#2a1a0e','#16213e'], glow:'#ff8c00', horizon:'🏙️', horizonN:4, particles:['🎵','🎶','💿','✨'], particleN:16 },
  unicorn:   { char:'🦄', label:'Unicorn',   bg:['#ff9de2','#d4aaff','#c9b1ff'], glow:'#ff44ff', horizon:'🌈',  horizonN:4, particles:['⭐','🌸','💖','✨','🦋'], particleN:22 },
  cat:       { char:'🐱', label:'Cat',       bg:['#2d1b33','#4a1a66','#1a0d26'], glow:'#cc88ff', horizon:'🎵',  horizonN:5, particles:['🎵','🎶','🎤','✨'], particleN:16 },
  swan:      { char:'🦢', label:'Swan',      bg:['#c8e6ff','#e8f4f8','#b8d4e8'], glow:'#44aaff', horizon:'🎼',  horizonN:4, particles:['🎵','🌸','❄️','✨'], particleN:15 },
  cowboy:    { char:'🤠', label:'Cowboy',    bg:['#d4884b','#ff9944','#8b4513'], glow:'#ffcc44', horizon:'🌵',  horizonN:5, particles:['🌟','⭐','☀️','✨'], particleN:14 },
  bear:      { char:'🐻', label:'Bear',      bg:['#2d4a22','#4a6a2a','#1a2e12'], glow:'#ff9944', horizon:'🌲',  horizonN:5, particles:['🍂','🍁','🌿','⭐'], particleN:14 },
  lion:      { char:'🦁', label:'Lion',      bg:['#d4884b','#ffaa33','#8b6914'], glow:'#ffcc00', horizon:'🌾',  horizonN:6, particles:['🌟','☀️','🦋','✨'], particleN:16 },
  turtle:    { char:'🐢', label:'Turtle',    bg:['#1a4a2e','#2a6a3e','#0d2e1a'], glow:'#44cc44', horizon:'🌴',  horizonN:4, particles:['🌺','🌸','☀️','🎵'], particleN:14 },
  parrot:    { char:'🦜', label:'Parrot',    bg:['#ff6b35','#ffaa22','#f7931e'], glow:'#ff6600', horizon:'🌴',  horizonN:4, particles:['🌺','🌸','🦋','☀️'], particleN:18 },
  butterfly: { char:'🦋', label:'Butterfly', bg:['#9b2d9b','#e91e8c','#7b2d8b'], glow:'#ff44ff', horizon:'🌸',  horizonN:6, particles:['🌸','🌺','💖','✨'], particleN:20 },
  hedgehog:  { char:'🦔', label:'Hedgehog',  bg:['#4a3728','#6a4a38','#2d1f1a'], glow:'#cc8844', horizon:'🌿',  horizonN:5, particles:['🍂','🌿','⭐','🎵'], particleN:13 },
  chick:     { char:'🐥', label:'Chick',     bg:['#ffe066','#fff176','#ffe082'], glow:'#ffee00', horizon:'🌼',  horizonN:6, particles:['🌸','⭐','💛','🌼','🐣'], particleN:20 },
  dragon:    { char:'🐉', label:'Dragon',    bg:['#3a0000','#1a0000','#2d0a00'], glow:'#ff4400', horizon:'🌋',  horizonN:3, particles:['🔥','✨','⭐','💫'], particleN:16 },
  moon:      { char:'🌙', label:'Moon',      bg:['#0d0d2a','#1a1a3e','#0a0a20'], glow:'#aabbff', horizon:'⭐',  horizonN:7, particles:['💫','✨','🌟','⭐'], particleN:22 },
  flamingo:  { char:'🦩', label:'Flamingo',  bg:['#ff9de2','#ff6eb4','#ffb3c6'], glow:'#ff44aa', horizon:'🌸',  horizonN:6, particles:['🌸','💖','🌺','✨'], particleN:18 },
  dolphin:   { char:'🐬', label:'Dolphin',   bg:['#0077b6','#0096c7','#023e8a'], glow:'#44aaff', horizon:'🌊',  horizonN:5, particles:['🐠','🐡','⭐','🫧'], particleN:16 },
  rocket:    { char:'🚀', label:'Rocket',    bg:['#020014','#0a0030','#030020'], glow:'#0088ff', horizon:'🪐',  horizonN:4, particles:['⭐','🌟','💫','✨'], particleN:24 },
  owl:       { char:'🦉', label:'Owl',       bg:['#0d1117','#1a2030','#161b22'], glow:'#ffaa00', horizon:'🌲',  horizonN:5, particles:['✨','🌟','🍂','💫'], particleN:14 },
  wolf:      { char:'🐺', label:'Wolf',      bg:['#1a2040','#2a3060','#0d1030'], glow:'#8899cc', horizon:'🌲',  horizonN:5, particles:['⭐','💨','🌑','✨'], particleN:15 },
  koala:     { char:'🐨', label:'Koala',     bg:['#b8d4b8','#88aa88','#7aa87a'], glow:'#66aa66', horizon:'🌿',  horizonN:5, particles:['🌿','🍃','⭐','🌸'], particleN:14 },
  penguin:   { char:'🐧', label:'Penguin',   bg:['#a8d8ff','#c8e6ff','#e8f4ff'], glow:'#aaccff', horizon:'❄️', horizonN:5, particles:['❄️','⭐','🌨️','✨'], particleN:16 },
  bat:       { char:'🦇', label:'Bat',       bg:['#1a0033','#0d0015','#2a0044'], glow:'#aa44ff', horizon:'🦇',  horizonN:4, particles:['✨','💫','🌑','⭐'], particleN:14 },
  frog:      { char:'🐸', label:'Frog',      bg:['#1a5a1a','#2d5a2d','#0d3a0d'], glow:'#88ff44', horizon:'🌿',  horizonN:5, particles:['💧','🌿','⭐','🍃'], particleN:14 },
  tiger:     { char:'🐯', label:'Tiger',     bg:['#cc5500','#ff7722','#8b3a00'], glow:'#ff8800', horizon:'🌾',  horizonN:6, particles:['🌟','☀️','✨','⭐'], particleN:15 },
  panda:     { char:'🐼', label:'Panda',     bg:['#c8e6c9','#e8f5e9','#a8d6a9'], glow:'#44aa44', horizon:'🎋',  horizonN:5, particles:['🌿','⭐','🌸','✨'], particleN:14 },
  shark:     { char:'🦈', label:'Shark',     bg:['#003366','#004488','#001a33'], glow:'#0088cc', horizon:'🌊',  horizonN:4, particles:['💧','🫧','⭐','🐟'], particleN:16 },
  horse:     { char:'🐴', label:'Horse',     bg:['#8b6914','#aa8833','#5a4500'], glow:'#cc9944', horizon:'🌾',  horizonN:6, particles:['🌟','⭐','☀️','🌸'], particleN:13 },
  dinosaur:  { char:'🦕', label:'Dinosaur',  bg:['#1a3300','#2a5500','#0d2200'], glow:'#66cc44', horizon:'🌿',  horizonN:5, particles:['🌿','🍃','⭐','🌺'], particleN:15 },
  superhero: { char:'🦸', label:'Superhero', bg:['#1a1a4e','#2a2a6e','#0d0d2e'], glow:'#4488ff', horizon:'🏙️', horizonN:4, particles:['⭐','💫','⚡','✨'], particleN:20 },
  ninja:     { char:'🥷', label:'Ninja',     bg:['#0a0a0a','#1a0a00','#050505'], glow:'#cc0000', horizon:'⛩️', horizonN:3, particles:['🌸','💫','⭐','🌟'], particleN:16 },
  wizard:    { char:'🧙', label:'Wizard',    bg:['#1a0033','#2a0055','#0d001a'], glow:'#8844ff', horizon:'✨',  horizonN:5, particles:['✨','💫','⭐','🌙'], particleN:20 },
  princess:  { char:'👸', label:'Princess',  bg:['#ffb3d9','#ff80b3','#ffccee'], glow:'#ff88cc', horizon:'🏰', horizonN:3, particles:['💖','⭐','🌸','✨'], particleN:18 },
  fairy:     { char:'🧚', label:'Fairy',     bg:['#c8e6c9','#88d8aa','#a5d6a7'], glow:'#44ff88', horizon:'🌸', horizonN:6, particles:['✨','🌸','💚','⭐'], particleN:22 },
  mermaid:   { char:'🧜', label:'Mermaid',   bg:['#006994','#0096c7','#004d75'], glow:'#00ccaa', horizon:'🌊', horizonN:5, particles:['🐠','🐡','💧','🫧'], particleN:16 },
  astronaut: { char:'👨‍🚀', label:'Astronaut', bg:['#020014','#050028','#030020'], glow:'#0099ff', horizon:'🌍', horizonN:3, particles:['⭐','🌟','💫','🪐'], particleN:24 },
}

// ─── Pools ────────────────────────────────────────────────────────────────────
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
  return { key, scene: S[key] ?? S.frog, pool }
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

// ─── Animation selection ──────────────────────────────────────────────────────
type Anim = 'Groove'|'ZipZag'|'Flappy'|'Spin'|'Wobble'|'Pulse'

function getAnim(t: NowPlayingTrack): Anim {
  const { energy: e, danceability: d, valence: v } = t
  if (e < 0.18)                  return 'Pulse'
  if (e < 0.38)                  return 'Wobble'
  if (e > 0.78)                  return 'ZipZag'
  if (e > 0.55 && d > 0.70)     return 'Groove'
  if (v > 0.72 && d > 0.50)     return 'Flappy'
  if (e > 0.50)                  return 'Spin'
  return 'Wobble'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildParticles(sc: Scene, seed: number, baseDur: number, energy: number): Particle[] {
  return Array.from({ length: sc.particleN }, (_, i): Particle => {
    const r = (n: number) => rng(seed, i * 20 + n)
    let v: 1|2|3|4|5
    if (energy > 0.68 && i % 4 === 0)      v = 1   // confetti
    else if (energy < 0.38 && i % 3 === 0) v = 2   // bubbles
    else if (i % 6 === 0)                   v = 4   // sparkle
    else                                    v = r(7) > 0.5 ? 3 : 5
    return {
      e:     sc.particles[Math.floor(r(0) * sc.particles.length)],
      x:     r(1) * 94,
      y:     v === 1 ? r(2) * 6 : v === 2 ? 90 + r(2) * 8 : r(2) * 82,
      sz:    28 + Math.floor(r(3) * 42),  // larger: 28–70px
      delay: r(4) * 9,
      dur:   baseDur * (0.45 + r(5) * 0.85),
      v,
    }
  })
}

// Companions with seed-based free-form dance paths (5-point ellipse + jitter)
function buildCompanions(res: SceneResult, seed: number, beatSec: number, energy: number): Companion[] {
  const others = res.pool.filter(k => k !== res.key && S[k])
  if (!others.length) return []
  return Array.from({ length: Math.min(2, others.length) }, (_, i) => {
    const key = others[Math.floor(rng(seed, 500 + i * 77) * others.length) % others.length]
    const radius = 125 + i * 55 + energy * 30
    // 5 pts on a jittered ellipse
    const pts = [0, 72, 144, 216, 288].map((a, j): [number,number] => {
      const ang = (a + rng(seed, 810 + i * 50 + j) * 36 - 18) * Math.PI / 180
      const r = radius * (0.72 + rng(seed, 860 + i * 50 + j) * 0.56)
      return [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r * 0.62)]
    })
    const rots = [0,1,2,3,4].map(j => Math.round((rng(seed, 910 + i*50+j) - 0.5) * 40))
    const scls = [0,1,2,3,4].map(j => +(0.78 + rng(seed, 960 + i*50+j) * 0.44).toFixed(2))
    return {
      e: S[key].char, sz: 50 + i * 9,
      dur: Math.max(5, beatSec * (12 + i * 7)),
      delay: +(rng(seed, 700 + i) * 2.5).toFixed(2),
      pts, rots, scls,
    }
  })
}

function getSpeeds(t: NowPlayingTrack) {
  const beat  = 60 / (t.tempo || 120)
  const charD = Math.max(0.35, Math.min(2.0, beat))
  const { energy: e } = t
  const bH  = Math.round(e * 80)         // bounce height 0-80px
  const xD  = Math.round(55 + e * 45)    // x displacement 55-100px
  const sqY = +(1 - e * 0.24).toFixed(3)
  const stY = +(1 + e * 0.32).toFixed(3)
  const sqX = +(1 / sqY).toFixed(3)
  const stX = +(1 / stY).toFixed(3)
  const pDur = Math.max(0.9, 5.5 - e * 3.8)
  return { beat, charD, bH, xD, sqY, sqX, stY, stX, pDur }
}

// ─── CSS factory ──────────────────────────────────────────────────────────────
function buildCSS(p: {
  anim: Anim; charD: number; bH: number; xD: number
  sqY: number; sqX: number; stY: number; stX: number
  glow: string; companions: Companion[]
  bg: [string,string,string]
}) {
  const { anim, charD, bH, xD, sqY, sqX, stY, stX, glow, companions, bg } = p
  const hH = Math.round(bH * 0.52), h70 = Math.round(bH * 0.72), h35 = Math.round(bH * 0.35)
  const gL = `${glow}33`, gM = `${glow}99`, gH = `${glow}ee`
  // golden & silver ratio offsets so position/rotation/scale never sync
  const rotD = (charD * 1.618).toFixed(2)
  const sclD = (charD * 2.414).toFixed(2)

  const moveKf =
    anim === 'Groove' ? `
      0%   { transform: translate(-${xD}px,  8px)        scaleX(${sqX}) scaleY(${sqY}); }
      15%  { transform: translate(-${Math.round(xD*.38)}px,-${hH}px) scaleY(${stY}); }
      33%  { transform: translate( ${Math.round(xD*.25)}px,-${bH}px)  scaleX(${stX}) scaleY(${stY}); }
      50%  { transform: translate( ${xD}px,  8px)        scaleX(${sqX}) scaleY(${sqY}); }
      67%  { transform: translate( ${Math.round(xD*.38)}px,-${hH}px) scaleY(${stY}); }
      84%  { transform: translate(-${Math.round(xD*.25)}px,-${h70}px) scaleX(${stX}) scaleY(${stY}); }
      100% { transform: translate(-${xD}px,  8px)        scaleX(${sqX}) scaleY(${sqY}); }` :
    anim === 'ZipZag' ? `
      0%   { transform: translate(-${xD}px, 14px)          scaleY(${sqY}) scaleX(${sqX}); }
      12%  { transform: translate(-${Math.round(xD*.28)}px,-${bH}px)  scaleY(${stY}) scaleX(${stX}); }
      25%  { transform: translate( ${Math.round(xD*.18)}px, 6px)  scale(1); }
      37%  { transform: translate( ${Math.round(xD*.65)}px,-${h70}px) scaleY(${stY}); }
      50%  { transform: translate( ${xD}px, 14px)          scaleY(${sqY}) scaleX(${sqX}); }
      62%  { transform: translate( ${Math.round(xD*.28)}px,-${bH}px)  scaleY(${stY}) scaleX(${stX}); }
      75%  { transform: translate(-${Math.round(xD*.18)}px, 6px)  scale(1); }
      87%  { transform: translate(-${Math.round(xD*.65)}px,-${h70}px) scaleY(${stY}); }
      100% { transform: translate(-${xD}px, 14px)          scaleY(${sqY}) scaleX(${sqX}); }` :
    anim === 'Flappy' ? `
      0%   { transform: translate(-${xD}px, 16px)          scaleY(${sqY}); }
      22%  { transform: translate(-${Math.round(xD*.28)}px,-${hH}px) scaleY(${stY}); }
      44%  { transform: translate(  ${Math.round(xD*.1)}px,-${bH}px) scaleY(${+(stY+0.1).toFixed(3)}); }
      66%  { transform: translate( ${xD}px, 16px)          scaleY(${sqY}); }
      84%  { transform: translate( ${Math.round(xD*.28)}px,-${hH}px) scaleY(${stY}); }
      100% { transform: translate(-${xD}px, 16px)          scaleY(${sqY}); }` :
    anim === 'Spin' ? `
      0%   { transform: translateY(0)    scaleY(${sqY}) scaleX(${sqX}); }
      25%  { transform: translateY(-${h35}px) scale(1); }
      50%  { transform: translateY(-${bH}px)  scaleY(${stY}) scaleX(${stX}); }
      75%  { transform: translateY(-${h35}px) scale(1); }
      88%  { transform: translateY(0)    scaleY(${sqY}) scaleX(${sqX}); }
      100% { transform: translateY(0)    scaleY(${sqY}) scaleX(${sqX}); }` :
    anim === 'Pulse' ? `
      0%,100% { transform: scale(0.84); }
      38%     { transform: scale(1.20); }
      68%     { transform: scale(0.93); }` : /* Wobble */`
      0%   { transform: translate(   0px,   0px) scale(0.94); }
      20%  { transform: translate( ${Math.round(xD*.55)}px,-${hH}px) scale(1.03); }
      40%  { transform: translate( ${Math.round(xD*.14)}px,-${bH}px) scale(1.08); }
      60%  { transform: translate(-${Math.round(xD*.48)}px,-${hH}px) scale(1.01); }
      80%  { transform: translate(-${Math.round(xD*.14)}px,-${h35}px) scale(0.97); }
      100% { transform: translate(   0px,   0px) scale(0.94); }`

  return `
    @keyframes charMove  { ${moveKf} }
    @keyframes charRot   {
      0%,100% { transform: rotate(-${anim==='Spin'?'180':'15'}deg); }
      ${anim==='Spin' ? 'to { transform: rotate(180deg); }' : '25% { transform: rotate(6deg); } 50% { transform: rotate(15deg); } 75% { transform: rotate(-6deg); }'}
    }
    @keyframes charSpin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes charScale {
      0%,100% { transform: translate(-50%,-50%) scale(1.00); }
      35%     { transform: translate(-50%,-50%) scale(1.16); }
      65%     { transform: translate(-50%,-50%) scale(0.90); }
    }
    @keyframes charPopIn {
      0%   { transform: translate(-50%,-50%) scale(0) rotate(-25deg); opacity:0; }
      55%  { transform: translate(-50%,-50%) scale(1.28) rotate(6deg); opacity:1; }
      75%  { transform: translate(-50%,-50%) scale(0.90) rotate(-3deg); opacity:1; }
      100% { transform: translate(-50%,-50%) scale(1.00) rotate(0deg); opacity:1; }
    }
    @keyframes glowPulse {
      0%,100% { filter: drop-shadow(0 0 18px ${gL}) drop-shadow(0 0 0px transparent); }
      50%     { filter: drop-shadow(0 0 55px ${gH}) drop-shadow(0 0 100px ${gM}); }
    }
    @keyframes burstRing {
      0%   { transform: translate(-50%,-50%) scale(0.15); opacity: 1.0; }
      100% { transform: translate(-50%,-50%) scale(5.50); opacity: 0.0; }
    }
    @keyframes bgFlow {
      0%,100% { background-position: 0% 50%; }
      50%     { background-position: 100% 50%; }
    }
    @keyframes gBlob1 {
      0%   { transform: translate(  0%,  0%); opacity: 0.22; }
      33%  { transform: translate( 22%,-12%); opacity: 0.34; }
      66%  { transform: translate( -6%,-20%); opacity: 0.16; }
      100% { transform: translate(  0%,  0%); opacity: 0.22; }
    }
    @keyframes gBlob2 {
      0%   { transform: translate(  0%,  0%); opacity: 0.16; }
      40%  { transform: translate(-26%, 14%); opacity: 0.30; }
      80%  { transform: translate( 12%, -8%); opacity: 0.12; }
      100% { transform: translate(  0%,  0%); opacity: 0.16; }
    }
    @keyframes confettiFall {
      0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: translateY(115vh) rotate(960deg); opacity: 0; }
    }
    @keyframes bubbleRise {
      0%   { transform: translateY(0)     translateX(  0px) scale(0.8); opacity:0.55; }
      50%  { transform: translateY(-42vh) translateX( 22px) scale(1.15); opacity:0.9; }
      100% { transform: translateY(-98vh) translateX(-12px) scale(0.6); opacity:0; }
    }
    @keyframes sideFloat {
      0%,100% { transform: translateY(  0px) translateX(  0px) rotate(  0deg); opacity:0.8; }
      33%     { transform: translateY(-34px) translateX( 18px) rotate( 20deg); opacity:1.0; }
      66%     { transform: translateY(-15px) translateX(-13px) rotate(-11deg); opacity:0.9; }
    }
    @keyframes sparkle {
      0%   { transform: scale(0)   rotate(-45deg); opacity:0; }
      12%  { transform: scale(2.0) rotate( 14deg); opacity:1; }
      30%  { transform: scale(0.9) rotate( -7deg); opacity:0.9; }
      55%  { transform: scale(1.2) rotate(  9deg); opacity:0.7; }
      80%  { transform: scale(0.4) rotate(-25deg); opacity:0.2; }
      100% { transform: scale(0)   rotate(-45deg); opacity:0; }
    }
    @keyframes spinFloat {
      0%,100% { transform: translateY(  0px) rotate(  0deg) scale(1.0); opacity:0.75; }
      25%     { transform: translateY(-28px) rotate( 90deg) scale(1.2); opacity:1.0; }
      50%     { transform: translateY(-48px) rotate(180deg) scale(0.88); opacity:0.85; }
      75%     { transform: translateY(-22px) rotate(270deg) scale(1.12); opacity:1.0; }
    }
    @keyframes horizonSway {
      0%,100% { transform: rotate(-3deg) scale(1.0); }
      50%     { transform: rotate( 3deg) scale(1.06); }
    }
    ${companions.map((c, i) => `
    @keyframes cDance${i} {
      0%   { transform: translate(${c.pts[0][0]}px,${c.pts[0][1]}px) rotate(${c.rots[0]}deg) scale(${c.scls[0]}); }
      20%  { transform: translate(${c.pts[1][0]}px,${c.pts[1][1]}px) rotate(${c.rots[1]}deg) scale(${c.scls[1]}); }
      40%  { transform: translate(${c.pts[2][0]}px,${c.pts[2][1]}px) rotate(${c.rots[2]}deg) scale(${c.scls[2]}); }
      60%  { transform: translate(${c.pts[3][0]}px,${c.pts[3][1]}px) rotate(${c.rots[3]}deg) scale(${c.scls[3]}); }
      80%  { transform: translate(${c.pts[4][0]}px,${c.pts[4][1]}px) rotate(${c.rots[4]}deg) scale(${c.scls[4]}); }
      100% { transform: translate(${c.pts[0][0]}px,${c.pts[0][1]}px) rotate(${c.rots[0]}deg) scale(${c.scls[0]}); }
    }`).join('')}
    /* unused refs to avoid lint */ .gr{--r:${rotD};--s:${sclD};--b0:${bg[0]};--b1:${bg[1]};--b2:${bg[2]};}
  `
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VisualDisplay({ track }: Props) {
  const seed  = useMemo(() => hashCode(track?.trackId ?? ''), [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res   = useMemo(() => track ? selectScene(track, seed) : null,        [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spd   = useMemo(() => track ? getSpeeds(track) : null,                [track?.trackId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anim  = useMemo(() => track ? getAnim(track) : 'Wobble' as Anim,     [track?.trackId])
  const parts = useMemo(
    () => res && spd ? buildParticles(res.scene, seed, spd.pDur, track?.energy ?? 0.5) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track?.trackId]
  )
  const comps = useMemo(
    () => res && spd ? buildCompanions(res, seed, spd.beat, track?.energy ?? 0.5) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track?.trackId]
  )

  if (!track || !res || !spd) return <div className="fixed inset-0 bg-black" />

  const { scene } = res
  const { charD, bH, xD, sqY, sqX, stY, stX } = spd
  const css = buildCSS({ anim, charD, bH, xD, sqY, sqX, stY, stX, glow: scene.glow, companions: comps, bg: scene.bg })

  // Rotation: Spin uses continuous spin (1 full rotation per beat), others use gentle sway
  const rotAnim  = anim === 'Spin' ? `charSpin ${charD.toFixed(2)}s linear infinite` : `charRot ${(charD * 1.618).toFixed(2)}s ease-in-out infinite`
  const sclAnim  = `charScale ${(charD * 2.414).toFixed(2)}s ease-in-out infinite`
  const glowAnim = `glowPulse ${(charD * 1.8).toFixed(2)}s ease-in-out infinite`
  // Burst ring timing: 3 rings, each fires every 2 beats, offset so one is always mid-expansion
  const ringDur  = (charD * 2).toFixed(2)

  const pAnimName = (v: number) =>
    v === 1 ? 'confettiFall' : v === 2 ? 'bubbleRise' : v === 3 ? 'sideFloat' : v === 4 ? 'sparkle' : 'spinFloat'

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <style>{css}</style>

      {/* ── BG: animated 3-stop gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${scene.bg[0]}, ${scene.bg[1]}, ${scene.bg[2]}, ${scene.bg[0]})`,
        backgroundSize: '300% 300%',
        animation: `bgFlow ${(18 + rng(seed, 888) * 10).toFixed(0)}s ease-in-out infinite`,
      }} />

      {/* ── BG: two drifting glow blobs */}
      <div className="absolute pointer-events-none" style={{
        width:'70vw', height:'70vw', borderRadius:'50%',
        background:`radial-gradient(circle, ${scene.glow}55 0%, transparent 68%)`,
        top:'4%', left:'12%',
        animation: `gBlob1 ${(16 + rng(seed, 777) * 8).toFixed(0)}s ease-in-out infinite`,
      }} />
      <div className="absolute pointer-events-none" style={{
        width:'50vw', height:'50vw', borderRadius:'50%',
        background:`radial-gradient(circle, ${scene.bg[2]}66 0%, transparent 65%)`,
        bottom:'8%', right:'8%',
        animation: `gBlob2 ${(20 + rng(seed, 666) * 8).toFixed(0)}s ease-in-out infinite`,
      }} />

      {/* ── Particles */}
      {parts.map((p, i) => (
        <span key={i} className="absolute pointer-events-none" style={{
          left:`${p.x}%`, top:`${p.y}%`,
          fontSize:`${p.sz}px`, lineHeight:1,
          animation:`${pAnimName(p.v)} ${p.dur.toFixed(2)}s ease-in-out ${p.delay.toFixed(2)}s infinite`,
          willChange:'transform',
        }}>{p.e}</span>
      ))}

      {/* ── Horizon row */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end pb-2" style={{height:'16vh'}}>
        {Array.from({length: scene.horizonN}, (_,i) => (
          <span key={i} style={{
            fontSize:`${40 + rng(seed, 900+i) * 30}px`, lineHeight:1,
            animation:`horizonSway ${2.2 + rng(seed, 910+i)*2.2}s ease-in-out ${(rng(seed,920+i)*2).toFixed(2)}s infinite`,
          }}>{scene.horizon}</span>
        ))}
      </div>

      {/* ── Burst rings (3 rings staggered) */}
      {[0,1,2].map(i => (
        <div key={i} className="absolute pointer-events-none" style={{
          left:'50%', top:'42%',
          width:'160px', height:'160px', borderRadius:'50%',
          border:`3px solid ${scene.glow}`,
          animation:`burstRing ${ringDur}s ease-out ${(charD * i * 0.66).toFixed(2)}s infinite`,
          willChange:'transform,opacity',
        }} />
      ))}

      {/* ── Companions: free-dancing around center */}
      <div className="absolute pointer-events-none" style={{left:'50%', top:'42%', width:0, height:0}}>
        {comps.map((c, i) => (
          <span key={i} className="absolute" style={{
            display:'block', fontSize:`${c.sz}px`, lineHeight:1,
            transform:'translate(-50%,-50%)',
            animation:`cDance${i} ${c.dur.toFixed(2)}s ease-in-out ${c.delay}s infinite`,
            willChange:'transform',
          }}>{c.e}</span>
        ))}
      </div>

      {/* ── Main character: 3 nested layers for organic motion */}
      {/* Layer A — position (beat-locked) */}
      <div className="absolute pointer-events-none" style={{left:'50%', top:'42%', width:0, height:0}}>
        <div style={{ animation:`charMove ${charD.toFixed(2)}s ease-in-out infinite`, willChange:'transform' }}>
          {/* Layer B — rotation (golden-ratio beat) */}
          <div style={{ animation: rotAnim }}>
            {/* Layer C — scale + glow (silver-ratio beat), pop-in on mount */}
            <span
              key={track.trackId}
              role="img"
              aria-label={scene.label}
              style={{
                display:'block',
                transform:'translate(-50%,-50%)',
                fontSize:'clamp(130px, 18vw, 200px)',
                lineHeight:1,
                animation:`charPopIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, ${sclAnim} 0.7s, ${glowAnim} 0.7s`,
                willChange:'transform,filter',
              }}
            >{scene.char}</span>
          </div>
        </div>
      </div>

      {/* ── Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.6) 100%)',
      }} />
    </div>
  )
}
