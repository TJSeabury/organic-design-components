import { parse, formatHex, converter, type Color, rgb, type Hsl, type Lab } from 'culori'

const toHsl = converter('hsl')

/**
 * Smoothstep interpolation function for smooth transitions
 */
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Blend two colors using multiply mode (darkens, good for shadows)
 */
const multiplyBlend = (base: number, blend: number): number => {
  return base * blend
}

/**
 * Blend two colors using screen mode (lightens, good for highlights)
 */
const screenBlend = (base: number, blend: number): number => {
  return 1 - (1 - base) * (1 - blend)
}

/**
 * Blend two colors using overlay mode (combines multiply and screen)
 */
const overlayBlend = (base: number, blend: number): number => {
  return base < 0.5 ? 2 * base * blend : 1 - 2 * (1 - base) * (1 - blend)
}

/**
 * Approach 1: Luminance-based blending with blending modes
 * Separates image into shadows, midtones, and highlights, then applies color tints
 * using different blending modes for each region.
 */
export interface LuminanceBasedGradingOptions {
  shadowColor: Color | string
  highlightColor: Color | string
  shadowThreshold?: number // default 0.3
  highlightThreshold?: number // default 0.7
  shadowStrength?: number // 0-1, default 0.3
  highlightStrength?: number // 0-1, default 0.2
  shadowBlendMode?: 'multiply' | 'overlay' | 'color'
  highlightBlendMode?: 'screen' | 'overlay' | 'color'
}

export const ApplyLuminanceBasedColorGrading = (
  imageData: ImageData,
  options: LuminanceBasedGradingOptions
): ImageData => {
  const {
    shadowColor,
    highlightColor,
    shadowThreshold = 0.3,
    highlightThreshold = 0.7,
    shadowStrength = 0.3,
    highlightStrength = 0.2,
    shadowBlendMode = 'multiply',
    highlightBlendMode = 'screen',
  } = options

  const toLab = converter('lab')
  const toRgb = converter('rgb')
  const toHsl = converter('hsl')

  // Parse and convert tint colors
  const shadowParsed = typeof shadowColor === 'string' ? parse(shadowColor) : shadowColor
  const highlightParsed = typeof highlightColor === 'string' ? parse(highlightColor) : highlightColor

  if (!shadowParsed || !highlightParsed) return imageData

  const shadowRgb = toRgb(shadowParsed)
  const highlightRgb = toRgb(highlightParsed)
  const shadowHsl = toHsl(shadowParsed)
  const highlightHsl = toHsl(highlightParsed)

  if (!shadowRgb || !highlightRgb || typeof shadowRgb !== 'object' || typeof highlightRgb !== 'object') {
    return imageData
  }

  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    // Convert pixel to LAB to get luminance
    const pixelColor = parse(`rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`)
    if (!pixelColor) continue

    const lab = toLab(pixelColor)
    if (!lab || typeof lab !== 'object') continue

    const luminance = lab.l / 100 // Normalize to 0-1

    let finalR = r
    let finalG = g
    let finalB = b

    if (luminance < shadowThreshold) {
      // Shadow region: apply shadow color tint
      const weight = smoothstep(0, shadowThreshold, luminance)
      const blendAmount = (1 - weight) * shadowStrength

      if (shadowBlendMode === 'multiply') {
        finalR = r + (multiplyBlend(r, shadowRgb.r ?? 0) - r) * blendAmount
        finalG = g + (multiplyBlend(g, shadowRgb.g ?? 0) - g) * blendAmount
        finalB = b + (multiplyBlend(b, shadowRgb.b ?? 0) - b) * blendAmount
      } else if (shadowBlendMode === 'overlay') {
        finalR = r + (overlayBlend(r, shadowRgb.r ?? 0) - r) * blendAmount
        finalG = g + (overlayBlend(g, shadowRgb.g ?? 0) - g) * blendAmount
        finalB = b + (overlayBlend(b, shadowRgb.b ?? 0) - b) * blendAmount
      } else if (shadowBlendMode === 'color' && shadowHsl && typeof shadowHsl === 'object') {
        // Color mode: apply hue/saturation while preserving luminance
        const pixelHsl = toHsl(pixelColor)
        if (pixelHsl && typeof pixelHsl === 'object') {
          const blendedHsl = {
            ...pixelHsl,
            h: pixelHsl.h! + (shadowHsl.h ?? 0) * blendAmount,
            s: pixelHsl.s! + (shadowHsl.s ?? 0) * blendAmount,
          }
          const blendedRgb = toRgb(blendedHsl)
          if (blendedRgb && typeof blendedRgb === 'object') {
            finalR = blendedRgb.r ?? r
            finalG = blendedRgb.g ?? g
            finalB = blendedRgb.b ?? b
          }
        }
      }
    } else if (luminance > highlightThreshold) {
      // Highlight region: apply highlight color tint
      const weight = smoothstep(highlightThreshold, 1, luminance)
      const blendAmount = weight * highlightStrength

      if (highlightBlendMode === 'screen') {
        finalR = r + (screenBlend(r, highlightRgb.r ?? 0) - r) * blendAmount
        finalG = g + (screenBlend(g, highlightRgb.g ?? 0) - g) * blendAmount
        finalB = b + (screenBlend(b, highlightRgb.b ?? 0) - b) * blendAmount
      } else if (highlightBlendMode === 'overlay') {
        finalR = r + (overlayBlend(r, highlightRgb.r ?? 0) - r) * blendAmount
        finalG = g + (overlayBlend(g, highlightRgb.g ?? 0) - g) * blendAmount
        finalB = b + (overlayBlend(b, highlightRgb.b ?? 0) - b) * blendAmount
      } else if (highlightBlendMode === 'color' && highlightHsl && typeof highlightHsl === 'object') {
        // Color mode: apply hue/saturation while preserving luminance
        const pixelHsl = toHsl(pixelColor)
        if (pixelHsl && typeof pixelHsl === 'object') {
          const blendedHsl = {
            ...pixelHsl,
            h: pixelHsl.h! + (highlightHsl.h ?? 0) * blendAmount,
            s: pixelHsl.s! + (highlightHsl.s ?? 0) * blendAmount,
          }
          const blendedRgb = toRgb(blendedHsl)
          if (blendedRgb && typeof blendedRgb === 'object') {
            finalR = blendedRgb.r ?? r
            finalG = blendedRgb.g ?? g
            finalB = blendedRgb.b ?? b
          }
        }
      }
    }
    // Midtones: no change (between shadowThreshold and highlightThreshold)

    // Clamp and write back
    data[i] = Math.max(0, Math.min(255, Math.round(finalR * 255)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(finalG * 255)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(finalB * 255)))
  }

  return imageData
}

