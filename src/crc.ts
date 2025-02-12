import type { Buffer } from 'node:buffer'

/**
 * Implementation of CRC-32 calculation for PNG chunks
 * Uses a pre-computed lookup table for better performance
 */

// Pre-compute CRC lookup table
const CRC_TABLE: Uint32Array = new Uint32Array(256);

// Initialize the CRC table
(function initCrcTable(): void {
  for (let i = 0; i < 256; i++) {
    let currentCrc = i
    for (let j = 0; j < 8; j++) {
      currentCrc = (currentCrc & 1)
        ? 0xEDB88320 ^ (currentCrc >>> 1)
        : currentCrc >>> 1
    }
    CRC_TABLE[i] = currentCrc
  }
})()

/**
 * Class for calculating CRC-32 values incrementally
 */
export class CrcCalculator {
  private _crc: number

  constructor() {
    this._crc = -1
  }

  /**
   * Updates the CRC value with new data
   * @param data - Buffer containing the data to process
   * @returns Always returns true (for stream compatibility)
   */
  public write(data: Buffer | Uint8Array): boolean {
    for (let i = 0; i < data.length; i++) {
      this._crc = CRC_TABLE[(this._crc ^ data[i]) & 0xFF] ^ (this._crc >>> 8)
    }
    return true
  }

  /**
   * Gets the final CRC-32 value
   * @returns The calculated CRC-32 value
   */
  public crc32(): number {
    return this._crc ^ -1
  }

  /**
   * Calculates CRC-32 for a complete buffer in one step
   * @param buf - Buffer to calculate CRC for
   * @returns The calculated CRC-32 value
   */
  public static crc32(buf: Buffer | Uint8Array): number {
    let crc = -1
    for (let i = 0; i < buf.length; i++) {
      crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
    }
    return crc ^ -1
  }
}

// Constants for CRC calculation
export const CRC_CONSTANTS = {
  /** Initial CRC value */
  INITIAL_CRC: -1,
  /** Final XOR value for CRC */
  FINAL_XOR: -1,
  /** CRC polynomial value */
  POLYNOMIAL: 0xEDB88320,
} as const

// Export the pre-computed table if needed
export { CRC_TABLE }

// Default export for backward compatibility
export default CrcCalculator
