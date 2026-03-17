export interface NowPlayingTrack {
  trackId: string
  title: string
  artist: string
  album: string
  albumArt: string
  genres: string[]
  tempo: number
  energy: number
  valence: number
  danceability: number
  isPlaying: boolean
}

export async function fetchWithSpotifyAuth(
  url: string,
  accessToken: string
): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function getNowPlaying(accessToken: string): Promise<NowPlayingTrack | null> {
  const res = await fetchWithSpotifyAuth(
    'https://api.spotify.com/v1/me/player/currently-playing',
    accessToken
  )

  if (res.status === 204 || res.status === 404) return null
  if (!res.ok) throw new Error(`Spotify error: ${res.status}`)

  const data = await res.json()
  if (!data.item || data.item.type !== 'track') return null

  const track = data.item
  const artistId = track.artists[0]?.id

  // Fetch audio features and artist genres in parallel
  const [featuresRes, artistRes] = await Promise.all([
    fetchWithSpotifyAuth(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      accessToken
    ),
    artistId
      ? fetchWithSpotifyAuth(
          `https://api.spotify.com/v1/artists/${artistId}`,
          accessToken
        )
      : Promise.resolve(null),
  ])

  const features = featuresRes.ok ? await featuresRes.json() : {}
  const artist = artistRes?.ok ? await artistRes.json() : {}

  return {
    trackId: track.id,
    title: track.name,
    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[0]?.url ?? '',
    genres: artist.genres ?? [],
    tempo: Math.round(features.tempo ?? 120),
    energy: features.energy ?? 0.5,
    valence: features.valence ?? 0.5,
    danceability: features.danceability ?? 0.5,
    isPlaying: data.is_playing,
  }
}
