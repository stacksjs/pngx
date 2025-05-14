# Event Handling

The PNG library uses an event-based system for processing images. This guide covers how to effectively work with events in both synchronous and asynchronous contexts.

## Available Events

The library emits the following events:

- `metadata`: Emitted when image metadata is parsed
- `parsed`: Emitted when image data is fully parsed
- `data`: Emitted when packed image data is available
- `end`: Emitted when processing is complete
- `error`: Emitted when an error occurs
- `close`: Emitted when the stream is closed

## Basic Event Handling

```typescript
import { PNG } from 'pngx'

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

## One-Time Event Listeners

For events that should only be handled once:

```typescript
// Handle the first data chunk only
png.once('data', (chunk) => {
  console.log('First data chunk received')
})

// Handle the first error only
png.once('error', (error) => {
  console.error('First error occurred:', error)
})
```

## Removing Event Listeners

```typescript
// Define the event handler
function handleMetadata(metadata) {
  console.log('Metadata received:', metadata)
}

// Add the listener
png.on('metadata', handleMetadata)

// Remove the listener when no longer needed
png.removeListener('metadata', handleMetadata)

// Remove all listeners for an event
png.removeAllListeners('metadata')
```

## Complete Example with Event Handling

```typescript
import { readFile } from 'node:fs/promises'
import { PNG } from 'pngx'

async function processImageWithEvents() {
  try {
    const buffer = await readFile('input.png')
    const png = new PNG()

    // Set up event handlers
    const handlers = {
      metadata: (metadata) => {
        console.log('Processing image:', metadata.width, 'x', metadata.height)
      },

      parsed: (data) => {
        console.log('Starting image processing')
        // Process the image data
        for (let y = 0; y < png.height; y++) {
          for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) * 4
            // Example: Invert colors
            png.data[idx] = 255 - png.data[idx] // Red
            png.data[idx + 1] = 255 - png.data[idx + 1] // Green
            png.data[idx + 2] = 255 - png.data[idx + 2] // Blue
          }
        }
        png.pack()
      },

      data: (chunk) => {
        console.log('Writing processed data')
        // Handle the processed data
      },

      error: (error) => {
        console.error('Error:', error)
      },

      end: () => {
        console.log('Processing complete')
        // Clean up event listeners
        png.removeAllListeners()
      }
    }

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      png.on(event, handler)
    })

    // Start processing
    png.parse(buffer)
  }
  catch (error) {
    console.error('Error:', error)
  }
}
```

## Best Practices

1. **Error Handling**: Always implement error event handlers
2. **Cleanup**: Remove event listeners when they're no longer needed
3. **Memory Management**: Be careful with closures in event handlers
4. **Event Order**: Understand the order of events in the processing pipeline
5. **Async Context**: Be aware of the asynchronous nature of events

## Event Flow

1. `metadata` → Image dimensions and properties
2. `parsed` → Raw image data available
3. `data` → Processed data chunks
4. `end` → Processing complete
5. `error` → Error occurred (can happen at any point)
6. `close` → Stream closed

## Next Steps

- Learn about [Asynchronous Operations](/features/async-operations)
- Explore [Advanced Features](/advanced/buffer-management)
- Check out [Performance Tips](/advanced/performance)
