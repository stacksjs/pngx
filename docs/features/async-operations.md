# Asynchronous Operations

The PNG library provides a powerful asynchronous API for non-blocking image processing. This is essential for handling large images and maintaining application responsiveness.

## Using the Asynchronous API

The main `PNG` class provides asynchronous operations:

```typescript
import { PNG } from 'pngx'

// Create a new image asynchronously
const png = new PNG({
  width: 100,
  height: 100
})
```

## Reading PNG Files Asynchronously

```typescript
import { readFile } from 'node:fs/promises'

async function readImageAsync() {
  // Read the file
  const buffer = await readFile('image.png')

  // Create a new PNG instance
  const png = new PNG()

  // Parse the buffer
  png.parse(buffer, (err, data) => {
    if (err)
      throw err
    // Process the image data
    console.log('Image parsed successfully')
  })
}
```

## Writing PNG Files Asynchronously

```typescript
import { writeFile } from 'node:fs/promises'

async function writeImageAsync() {
  const png = new PNG({
    width: 100,
    height: 100
  })

  // Manipulate the image data
  // ... (image manipulation code) ...

  // Pack the image data
  png.pack()

  // Handle the packed data
  png.on('data', async (chunk) => {
    await writeFile('output.png', chunk)
  })
}
```

## Event-Based Processing

The asynchronous API uses an event-based system for processing:

```typescript
const png = new PNG()

// Handle metadata
png.on('metadata', (metadata) => {
  console.log('Image dimensions:', metadata.width, 'x', metadata.height)
})

// Handle parsed data
png.on('parsed', (data) => {
  console.log('Image data parsed successfully')
})

// Handle errors
png.on('error', (error) => {
  console.error('Error processing image:', error)
})

// Handle completion
png.on('end', () => {
  console.log('Image processing complete')
})
```

## Complete Example

Here's a complete example of asynchronous image processing:

```typescript
import { readFile, writeFile } from 'node:fs/promises'
import { PNG } from 'pngx'

async function processImageAsync() {
  try {
    // Read the input image
    const buffer = await readFile('input.png')

    // Create and parse the PNG
    const png = new PNG()

    // Set up event handlers
    png.on('parsed', (data) => {
      // Process the image
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const idx = (png.width * y + x) * 4

          // Example: Apply a sepia filter
          const r = png.data[idx]
          const g = png.data[idx + 1]
          const b = png.data[idx + 2]

          png.data[idx] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
          png.data[idx + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
          png.data[idx + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
        }
      }

      // Pack and write the processed image
      png.pack()
    })

    // Handle the packed data
    png.on('data', async (chunk) => {
      await writeFile('output.png', chunk)
    })

    // Parse the input buffer
    png.parse(buffer)
  }
  catch (error) {
    console.error('Error processing image:', error)
  }
}
```

## When to Use Asynchronous Operations

Use asynchronous operations when:

1. Processing large images
2. Working in web applications
3. Handling multiple images simultaneously
4. Building scalable applications
5. Need to maintain UI responsiveness

## Best Practices

1. **Error Handling**: Always implement proper error handling for async operations
2. **Memory Management**: Be mindful of memory usage with large images
3. **Event Cleanup**: Remove event listeners when they're no longer needed
4. **Streaming**: Use streaming for very large images
5. **Progress Tracking**: Implement progress tracking for long operations

## Next Steps

- Learn about [Event Handling](/features/event-handling)
- Explore [Advanced Features](/advanced/buffer-management)
- Check out [Performance Tips](/advanced/performance)
