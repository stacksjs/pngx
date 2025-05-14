# Image Processing

The PNG processing library provides powerful capabilities for working with PNG images in both synchronous and asynchronous modes. This guide covers the core image processing features.

## Basic Image Creation

You can create a new PNG image with specified dimensions:

```typescript
import { PNG } from 'pngx'

// Create a new 100x100 PNG image
const png = new PNG({
  width: 100,
  height: 100,
  fill: true // Optional: fills the image with zeros
})
```

## Image Data Manipulation

The library provides direct access to the image data buffer, allowing for pixel-level manipulation:

```typescript
// Access the raw image data
const imageData = png.data

// The data is stored as a Buffer with RGBA values
// Each pixel takes 4 bytes (R, G, B, A)
const pixelIndex = (y * png.width + x) * 4

// Set pixel color
imageData[pixelIndex] = 255 // Red
imageData[pixelIndex + 1] = 0 // Green
imageData[pixelIndex + 2] = 0 // Blue
imageData[pixelIndex + 3] = 255 // Alpha (opacity)
```

## Image Operations

### BitBlt Operations

The library supports BitBlt (Bit Block Transfer) operations for copying rectangular regions between images:

```typescript
// Copy a region from one image to another
png.bitblt(
  destinationImage, // Target PNG
  srcX, // Source X coordinate
  srcY, // Source Y coordinate
  width, // Region width
  height, // Region height
  deltaX, // Destination X coordinate
  deltaY // Destination Y coordinate
)
```

### Gamma Correction

You can adjust the gamma value of an image:

```typescript
// Adjust gamma for better color accuracy
png.adjustGamma()
```

## Event-Based Processing

The library uses an event-based system for processing images:

```typescript
png.on('metadata', (metadata) => {
  console.log('Image dimensions:', metadata.width, 'x', metadata.height)
})

png.on('parsed', (data) => {
  console.log('Image data parsed successfully')
})

png.on('error', (error) => {
  console.error('Error processing image:', error)
})
```

## Best Practices

1. **Memory Management**: Always handle large images carefully as they can consume significant memory.
2. **Error Handling**: Implement proper error handling for all image operations.
3. **Buffer Safety**: When manipulating pixel data directly, ensure you stay within buffer bounds.
4. **Async Operations**: Use async operations for large images to prevent blocking the main thread.

## Example: Complete Image Processing Workflow

```typescript
import { PNG } from 'pngx'

// Create and process an image
async function processImage() {
  const png = new PNG({
    width: 200,
    height: 200
  })

  // Fill with a gradient
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) * 4
      png.data[idx] = x // Red
      png.data[idx + 1] = y // Green
      png.data[idx + 2] = 0 // Blue
      png.data[idx + 3] = 255 // Alpha
    }
  }

  // Adjust gamma
  png.adjustGamma()

  // Pack the image data
  png.pack()
}
```

## Next Steps

- Learn about [Synchronous Operations](/features/sync-operations)
- Explore [Asynchronous Operations](/features/async-operations)
- Understand [Event Handling](/features/event-handling)