/**
 * Approach 2: Three-way color mixing
 * Mixes shadow, midtone, and highlight colors based on smooth luminance weights.
 * Uses smoothstep for smooth transitions between regions.
 */
export interface ThreeWayColorMixingOptions {
  shadowColor: Color | string
  midtoneColor: Color | string
  highlightColor: Color | string
  shadowTransition?: number // 0-1, where shadow influence ends, default 0.4
  highlightTransition?: number // 0-1, where highlight influence begins, default 0.6
  transitionSmoothness?: number // 0-1, smoothstep edge size, default 0.1
}

export const ApplyThreeWayColorMixing = (
  imageData: ImageData,
  options: ThreeWayColorMixingOptions
): ImageData => {
  const {
    shadowColor,
    midtoneColor,
    highlightColor,
    shadowTransition = 0.4,
    highlightTransition = 0.6,
    transitionSmoothness = 0.1,
  } = options

  const toLab = converter('lab')
  const toRgb = converter('rgb')

  // Parse and convert all three colors to LAB
  const shadowParsed = typeof shadowColor === 'string' ? parse(shadowColor) : shadowColor
  const midtoneParsed = typeof midtoneColor === 'string' ? parse(midtoneColor) : midtoneColor
  const highlightParsed = typeof highlightColor === 'string' ? parse(highlightColor) : highlightColor

  if (!shadowParsed || !midtoneParsed || !highlightParsed) return imageData

  const shadowLab = toLab(shadowParsed)
  const midtoneLab = toLab(midtoneParsed)
  const highlightLab = toLab(highlightParsed)

  if (
    !shadowLab ||
    !midtoneLab ||
    !highlightLab ||
    typeof shadowLab !== 'object' ||
    typeof midtoneLab !== 'object' ||
    typeof highlightLab !== 'object'
  ) {
    return imageData
  }

  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // Convert pixel to LAB to get luminance
    const pixelColor = parse(`rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`)
    if (!pixelColor) continue

    const lab = toLab(pixelColor)
    if (!lab || typeof lab !== 'object') continue

    const luminance = lab.l / 100 // Normalize to 0-1

    // Calculate weights for each color region using smoothstep
    const shadowWeight = smoothstep(
      shadowTransition + transitionSmoothness,
      shadowTransition - transitionSmoothness,
      luminance
    )
    const highlightWeight = smoothstep(
      highlightTransition - transitionSmoothness,
      highlightTransition + transitionSmoothness,
      luminance
    )
    const midtoneWeight = 1 - shadowWeight - highlightWeight

    // Mix colors in LAB space (perceptually uniform)
    const mixedLab: Lab = {
      mode: 'lab',
      l: lab.l, // Preserve original luminance
      a:
        (shadowLab.a ?? 0) * shadowWeight +
        (midtoneLab.a ?? 0) * midtoneWeight +
        (highlightLab.a ?? 0) * highlightWeight,
      b:
        (shadowLab.b ?? 0) * shadowWeight +
        (midtoneLab.b ?? 0) * midtoneWeight +
        (highlightLab.b ?? 0) * highlightWeight,
    }

    // Convert back to RGB
    const rgbColor = toRgb(mixedLab)
    if (!rgbColor || typeof rgbColor !== 'object') continue

    // Blend with original color based on luminance (preserve some original character)
    const blendFactor = 0.7 // How much of the mixed color vs original (0-1)
    const originalR = data[i] / 255
    const originalG = data[i + 1] / 255
    const originalB = data[i + 2] / 255

    const finalR = originalR * (1 - blendFactor) + (rgbColor.r ?? 0) * blendFactor
    const finalG = originalG * (1 - blendFactor) + (rgbColor.g ?? 0) * blendFactor
    const finalB = originalB * (1 - blendFactor) + (rgbColor.b ?? 0) * blendFactor

    // Clamp and write back
    data[i] = Math.max(0, Math.min(255, Math.round(finalR * 255)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(finalG * 255)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(finalB * 255)))
  }

  return imageData
}

