export const LANDSCAPE_TILE_SIZE = {
  xs: '6',
  xxl: '4',
};

export const NEWS_TILE_SIZE = {
  xs: '12',
  xl: '4',
  xxl: '3',
};

export const CANONICAL_PX_PER_REM = 15;

/**
 * These rem calculations below are simply converting 1080px to REM like our CSS mixin: (PX / 15)
 */

export const convert1080pxToREM = (px: number): string => `${px / CANONICAL_PX_PER_REM}rem`; // make sure to keep this up to date if it changes

// containers page
export const CONTAINER_GRID_ITEM_VERTICAL_MARGIN_REM = 0.8;

export enum CONTENT_TILE_TYPE {
  landscape = 'landscape',
  portrait = 'portrait',
}

export enum CONTENT_TILE_SIZE {
  large = 'large',
  normal = 'normal',
  medium = 'medium',
  larger = 'larger', // For the experiment: https://app.shortcut.com/tubi/story/516229
  promoLarge = 'promo-large', // For the experiment: https://app.shortcut.com/tubi/story/653757/firetv-dc-content-promotion-row
  promoNormal = 'promo-normal',
  spotlight = 'spotlight',
}

interface StyleConstants {
  TILES_PER_ROW: number;
  TILE_HEIGHT: number;
  TILE_WIDTH?: number;
  RENDERED_ROWS: number;
  MARGIN: number;
  ROW_HEIGHT: number;
  VIDEO_COUNT_TO_LOAD?: number;
}

// container detail page constants
export const containerVideoGridStyleConstants: StyleConstants = {
  TILE_HEIGHT: 17.8, // 267 / 15 = 17.8
  TILE_WIDTH: 12.4, // 186 / 15 = 12.4
  MARGIN: 0.8, // 12 / 15 = 0.8
  TILES_PER_ROW: 8,
  RENDERED_ROWS: 5,
  ROW_HEIGHT: 17.8 + 0.8,
};

const landscapeContainerVideoGridStyleConstants: StyleConstants = {
  TILE_HEIGHT: 14.4, // 216 / 15 = 14.4
  TILE_WIDTH: 25.6, // 384 / 15 = 25.6
  MARGIN: 0.8, // 12 / 15 = 0.8
  TILES_PER_ROW: 4,
  RENDERED_ROWS: 5,
  ROW_HEIGHT: 14.4 + 0.8,
};

export const slowPlatformContainerVideoGridStyleConstants: StyleConstants = {
  // TODO: Temporary adjustment to fix the bug that contents are cut off on the container detail page
  TILE_HEIGHT: 25.04,
  TILE_WIDTH: 17.33,
  MARGIN: 2,
  TILES_PER_ROW: 6,
  RENDERED_ROWS: 3,
  ROW_HEIGHT: 25.04 + 2,
};

export const largerContainerVideoGridStyleConstants: StyleConstants = {
  TILE_HEIGHT: 24, // 360px
  TILE_WIDTH: 16.8, // 252px
  MARGIN: 1.07, // 16px
  TILES_PER_ROW: 6,
  RENDERED_ROWS: 5,
  ROW_HEIGHT: 24 + 1.07,
};

const portraitContainerTileStyleConstants: StyleConstants = {
  TILE_HEIGHT: 24, // 24rem, 360px
  TILE_WIDTH: 16.8, // 252px
  MARGIN: 1.07, // 16px
  TILES_PER_ROW: 4,
  RENDERED_ROWS: 3,
  ROW_HEIGHT: 24 + 1.07,
};

const landscapeContainerTileStyleConstants: StyleConstants = {
  TILE_HEIGHT: 14.4,
  MARGIN: 0.8,
  TILES_PER_ROW: 4,
  RENDERED_ROWS: 3,
  ROW_HEIGHT: 14.4 + 1.07,
};

export const getContainerPageStyleConstants = (tileType?: CONTENT_TILE_TYPE) => {
  if (tileType === CONTENT_TILE_TYPE.portrait) {
    return portraitContainerTileStyleConstants;
  }
  return landscapeContainerTileStyleConstants;
};

