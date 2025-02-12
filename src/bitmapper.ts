import { Buffer } from 'node:buffer'
import { getImagePasses, getInterlaceIterator } from './interlace'

type PixelMapper = (
  pxData: Buffer | Uint16Array,
  data: Buffer | number[],
  pxPos: number,
  rawPos: number
) => void

type CustomPixelMapper = (
  pxData: Buffer | Uint16Array,
  pixelData: number[],
  pxPos: number,
  maxBit: number
) => void

interface BitmapInfo {
  width: number
  height: number
  depth: 1 | 2 | 4 | 8 | 16
  bpp: 1 | 2 | 3 | 4
  interlace: boolean
}

interface ImagePass {
  width: number
  height: number
  index: number
}

interface BitRetriever {
  get: (count: number) => number[]
  resetAfterLine: () => void
  end: () => void
}

// Standard pixel mappers for 8-bit depth
const pixelBppMapper: PixelMapper[] = [
  () => { }, // 0 - dummy entry

  // 1 - L (Luminance)
  (pxData, data, pxPos, rawPos) => {
    if (rawPos === (data as Buffer).length) {
      throw new Error('Ran out of data')
    }

    const pixel = (data as Buffer)[rawPos]
    pxData[pxPos] = pixel
    pxData[pxPos + 1] = pixel
    pxData[pxPos + 2] = pixel
    pxData[pxPos + 3] = 0xFF
  },

  // 2 - LA (Luminance with Alpha)
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 1 >= (data as Buffer).length) {
      throw new Error('Ran out of data')
    }

    const pixel = (data as Buffer)[rawPos]
    pxData[pxPos] = pixel
    pxData[pxPos + 1] = pixel
    pxData[pxPos + 2] = pixel
    pxData[pxPos + 3] = (data as Buffer)[rawPos + 1]
  },

  // 3 - RGB
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 2 >= (data as Buffer).length) {
      throw new Error('Ran out of data')
    }

    pxData[pxPos] = (data as Buffer)[rawPos]
    pxData[pxPos + 1] = (data as Buffer)[rawPos + 1]
    pxData[pxPos + 2] = (data as Buffer)[rawPos + 2]
    pxData[pxPos + 3] = 0xFF
  },

  // 4 - RGBA
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 3 >= (data as Buffer).length) {
      throw new Error('Ran out of data')
    }

    pxData[pxPos] = (data as Buffer)[rawPos]
    pxData[pxPos + 1] = (data as Buffer)[rawPos + 1]
    pxData[pxPos + 2] = (data as Buffer)[rawPos + 2]
    pxData[pxPos + 3] = (data as Buffer)[rawPos + 3]
  },
]

// Custom pixel mappers for other bit depths
const pixelBppCustomMapper: CustomPixelMapper[] = [
  () => { }, // 0 - dummy entry

  // 1 - L (Luminance)
  (pxData, pixelData, pxPos, maxBit) => {
    const pixel = pixelData[0]
    pxData[pxPos] = pixel
    pxData[pxPos + 1] = pixel
    pxData[pxPos + 2] = pixel
    pxData[pxPos + 3] = maxBit
  },

  // 2 - LA (Luminance with Alpha)
  (pxData, pixelData, pxPos) => {
    const pixel = pixelData[0]
    pxData[pxPos] = pixel
    pxData[pxPos + 1] = pixel
    pxData[pxPos + 2] = pixel
    pxData[pxPos + 3] = pixelData[1]
  },

  // 3 - RGB
  (pxData, pixelData, pxPos, maxBit) => {
    pxData[pxPos] = pixelData[0]
    pxData[pxPos + 1] = pixelData[1]
    pxData[pxPos + 2] = pixelData[2]
    pxData[pxPos + 3] = maxBit
  },

  // 4 - RGBA
  (pxData, pixelData, pxPos) => {
    pxData[pxPos] = pixelData[0]
    pxData[pxPos + 1] = pixelData[1]
    pxData[pxPos + 2] = pixelData[2]
    pxData[pxPos + 3] = pixelData[3]
  },
]

/**
 * Creates a bit retriever for handling non-8-bit pixel depths
 */
