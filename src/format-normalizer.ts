import { Buffer } from 'node:buffer'

/**
 * Format normalizer for PNG image data.
 * Handles palette conversion, transparency, and bit depth scaling.
 */

type Color = [number, number, number, number]

interface ImageData {
  depth: number
  width: number
  height: number
  colorType: number
  transColor?: number[]
  palette?: Color[]
}

/**
 * Converts paletted image data to RGBA format
 * @throws {Error} If a color index is not found in the palette
 */
function dePalette(
  indata: Buffer,
  outdata: Buffer,
  width: number,
  height: number,
  palette: Color[],
): void {
  let pxPos = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = palette[indata[pxPos]]

      if (!color) {
        throw new Error(`Index ${indata[pxPos]} not in palette`)
      }

      for (let i = 0; i < 4; i++) {
        outdata[pxPos + i] = color[i]
      }
      pxPos += 4
    }
  }
}

/**
 * Replaces specific colors with transparent pixels
 */
function replaceTransparentColor(
  indata: Buffer,
  outdata: Buffer,
  width: number,
  height: number,
  transColor: number[],
): void {
  let pxPos = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let makeTrans = false

      if (transColor.length === 1) {
        makeTrans = transColor[0] === indata[pxPos]
      }
      else {
        makeTrans = (
          transColor[0] === indata[pxPos]
          && transColor[1] === indata[pxPos + 1]
          && transColor[2] === indata[pxPos + 2]
        )
      }

      if (makeTrans) {
        for (let i = 0; i < 4; i++) {
          outdata[pxPos + i] = 0
        }
      }
      pxPos += 4
    }
  }
}

/**
 * Scales pixel values from the input bit depth to 8 bits
 */
function scaleDepth(
  indata: Buffer,
  outdata: Buffer,
  width: number,
  height: number,
  depth: number,
): void {
  const maxOutSample = 255
  const maxInSample = 2 ** depth - 1
  let pxPos = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let i = 0; i < 4; i++) {
        outdata[pxPos + i] = Math.floor(
          (indata[pxPos + i] * maxOutSample) / maxInSample + 0.5,
        )
      }
      pxPos += 4
    }
  }
}

/**
 * Normalizes PNG image data to a standard RGBA format
 *
 * @param indata - Input image data buffer
 * @param imageData - Image metadata and parameters
 * @param skipRescale - Whether to skip bit depth rescaling
 * @returns Normalized image data buffer
 * @throws {Error} If palette index is invalid
 */
export function normalizeFormat(
  indata: Buffer,
  imageData: ImageData,
  skipRescale = false,
): Buffer {
  const {
    depth,
    width,
    height,
    colorType,
    transColor,
    palette,
  } = imageData

  let outdata: Buffer = indata // only different for 16 bits

  if (colorType === 3 && palette) { // paletted
    dePalette(indata, outdata, width, height, palette)
  }
  else {
    if (transColor) {
      replaceTransparentColor(indata, outdata, width, height, transColor)
    }

    // if it needs scaling
    if (depth !== 8 && !skipRescale) {
      // if we need to change the buffer size
      if (depth === 16) {
        outdata = Buffer.alloc(width * height * 4)
      }
      scaleDepth(indata, outdata, width, height, depth)
    }
  }

  return outdata
}

// Default export for backward compatibility
export default normalizeFormat
