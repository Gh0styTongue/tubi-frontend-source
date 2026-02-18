import type { Request } from 'express';

import { getCookie } from 'client/utils/localDataStorage';
import { DEVICE_RESOLUTION } from 'common/constants/constants';
import {
  VIEWPORT_WIDTH_PX,
  VIEWPORT_HEIGHT_PX,
  PORTRAIT_TILE_WIDTH_PX,
  PORTRAIT_TILE_HEIGHT_PX,
  LANDSCAPE_TILE_WIDTH_PX,
  LANDSCAPE_TILE_HEIGHT_PX,
  BACKGROUND_WIDTH_PX,
  BACKGROUND_HEIGHT_PX,
  DISCOVERY_ROW_TILE_WIDTH_PX,
  DISCOVERY_ROW_TILE_HEIGHT_PX,
  LARGER_LANDSCAPE_TILE_WIDTH_PX,
  LARGER_PORTRAIT_TILE_WIDTH_PX,
  LARGER_PORTRAIT_TILE_HEIGHT_PX,
  LARGER_LANDSCAPE_TILE_HEIGHT_PX, ART_TITLE_HEIGHT_PX,
} from 'common/constants/style-constants';

export type ImageType = 'poster' | 'landscape' | 'background' | 'hero' | 'thumbnail' | 'title';
type Image = [string, number, number, ImageType];

const defaultResolution = [VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX];

export const getResolution = (resolution: string) => {
  return resolution.split('x').map((n) => parseInt(n, 10));
};

export const validateResolution = (resolution: string | number[]) => {
  if (typeof resolution === 'string') {
    resolution = getResolution(resolution);
  }
  return resolution.length === 2 && resolution.every((n) => !Number.isNaN(n) && n !== 0);
};

export const getOTTImageQuery = (resolution: string, query?: Request['query']) => {
  const { useLargeSizePoster, largerPoster, useArtTitle } = query || {} as Request['query'];
  const isDiscoveryRowLargeSize = useLargeSizePoster?.toString() === 'true';
  const isLargerPoster = largerPoster?.toString() === 'true';
  const enableArtTitle = useArtTitle?.toString() === 'true';
  let ratio = 1;
  const res = getResolution(resolution);
  if (validateResolution(res)) {
    ratio = res[0] / defaultResolution[0];
  }
  /*
   * poster: width 186, height 267
   * landscape: width 384, height 216
   * On OTT, we are using hero_images and thumbnails differently compared to web
   * hero_images & thumbnails are used for series & featured posters
   * references:
   * ott-ui/components/Tile/Tile.scss
   * ott-ui/components/ContentRow/ContentRow.tsx
   * components/ContainerVideoGrid/ContainerVideoGrid.tsx
   */
  const images: Image[] = [
    ['posterarts', isLargerPoster ? LARGER_PORTRAIT_TILE_WIDTH_PX : PORTRAIT_TILE_WIDTH_PX, isLargerPoster ? LARGER_PORTRAIT_TILE_HEIGHT_PX : PORTRAIT_TILE_HEIGHT_PX, 'poster'],
    ['landscape_images', isLargerPoster ? LARGER_LANDSCAPE_TILE_WIDTH_PX : LANDSCAPE_TILE_WIDTH_PX, isLargerPoster ? LARGER_LANDSCAPE_TILE_HEIGHT_PX : LANDSCAPE_TILE_HEIGHT_PX, 'landscape'],
    ['hero_images', LANDSCAPE_TILE_WIDTH_PX, LANDSCAPE_TILE_HEIGHT_PX, 'hero'],
    ['thumbnails', LANDSCAPE_TILE_WIDTH_PX, LANDSCAPE_TILE_HEIGHT_PX, 'thumbnail'],
    ['linear_larger_poster', isLargerPoster ? LARGER_LANDSCAPE_TILE_WIDTH_PX : LANDSCAPE_TILE_WIDTH_PX, isLargerPoster ? LARGER_LANDSCAPE_TILE_HEIGHT_PX : LANDSCAPE_TILE_HEIGHT_PX, 'landscape'],
    ['larger_thumbnails', LARGER_LANDSCAPE_TILE_WIDTH_PX, LARGER_LANDSCAPE_TILE_HEIGHT_PX, 'thumbnail'],
  ];

  if (enableArtTitle) {
    // width 0 for dynamic width
    images.push(['title_art', 0, ART_TITLE_HEIGHT_PX, 'title']);
  }
  // For LGTV, enable tupian caused a performance issue
  // We disable this util we found and resolve the performance issue.
  if (__OTTPLATFORM__ !== 'LGTV') {
    images.push(['backgrounds', BACKGROUND_WIDTH_PX, BACKGROUND_HEIGHT_PX, 'background']);
  }
  if (isDiscoveryRowLargeSize) {
    images.push(['posterarts_384', DISCOVERY_ROW_TILE_WIDTH_PX, DISCOVERY_ROW_TILE_HEIGHT_PX, 'poster']);
  }
  const imageQuery = images.reduce<Record<string, string>>((query, image) => {
    const [key, w, h, type] = image;
    query[key] = `w${Math.round(w * ratio)}h${Math.round(h * ratio)}_${type}`;
    return query;
  }, {});
  return imageQuery;
};

