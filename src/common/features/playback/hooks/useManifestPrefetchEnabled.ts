import { useExperiment } from 'common/experimentV2';
import { webottMajorPlatformsManifestPrefetch } from 'common/experimentV2/configs/webottMajorPlatformsManifestPrefetch';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { isSamsungBefore2017 } from 'common/utils/tizenTools';

/**
 * Check if the current platform supports manifest prefetch.
 * Disabled on: Web, AndroidTV, Samsung 2015/2016
 */
function isPlatformSupported(): boolean {
  // Disable on web
  if (__WEBPLATFORM__) {
    return false;
  }

  // Disable on AndroidTV
  if (__OTTPLATFORM__ === 'ANDROIDTV') {
    return false;
  }

  // Disable on Samsung 2015/2016 (older Tizen devices)
  if (isSamsungBefore2017()) {
    return false;
  }

  return true;
}

/**
 * Hook to determine if manifest prefetch / IndexedDB cache is enabled.
 *
 * Priority:
 * 1. Platform must be supported (not Web, AndroidTV, or Samsung 2015/2016)
 * 2. FeatureSwitch override (if explicitly set)
 * 3. Experiment value (if FeatureSwitch is default)
 *
 * @returns boolean indicating if the feature is enabled
 */
function useManifestPrefetchEnabled(): boolean {
  const experimentEnabled = useExperiment(webottMajorPlatformsManifestPrefetch, { disableExposureLog: true }).get('enable');

  // Check platform support first
  if (!isPlatformSupported()) {
    return false;
  }

  // FeatureSwitch takes priority if explicitly set
  if (!FeatureSwitchManager.isDefault(['Player', 'IndexedDBManifestCache'])) {
    return FeatureSwitchManager.isEnabled(['Player', 'IndexedDBManifestCache']);
  }

  return experimentEnabled;
}

export default useManifestPrefetchEnabled;
