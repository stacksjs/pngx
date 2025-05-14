# BitBlt Operations

BitBlt (Bit Block Transfer) operations are powerful tools for copying and manipulating rectangular regions of images. This guide covers how to use BitBlt operations effectively in the PNG library.

## Understanding BitBlt

BitBlt operations allow you to:

- Copy regions between images
- Move image data efficiently
- Create composite images
- Implement image effects

## Basic BitBlt Usage

```typescript
import { PNG } from 'pngx'

// Create source and destination images
const source = new PNG({ width: 100, height: 100 })
const destination = new PNG({ width: 200, height: 200 })

// Copy a region from source to destination
source.bitblt(
  destination, // Target image
  0, // Source X
  0, // Source Y
  50, // Width
  50, // Height
  25, // Destination X
  25 // Destination Y
)
```

## BitBlt Parameters

The `bitblt` method takes the following parameters:

```typescript
bitblt(
  dst: PNG,      // Destination image
  srcX: number,  // Source X coordinate
  srcY: number,  // Source Y coordinate
  width: number, // Region width
  height: number,// Region height
  deltaX: number,// Destination X coordinate
  deltaY: number // Destination Y coordinate
)
```

## Common Use Cases

### 1. Copying Image Regions

```typescript
// Copy a region from one image to another
function copyRegion(
  source: PNG,
  destination: PNG,
  region: { x: number, y: number, width: number, height: number }
): void {
  source.bitblt(
    destination,
    region.x,
    region.y,
    region.width,
    region.height,
    0, // Place at (0,0) in destination
    0
  )
}
```

### 2. Creating Image Tiles

```typescript
// Create a tiled pattern from a source image
function createTiles(
  source: PNG,
  destination: PNG,
  tileSize: number
): void {
  for (let y = 0; y < destination.height; y += tileSize) {
    for (let x = 0; x < destination.width; x += tileSize) {
      source.bitblt(
        destination,
        0,
        0,
        tileSize,
        tileSize,
        x,
        y
      )
    }
  }
}
```

### 3. Image Composition

```typescript
// Composite multiple images
function compositeImages(
  background: PNG,
  overlay: PNG,
  position: { x: number, y: number }
): void {
  overlay.bitblt(
    background,
    0,
    0,
    overlay.width,
    overlay.height,
    position.x,
    position.y
  )
}
```

## Best Practices

1. **Bounds Checking**: Always ensure source and destination regions are within image bounds
2. **Memory Efficiency**: Use BitBlt for large regions instead of pixel-by-pixel copying
3. **Performance**: Minimize the number of BitBlt operations
4. **Error Handling**: Handle out-of-bounds errors appropriately

## Example: Advanced BitBlt Operations

```typescript
import { PNG } from 'pngx'

class ImageProcessor {
  // Create a mirror effect
  static mirrorImage(source: PNG): PNG {
    const result = new PNG({
      width: source.width * 2,
      height: source.height
    })

    // Copy original image
    source.bitblt(result, 0, 0, source.width, source.height, 0, 0)

    // Create mirror image
    for (let x = 0; x < source.width; x++) {
      source.bitblt(
        result,
        x,
        0,
        1,
        source.height,
        source.width * 2 - x - 1,
        0
      )
    }

    return result
  }

  // Create a grid of images
  static createGrid(
    source: PNG,
    gridSize: { rows: number, cols: number }
  ): PNG {
    const result = new PNG({
      width: source.width * gridSize.cols,
      height: source.height * gridSize.rows
    })

    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        source.bitblt(
          result,
          0,
          0,
          source.width,
          source.height,
          col * source.width,
          row * source.height
        )
      }
    }

    return result
  }
}
```

## Performance Considerations

1. **Region Size**: Larger regions are more efficient than multiple small regions
2. **Memory Access**: BitBlt operations are memory-bound, so minimize unnecessary copies
3. **Buffer Alignment**: Consider memory alignment for optimal performance
4. **Async Operations**: Use async operations for large images

## Next Steps

- Learn about [Buffer Management](/advanced/buffer-management)
- Explore [Gamma Correction](/advanced/gamma-correction)
- Check out [Performance Tips](/advanced/performance)
