export const HDC_SPOTLIGHT = 'hdc_spotlight';
export const HDC_CAROUSEL = 'hdc_carousel';
export const HDC_WRAPPER_VIDEO = 'wrapper_video';
export const HDC_WRAPPER = 'wrapper';
export const HDC_CONTAINER_PREFIX = 'hdc_';
export const HDC_AD_ROW_HEIGHT = 360;
export const HDC_AD_PLAY_DELAY = 3000;
export const DISABLE_HDC_AD_REFETCH_WHEN_SCROLL_ON_HOMEPAGE = true; // disable refetch when scroll on homepage, maybe we will remove this later

// hard code now as a fallback, cause the ad server doesn't return the row placement
export const defaultRowPlacementMap: Record<string, number> = {
  [HDC_WRAPPER]: 0,
  [HDC_SPOTLIGHT]: 3,
  [HDC_CAROUSEL]: 3,
};
