import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function generateImagePrompt(params: {
  title: string
  artist: string
  album: string
  genres: string[]
  tempo: number
  energy: number
  valence: number
  danceability: number
}): Promise<string> {
  const { title, artist, album, genres, tempo, energy, valence, danceability } = params

  const moodDesc = valence > 0.6 ? 'uplifting/joyful' : valence < 0.4 ? 'melancholic/dark' : 'bittersweet/neutral'
  const energyDesc = energy > 0.7 ? 'intense/powerful' : energy < 0.3 ? 'calm/gentle' : 'moderate'
  const genreStr = genres.length > 0 ? genres.slice(0, 3).join(', ') : 'general'

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: 'You are a cinematographer. Output only a single image generation prompt with no preamble, quotes, or explanation.',
    messages: [
      {
        role: 'user',
        content: `Song: "${title}" by ${artist} from album "${album}". Genre: ${genreStr}. ${tempo} BPM, energy: ${energyDesc}, mood: ${moodDesc}, danceability: ${Math.round(danceability * 100)}%. Write a vivid, cinematic, atmospheric image prompt (max 50 words) for a full-screen ambient TV visual that captures the feeling of this song.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return text
}
