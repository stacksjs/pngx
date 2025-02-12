import { Buffer } from 'node:buffer'
import { paethPredictor } from './paeth-predictor'

/**
 * Options for PNG filter packing
 */
interface FilterPackOptions {
  filterType?: number | number[]
  bitDepth?: number
}

type FilterFunction = (
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
  bpp: number
) => void

type FilterSumFunction = (
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  bpp: number
) => number

/**
 * Implements "None" filter
 */
function filterNone(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
): void {
  for (let x = 0; x < byteWidth; x++) {
    rawData[rawPos + x] = pxData[pxPos + x]
  }
}

/**
 * Calculates sum for "None" filter
 */
function filterSumNone(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
): number {
  let sum = 0
  const length = pxPos + byteWidth

  for (let i = pxPos; i < length; i++) {
    sum += Math.abs(pxData[i])
  }
  return sum
}

/**
 * Implements "Sub" filter
 */
function filterSub(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
  bpp: number,
): void {
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const val = pxData[pxPos + x] - left
    rawData[rawPos + x] = val
  }
}

/**
 * Calculates sum for "Sub" filter
 */
function filterSumSub(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  bpp: number,
): number {
  let sum = 0
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const val = pxData[pxPos + x] - left
    sum += Math.abs(val)
  }
  return sum
}

/**
 * Implements "Up" filter
 */
function filterUp(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
): void {
  for (let x = 0; x < byteWidth; x++) {
    const up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0
    const val = pxData[pxPos + x] - up
    rawData[rawPos + x] = val
  }
}

/**
 * Calculates sum for "Up" filter
 */
function filterSumUp(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
): number {
  let sum = 0
  const length = pxPos + byteWidth
  for (let x = pxPos; x < length; x++) {
    const up = pxPos > 0 ? pxData[x - byteWidth] : 0
    const val = pxData[x] - up
    sum += Math.abs(val)
  }
  return sum
}

/**
 * Implements "Average" filter
 */
function filterAvg(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
  bpp: number,
): void {
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0
    const val = pxData[pxPos + x] - ((left + up) >> 1)
    rawData[rawPos + x] = val
  }
}

/**
 * Calculates sum for "Average" filter
 */
function filterSumAvg(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  bpp: number,
): number {
  let sum = 0
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0
    const val = pxData[pxPos + x] - ((left + up) >> 1)
    sum += Math.abs(val)
  }
  return sum
}

/**
 * Implements "Paeth" filter
 */
function filterPaeth(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  rawData: Buffer,
  rawPos: number,
  bpp: number,
): void {
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0
    const upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0
    const val = pxData[pxPos + x] - paethPredictor(left, up, upleft)
    rawData[rawPos + x] = val
  }
}

/**
 * Calculates sum for "Paeth" filter
 */
function filterSumPaeth(
  pxData: Buffer,
  pxPos: number,
  byteWidth: number,
  bpp: number,
): number {
  let sum = 0
  for (let x = 0; x < byteWidth; x++) {
    const left = x >= bpp ? pxData[pxPos + x - bpp] : 0
    const up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0
    const upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0
    const val = pxData[pxPos + x] - paethPredictor(left, up, upleft)
    sum += Math.abs(val)
  }
  return sum
}

const filters: Record<number, FilterFunction> = {
  0: filterNone,
  1: filterSub,
  2: filterUp,
  3: filterAvg,
  4: filterPaeth,
}

const filterSums: Record<number, FilterSumFunction> = {
  0: filterSumNone,
  1: filterSumSub,
  2: filterSumUp,
  3: filterSumAvg,
  4: filterSumPaeth,
}

/**
 * Packs pixel data using PNG filtering
 * @param pxData - Input pixel data
 * @param width - Image width
 * @param height - Image height
 * @param options - Filtering options
 * @param bpp - Bytes per pixel
 * @returns Filtered data buffer
 */
export function packFilter(
  pxData: Buffer,
  width: number,
  height: number,
  options: FilterPackOptions,
  bpp: number,
): Buffer {
  let filterTypes: number[]

  if (!('filterType' in options) || options.filterType === -1) {
    filterTypes = [0, 1, 2, 3, 4]
  }
  else if (typeof options.filterType === 'number') {
    filterTypes = [options.filterType]
  }
  else if (Array.isArray(options.filterType)) {
    filterTypes = options.filterType
  }
  else {
    throw new TypeError('Unrecognized filter types')
  }

  if (options.bitDepth === 16) {
    bpp *= 2
  }

  const byteWidth = width * bpp
  let rawPos = 0
  let pxPos = 0
  const rawData = Buffer.alloc((byteWidth + 1) * height)

  let sel = filterTypes[0]

  for (let y = 0; y < height; y++) {
    if (filterTypes.length > 1) {
      // Find best filter for this line (with lowest sum of values)
      let min = Infinity

      for (const filterType of filterTypes) {
        const sum = filterSums[filterType](pxData, pxPos, byteWidth, bpp)
        if (sum < min) {
          sel = filterType
          min = sum
        }
      }
    }

    rawData[rawPos] = sel
    rawPos++
    filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp)
    rawPos += byteWidth
    pxPos += byteWidth
  }

  return rawData
}

// Default export for backward compatibility
export default packFilter
