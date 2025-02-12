import type { Buffer } from 'node:buffer'
import type { PNG } from './png' // Importing the main PNG class we created earlier
import pack from './packer-sync'
import parse from './parser-sync'

interface PNGSyncOptions {
  // Common options that can be passed to both read and write
  skipRescale?: boolean
  // Add other options as needed
}

interface PNGReadResult {
  width: number
  height: number
  data: Buffer
  gamma?: number
}

/**
 * Synchronously reads a PNG buffer and returns the decoded image data
 * @param buffer The PNG file data as a buffer
 * @param options Optional configuration for reading
 * @returns Decoded PNG data including dimensions and pixel data
 */
export function read(buffer: Buffer, options: PNGSyncOptions = {}): PNGReadResult {
  return parse(buffer, options)
}

/**
 * Synchronously encodes PNG data into a buffer
 * @param png The PNG instance or data to encode
 * @param options Optional configuration for writing
 * @returns Encoded PNG data as a buffer
 */
export function write(png: PNG | PNGReadResult, options: PNGSyncOptions = {}): Buffer {
  return pack(png, options)
}
