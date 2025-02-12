import { Buffer } from 'node:buffer'
import { Filter } from './filter-parse'
import { SyncReader } from './sync-reader'

interface BitmapInfo {
  width: number
  height: number
  interlace: boolean
  bpp: number
  depth: number
}

/**
 * Processes a PNG buffer synchronously with the specified filtering
 * @param inBuffer - Input buffer containing PNG data
 * @param bitmapInfo - Information about the bitmap format
 * @returns Processed buffer with filtering applied
 */
export function processSync(inBuffer: Buffer, bitmapInfo: BitmapInfo): Buffer {
  const outBuffers: Buffer[] = []
  const reader = new SyncReader(inBuffer)

  const filter = new Filter(bitmapInfo, {
    read: reader.read.bind(reader),
    write: (bufferPart: Buffer) => {
      outBuffers.push(bufferPart)
    },
    complete: () => {
      // Completion callback - no action needed for sync processing
    },
  })

  filter.start()
  reader.process()

  return Buffer.concat(outBuffers)
}

// Default export for backward compatibility
export default processSync
