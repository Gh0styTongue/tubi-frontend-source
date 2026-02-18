import { setImagePool } from 'client/imagePool/default';
import { ImagePool } from 'client/imagePool/ImagePool';
import { setImageRequestQueue } from 'client/imageRequestQueue/default';
import { ImageRequestQueue } from 'client/imageRequestQueue/ImageRequestQueue';
import { setSpatialNavigation } from 'client/spatialNavigation/default';
import { SpatialNavigation } from 'client/spatialNavigation/spatialNavigation';
import systemApi from 'client/systemApi';
import { setSystemApi } from 'client/systemApi/default';
import ApiClient from 'common/helpers/ApiClient';
import { setApiClient } from 'common/helpers/apiClient/default';
import { trackLogging, trackEvent } from 'common/utils/track';
import { setTrackEvent, setTrackLogging } from 'common/utils/track/default';

/**
 * This project used to have a problem with circular dependencies.
 * At that time this file was used to solve the problem. Ideally
 * we shouldn't need to add more dependencies to this function.
 * Only add a dependency to this function as a last resort if
 * you can't solve the circular dependency problem in another way.
 */
export function setupDependencies() {
  // dependency injection
  setApiClient(ApiClient);
  setSystemApi(systemApi);
  setTrackEvent(trackEvent);
  setTrackLogging(trackLogging);
  if (__ISOTT__) {
    // We don't want to register event listeners for spatial navigation by default in production
    // We should enable the spatial navigation only where it is used
    setSpatialNavigation(new SpatialNavigation(!__PRODUCTION__));
    if (__CLIENT__) {
      setImagePool(new ImagePool(5));
      setImageRequestQueue(new ImageRequestQueue());
    }
  }
}

