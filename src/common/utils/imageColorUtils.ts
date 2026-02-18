import logger from 'common/helpers/logging';

// OKLab color space utilities for perceptually uniform color manipulation
// Color utility class for OKLab color space operations
class Color {
  r: number;
  g: number;
  b: number;
  alpha: number;

  constructor(r: number, g: number, b: number, alpha: number = 1.0) {
    // Clamp values to valid range
    this.r = Math.max(0, Math.min(1, r));
    this.g = Math.max(0, Math.min(1, g));
    this.b = Math.max(0, Math.min(1, b));
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Convert RGB to OKLab color space
   */
  toOKLab() {
    const r = this.r;
    const g = this.g;
    const b = this.b;

    // Linearize sRGB values (matching Swift implementation)
    const linearize = (c: number) => c ** 2.2;

    const lR = linearize(r);
    const lG = linearize(g);
    const lB = linearize(b);

    // Convert to OKLab
    const l = 0.4122214708 * lR + 0.5363325363 * lG + 0.0514459929 * lB;
    const m = 0.2119034982 * lR + 0.6806995451 * lG + 0.1073969566 * lB;
    const s = 0.0883024619 * lR + 0.2817188376 * lG + 0.6299787005 * lB;

    const l_ = l ** (1 / 3.0);
    const m_ = m ** (1 / 3.0);
    const s_ = s ** (1 / 3.0);

    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    };
  }

  /**
   * Create a Color from OKLab color space
   */
  static fromOKLab(L: number, a: number, b: number): Color {
    const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;

    // Delinearize back to sRGB (matching Swift implementation)
    const delinearize = (c: number) => Math.max(0, Math.min(1, c)) ** (1 / 2.2);

    const red = delinearize(+4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
    const green = delinearize(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
    const blue = delinearize(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_);

    return new Color(red, green, blue, 1.0);
  }

  /**
   * Adjust the luminance of the color to a target value while preserving hue and saturation
   */
  withAdjustedLuminance(targetLuminance: number): Color {
    const oklab = this.toOKLab();
    oklab.L = targetLuminance;
    return Color.fromOKLab(oklab.L, oklab.a, oklab.b);
  }

  /**
   * Convert to RGB object
   */
  toRGB() {
    return {
      r: Math.round(this.r * 255),
      g: Math.round(this.g * 255),
      b: Math.round(this.b * 255),
      alpha: this.alpha,
    };
  }
}

// Image utility functions for calculating average colors
class ImageColorUtils {
  /**
   * Calculate average color from ImageData by sampling pixels
   */
  static calculateAverageFromImageData(imageData: ImageData): Color {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const pixelCount = width * height;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    // Sample pixels
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }

    const avgR = totalR / pixelCount / 255.0;
    const avgG = totalG / pixelCount / 255.0;
    const avgB = totalB / pixelCount / 255.0;

    return new Color(avgR, avgG, avgB, 1.0);
  }

  /**
   * Calculate average color from an image
   */
  static async averageColor(image: HTMLImageElement | ImageData | string): Promise<Color | null> {
    // If already ImageData, calculate directly
    if (image instanceof ImageData) {
      return ImageColorUtils.calculateAverageFromImageData(image);
    }

    // Load image if string URL, otherwise use HTMLImageElement directly
    let img: HTMLImageElement;
    if (typeof image === 'string') {
      try {
        img = await ImageColorUtils.loadImage(image);
      } catch {
        return null;
      }
    } else if (image instanceof HTMLImageElement) {
      img = image;
    } else {
      return null;
    }

    // Draw image to canvas and extract ImageData
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return ImageColorUtils.calculateAverageFromImageData(imageData);
    } catch (err) {
      logger.error({ err }, 'Error extracting image data from canvas');
      return null;
    }
  }

  /**
   * Get average color using canvas and adjust luminance
   */
  static async averageColorWithAdjustedLuminance(
    image: HTMLImageElement | ImageData | string,
    targetLuminance: number = 0.18
  ): Promise<Color | null> {
    const averageColor = await ImageColorUtils.averageColor(image);
    if (!averageColor) {
      return null;
    }
    return averageColor.withAdjustedLuminance(targetLuminance);
  }

  /**
   * Load an image from a URL or data URL
   */
  static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for cross-origin images
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Default gradient color - solidSurface10 (#161324) so tiles don't blend into background
const DEFAULT_GRADIENT_COLOR = 'rgb(22, 19, 36)';

// Limit color cache to prevent memory bloat
const MAX_COLOR_CACHE_SIZE = 50;

// Cache for extracted colors to avoid re-extracting
// Uses a simple LRU-style eviction when cache exceeds MAX_COLOR_CACHE_SIZE
const colorCache: Record<string, string> = {};
const colorCacheKeys: string[] = [];

// Add a color to the cache with LRU eviction when full
const addToColorCache = (key: string, color: string) => {
  if (colorCache[key]) {
    // Key exists - update recency by moving to end of eviction list
    const index = colorCacheKeys.indexOf(key);
    if (index !== -1) {
      colorCacheKeys.splice(index, 1);
      colorCacheKeys.push(key);
    }
  } else {
    // New key - add to eviction list
    colorCacheKeys.push(key);
    // Evict oldest entries if cache is full
    while (colorCacheKeys.length > MAX_COLOR_CACHE_SIZE) {
      // Non-null assertion is safe here because the while condition guarantees array is non-empty
      const oldestKey = colorCacheKeys.shift()!;
      delete colorCache[oldestKey];
    }
  }
  colorCache[key] = color;
};

// Clear the color cache (exported for testing)
const clearColorCache = () => {
  Object.keys(colorCache).forEach(key => delete colorCache[key]);
  colorCacheKeys.length = 0;
};

// Utility function to extract average color from an image and adjust luminance
const extractDominantColor = async (imageUrl: string, targetLuminance = 0.18): Promise<string> => {
  try {
    const color = await ImageColorUtils.averageColorWithAdjustedLuminance(imageUrl, targetLuminance);
    if (color) {
      const rgb = color.toRGB();
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
  } catch {
    return DEFAULT_GRADIENT_COLOR;
  }
  return DEFAULT_GRADIENT_COLOR;
};

export {
  Color,
  ImageColorUtils,
  DEFAULT_GRADIENT_COLOR,
  MAX_COLOR_CACHE_SIZE,
  colorCache,
  colorCacheKeys,
  addToColorCache,
  clearColorCache,
  extractDominantColor,
};
