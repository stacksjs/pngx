import { ok as assert } from 'node:assert'
import { Buffer, kMaxLength } from 'node:buffer'
import { EventEmitter } from 'node:events'
import process from 'node:process'
import { constants } from 'node:zlib'

interface InflateOptions {
  chunkSize?: number
  maxLength?: number
  finishFlushFlag?: number
}

interface WriteState {
  0: number // availInAfter
  1: number // availOutAfter
}

interface ZlibHandle {
  close: () => void
  writeSync: (
    flushFlag: number,
    chunk: Buffer,
    inOff: number,
    availInBefore: number,
    outBuffer: Buffer,
    outOff: number,
    availOutBefore: number
  ) => [number, number]
}

class Inflate extends EventEmitter {
  private _maxLength?: number
  private _offset: number
  private _buffer: Buffer
  private _chunkSize: number
  private _hadError: boolean
  private _writeState?: WriteState
  public _finishFlushFlag?: number
  public _handle?: ZlibHandle

  constructor(opts: InflateOptions = {}) {
    super()

    if (opts.chunkSize && opts.chunkSize < 64) { // Z_MIN_CHUNK is 64 in zlib
      opts.chunkSize = 64
    }

    // Node 8 --> 9 compatibility check
    this._offset = (this as any)._outOffset !== undefined
      ? (this as any)._outOffset
      : (this as any)._offset

    this._buffer = (this as any)._outBuffer || (this as any)._buffer
    this._handle = (this as any)._handle
    this._hadError = false
    this._chunkSize = opts.chunkSize || 16 * 1024

    if (opts.maxLength != null) {
      this._maxLength = opts.maxLength
    }
  }

  _processChunk(chunk: Buffer, flushFlag: number, asyncCb?: (err: Error | null, result: Buffer) => void): Buffer {
    if (typeof asyncCb === 'function') {
      this.emit('error', new Error('Async processing not supported'))
      return Buffer.alloc(0)
    }

    const availInBefore = chunk?.length || 0
    const availOutBefore = this._chunkSize - this._offset
    const leftToInflate = this._maxLength ?? Infinity
    let inOff = 0

    const buffers: Buffer[] = []
    let nread = 0

    let error: Error | undefined
    this.on('error', (err: Error) => {
      error = err
    })

    const handleChunk = (availInAfter: number, availOutAfter: number): boolean => {
      if (this._hadError)
        return false

      const have = availOutBefore - availOutAfter
      assert(have >= 0, 'have should not go down')

      if (have > 0) {
        let out = this._buffer.slice(this._offset, this._offset + have)
        this._offset += have

        if (out.length > leftToInflate) {
          out = out.subarray(0, leftToInflate)
        }

        buffers.push(out)
        nread += out.length

        if (leftToInflate - out.length === 0) {
          return false
        }
      }

      if (availOutAfter === 0 || this._offset >= this._chunkSize) {
        this._offset = 0
        this._buffer = Buffer.allocUnsafe(this._chunkSize)
      }

      if (availOutAfter === 0) {
        inOff += availInBefore - availInAfter
        return true
      }

      return false
    }

    assert(this._handle, 'zlib binding closed')
    let res: WriteState

    do {
      res = this._handle.writeSync(
        flushFlag,
        chunk, // in
        inOff, // in_off
        availInBefore, // in_len
        this._buffer, // out
        this._offset, // out_off
        availOutBefore, // out_len
      )
      // Node 8 --> 9 compatibility check
      res = res || this._writeState as WriteState
    } while (!this._hadError && handleChunk(res[0], res[1]))

    if (this._hadError) {
      throw error
    }

    if (nread >= kMaxLength) {
      closeInflate(this as unknown as Inflate & { _handle?: ZlibHandle })
      throw new RangeError(
        `Cannot create final Buffer. It would be larger than 0x${kMaxLength.toString(16)} bytes`,
      )
    }

    const buf = Buffer.concat(buffers, nread)
    closeInflate(this as unknown as Inflate & { _handle?: ZlibHandle })

    return buf
  }
}

export function createInflate(opts?: InflateOptions): Inflate {
  return new Inflate(opts)
}

function closeInflate(engine: Inflate & { _handle?: ZlibHandle }, callback?: () => void): void {
  if (callback) {
    process.nextTick(callback)
  }

  // Caller may invoke .close after a zlib error (which will null _handle)
  if (!(engine as Inflate)._handle) {
    return
  }

  engine._handle?.close()
  engine._handle = undefined
}

function zlibBufferSync(engine: Inflate, buffer: Buffer | string): Buffer {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer)
  }
  if (!(buffer instanceof Buffer)) {
    throw new TypeError('Not a string or buffer')
  }

  const flushFlag = engine._finishFlushFlag ?? constants.Z_FINISH

  return engine._processChunk(buffer, flushFlag)
}

export function inflateSync(buffer: Buffer | string, opts?: InflateOptions): Buffer {
  return zlibBufferSync(new Inflate(opts), buffer)
}

export default inflateSync
