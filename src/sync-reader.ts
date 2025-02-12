import type { Buffer } from 'node:buffer'

interface ReadRequest {
  length: number
  allowLess: boolean
  func: (data: Buffer) => void
}

/**
 * SyncReader handles synchronous reading of chunks from a buffer
 * with support for variable-length reads and partial reads
 */
export class SyncReader {
  private _buffer: Buffer
  private _reads: ReadRequest[]

  /**
   * Creates a new SyncReader instance
   * @param buffer The source buffer to read from
   */
  constructor(buffer: Buffer) {
    this._buffer = buffer
    this._reads = []
  }

  /**
   * Queues a read request for the specified length
   * @param length Number of bytes to read. If negative, allows reading less than the absolute value
   * @param callback Function to call with the read data
   */
  public read(length: number, callback: (data: Buffer) => void): void {
    this._reads.push({
      length: Math.abs(length), // if length < 0 then at most this length
      allowLess: length < 0,
      func: callback,
    })
  }

  /**
   * Processes all queued read requests
   * @throws {Error} If there are pending reads after buffer is exhausted
   * @throws {Error} If there is unprocessed data after all reads complete
   */
  public process(): void {
    // Process as long as there is data and read requests
    while (this._reads.length > 0 && this._buffer.length) {
      const read = this._reads[0]

      if (this._buffer.length
        && (this._buffer.length >= read.length || read.allowLess)) {
        // We can satisfy this request
        this._reads.shift()

        const buf = this._buffer
        const readLength = Math.min(read.length, buf.length)

        this._buffer = buf.slice(readLength)
        read.func.call(this, buf.slice(0, readLength))
      }
      else {
        break
      }
    }

    if (this._reads.length > 0) {
      throw new Error('There are some read requests waiting on finished stream')
    }

    if (this._buffer.length > 0) {
      throw new Error('Unrecognized content at end of stream')
    }
  }

  /**
   * Gets the remaining unread buffer
   * @returns The remaining buffer
   */
  public get remainingBuffer(): Buffer {
    return this._buffer
  }

  /**
   * Gets the number of pending read requests
   * @returns Number of pending reads
   */
  public get pendingReads(): number {
    return this._reads.length
  }
}
