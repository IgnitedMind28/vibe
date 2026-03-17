import { cookies } from 'next/headers'
import SpotifyAuth from '@/components/SpotifyAuth'
import VibePlayer from '@/components/VibePlayer'

interface SearchParams {
  error?: string
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value
  const { error } = await searchParams

  if (!accessToken) {
    return <SpotifyAuth error={error} />
  }

  return <VibePlayer />
}
