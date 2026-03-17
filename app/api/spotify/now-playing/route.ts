import { NextRequest, NextResponse } from 'next/server'
import { getNowPlaying } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const track = await getNowPlaying(accessToken)
    if (!track) {
      return NextResponse.json({ track: null })
    }
    return NextResponse.json({ track })
  } catch (err) {
    const status = err instanceof Error && err.message.includes('401') ? 401 : 500
    return NextResponse.json({ error: 'Failed to fetch now playing' }, { status })
  }
}
