# Synchronous Operations

The PNG library provides a synchronous API for simpler, blocking operations. This is useful for smaller images or when you need to ensure operations complete before moving on.

## Using the Synchronous API

The synchronous API is available through the `PNGSync` class:

```typescript
import { PNG } from 'pngx'

// Access the synchronous API
const PNGSync = PNG.sync
```

## Creating Images Synchronously

```typescript
// Create a new image synchronously
const png = new PNGSync({
  width: 100,
  height: 100
})
```

## Reading PNG Files

```typescript
import { readFileSync } from 'node:fs'

// Read and parse a PNG file synchronously
const buffer = readFileSync('image.png')
const png = PNGSync.read(buffer)
```

## Writing PNG Files

```typescript
import { writeFileSync } from 'node:fs'

// Create and write a PNG file synchronously
const png = new PNGSync({
  width: 100,
  height: 100
})

// Manipulate the image data
// ... (image manipulation code) ...

// Write the PNG file
const buffer = PNGSync.write(png)
writeFileSync('output.png', buffer)
```

## Complete Example

Here's a complete example of synchronous image processing:

```typescript
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngx'

function processImageSync() {
  // Read the input image
  const inputBuffer = readFileSync('input.png')
  const png = PNG.sync.read(inputBuffer)

  // Process the image
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) * 4

      // Example: Convert to grayscale
      const gray = (png.data[idx] + png.data[idx + 1] + png.data[idx + 2]) / 3
      png.data[idx] = gray // Red
      png.data[idx + 1] = gray // Green
      png.data[idx + 2] = gray // Blue
      // Alpha channel remains unchanged
    }
  }

  // Write the processed image
  const outputBuffer = PNG.sync.write(png)
  writeFileSync('output.png', outputBuffer)
}
```

## When to Use Synchronous Operations

Use synchronous operations when:

1. Working with small images
2. Need simple, linear code flow
3. Processing images in a non-blocking context
4. Debugging or prototyping

## Performance Considerations

- Synchronous operations block the main thread
- Not suitable for large images in web applications
- Use with caution in server environments
- Consider using async operations for better scalability

## Next Steps

- Learn about [Asynchronous Operations](/features/async-operations)
- Explore [Event Handling](/features/event-handling)
- Check out [Advanced Features](/advanced/buffer-management)
