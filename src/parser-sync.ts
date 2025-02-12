import { Buffer } from 'node:buffer'
import { deflateSync, inflateSync as zlibInflateSync } from 'node:zlib'
import { dataToBitMap } from './bitmapper'
import FilterSync from './filter-parse-sync'
import formatNormalizer from './format-normalizer'
import { Parser } from './parser'
import { inflateSync } from './sync-inflate'
import { SyncReader } from './sync-reader'

interface ParserSyncOptions {
  skipRescale?: boolean
}

interface MetaData {
  width: number
  height: number
  depth: number
  bpp: number
  interlace: boolean
  color?: boolean
  alpha?: boolean
  data?: Buffer
  gamma?: number
  palette?: Buffer
  transColor?: number[]
}

interface ParserCallbacks {
  read: () => Buffer
  error: (err: Error) => void
  metadata: (metadata: MetaData) => void
  gamma: (gamma: number) => void
  palette: (palette: Buffer) => void
  transColor: (transColor: number[]) => void
  inflateData: (data: Buffer) => void
  simpleTransparency: () => void
}

/**
 * Synchronously parse a PNG buffer
 * @param buffer The PNG file data as a buffer
 * @param options Parser options
 * @returns Parsed PNG metadata including pixel data
 */
export function parseSync(buffer: Buffer, options: ParserSyncOptions = {}): MetaData {
  let err: Error | null = null
  let metaData: MetaData | null = null
  let gamma: number | null = null
  const inflateDataList: Buffer[] = []

  const callbacks: ParserCallbacks = {
    read(): Buffer {
      return Buffer.alloc(0) // Will be overridden by reader.read
    },
    error(_err: Error): void {
      err = _err
    },
    metadata(_metaData: MetaData): void {
      metaData = _metaData
    },
    gamma(_gamma: number): void {
      gamma = _gamma
    },
    palette(palette: Buffer): void {
      if (metaData) {
        metaData.palette = palette
      }
    },
    transColor(transColor: number[]): void {
      if (metaData) {
        metaData.transColor = transColor
      }
    },
    inflateData(inflatedData: Buffer): void {
      inflateDataList.push(inflatedData)
    },
    simpleTransparency(): void {
      if (metaData) {
        metaData.alpha = true
      }
    },
  }

  const reader = new SyncReader(buffer)
  callbacks.read = reader.read.bind(reader)

  const parser = new Parser(options, callbacks)

  parser.start()
  reader.process()

  if (err) {
    throw err
  }

  if (!metaData) {
    throw new Error('PNG parsing failed - no metadata available')
  }

  // Join together the inflate data
  const inflateData = Buffer.concat(inflateDataList)
  inflateDataList.length = 0

  let inflatedData: Buffer
  if (metaData.interlace) {
    inflatedData = zlibInflateSync(inflateData)
  }
  else {
    const rowSize = ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1
    const imageSize = rowSize * metaData.height
    inflatedData = inflateSync(inflateData, {
      chunkSize: imageSize,
      maxLength: imageSize,
    })
  }

  if (!inflatedData?.length) {
    throw new Error('Bad PNG - invalid inflate data response')
  }

  const unfilteredData = FilterSync.process(inflatedData, metaData)
  const bitmapData = dataToBitMap(unfilteredData, metaData)
  const normalisedBitmapData = formatNormalizer(
    bitmapData,
    metaData,
    options.skipRescale,
  )

  metaData.data = normalisedBitmapData
  metaData.gamma = gamma || 0

  return metaData
}

export default parseSync
