'use client'

import { useState, useEffect } from 'react'

interface Props {
  imageUrl: string | null
  isLoading: boolean
}

export default function VisualDisplay({ imageUrl, isLoading }: Props) {
  const [current, setCurrent] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (!imageUrl || imageUrl === current) return

    if (!current) {
      setCurrent(imageUrl)
      return
    }

    // Preload the new image, then crossfade
    const img = new Image()
    img.onload = () => {
      setNext(imageUrl)
      setIsFading(true)
      setTimeout(() => {
        setCurrent(imageUrl)
        setNext(null)
        setIsFading(false)
      }, 2000)
    }
    img.src = imageUrl
  }, [imageUrl, current])

  return (
    <div className="fixed inset-0 bg-black">
      {/* Current image */}
      {current && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{
            backgroundImage: `url(${current})`,
            opacity: isFading ? 0 : 1,
          }}
        />
      )}

      {/* Incoming image */}
      {next && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{
            backgroundImage: `url(${next})`,
            opacity: isFading ? 1 : 0,
          }}
        />
      )}

      {/* Loading pulse overlay */}
      {isLoading && !current && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-white/40 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