function createBitRetriever(data: Buffer, depth: number): BitRetriever {
  let leftOver: number[] = []
  let i = 0

  function split(): void {
    if (i === data.length) {
      throw new Error('Ran out of data')
    }
    const byte = data[i]
    i++

    switch (depth) {
      case 16: {
        const byte2 = data[i]
        i++
        leftOver.push((byte << 8) + byte2)
        break
      }
      case 4:
        leftOver.push(byte >> 4, byte & 0x0F)
        break
      case 2:
        leftOver.push(
          (byte >> 6) & 3,
          (byte >> 4) & 3,
          (byte >> 2) & 3,
          byte & 3,
        )
        break
      case 1:
        leftOver.push(
          (byte >> 7) & 1,
          (byte >> 6) & 1,
          (byte >> 5) & 1,
          (byte >> 4) & 1,
          (byte >> 3) & 1,
          (byte >> 2) & 1,
          (byte >> 1) & 1,
          byte & 1,
        )
        break
      default:
        throw new Error('Unrecognized depth')
    }
  }

  return {
    get: (count: number): number[] => {
      while (leftOver.length < count) {
        split()
      }

      const result = leftOver.slice(0, count)
      leftOver = leftOver.slice(count)

      return result
    },

    resetAfterLine: () => {
      leftOver.length = 0
    },

    end: () => {
      if (i !== data.length) {
        throw new Error('Extra data found')
      }
    },
  }
}

/**
 * Maps 8-bit image data to RGBA pixels
 */
function mapImage8Bit(
  image: ImagePass,
  pxData: Buffer | Uint16Array,
  getPxPos: (x: number, y: number, pass: number) => number,
  bpp: 1 | 2 | 3 | 4,
  data: Buffer,
  rawPos: number,
): number {
  const { width, height, index: imagePass } = image

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pxPos = getPxPos(x, y, imagePass)
      pixelBppMapper[bpp](pxData, data, pxPos, rawPos)
      rawPos += bpp
    }
  }
  return rawPos
}

/**
 * Maps custom bit depth image data to RGBA pixels
 */
function mapImageCustomBit(
  image: ImagePass,
  pxData: Buffer | Uint16Array,
  getPxPos: (x: number, y: number, pass: number) => number,
  bpp: 1 | 2 | 3 | 4,
  bits: BitRetriever,
  maxBit: number,
): void {
  const { width, height, index: imagePass } = image

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelData = bits.get(bpp)
      const pxPos = getPxPos(x, y, imagePass)
      pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit)
    }
    bits.resetAfterLine()
  }
}

/**
 * Converts raw bitmap data to RGBA pixel data
 */
export function dataToBitMap(data: Buffer, bitmapInfo: BitmapInfo): Buffer | Uint16Array {
  const { width, height, depth, bpp, interlace } = bitmapInfo

  let bits: BitRetriever | undefined
  if (depth !== 8) {
    bits = createBitRetriever(data, depth)
  }

  // Create appropriate pixel data storage
  const pxData = depth <= 8
    ? Buffer.alloc(width * height * 4)
    : new Uint16Array(width * height * 4)

  const maxBit = 2 ** depth - 1
  let rawPos = 0

  // Set up interlacing if needed
  let images: ImagePass[]
  let getPxPos: (x: number, y: number, pass: number) => number

  if (interlace) {
    images = getImagePasses(width, height)
    getPxPos = getInterlaceIterator(width)
  }
  else {
    let nonInterlacedPxPos = 0
    getPxPos = () => {
      const pos = nonInterlacedPxPos
      nonInterlacedPxPos += 4
      return pos
    }
    images = [{ width, height, index: 0 }]
  }

  // Process each image pass
  for (const image of images) {
    if (depth === 8) {
      rawPos = mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos)
    }
    else if (bits) {
      mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit)
    }
  }

  // Verify all data was processed
  if (depth === 8) {
    if (rawPos !== data.length) {
      throw new Error('Extra data found')
    }
  }
  else if (bits) {
    bits.end()
  }

  return pxData
}

export default dataToBitMap
