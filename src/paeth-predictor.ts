/**
 * Implements the Paeth predictor algorithm as defined in the PNG specification.
 * This algorithm estimates the value of a pixel based on the values of nearby pixels.
 *
 * The Paeth predictor selects the neighboring pixel (left, above, or upper left)
 * which most closely matches the trend of the surrounding pixels. It does this by
 * choosing the pixel whose value is closest to the value predicted by a simple
 * linear function of the other two pixels.
 *
 * @see {@link http://www.w3.org/TR/PNG-Filters.html} PNG Specification
 *
 * @param left - The pixel to the left of the current position
 * @param above - The pixel above the current position
 * @param upLeft - The pixel diagonally up and to the left of the current position
 *
 * @returns The predicted value for the current pixel
 *
 * @example
 * ```typescript
 * // Predict a pixel value based on its neighbors
 * const predicted = paethPredictor(120, 130, 125);
 * ```
 */
export function paethPredictor(left: number, above: number, upLeft: number,
): number {
  // Initial estimate using linear function
  const paeth = left + above - upLeft

  // Calculate absolute differences from the estimate
  const pLeft = Math.abs(paeth - left)
  const pAbove = Math.abs(paeth - above)
  const pUpLeft = Math.abs(paeth - upLeft)

  // Return the value that was closest to the estimate
  if (pLeft <= pAbove && pLeft <= pUpLeft) {
    return left
  }

  if (pAbove <= pUpLeft) {
    return above
  }

  return upLeft
}
