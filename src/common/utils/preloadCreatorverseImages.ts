import {
  CREATORVERSE_LOGO_URL,
  CREATORVERSE_BACKGROUND_URL,
  CREATORVERSE_BACKGROUND_FALLBACK_URL,
} from 'common/constants/constants';
import OttMajorPlatformsCreatorverse from 'common/experiments/config/ottMajorPlatformsCreatorverse';
import WebCreatorverse from 'common/experiments/config/webCreatorverse';
import logger from 'common/helpers/logging';
import type { TubiStore } from 'common/types/storeState';
import { preloadImages } from 'common/utils/preloadImages';

/**
 * Preloads Creatorverse images on app startup to improve performance
 * when users encounter Creatorverse content. Checks both OTT and Web
 * Creatorverse experiments to determine if preloading is needed.
 */
export const preloadCreatorverseImages = async (store: TubiStore): Promise<void> => {
  try {
    const ottCreatorverseExperiment = OttMajorPlatformsCreatorverse(store);
    const webCreatorverseExperiment = WebCreatorverse(store);

    if (
      (ottCreatorverseExperiment.enabled && ottCreatorverseExperiment.getValue()) ||
      (webCreatorverseExperiment.enabled && webCreatorverseExperiment.getValue())
    ) {
      await preloadImages([CREATORVERSE_LOGO_URL, CREATORVERSE_BACKGROUND_URL, CREATORVERSE_BACKGROUND_FALLBACK_URL]);
    }
  } catch (error) {
    // Don't throw - preloading is an optimization, not critical
    logger.warn({ error }, 'Creatorverse image preload failed');
  }
};
