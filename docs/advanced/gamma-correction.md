# Gamma Correction

Gamma correction is a crucial aspect of image processing that ensures accurate color representation across different display devices. This guide covers how to work with gamma values in PNG images.

## Understanding Gamma

Gamma correction compensates for the non-linear relationship between pixel values and displayed brightness. The gamma value typically ranges from 0 to 1, where:

- 0.45455 (1/2.2) is the standard gamma for sRGB
- 1.0 means no gamma correction
- Values < 1 make the image brighter
- Values > 1 make the image darker

## Working with Gamma

### Reading Gamma Value

```typescript
import { PNG } from 'pngx'

const png = new PNG()

// Listen for gamma value
png.on('gamma', (gamma) => {
  console.log('Image gamma value:', gamma)
})
```

### Adjusting Gamma

```typescript
// Adjust gamma for better color accuracy
png.adjustGamma()

// Or manually set gamma
png.gamma = 0.45455 // Standard sRGB gamma
```

## Gamma Correction Process

The library performs gamma correction in the following steps:

1. Read the gamma value from the PNG file
2. Apply the inverse gamma correction to linearize the values
3. Process the image data
4. Apply gamma correction to restore the correct display values

## Example: Custom Gamma Correction

```typescript
import { PNG } from 'pngx'

function applyCustomGamma(png: PNG, targetGamma: number): void {
  // Store original gamma
  const originalGamma = png.gamma

  // Convert to linear space
  for (let i = 0; i < png.data.length; i += 4) {
    // Apply inverse gamma to linearize
    png.data[i] = (png.data[i] / 255) ** originalGamma * 255
    png.data[i + 1] = (png.data[i + 1] / 255) ** originalGamma * 255
    png.data[i + 2] = (png.data[i + 2] / 255) ** originalGamma * 255
  }

  // Process the image in linear space
  // ... (image processing code) ...

  // Convert back to gamma space
  for (let i = 0; i < png.data.length; i += 4) {
    // Apply target gamma
    png.data[i] = (png.data[i] / 255) ** (1 / targetGamma) * 255
    png.data[i + 1] = (png.data[i + 1] / 255) ** (1 / targetGamma) * 255
    png.data[i + 2] = (png.data[i + 2] / 255) ** (1 / targetGamma) * 255
  }
}
```

## Best Practices

1. **Preserve Original Gamma**: Always store the original gamma value before making adjustments
2. **Work in Linear Space**: Perform color operations in linear space for accurate results
3. **Consider Display**: Account for the target display's gamma when making adjustments
4. **Performance**: Apply gamma correction after all other image processing

## Common Gamma Values

| Display Type | Gamma Value |
|--------------|-------------|
| sRGB         | 0.45455     |
| Adobe RGB    | 0.45455     |
| Apple RGB    | 0.45455     |
| No Correction| 1.0         |

## Example: Complete Gamma Workflow

```typescript
import { PNG } from 'pngx'

async function processImageWithGamma() {
  const png = new PNG()

  // Set up gamma handling
  let originalGamma = 1.0

  png.on('gamma', (gamma) => {
    originalGamma = gamma
    console.log('Original gamma:', gamma)
  })

  png.on('parsed', () => {
    // Convert to linear space
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = (png.data[i] / 255) ** originalGamma * 255
      png.data[i + 1] = (png.data[i + 1] / 255) ** originalGamma * 255
      png.data[i + 2] = (png.data[i + 2] / 255) ** originalGamma * 255
    }

    // Process image in linear space
    // ... (image processing) ...

    // Convert back to gamma space
    const targetGamma = 0.45455 // sRGB
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = (png.data[i] / 255) ** (1 / targetGamma) * 255
      png.data[i + 1] = (png.data[i + 1] / 255) ** (1 / targetGamma) * 255
      png.data[i + 2] = (png.data[i + 2] / 255) ** (1 / targetGamma) * 255
    }

    // Pack the processed image
    png.pack()
  })
}
```

## Next Steps

- Learn about [BitBlt Operations](/advanced/bitblt-operations)
- Explore [Buffer Management](/advanced/buffer-management)
- Check out [Performance Tips](/advanced/performance)
