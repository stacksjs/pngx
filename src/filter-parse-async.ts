import { Buffer } from 'node:buffer'
import { ChunkStream } from './chunkstream'
import { Filter } from './filter-parse'

interface BitmapInfo {
  width: number
  height: number
  interlace: boolean
  bpp: number
  depth: 1 | 2 | 4 | 8 | 16
}

/**
 * Interface for FilterAsync events
 */
interface FilterAsyncEvents {
  complete: (data: Buffer) => void
  error: (error: Error) => void
}

/**
 * Asynchronous filter processor for PNG data
 * Extends ChunkStream to handle streaming data processing
 */
export class FilterAsync extends ChunkStream {
  private readonly _filter: Filter

  constructor(bitmapInfo: BitmapInfo) {
    super()

    const buffers: Buffer[] = []

    this._filter = new Filter(bitmapInfo, {
      read: this.read.bind(this),
      write: (buffer: Buffer) => {
        buffers.push(buffer)
      },
      complete: () => {
        this.emit('complete', Buffer.concat(buffers))
      },
    })

    this._filter.start()
  }

  /**
   * Emit typed events
   */
  public emit<K extends keyof FilterAsyncEvents>(
    event: K,
    ...args: Parameters<FilterAsyncEvents[K]>
  ): boolean {
    return super.emit(event, ...args)
  }

  /**
   * Add typed event listeners
   */
  public on<K extends keyof FilterAsyncEvents>(
    event: K,
    listener: FilterAsyncEvents[K],
  ): this {
    return super.on(event, listener)
  }

  /**
   * Add typed one-time event listeners
   */
  public once<K extends keyof FilterAsyncEvents>(
    event: K,
    listener: FilterAsyncEvents[K],
  ): this {
    return super.once(event, listener)
  }
}

// Default export for backward compatibility
export default FilterAsync
