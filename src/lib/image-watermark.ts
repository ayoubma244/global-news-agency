/**
 * Image Watermark — downloads images from source articles,
 * adds the site's logo/name as a watermark, and stores them locally.
 *
 * Features:
 * - Download image from URL
 * - Add text watermark (site name) - bottom-right corner
 * - Add logo watermark if logo URL provided
 * - Save to /public/images/articles/
 * - Return public URL for embedding
 *
 * Uses: sharp (image processing) - need to install
 */

import { promises as fs } from 'fs'
import path from 'path'
import { existsSync } from 'fs'

// Lazy-load sharp (heavy module)
let sharpModule: any = null
async function getSharp() {
  if (!sharpModule) {
    sharpModule = await import('sharp')
  }
  return sharpModule.default
}

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'articles')
const PUBLIC_PREFIX = '/images/articles'

export interface WatermarkOptions {
  siteName: string
  logoUrl?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  opacity?: number  // 0-100
  fontSize?: number // relative to image width
  textColor?: string // hex
}

export interface ProcessedImage {
  originalUrl: string
  storedUrl: string  // public URL
  localPath: string  // filesystem path
  width: number
  height: number
  isWatermarked: boolean
}

/**
 * Ensure the images directory exists.
 */
async function ensureDir() {
  if (!existsSync(IMAGES_DIR)) {
    await fs.mkdir(IMAGES_DIR, { recursive: true })
  }
}

/**
 * Generate a unique filename from URL.
 */
function generateFilename(url: string, ext = '.jpg'): string {
  const hash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '').slice(0, 16)
  return `${hash}-${Date.now()}${ext}`
}

/**
 * Download an image from a URL.
 */
async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/2.0; +https://yoursite.com/bot)',
      'Accept': 'image/*',
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Add text watermark to an image buffer using sharp + SVG overlay.
 */
async function addTextWatermark(
  imageBuffer: Buffer,
  opts: WatermarkOptions,
  imageWidth: number
): Promise<Buffer> {
  const sharp = await getSharp()

  // Calculate font size relative to image width
  const fontSize = Math.max(16, Math.round(imageWidth * (opts.fontSize || 0.03)))
  const padding = Math.max(10, Math.round(imageWidth * 0.02))
  const text = opts.siteName

  // Get image metadata for positioning
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || imageWidth
  const height = metadata.height || 600

  // Calculate text dimensions (approximate)
  const textWidth = text.length * fontSize * 0.55
  const textHeight = fontSize * 1.2

  // Position calculation
  let x = padding
  let y = padding
  const pos = opts.position || 'bottom-right'
  if (pos.includes('right')) x = width - textWidth - padding
  if (pos.includes('bottom')) y = height - textHeight - padding
  if (pos === 'center') {
    x = (width - textWidth) / 2
    y = (height - textHeight) / 2
  }

  const opacity = (opts.opacity ?? 70) / 100
  const textColor = opts.textColor || '#ffffff'
  // Background shadow for readability
  const shadowColor = 'rgba(0,0,0,0.5)'

  // Create SVG overlay
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="${shadowColor}"/>
      </filter>
    </defs>
    <text x="${x}" y="${y + fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" opacity="${opacity}" filter="url(#shadow)">${escapeXml(text)}</text>
  </svg>`

  const svgBuffer = Buffer.from(svg)

  // Composite the SVG onto the image
  return await sharp(imageBuffer)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] || c)
}

/**
 * Process a single image: download → watermark → save locally.
 */
export async function processImage(
  imageUrl: string,
  opts: WatermarkOptions
): Promise<ProcessedImage | null> {
  try {
    await ensureDir()

    // 1. Download
    const originalBuffer = await downloadImage(imageUrl)

    // 2. Get metadata
    const sharp = await getSharp()
    const metadata = await sharp(originalBuffer).metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600

    // 3. Add watermark
    let finalBuffer = originalBuffer
    let isWatermarked = false
    try {
      finalBuffer = await addTextWatermark(originalBuffer, opts, width)
      isWatermarked = true
    } catch (e: any) {
      console.error('Watermark failed, using original:', e.message)
      // Convert to JPEG anyway for consistency
      finalBuffer = await sharp(originalBuffer).jpeg({ quality: 85 }).toBuffer()
    }

    // 4. Save locally
    const filename = generateFilename(imageUrl)
    const localPath = path.join(IMAGES_DIR, filename)
    await fs.writeFile(localPath, finalBuffer)

    // 5. Return public URL
    const storedUrl = `${PUBLIC_PREFIX}/${filename}`

    return {
      originalUrl: imageUrl,
      storedUrl,
      localPath,
      width,
      height,
      isWatermarked,
    }
  } catch (e: any) {
    console.error(`Failed to process image ${imageUrl}:`, e.message)
    return null
  }
}

/**
 * Process multiple images, return only successful ones.
 */
export async function processImages(
  imageUrls: string[],
  opts: WatermarkOptions,
  maxImages = 5
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = []
  const urls = imageUrls.slice(0, maxImages)

  for (const url of urls) {
    const processed = await processImage(url, opts)
    if (processed) results.push(processed)
  }

  return results
}
