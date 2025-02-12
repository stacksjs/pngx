import type { Deflate } from 'node:zlib'
import { Buffer } from 'node:buffer'
import { createDeflate } from 'node:zlib'
import { bitPacker } from './bitpacker'
import {
  COLORTYPE_ALPHA,
  COLORTYPE_COLOR,
  COLORTYPE_COLOR_ALPHA,
  COLORTYPE_GRAYSCALE,
  COLORTYPE_TO_BPP_MAP,
  GAMMA_DIVISION,
  TYPE_gAMA,
  TYPE_IDAT,
  TYPE_IEND,
  TYPE_IHDR,
} from './constants'
import { CrcCalculator } from './crc'
import filterPack from './filter-pack'

export interface PackerOptions {
  deflateChunkSize?: number
  deflateLevel?: number
  deflateStrategy?: number
  inputHasAlpha?: boolean
  deflateFactory?: typeof createDeflate
  bitDepth?: 8 | 16
  colorType?: number
  inputColorType?: number
}

const SUPPORTED_COLOR_TYPES = [
  COLORTYPE_GRAYSCALE,
  COLORTYPE_COLOR,
  COLORTYPE_COLOR_ALPHA,
  COLORTYPE_ALPHA,
] as const

type SupportedColorType = typeof SUPPORTED_COLOR_TYPES[number]

/**
 * Packer handles the creation of PNG chunks and data compression
 */
export class Packer {
  private readonly _options: Required<PackerOptions>

  /**
   * Creates a new Packer instance
   * @param options - Configuration options for the packer
   * @throws {Error} If color type or bit depth is not supported
   */
  constructor(options: PackerOptions = {}) {
    this._options = {
      deflateChunkSize: options.deflateChunkSize || 32 * 1024,
      deflateLevel: options.deflateLevel ?? 9,
      deflateStrategy: options.deflateStrategy ?? 3,
      inputHasAlpha: options.inputHasAlpha ?? true,
      deflateFactory: options.deflateFactory || createDeflate,
      bitDepth: options.bitDepth || 8,
      colorType: (options.colorType as SupportedColorType) ?? COLORTYPE_COLOR_ALPHA,
      inputColorType: (options.inputColorType as SupportedColorType) ?? COLORTYPE_COLOR_ALPHA,
    }

    this.validateOptions()
  }

  /**
   * Validates the packer options
   * @private
   * @throws {Error} If options are invalid
   */
  private validateOptions(): void {
    if (!SUPPORTED_COLOR_TYPES.includes(this._options.colorType)) {
      throw new Error(
        `Option color type: ${this._options.colorType} is not supported at present`,
      )
    }

    if (!SUPPORTED_COLOR_TYPES.includes(this._options.inputColorType)) {
      throw new Error(
        `Option input color type: ${this._options.inputColorType} is not supported at present`,
      )
    }

    if (this._options.bitDepth !== 8 && this._options.bitDepth !== 16) {
      throw new Error(
        `Option bit depth: ${this._options.bitDepth} is not supported at present`,
      )
    }
  }

  /**
   * Gets the deflate options for compression
   */
  public getDeflateOptions(): {
    chunkSize: number
    level: number
    strategy: number
  } {
    return {
      chunkSize: this._options.deflateChunkSize,
      level: this._options.deflateLevel,
      strategy: this._options.deflateStrategy,
    }
  }

  /**
   * Creates a new deflate stream
   */
  public createDeflate(): Deflate {
    return this._options.deflateFactory(this.getDeflateOptions())
  }

  /**
   * Filters the pixel data for compression
   * @param data - Raw pixel data
   * @param width - Image width
   * @param height - Image height
   */
  public filterData(data: Buffer, width: number, height: number): Buffer {
    // Convert to correct format for filtering
    const packedData = bitPacker(data, width, height, this._options)

    // Filter pixel data
    const bpp = COLORTYPE_TO_BPP_MAP[this._options.colorType]
    return filterPack(packedData, width, height, this._options, bpp)
  }

  /**
   * Packs a PNG chunk with type and data
   * @param type - Chunk type
   * @param data - Chunk data
   */
  private _packChunk(type: number, data: Buffer | null): Buffer {
    const len = data ? data.length : 0
    const buf = Buffer.alloc(len + 12)

    buf.writeUInt32BE(len, 0)
    buf.writeUInt32BE(type, 4)

    if (data) {
      data.copy(buf, 8)
    }

    buf.writeInt32BE(
      CrcCalculator.crc32(buf.subarray(4, buf.length - 4)),
      buf.length - 4,
    )

    return buf
  }

  /**
   * Packs a GAMA chunk
   * @param gamma - Gamma value
   */
  public packGAMA(gamma: number): Buffer {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(Math.floor(gamma * GAMMA_DIVISION), 0)
    return this._packChunk(TYPE_gAMA, buf)
  }

  /**
   * Packs an IHDR chunk
   * @param width - Image width
   * @param height - Image height
   */
  public packIHDR(width: number, height: number): Buffer {
    const buf = Buffer.alloc(13)
    buf.writeUInt32BE(width, 0)
    buf.writeUInt32BE(height, 4)
    buf[8] = this._options.bitDepth // Bit depth
    buf[9] = this._options.colorType // Color type
    buf[10] = 0 // Compression
    buf[11] = 0 // Filter
    buf[12] = 0 // Interlace

    return this._packChunk(TYPE_IHDR, buf)
  }

  /**
   * Packs an IDAT chunk
   * @param data - Image data
   */
  public packIDAT(data: Buffer): Buffer {
    return this._packChunk(TYPE_IDAT, data)
  }

  /**
   * Packs an IEND chunk
   */
  public packIEND(): Buffer {
    return this._packChunk(TYPE_IEND, null)
  }
}