export const LoadImageData = async (imageUrl: string): Promise<ImageData | undefined> => {
  try {
    // Use fetch to follow redirects and get the image as a blob
    const response = await fetch(imageUrl, { mode: 'cors' })
    if (!response.ok) {
      console.warn('Failed to fetch image:', response.statusText)
      return undefined
    }
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    return await new Promise<ImageData | undefined>((resolve) => {
      const image = new Image()
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(undefined)
            return
          }
          ctx.drawImage(image, 0, 0)
          const imageData = ctx.getImageData(0, 0, image.width, image.height)
          resolve(imageData)
        } catch (error) {
          console.warn('Failed to load image data:', error)
          resolve(undefined)
        } finally {
          URL.revokeObjectURL(blobUrl)
        }
      }
      image.onerror = () => {
        URL.revokeObjectURL(blobUrl)
        resolve(undefined)
      }
      image.src = blobUrl
    })
  } catch (error) {
    console.warn('Failed to fetch image:', error)
    return undefined
  }
}

export const ExtractComplimentaryColorsFromImage = async (imageUrl: string): Promise<[Color, Color] | undefined> => {
  const imageData = await LoadImageData(imageUrl)
  if (!imageData) return undefined

  // A Uint8ClampedArray if the pixelFormat is "rgba-unorm8".
  const data = imageData.data
  const colors: Color[] = []
  for (let i = 0; i < data.length; i += 4) {
    const pixelColor: Color | undefined = parse(
      `rgba(${data[i + 0]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3]})`,
    )
    if (!pixelColor) continue
    const hsl = toHsl(pixelColor)
    if (hsl && FilterColorIsAestheticTone(hsl, 0.5, 0.9)) {
      colors.push(pixelColor)
    }
  }

  const mostFrequentColor = MostFrequentColor(colors)
  if (!mostFrequentColor) return undefined

  return [
    mostFrequentColor,
    GetComplimentaryColor(mostFrequentColor),
  ]
}

