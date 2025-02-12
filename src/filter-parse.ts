import { Buffer } from 'node:buffer'
import { getImagePasses } from './interlace'
import { paethPredictor } from './paeth-predictor'

interface BitmapInfo {
  width: number
  height: number
  interlace: boolean
  bpp: number
  depth: 1 | 2 | 4 | 8 | 16
}

interface FilterDependencies {
  read: (length: number, callback: (data: Buffer) => void) => void
  write: (data: Buffer) => void
  complete: () => void
}

interface ImagePass {
  byteWidth: number
  height: number
  lineIndex: number
}

/**
 * Calculates the byte width for a scanline
 * @param width - Image width in pixels
 * @param bpp - Bytes per pixel
 * @param depth - Bit depth
 */
function getByteWidth(width: number, bpp: number, depth: number): number {
  let byteWidth = width * bpp
  if (depth !== 8) {
    byteWidth = Math.ceil(byteWidth / (8 / depth))
  }
  return byteWidth
}

/**
 * Filter class for handling PNG scanline filtering
 */
export class Filter {
  private readonly _xComparison: number
  private _imageIndex: number
  private _images: ImagePass[]
  private _lastLine: Buffer | null

  // Dependencies
  private readonly read: FilterDependencies['read']
  private readonly write: FilterDependencies['write']
  private readonly complete: FilterDependencies['complete']

  constructor(bitmapInfo: BitmapInfo, dependencies: FilterDependencies) {
    const { width, height, interlace, bpp, depth } = bitmapInfo

    this.read = dependencies.read
    this.write = dependencies.write
    this.complete = dependencies.complete

    this._imageIndex = 0
    this._lastLine = null
    this._images = []

    // Set up image passes
    if (interlace) {
      const passes = getImagePasses(width, height)
      for (const pass of passes) {
        this._images.push({
          byteWidth: getByteWidth(pass.width, bpp, depth),
          height: pass.height,
          lineIndex: 0,
        })
      }
    }
    else {
      this._images.push({
        byteWidth: getByteWidth(width, bpp, depth),
        height,
        lineIndex: 0,
      })
    }

    // Set up byte comparison value for filtering
    // When filtering the line we look at the pixel to the left
    // The spec says it's done on a byte level regardless of pixels
    // For byte-compatible depths (8 or 16) we subtract bpp to compare pixels
    // For sub-byte depths, we compare individual bytes
    if (depth === 8) {
      this._xComparison = bpp
    }
    else if (depth === 16) {
      this._xComparison = bpp * 2
    }
    else {
      this._xComparison = 1
    }
  }

  /**
   * Starts the filtering process
   */
  public start(): void {
    this.read(
      this._images[this._imageIndex].byteWidth + 1,
      this._reverseFilterLine.bind(this),
    )
  }

  /**
   * Implements PNG filter type 1 (Sub)
   */
  private _unFilterType1(
    rawData: Buffer,
    unfilteredLine: Buffer,
    byteWidth: number,
  ): void {
    const xBiggerThan = this._xComparison - 1

    for (let x = 0; x < byteWidth; x++) {
      const rawByte = rawData[1 + x]
      const f1Left = x > xBiggerThan ? unfilteredLine[x - this._xComparison] : 0
      unfilteredLine[x] = rawByte + f1Left
    }
  }

  /**
   * Implements PNG filter type 2 (Up)
   */
  private _unFilterType2(
    rawData: Buffer,
    unfilteredLine: Buffer,
    byteWidth: number,
  ): void {
    for (let x = 0; x < byteWidth; x++) {
      const rawByte = rawData[1 + x]
      const f2Up = this._lastLine ? this._lastLine[x] : 0
      unfilteredLine[x] = rawByte + f2Up
    }
  }

  /**
   * Implements PNG filter type 3 (Average)
   */
  private _unFilterType3(
    rawData: Buffer,
    unfilteredLine: Buffer,
    byteWidth: number,
  ): void {
    const xBiggerThan = this._xComparison - 1

    for (let x = 0; x < byteWidth; x++) {
      const rawByte = rawData[1 + x]
      const f3Up = this._lastLine ? this._lastLine[x] : 0
      const f3Left = x > xBiggerThan ? unfilteredLine[x - this._xComparison] : 0
      const f3Add = Math.floor((f3Left + f3Up) / 2)
      unfilteredLine[x] = rawByte + f3Add
    }
  }

  /**
   * Implements PNG filter type 4 (Paeth)
   */
  private _unFilterType4(
    rawData: Buffer,
    unfilteredLine: Buffer,
    byteWidth: number,
  ): void {
    const xBiggerThan = this._xComparison - 1

    for (let x = 0; x < byteWidth; x++) {
      const rawByte = rawData[1 + x]
      const f4Up = this._lastLine ? this._lastLine[x] : 0
      const f4Left = x > xBiggerThan ? unfilteredLine[x - this._xComparison] : 0
      const f4UpLeft = x > xBiggerThan && this._lastLine
        ? this._lastLine[x - this._xComparison]
        : 0
      const f4Add = paethPredictor(f4Left, f4Up, f4UpLeft)
      unfilteredLine[x] = rawByte + f4Add
    }
  }

  /**
   * Reverses the PNG filtering for a scanline
   */
  private _reverseFilterLine(rawData: Buffer): void {
    const filter = rawData[0]
    let unfilteredLine: Buffer
    const currentImage = this._images[this._imageIndex]
    const byteWidth = currentImage.byteWidth

    if (filter === 0) {
      unfilteredLine = rawData.slice(1, byteWidth + 1)
    }
    else {
      unfilteredLine = Buffer.alloc(byteWidth)

      switch (filter) {
        case 1:
          this._unFilterType1(rawData, unfilteredLine, byteWidth)
          break
        case 2:
          this._unFilterType2(rawData, unfilteredLine, byteWidth)
          break
        case 3:
          this._unFilterType3(rawData, unfilteredLine, byteWidth)
          break
        case 4:
          this._unFilterType4(rawData, unfilteredLine, byteWidth)
          break
        default:
          throw new Error(`Unrecognized filter type - ${filter}`)
      }
    }

    this.write(unfilteredLine)

    currentImage.lineIndex++
    if (currentImage.lineIndex >= currentImage.height) {
      this._lastLine = null
      this._imageIndex++
    }
    else {
      this._lastLine = unfilteredLine
    }

    const nextImage = this._images[this._imageIndex]
    if (nextImage) {
      // Read using the byte width from the new current image
      this.read(nextImage.byteWidth + 1, this._reverseFilterLine.bind(this))
    }
    else {
      this._lastLine = null
      this.complete()
    }
  }
}
