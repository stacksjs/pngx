# PNGSync Class

The `PNGSync` class provides synchronous versions of the PNG processing methods. It's useful when you need to process PNG images in a synchronous context or when working with smaller images where the blocking nature of synchronous operations is acceptable.

## Constructor

```typescript
new PNGSync(options?: PNGOptions)
```

### Options

Same as the PNG class options:

```typescript
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

## Properties

Same as the PNG class properties:

- `width`: number
- `height`: number
- `data`: Buffer
- `gamma`: number
- `palette`: number[]
- `colorType`: number
- `depth`: number
- `interlace`: boolean

## Methods

### parse(buffer: Buffer): Buffer

Synchronously parses a PNG buffer and returns the image data.

```typescript
import { readFileSync } from 'node:fs'
import { PNGSync } from 'pngx'

const buffer = readFileSync('image.png')
const png = new PNGSync()
const data = png.parse(buffer)

// Process data
for (let i = 0; i < data.length; i += 4) {
  // Access RGBA values
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const a = data[i + 3]
}
```

### pack(): Buffer

Synchronously packs the image data into a PNG buffer.

```typescript
import { writeFileSync } from 'node:fs'
import { PNGSync } from 'pngx'

const png = new PNGSync({
  width: 100,
  height: 100
})

// Fill with data
// ...

const buffer = png.pack()
writeFileSync('output.png', buffer)
```

### bitblt(dst: PNGSync, srcX: number, srcY: number, width: number, height: number, deltaX: number, deltaY: number): void

Synchronously copies a rectangular region from this image to another image.

```typescript
const source = new PNGSync({ width: 100, height: 100 })
const destination = new PNGSync({ width: 200, height: 200 })

source.bitblt(
  destination,
  0, // Source X
  0, // Source Y
  50, // Width
  50, // Height
  25, // Destination X
  25 // Destination Y
)
```

### adjustGamma(): void

Synchronously adjusts the gamma value of the image.

```typescript
const png = new PNGSync()
png.parse(buffer)
png.adjustGamma()
```

## Example Usage

### Creating and Saving an Image

```typescript
import { writeFileSync } from 'node:fs'
import { PNGSync } from 'pngx'

// Create a new image
const png = new PNGSync({
  width: 100,
  height: 100,
  colorType: 6, // RGBA
  inputColorType: 6,
  inputHasAlpha: true
})

// Fill with a gradient
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (y * png.width + x) * 4
    png.data[idx] = x // Red
    png.data[idx + 1] = y // Green
    png.data[idx + 2] = 0 // Blue
    png.data[idx + 3] = 255 // Alpha
  }
}

// Save the image
const buffer = png.pack()
writeFileSync('gradient.png', buffer)
```

### Reading and Processing an Image

```typescript
import { readFileSync, writeFileSync } from 'node:fs'
import { PNGSync } from 'pngx'

// Read an image
const buffer = readFileSync('input.png')
const png = new PNGSync()
const data = png.parse(buffer)

// Convert to grayscale
for (let i = 0; i < data.length; i += 4) {
  const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
  data[i] = gray // Red
  data[i + 1] = gray // Green
  data[i + 2] = gray // Blue
  // Alpha remains unchanged
}

// Save the processed image
const outputBuffer = png.pack()
writeFileSync('grayscale.png', outputBuffer)
```

## Performance Considerations

1. **Blocking Operations**: Synchronous operations block the event loop
2. **Memory Usage**: All data is loaded into memory at once
3. **Large Images**: Consider using the async PNG class for large images
4. **Error Handling**: Errors are thrown directly instead of passed to callbacks

## Best Practices

1. **Use for Small Images**: Best suited for small to medium-sized images
2. **Error Handling**: Use try-catch blocks for error handling
3. **Memory Management**: Be mindful of memory usage with large images
4. **Type Safety**: Use TypeScript types for better development experience

## When to Use PNGSync

- Small to medium-sized images
- Simple scripts and utilities
- When synchronous code is required
- When working with small images in a synchronous context

## When to Use PNG (Async)

- Large images
- Web servers and applications
- When non-blocking operations are required
- When working with streams

## Next Steps

- Learn about the [PNG Class](/api-reference/png)
- Explore the [Parser](/api-reference/parser) and [Packer](/api-reference/packer) utilities
- Check out [Advanced Topics](/advanced/buffer-management)