export const ExtractAverageWarmAndCoolColorsFromImage = async (imageUrl: string): Promise<[Color, Color] | undefined> => {
  const imageData = await LoadImageData(imageUrl)
  if (!imageData) return undefined

  // A Uint8ClampedArray if the pixelFormat is "rgba-unorm8".
  const data = imageData.data
  const colors: Color[] = []
  for (let i = 0; i < data.length; i += 4) {
    const pixelColor: Color | undefined = parse(
      `rgba(${data[i + 0]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3]})`,
    )
    if (!pixelColor) continue
    const hsl = toHsl(pixelColor)
    if (hsl && FilterColorIsAestheticTone(hsl, 0.5, 0.9)) {
      colors.push(pixelColor)
    }
  }

  if (colors.length === 0) return undefined

  const [warmColors, coolColors] = SortColorsByWarmth(colors)
  return [AverageColors(warmColors), AverageColors(coolColors)]
}

export const AverageColors = (colors: Color[]): Color => {
  if (colors.length === 0) return rgb('#000000') as Color

  const toLab = converter('lab')
  const toRgb = converter('rgb')

  // Convert all colors to LAB color space for perceptually uniform averaging
  const labColors = colors
    .map(color => toLab(color))
    .filter((lab): lab is Lab => lab !== undefined && typeof lab === 'object')

  if (labColors.length === 0) return rgb('#000000') as Color

  // Average each LAB channel
  const avgLab: Lab = {
    mode: 'lab',
    l: labColors.reduce((sum, lab) => sum + (lab.l ?? 0), 0) / labColors.length,
    a: labColors.reduce((sum, lab) => sum + (lab.a ?? 0), 0) / labColors.length,
    b: labColors.reduce((sum, lab) => sum + (lab.b ?? 0), 0) / labColors.length,
  }

  // Convert back to RGB and return as Color
  const avgRgb = toRgb(avgLab)
  return (avgRgb ? rgb(avgRgb) : rgb('#000000')) as Color
}

export const SortColorsByWarmth = (colors: Color[]): [Color[], Color[]] => {
  const warmColors: Color[] = []
  const coolColors: Color[] = []
  for (const color of colors) {
    const hsl = toHsl(color)
    if (hsl && hsl.h && hsl.h > 90 && hsl.h < 270) {
      warmColors.push(color)
    } else {
      coolColors.push(color)
    }
  }
  return [warmColors, coolColors]
}

export const FilterColorIsAestheticTone = (
  color: Hsl,
  lower: number = 0.5,
  upper: number = 0.9,
) => {
  if (!color || typeof color !== "object") return false;
  if (color.l < lower || color.l > upper) return false;
  if (color.s < 0.2) return false;
  return true;
};

export const MostFrequentColor = (colors: Color[]): Color => {
  const colorCounts = colors.reduce((acc, color) => {
    acc[formatHex(color)] = (acc[formatHex(color)] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return parse(Object.keys(colorCounts).reduce((a, b) => colorCounts[a as keyof typeof colorCounts] > colorCounts[b as keyof typeof colorCounts] ? a : b)) as Color
}

export const GetComplimentaryColor = (color: string | Color): Color => {
  const parsed = typeof color === 'string' ? parse(color) : color
  if (!parsed) return rgb('#000000') as Color

  // Convert to HSL format
  const toHsl = converter('hsl')
  const hsl = toHsl(parsed)

  if (!hsl) return rgb(parsed) || rgb('#000000') as Color

  // Rotate hue by 180 degrees for complementary color
  const h = 'h' in hsl && typeof hsl.h === 'number' ? (hsl.h + 180) % 360 : 180
  const complementaryHsl = { ...hsl, h } as unknown as Color

  return rgb(complementaryHsl) || rgb('#000000') as Color
}