import { Buffer } from 'node:buffer'
import process from 'node:process'
import { Stream } from 'node:stream'

interface ReadRequest {
  length: number
  allowLess: boolean
  func: (data: Buffer) => void
}

/**
 * ChunkStream handles buffered reading and writing of data streams
 * with support for variable-length chunks and partial reads
 */
export class ChunkStream extends Stream {
  private _buffers: (Buffer | null)[] | null = []
  private _buffered: number = 0
  private _reads: ReadRequest[] | null = []
  private _paused: boolean = false
  private _encoding: BufferEncoding = 'utf-8'
  public writable: boolean = true

  constructor() {
    super()
  }

  /**
   * Reads a specified amount of data from the stream
   * @param length - Number of bytes to read. If negative, allows reading less
   * @param callback - Function to call with read data
   */
  public read(length: number, callback: (data: Buffer) => void): void {
    this._reads?.push({
      length: Math.abs(length), // if length < 0 then at most this length
      allowLess: length < 0,
      func: callback,
    })

    process.nextTick(() => {
      this._process()

      // If it's paused and there is not enough data then ask for more
      if (this._paused && this._reads && this._reads.length > 0) {
        this._paused = false
        this.emit('drain')
      }
    })
  }

  /**
   * Writes data to the stream
   * @param data - Data to write
   * @param encoding - Optional encoding for string data
   * @returns Whether the stream is still writable and not paused
   */
  public write(data: Buffer | string, encoding?: BufferEncoding): boolean {
    if (!this.writable) {
      this.emit('error', new Error('Stream not writable'))
      return false
    }

    const dataBuffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data, encoding || this._encoding)

    this._buffers?.push(dataBuffer)
    this._buffered += dataBuffer.length

    this._process()

    // Pause if there are no more read requests
    if (this._reads?.length === 0) {
      this._paused = true
    }

    return this.writable && !this._paused
  }

  /**
   * Ends the stream
   * @param data - Optional final data to write
   * @param encoding - Optional encoding for string data
   */
  public end(data?: Buffer | string, encoding?: BufferEncoding): void {
    if (data) {
      this.write(data, encoding)
    }

    this.writable = false

    // Already destroyed
    if (!this._buffers) {
      return
    }

    // Enqueue or handle end
    if (this._buffers.length === 0) {
      this._end()
    }
    else {
      this._buffers.push(null)
      this._process()
    }
  }

  /**
   * Alias for end()
   */
  public destroySoon: (data?: Buffer | string, encoding?: BufferEncoding) => void = this.end
  /**
   * Handles the end of the stream
   */
  private _end(): void {
    if (this._reads && this._reads.length > 0) {
      this.emit('error', new Error('Unexpected end of input'))
    }

    this.destroy()
  }

  /**
   * Destroys the stream
   */
  public destroy(): void {
    if (!this._buffers) {
      return
    }

    this.writable = false
    this._reads = null
    this._buffers = null

    this.emit('close')
  }

  /**
   * Processes a read request that allows reading less than requested
   */
  private _processReadAllowingLess(read: ReadRequest): void {
    this._reads?.shift()

    if (!this._buffers)
      return

    const smallerBuf = this._buffers[0]
    if (!smallerBuf)
      return

    // More data than needed
    if (smallerBuf.length > read.length) {
      this._buffered -= read.length
      this._buffers[0] = smallerBuf.slice(read.length)
      read.func.call(this, smallerBuf.slice(0, read.length))
    }
    else {
      // Less than maximum length, use it all
      this._buffered -= smallerBuf.length
      this._buffers.shift()
      read.func.call(this, smallerBuf)
    }
  }

  /**
   * Processes a read request for exact length
   */
  private _processRead(read: ReadRequest): void {
    this._reads?.shift()

    let pos = 0
    let count = 0
    const data = Buffer.alloc(read.length)

    // Create buffer for all data
    while (pos < read.length) {
      if (!this._buffers)
        break

      const buf = this._buffers[count++]
      if (!buf)
        break

      const len = Math.min(buf.length, read.length - pos)

      buf.copy(data, pos, 0, len)
      pos += len

      // Last buffer wasn't used entirely
      if (len !== buf.length) {
        this._buffers[--count] = buf.slice(len)
      }
    }

    // Remove all used buffers
    if (count > 0) {
      this._buffers?.splice(0, count)
    }

    this._buffered -= read.length
    read.func.call(this, data)
  }

  /**
   * Main processing loop for the stream
   */
  private _process(): void {
    try {
      // Process as long as there is data and read requests
      while (this._buffered > 0 && this._reads && this._reads.length > 0) {
        const read = this._reads[0]

        if (read.allowLess) {
          this._processReadAllowingLess(read)
        }
        else if (this._buffered >= read.length) {
          this._processRead(read)
        }
        else {
          // Not enough data to satisfy first request
          break
        }
      }

      if (this._buffers && !this.writable) {
        this._end()
      }
    }
    catch (ex) {
      this.emit('error', ex instanceof Error ? ex : new Error(String(ex)))
    }
  }
}
