import { NextRequest, NextResponse } from 'next/server'
import { generateImagePrompt } from '@/lib/claude'

// Simple in-memory cache keyed by trackId
const cache = new Map<string, string>()

function trackIdToSeed(trackId: string): number {
  let hash = 0
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash << 5) - hash + trackId.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { trackId, title, artist, album, genres, tempo, energy, valence, danceability } = body

  if (!trackId || !title || !artist) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Return cached image URL if available
  if (cache.has(trackId)) {
    return NextResponse.json({ imageUrl: cache.get(trackId) })
  }

  const prompt = await generateImagePrompt({
    title,
    artist,
    album: album ?? '',
    genres: genres ?? [],
    tempo: tempo ?? 120,
    energy: energy ?? 0.5,
    valence: valence ?? 0.5,
    danceability: danceability ?? 0.5,
  })

  const seed = trackIdToSeed(trackId)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1920&height=1080&nologo=true&seed=${seed}`

  cache.set(trackId, imageUrl)

  return NextResponse.json({ imageUrl, prompt })
}
