import type { PackerOptions } from './packer'
import { Buffer } from 'node:buffer'
import { deflateSync } from 'node:zlib'
import { PNG_SIGNATURE } from './constants'
import { Packer } from './packer'

// Check if we have synchronous zlib support

interface PNGMetaData {
  width: number
  height: number
  data: Buffer
  gamma?: number
}

/**
 * Synchronously packs PNG data into a buffer
 * @param metaData - The PNG metadata and pixel data
 * @param options - Packer options
 * @returns Packed PNG data as a buffer
 * @throws {Error} If sync capability is not available or if compression fails
 */
export function packSync(
  metaData: PNGMetaData,
  options: PackerOptions = {},
): Buffer {
  const packer = new Packer(options)
  const chunks: Buffer[] = []

  // Add PNG signature
  chunks.push(Buffer.from(PNG_SIGNATURE))

  // Add header chunk
  chunks.push(packer.packIHDR(metaData.width, metaData.height))

  // Add optional gamma chunk
  if (metaData.gamma) {
    chunks.push(packer.packGAMA(metaData.gamma))
  }

  // Filter the data
  const filteredData = packer.filterData(
    metaData.data,
    metaData.width,
    metaData.height,
  )

  // Compress the filtered data
  const compressedData = deflateSync(
    filteredData,
    packer.getDeflateOptions(),
  )

  if (!compressedData?.length) {
    throw new Error('Bad PNG - invalid compressed data response')
  }

  // Add image data chunk
  chunks.push(packer.packIDAT(compressedData))

  // Add end chunk
  chunks.push(packer.packIEND())

  // Combine all chunks
  return Buffer.concat(chunks)
}

// Default export for backward compatibility
export default packSync
