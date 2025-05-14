# Buffer Management

The PNG library uses efficient buffer management techniques for handling image data. This guide covers advanced buffer operations and best practices.

## Buffer Structure

PNG images are stored in a buffer with the following characteristics:

- Each pixel takes 4 bytes (RGBA format)
- Data is stored in a linear buffer
- Buffer size = width *height* 4 bytes

```typescript
import { PNG } from 'pngx'

const png = new PNG({
  width: 100,
  height: 100
})

// Buffer size = 100 * 100 * 4 = 40000 bytes
console.log(png.data.length) // 40000
```

## Pixel Access

### Direct Buffer Access

```typescript
// Get pixel at (x, y)
function getPixel(x: number, y: number): [number, number, number, number] {
  const idx = (y * png.width + x) * 4
  return [
    png.data[idx], // Red
    png.data[idx + 1], // Green
    png.data[idx + 2], // Blue
    png.data[idx + 3] // Alpha
  ]
}

// Set pixel at (x, y)
function setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
  const idx = (y * png.width + x) * 4
  png.data[idx] = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = a
}
```

## Bit Depth Handling

The library supports various bit depths (1, 2, 4, 8, 16 bits per channel):

```typescript
// Example: Working with 16-bit depth
const png = new PNG({
  width: 100,
  height: 100,
  depth: 16 // 16 bits per channel
})

// Access 16-bit values
function getPixel16Bit(x: number, y: number): [number, number, number, number] {
  const idx = (y * png.width + x) * 8 // 8 bytes per pixel (4 channels * 2 bytes)
  return [
    png.data.readUInt16BE(idx), // Red
    png.data.readUInt16BE(idx + 2), // Green
    png.data.readUInt16BE(idx + 4), // Blue
    png.data.readUInt16BE(idx + 6) // Alpha
  ]
}
```

## Buffer Operations

### Copying Regions

```typescript
// Copy a region using BitBlt
png.bitblt(
  destinationImage,
  srcX,
  srcY,
  width,
  height,
  deltaX,
  deltaY
)
```

### Buffer Allocation

```typescript
// Create a new buffer with specific size
const buffer = Buffer.alloc(width * height * 4)

// Create a buffer from existing data
const buffer = Buffer.from(existingData)
```

## Performance Considerations

1. **Buffer Reuse**: Reuse buffers when possible to reduce memory allocation
2. **Direct Access**: Use direct buffer access for better performance
3. **TypedArrays**: Consider using TypedArrays for better performance with large images
4. **Memory Alignment**: Keep memory alignment in mind for optimal performance

## Best Practices

1. **Bounds Checking**: Always check buffer bounds before access
2. **Memory Management**: Free buffers when no longer needed
3. **Error Handling**: Handle buffer-related errors appropriately
4. **Type Safety**: Use TypeScript types for buffer operations

## Example: Efficient Buffer Processing

```typescript
import { PNG } from 'pngx'

function processImageEfficiently(png: PNG): void {
  // Get the buffer
  const buffer = png.data

  // Process in chunks for better performance
  const chunkSize = 1024 * 4 // Process 1024 pixels at a time
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize)

    // Process chunk
    for (let j = 0; j < chunk.length; j += 4) {
      // Example: Convert to grayscale
      const gray = (chunk[j] + chunk[j + 1] + chunk[j + 2]) / 3
      chunk[j] = gray // Red
      chunk[j + 1] = gray // Green
      chunk[j + 2] = gray // Blue
      // Alpha remains unchanged
    }
  }
}
```

## Next Steps

- Learn about [Gamma Correction](/advanced/gamma-correction)
- Explore [BitBlt Operations](/advanced/bitblt-operations)
- Check out [Performance Tips](/advanced/performance)
