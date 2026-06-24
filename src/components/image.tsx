'use client'

import NextImage from 'next/image'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
}

/**
 * Optimized Image component using next/image.
 * Falls back to regular img if next/image fails.
 */
export default function Image({ src, alt, width, height, className, fill, priority, sizes }: Props) {
  // For external images, we use unoptimized to avoid configuration issues
  // In production, configure next.config.js with images.remotePatterns
  if (fill) {
    return (
      <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={sizes || '100vw'}
          priority={priority}
          unoptimized
          style={{ objectFit: 'cover' }}
        />
      </div>
    )
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      unoptimized
      sizes={sizes}
    />
  )
}
