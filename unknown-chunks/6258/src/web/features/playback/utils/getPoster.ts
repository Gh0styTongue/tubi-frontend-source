import type { TileOrientation } from '@tubitv/web-ui';

import type { Video } from 'common/types/video';

/**
 * get the poster of video
 * @param {Object} content
 * @param {TileOrientation} tileOrientation
 * @return {Boolean}
 */
export const getPoster = (content: Video, tileOrientation?: TileOrientation): string => {
  const {
    hero_images: heroImages = [],
    landscape_images: landscapeImages = [],
    backgrounds = [],
    thumbnails = [],
  } = content;
  if (tileOrientation === 'landscape') {
    return landscapeImages[0] || thumbnails[0] || heroImages[0] || backgrounds[0];
  }
  return heroImages[0] || backgrounds[0] || landscapeImages[0] || thumbnails[0];
};
