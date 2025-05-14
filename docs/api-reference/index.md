# API Reference

Welcome to the PNGX API Reference. This section provides detailed documentation for all public APIs in the PNGX library.

## Core Classes

- [PNG Class](/api-reference/png) - The main class for PNG image processing
- [PNGSync Class](/api-reference/pngsync) - Synchronous version of the PNG class
- [Parser](/api-reference/parser) - PNG file parsing utilities
- [Packer](/api-reference/packer) - PNG file packing utilities

## Quick Start

```typescript
import { PNG } from 'pngx'

// Create a new PNG image
const png = new PNG({
  width: 100,
  height: 100
})

// Read a PNG file
png.parse(fs.readFileSync('image.png'), (err, data) => {
  if (err)
    throw err

  // Process the image
  for (let i = 0; i < data.length; i += 4) {
    // Access RGBA values
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
  }

  // Write the image
  png.pack().pipe(fs.createWriteStream('output.png'))
})
```

## Common Operations

### Creating Images

```typescript
// Create a blank image
const png = new PNG({
  width: 100,
  height: 100
})

// Create with specific color
const png = new PNG({
  width: 100,
  height: 100,
  colorType: 6, // RGBA
  inputColorType: 6,
  inputHasAlpha: true
})
```

### Reading Images

```typescript
// Asynchronous
png.parse(buffer, (err, data) => {
  if (err)
    throw err
  // Process data
})

// Synchronous
const data = pngSync.parse(buffer)
```

### Writing Images

```typescript
// Asynchronous
png.pack().pipe(fs.createWriteStream('output.png'))

// Synchronous
fs.writeFileSync('output.png', pngSync.pack())
```

## Events

The PNG class is an EventEmitter that emits the following events:

- `metadata` - Emitted when image metadata is parsed
- `gamma` - Emitted when gamma value is found
- `parsed` - Emitted when image is fully parsed
- `error` - Emitted when an error occurs

## Constants

### Color Types

- `COLOR_GRAYSCALE` = 0
- `COLOR_RGB` = 2
- `COLOR_PALETTE` = 3
- `COLOR_GRAYSCALE_ALPHA` = 4
- `COLOR_RGBA` = 6

### Filter Types

- `FILTER_NONE` = 0
- `FILTER_SUB` = 1
- `FILTER_UP` = 2
- `FILTER_AVG` = 3
- `FILTER_PAETH` = 4

## Type Definitions

```typescript
interface PNGMetadata {
  width: number
  height: number
  depth: number
  colorType: number
  interlace: boolean
  palette: boolean
  hasAlpha: boolean
  colorSpace: string
}

interface PNGOptions {
  width?: number
  height?: number
  fill?: boolean
  colorType?: number
  inputColorType?: number
  inputHasAlpha?: boolean
  skipRescale?: boolean
  deflateLevel?: number
  deflateStrategy?: number
  filterType?: number | number[]
  colorSpace?: string
  inputColorSpace?: string
  bgColor?: object
}
```

## Error Handling

The library uses Node.js style error handling with callbacks:

```typescript
png.parse(buffer, (err, data) => {
  if (err) {
    console.error('Error parsing PNG:', err)
  }
  // Process data
})
```

## Next Steps

- Explore the [PNG Class](/api-reference/png) documentation
- Learn about [Synchronous Operations](/api-reference/pngsync)
- Check out the [Parser](/api-reference/parser) and [Packer](/api-reference/packer) utilities
