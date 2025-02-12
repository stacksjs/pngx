import { Buffer } from 'node:buffer'
import {
  COLORTYPE_ALPHA,
  COLORTYPE_COLOR,
  COLORTYPE_COLOR_ALPHA,
  COLORTYPE_GRAYSCALE,
  COLORTYPE_TO_BPP_MAP,
} from './constants'

interface BitpackOptions {
  colorType: number
  inputColorType: number
  bitDepth: 8 | 16
  inputHasAlpha?: boolean
  bgColor?: {
    red?: number
    green?: number
    blue?: number
  }
}

interface RGBA {
  red: number
  green: number
  blue: number
  alpha: number
}

/**
 * Checks if the system is big endian
 */
function isBigEndian(): boolean {
  const buffer = new ArrayBuffer(2)
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */)
  // Int16Array uses the platform's endianness
  return new Int16Array(buffer)[0] !== 256
}

/**
 * Packs image data with specified color type and bit depth
 */
export function bitPacker(
  dataIn: Buffer,
  width: number,
  height: number,
  options: BitpackOptions,
): Buffer {
  const outHasAlpha = [COLORTYPE_COLOR_ALPHA, COLORTYPE_ALPHA].includes(options.colorType)

  // Fast path: if no conversion needed and endianness matches
  if (options.colorType === options.inputColorType) {
    if (options.bitDepth === 8 || (options.bitDepth === 16 && isBigEndian())) {
      return dataIn
    }
  }

  // Map to UInt16 array if data is 16bit
  const data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer)

  const maxValue = options.bitDepth === 16 ? 65535 : 255

  let inBpp = COLORTYPE_TO_BPP_MAP[options.inputColorType]
  if (inBpp === 4 && !options.inputHasAlpha) {
    inBpp = 3
  }

  let outBpp = COLORTYPE_TO_BPP_MAP[options.colorType]
  if (options.bitDepth === 16) {
    outBpp *= 2
  }

  const outData = Buffer.alloc(width * height * outBpp)

  // Initialize background color
  const bgColor = {
    red: options.bgColor?.red ?? maxValue,
    green: options.bgColor?.green ?? maxValue,
    blue: options.bgColor?.blue ?? maxValue,
  }

  /**
   * Gets RGBA values for current pixel
   */
  function getRGBA(inIndex: number): RGBA {
    let red: number
    let green: number
    let blue: number
    let alpha = maxValue

    switch (options.inputColorType) {
      case COLORTYPE_COLOR_ALPHA:
        alpha = data[inIndex + 3]
        red = data[inIndex]
        green = data[inIndex + 1]
        blue = data[inIndex + 2]
        break
      case COLORTYPE_COLOR:
        red = data[inIndex]
        green = data[inIndex + 1]
        blue = data[inIndex + 2]
        break
      case COLORTYPE_ALPHA:
        alpha = data[inIndex + 1]
        red = data[inIndex]
        green = red
        blue = red
        break
      case COLORTYPE_GRAYSCALE:
        red = data[inIndex]
        green = red
        blue = red
        break
      default:
        throw new Error(
          `Input color type: ${options.inputColorType} is not supported at present`,
        )
    }

    // Handle alpha blending
    if (options.inputHasAlpha && !outHasAlpha) {
      const alphaRatio = alpha / maxValue
      const inverseAlpha = 1 - alphaRatio

      red = Math.min(
        Math.max(Math.round(inverseAlpha * bgColor.red + alphaRatio * red), 0),
        maxValue,
      )
      green = Math.min(
        Math.max(Math.round(inverseAlpha * bgColor.green + alphaRatio * green), 0),
        maxValue,
      )
      blue = Math.min(
        Math.max(Math.round(inverseAlpha * bgColor.blue + alphaRatio * blue), 0),
        maxValue,
      )
    }

    return { red, green, blue, alpha }
  }

  let inIndex = 0
  let outIndex = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgba = getRGBA(inIndex)

      switch (options.colorType) {
        case COLORTYPE_COLOR_ALPHA:
        case COLORTYPE_COLOR:
          if (options.bitDepth === 8) {
            outData[outIndex] = rgba.red
            outData[outIndex + 1] = rgba.green
            outData[outIndex + 2] = rgba.blue
            if (outHasAlpha) {
              outData[outIndex + 3] = rgba.alpha
            }
          }
          else {
            outData.writeUInt16BE(rgba.red, outIndex)
            outData.writeUInt16BE(rgba.green, outIndex + 2)
            outData.writeUInt16BE(rgba.blue, outIndex + 4)
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 6)
            }
          }
          break

        case COLORTYPE_ALPHA:
        case COLORTYPE_GRAYSCALE: {
          const grayscale = Math.round((rgba.red + rgba.green + rgba.blue) / 3)
          if (options.bitDepth === 8) {
            outData[outIndex] = grayscale
            if (outHasAlpha) {
              outData[outIndex + 1] = rgba.alpha
            }
          }
          else {
            outData.writeUInt16BE(grayscale, outIndex)
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 2)
            }
          }
          break
        }

        default:
          throw new Error(`Unrecognized color type ${options.colorType}`)
      }

      inIndex += inBpp
      outIndex += outBpp
    }
  }

  return outData
}

// Default export for backward compatibility
export default bitPacker
