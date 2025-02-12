import type { Deflate } from 'node:zlib'
import { Buffer } from 'node:buffer'
import { Transform } from 'node:stream'
import { PNG_SIGNATURE } from './constants'
import { Packer } from './packer'

interface PackerOptions {
  // Add any specific packer options here
  deflateLevel?: number
  deflateStrategy?: number
  filterType?: number
}

export class PackerAsync extends Transform {
  private readonly _packer: Packer
  private readonly _deflate: Deflate

  constructor(options: PackerOptions = {}) {
    super()
    this._packer = new Packer(options)
    this._deflate = this._packer.createDeflate()
    this.readable = true
  }

  public pack(data: Buffer, width: number, height: number, gamma?: number): void {
    // Emit PNG signature
    this.emit('data', Buffer.from(PNG_SIGNATURE))

    // Emit IHDR chunk
    this.emit('data', this._packer.packIHDR(width, height))

    // Emit optional GAMA chunk
    if (gamma) {
      this.emit('data', this._packer.packGAMA(gamma))
    }

    // Filter the data
    const filteredData = this._packer.filterData(data, width, height)

    // Set up deflate stream events
    this._deflate.on('error', (error: Error) => this.emit('error', error))

    this._deflate.on('data', (compressedData: Buffer) => {
      this.emit('data', this._packer.packIDAT(compressedData))
    })

    this._deflate.on('end', () => {
      this.emit('data', this._packer.packIEND())
      this.emit('end')
    })

    // Start compression
    this._deflate.end(filteredData)
  }
}

export default PackerAsync