export const getContainerDetailPageStyleConstants = (
  { isSlowDeviceDesignEnabled, isLandscape, enableLargerPoster }: { isSlowDeviceDesignEnabled?: boolean; isLandscape?: boolean; enableLargerPoster?: boolean } = {
    isSlowDeviceDesignEnabled: __IS_SLOW_PLATFORM__,
  }
): StyleConstants => {
  let styleConstants: StyleConstants;
  if (isLandscape) {
    styleConstants = landscapeContainerVideoGridStyleConstants;
  } else if (enableLargerPoster) {
    styleConstants = largerContainerVideoGridStyleConstants;
  } else {
    styleConstants = isSlowDeviceDesignEnabled
      ? slowPlatformContainerVideoGridStyleConstants
      : containerVideoGridStyleConstants;
  }

  return { ...styleConstants, VIDEO_COUNT_TO_LOAD: styleConstants.TILES_PER_ROW * styleConstants.RENDERED_ROWS * 2 };
};

export const TRANSPARENT_BUTTON_COLOR = 'rgba(150, 153, 163, 0.16)';

export const THEME_DARK_BLUE_BG = '#10141F';
export const TILE_BACKGROUND_COLOR = '#333';

// The style values should be consistent with ott-ui/src/components/Tile/Tile.scss and ott-ui/src/components/TileRow/TileRow.scss
// TODO we need to find a approach to keep single source of truth between CSS and JS
export const VIEWPORT_WIDTH_PX = 1920;
export const VIEWPORT_HEIGHT_PX = 1080;
export const PORTRAIT_TILE_WIDTH_PX = 186;
export const PORTRAIT_TILE_HEIGHT_PX = 267;
export const LANDSCAPE_TILE_WIDTH_PX = 384;
export const LANDSCAPE_TILE_HEIGHT_PX = 216;
export const MEDIUM_PORTRAIT_TILE_HEIGHT_PX = 318;
export const LARGER_LANDSCAPE_TILE_WIDTH_PX = 504;
export const LARGER_LANDSCAPE_TILE_HEIGHT_PX = 283;
export const LARGER_PORTRAIT_TILE_WIDTH_PX = 244;
export const LARGER_PORTRAIT_TILE_HEIGHT_PX = 350;
export const PROMO_PORTRAIT_TILE_WIDTH_PX = 252;
export const PROMO_SELECTED_PORTRAIT_TILE_WIDTH_PX = 329;
export const PROMO_SELECTED_PORTRAIT_TILE_HEIGHT_PX = 470;
export const BACKGROUND_HEIGHT_PX = 906;
export const BACKGROUND_WIDTH_PX = 1614;
export const TILE_MARGIN_LEFT_PX = 10;
export const LARGER_TILE_MARGIN_LEFT_PX = 16;
export const TOP_10_TILE_LEFT_INSET = PORTRAIT_TILE_WIDTH_PX + TILE_MARGIN_LEFT_PX;
export const TOP_10_LARGER_TILE_LEFT_INSET = LARGER_PORTRAIT_TILE_WIDTH_PX + LARGER_TILE_MARGIN_LEFT_PX;
export const DISCOVERY_ROW_TILE_HEIGHT_PX = 552;
export const DISCOVERY_ROW_TILE_WIDTH_PX = 384;
export const REGISTRATION_PROMPT_HEIGHT_PX = 317;
export const ART_TITLE_HEIGHT_PX = 112;

export const DEFAULT_HEADER_HEIGHT_PX = 52;
export const SPONSORSHIP_HEADER_HEIGHT_PX = 87;

export const CONTAINER_ROW_PADDING_PX = 36;

export const TUPIAN_POSTERART_PREFIX = 'posterarts';
export const TUPIAN_LANDSCAPE_PREFIX = 'landscape';
// visit web-ui/src/components/Carousel/Carousel.tsx for breakpoints
export const TUPIAN_SRCSET_MEDIA_QUERY: Partial<Record<typeof TUPIAN_POSTERART_PREFIX | typeof TUPIAN_LANDSCAPE_PREFIX, string>> = {};

export const TRENDING_SEARCH_TILES_PER_ROW = 5;
export const TRENDING_SEARCH_RENDERED_ROWS = 3;
const TRENDING_SEARCH_LIVE_NEW_TILES = 2;
export const TRENDING_SEARCH_TOP_SEARCHED_TILES = TRENDING_SEARCH_TILES_PER_ROW * (TRENDING_SEARCH_RENDERED_ROWS + 1) - TRENDING_SEARCH_LIVE_NEW_TILES;