export const getWebImageQuery = (isMobile?: boolean, isV5?: boolean, query?: Request['query']) => {
  /*
   * For responsive design on web, we don't need resolution to determine the container size.
   * Instead, use breakpoints to calculate the posterarts size:
   * Outer container's padding: 65px
   * Gutter padding: 5px
   * | Screen width                | Largest poster tile size | Landscape (Linear) |
   * |-----------------------------|--------------------------|--------------------|
   * |1440 ~ 1920: 16.67%          | 288 (6 tiles)            | 587 (3 tiles)      |
   * |1170 ~ 1440: 20%             | 252 (5 tiles)            | 645 (2 tiles)      |
   * |960 ~ 1170: 25%              | 250 (4 tiles)            |
   * |below 960: 33.33%            | 267 (3 tiles)            |
   *
   * Before switching to tupian, image sizes are:
   * posterarts: width 400, height 574
   * landscape: width 978, height 576
   * web_ui/src/Col/Col.js
   *
   * Ref: Tupian image query sizes
   * https://github.com/adRise/lex/blob/9df60ff877d17a8c1c1b4721cb7c4ee6aff702bc/content/apps/content/lib/content/canvas/canonicalization.ex#L8~L76
   */
  const { useArtTitle } = query || {} as Request['query'];
  const enableArtTitle = useArtTitle?.toString() === 'true';
  const images: Readonly<(Image | undefined)[]> = [
    isMobile ? ['posterarts', 256, 368, 'poster'] : ['posterarts', 408, 583, 'poster'],
    // mobile background hero image
    ['hero_422', 422, 360, 'hero'],
    // mobile feature hero image
    ['hero_feature', 375, 355, 'hero'],
    isV5 ? ['landscape_images', isMobile ? 504 : 978, isMobile ? 283 : 576, 'landscape'] : undefined,
    isV5 ? ['linear_larger_poster', isMobile ? 504 : 978, isMobile ? 283 : 576, 'landscape'] : undefined,
    isV5 ? ['backgrounds', isMobile ? 807 : 1614, isMobile ? 453 : 906, 'background'] : undefined,
    enableArtTitle ? ['title_art', 430, 180, 'title'] : undefined,
  ];
  const imageQuery = images.reduce<Record<string, string>>((query, image) => {
    if (!image) return query;
    const [key, w, h, type] = image;
    query[key] = `w${w}h${h}_${type}`;
    return query;
  }, {});
  return imageQuery;
};

export const getImageQueryFromRequest = (req: Request) => {
  const resolution = req.cookies[DEVICE_RESOLUTION] || defaultResolution.join('x');
  if (__ISOTT__) {
    return getOTTImageQuery(resolution, req.query);
  }
  return getWebImageQuery(req.query.isMobile === 'true', req.query.v === '4', req.query);
};

interface ImageQueryParams {
  isMobile?: boolean;
  largerPoster?: boolean;
  useLargeSizePoster?: boolean;
  useArtTitle?: boolean;
  v?: 3 | 5;
}

export const getImageQueryFromParams = (params: ImageQueryParams) => {
  if (__ISOTT__) {
    const resolution = getCookie(DEVICE_RESOLUTION) || defaultResolution.join('x');
    return getOTTImageQuery(resolution, params as Request['query']);
  }
  const { isMobile, v } = params;
  return getWebImageQuery(isMobile, v === 5, params as Request['query']);
};

/**
 * convert images response in tensor/cms API to object as [WIDTH, URL][]
 */
export type ImageTuple = [number, string];
export const parseContentImages = (images: Record<string, string[]> | undefined, prefix: string) => {
  if (!images) {
    return [];
  }
  const keys = Object.keys(images).filter((k) => k.startsWith(prefix));
  const result = keys
    .reduce<ImageTuple[]>((tuples, k) => {
      const url = Array.isArray(images[k]) ? images[k][0] : '';
      const [, width] = k.split('_');
      if (url && width) {
        return [...tuples, [Number(width), url]];
      }
      return tuples;
    }, [])
    .sort((a, b) => a[0] - b[0]);
  return result;
};

export const formatSrcSet = (images: ImageTuple[], unit = 'w') => {
  return images
    .map((image) => {
      const [width, url] = image;
      return width ? `${url} ${width}${unit}` : url;
    })
    .join(', ');
};
