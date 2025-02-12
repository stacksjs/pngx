const fs = require('node:fs')
const path = require('node:path')
const test = require('tape')
const PNG = require('../lib/png').PNG
const stream = require('node:stream')

function parseFile(filename, cb) {
  fs.createReadStream(path.join(__dirname, 'png-parse-data', filename))
    .pipe(new PNG())
    .on('error', (e) => {
      console.log('error')
      cb(e)
    })
    .on('parsed', function () {
      cb(null, this)
    })
}

function parseBuffer(buffer, cb) {
  const bufferStream = new stream.PassThrough()
  bufferStream.end(buffer)

  bufferStream
    .pipe(new PNG({}))
    .on('error', (e) => {
      cb(e)
    })
    .on('parse', function () {
      cb(null, this)
    })
}

function getPixel(png, x, y) {
  return png.data.readUInt32BE((x + y * png.width) * 4)
}

test('should correctly parse an 1-bit colormap png', (t) => {
  t.timeoutAfter(5000)
  parseFile('1bit.png', (err, png) => {
    t.equal(err, null, 'there should be no error')
    t.equal(png.width, 1024, 'the width should be 1024')
    t.equal(png.height, 1024, 'the height should be 1024')
    // t.equal(png.bpp, 1, "the bpp should be 1");
    t.equal(png.data.length, 1024 * 1024 * 4)
    // t.equal(png.trailer.length, 0);

    let y = 1024
    let x

    let isOk = true
    while (y--) {
      x = 1024
      while (x--) {
        if (getPixel(png, x, y) !== 0x000000FF) {
          t.fail(
            `pixel does not match - ${getPixel(png, x, y)} !== 0x000000FF`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should all be black')

    t.end()
  })
})

test('should correctly parse an 8-bit grayscale png', (t) => {
  parseFile('grayscale.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 16)
    t.equal(png.height, 16)
    // t.equal(png.bpp, 1);
    t.equal(png.data.length, 16 * 16 * 4)
    // t.equal(png.trailer.toString(), "Hello, world!\n");

    let y = 16
    let x

    let isOk = true
    while (y--) {
      x = 16
      while (x--) {
        if (getPixel(png, x, y) !== (x ^ y) * 286331136 + 255) {
          t.fail(
            `pixel does not match - ${
              getPixel(png, x, y)
            } !== ${
              (x ^ y) * 286331136 + 255}`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should match')

    t.end()
  })
})

test('should correctly parse an 8-bit truecolor png', (t) => {
  parseFile('truecolor.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 16)
    t.equal(png.height, 16)
    // t.equal(png.bpp, 3);
    t.equal(png.data.length, 16 * 16 * 4)
    // t.equal(png.trailer.length, 0);

    let y = 16
    let x

    let isOk = true
    while (y--) {
      x = 16
      while (x--) {
        if (
          getPixel(png, x, y)
          !== x * 285212672 + y * 1114112 + (x ^ y) * 4352 + 255
        ) {
          t.fail(
            `pixel does not match - ${
              getPixel(png, x, y)
            } !== ${
              x * 285212672 + y * 1114112 + (x ^ y) * 4352 + 255}`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should match')

    t.end()
  })
})

test('should correctly parse an 8-bit truecolor png with alpha', (t) => {
  parseFile('truecoloralpha.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 16)
    t.equal(png.height, 16)
    // t.equal(png.bpp, 4);
    t.equal(png.data.length, 16 * 16 * 4)
    // t.equal(png.trailer.length, 0);

    let y = 16
    let x
    let isOk = true

    while (y--) {
      x = 16
      while (x--) {
        if (
          getPixel(png, x, y)
          !== x * 285212672 + y * 1114112 + (x ^ y) * 17
        ) {
          t.fail(
            `pixel does not match - ${
              getPixel(png, x, y)
            } !== ${
              x * 285212672 + y * 1114112 + (x ^ y) * 17}`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should match')

    t.end()
  })
})

test('should correctly read image with scanline filter', (t) => {
  parseFile('accum.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 1024)
    t.equal(png.height, 1024)
    // t.equal(png.bpp, 3);
    t.equal(png.data.length, 1024 * 1024 * 4)
    // t.equal(png.trailer.length, 0);

    t.equal(getPixel(png, 0, 0), 0xFF0000FF)
    t.equal(getPixel(png, 1, 0), 0xFF0000FF)
    t.equal(getPixel(png, 420, 308), 0xFF0029FF)
    t.equal(getPixel(png, 433, 308), 0x0A299DFF)
    t.equal(getPixel(png, 513, 308), 0x0066FFFF)
    t.equal(getPixel(png, 728, 552), 0xFF0047FF)

    t.end()
  })
})

test('should correctly read an indexed color image', (t) => {
  parseFile('indexed.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 16)
    t.equal(png.height, 16)
    // t.equal(png.bpp, 3);
    t.equal(png.data.length, 16 * 16 * 4)
    // t.equal(png.trailer.length, 0);

    let y = 16
    let x
    let isOk = true

    while (y--) {
      x = 16
      while (x--) {
        let expected
        if (x + y < 8) {
          expected = 0xFF0000FF
        }
        else if (x + y < 16) {
          expected = 0x00FF00FF
        }
        else if (x + y < 24) {
          expected = 0x0000FFFF
        }
        else {
          expected = 0x000000FF
        }

        if (getPixel(png, x, y) !== expected) {
          t.fail(
            `pixel does not match - ${getPixel(png, x, y)} !== ${expected}`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should match')
    t.end()
  })
})

test('should correctly read an indexed color image with alpha', (t) => {
  parseFile('indexedalpha.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 16)
    t.equal(png.height, 16)
    // t.equal(png.bpp, 4);
    t.equal(png.data.length, 16 * 16 * 4)
    // t.equal(png.trailer.length, 0);

    let y = 16
    let x
    let isOk = true

    while (y--) {
      x = 16
      while (x--) {
        let expected
        if (x >= 4 && x < 12) {
          expected = 0x00000000
        }
        else if (x + y < 8) {
          expected = 0xFF0000FF
        }
        else if (x + y < 16) {
          expected = 0x00FF00FF
        }
        else if (x + y < 24) {
          expected = 0x0000FFFF
        }
        else {
          expected = 0x000000FF
        }

        if (getPixel(png, x, y) !== expected) {
          t.fail(
            `pixel does not match - ${getPixel(png, x, y)} !== ${expected}`,
          )
          isOk = false
          break
        }
      }
    }
    t.ok(isOk, 'The pixels should match')

    t.end()
  })
})

test('should correctly support crazily-filtered images', (t) => {
  parseFile('paeth.png', (err, png) => {
    t.equal(err, null)
    t.equal(png.width, 512)
    t.equal(png.height, 512)
    // t.equal(png.bpp, 4);
    t.equal(png.data.length, 512 * 512 * 4)

    t.equal(getPixel(png, 0, 0), 0xFF000000)
    t.equal(getPixel(png, 1, 0), 0xFF000000)
    t.equal(getPixel(png, 0, 1), 0xFF000000)
    t.equal(getPixel(png, 2, 2), 0xFF000000)
    t.equal(getPixel(png, 0, 50), 0xFF000000)
    t.equal(getPixel(png, 219, 248), 0xFF000D00)
    t.equal(getPixel(png, 220, 248), 0xFF000D00)
    t.equal(getPixel(png, 215, 249), 0xFF000C00)
    t.equal(getPixel(png, 216, 249), 0xFF000C00)
    t.equal(getPixel(png, 217, 249), 0xFF000D00)
    t.equal(getPixel(png, 218, 249), 0xFF000D00)
    t.equal(getPixel(png, 219, 249), 0xFF000E00)
    t.equal(getPixel(png, 220, 249), 0xFF000E00)
    t.equal(getPixel(png, 263, 319), 0xFF002100)
    t.equal(getPixel(png, 145, 318), 0x05535A00)
    t.equal(getPixel(png, 395, 286), 0x0007FF00)
    t.equal(getPixel(png, 152, 167), 0x052C3500)
    t.equal(getPixel(png, 153, 167), 0x04303600)
    t.equal(getPixel(png, 154, 167), 0x042F3700)
    t.equal(getPixel(png, 100, 168), 0xFF000400)
    t.equal(getPixel(png, 120, 168), 0xFF000900)
    t.equal(getPixel(png, 140, 168), 0xFF001B00)
    t.equal(getPixel(png, 150, 168), 0x05313600)
    t.equal(getPixel(png, 152, 168), 0x04343C00)
    t.equal(getPixel(png, 153, 168), 0x03343F00)
    t.equal(getPixel(png, 154, 168), 0x03344100)
    t.equal(getPixel(png, 155, 168), 0x02344300)
    t.equal(getPixel(png, 156, 168), 0x02314400)
    t.equal(getPixel(png, 157, 168), 0x02323F00)
    t.equal(getPixel(png, 158, 168), 0x03313900)

    t.end()
  })
})

test('should bail with an error given an invalid PNG', (t) => {
  const buf = Buffer.from('I AM NOT ACTUALLY A PNG', 'utf8')

  return parseBuffer(buf, (err) => {
    t.ok(err instanceof Error, 'Error should be received')
    t.end()
  })
})

test('should bail with an error given an empty file', (t) => {
  const buf = Buffer.from('')

  return parseBuffer(buf, (err) => {
    t.ok(err instanceof Error, 'Error should be received')
    t.end()
  })
})

test('should bail with an error given a bad chunk type', (t) => {
  parseFile('with_bad_type.png', (err, png) => {
    t.ok(err instanceof Error, 'Error should be received')
    t.equal(png, undefined, 'PNG should not be defined')
    t.end()
  })
})

test('should bail with an error given a truncated PNG', (t) => {
  const buf = Buffer.from('89504e470d0a1a0a000000', 'hex')

  return parseBuffer(buf, (err) => {
    t.ok(err instanceof Error, 'Error should be received')
    t.end()
  })
})

test('should return an error if a PNG is normal except for a missing IEND', (t) => {
  const buf = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000100000001008000000003a98a0bd000000017352474200aece1ce90000002174455874536f6674776172650047726170686963436f6e7665727465722028496e74656c297787fa190000008849444154789c448e4111c020100363010b58c00216b080052c60010b58c0c259c00216ae4d3b69df99dd0d1062caa5b63ee6b27d1c012996dceae86b6ef38398106acb65ae3e8edbbef780564b5e73743fdb409e1ef2f4803c3de4e901797ac8d3f3f0f490a7077ffffd03f5f507eaeb0fd4d71fa8af3f505f7fa0befe7c7dfdb9000000ffff0300c0fd7f8179301408',
    'hex',
  )

  return parseBuffer(buf, (err) => {
    t.ok(err instanceof Error, 'Error should be received')
    t.end()
  })
})

test('should set alpha=true in metadata for images with tRNS chunk', (t) => {
  fs.createReadStream(path.join(__dirname, 'in', 'tbbn0g04.png'))
    .pipe(new PNG())
    .on('metadata', (metadata) => {
      t.ok(metadata.alpha, 'Image should have alpha=true')
      t.end()
    })
})

test('Should parse with low highWaterMark', (t) => {
  fs.createReadStream(path.join(__dirname, 'in', 'tbbn0g04.png'), {
    highWaterMark: 2,
  })
    .pipe(new PNG())
    .on('parsed', () => {
      t.pass('Image should have parsed')
      t.end()
    })
    .on('error', (e) => {
      t.error(e, 'Should not error')
    })
})
