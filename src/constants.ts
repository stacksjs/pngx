// PNG Header signature bytes
export const PNG_SIGNATURE: Uint8Array = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

// Chunk type constants
export const ChunkType = {
  IHDR: 0x49484452,
  IEND: 0x49454E44,
  IDAT: 0x49444154,
  PLTE: 0x504C5445,
  tRNS: 0x74524E53,
  gAMA: 0x67414D41,
} as const

// Individual color type bits
export const ColorType = {
  GRAYSCALE: 0,
  PALETTE: 1,
  COLOR: 2,
  ALPHA: 4, // e.g. grayscale and alpha
} as const

// Combined color types
export const ColorTypeCombinations = {
  PALETTE_COLOR: 3, // PALETTE | COLOR
  COLOR_ALPHA: 6, // COLOR | ALPHA
} as const

// Maps color types to bits per pixel
export const COLORTYPE_TO_BPP_MAP: Readonly<Record<number, number>> = {
  [ColorType.GRAYSCALE]: 1,
  [ColorType.COLOR]: 3,
  [ColorTypeCombinations.PALETTE_COLOR]: 1,
  [ColorType.GRAYSCALE | ColorType.ALPHA]: 2,
  [ColorTypeCombinations.COLOR_ALPHA]: 4,
} as const

// Gamma division constant
export const GAMMA_DIVISION = 100000

// Export commonly used combinations for convenience
export const TYPE_IHDR: number = ChunkType.IHDR
export const TYPE_IEND: number = ChunkType.IEND
export const TYPE_IDAT: number = ChunkType.IDAT
export const TYPE_PLTE: number = ChunkType.PLTE
export const TYPE_tRNS: number = ChunkType.tRNS
export const TYPE_gAMA: number = ChunkType.gAMA

export const COLORTYPE_GRAYSCALE: number = ColorType.GRAYSCALE
export const COLORTYPE_PALETTE: number = ColorType.PALETTE
export const COLORTYPE_COLOR: number = ColorType.COLOR
export const COLORTYPE_ALPHA: number = ColorType.ALPHA
export const COLORTYPE_PALETTE_COLOR: number = ColorTypeCombinations.PALETTE_COLOR
export const COLORTYPE_COLOR_ALPHA: number = ColorTypeCombinations.COLOR_ALPHA
