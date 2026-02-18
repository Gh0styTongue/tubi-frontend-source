import { MAJOR_PLATFORMS_HTTP3_VIDEO, getConfig } from 'common/experiments/config/ottMajorPlatformsHttp3Video';
import { MAJOR_PLATFORMS_USING_NO_CACHE_CDN, getConfig as getNoCacheConfig } from 'common/experiments/config/ottMajorPlatformsUsingNoCacheCdn';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';

const ottMajorPlatformsHttp3VideoSelector = (state: StoreState) => {
  // If feature switch is not default, use its value
  if (!FeatureSwitchManager.isDefault(['VOD', 'HTTP3'])) {
    return FeatureSwitchManager.isEnabled(['VOD', 'HTTP3']);
  }

  // Otherwise fall back to experiment
  return popperExperimentsSelector(state, {
    ...MAJOR_PLATFORMS_HTTP3_VIDEO,
    config: getConfig(),
  });
};

const ottMajorPlatformsNoCacheVideoSelector = (state: StoreState) => {
  if (!FeatureSwitchManager.isDefault(['VOD', 'NOCache'])) {
    return FeatureSwitchManager.isEnabled(['VOD', 'NOCache']);
  }

  return popperExperimentsSelector(state, {
    ...MAJOR_PLATFORMS_USING_NO_CACHE_CDN,
    config: getNoCacheConfig(),
  });
};

export const ottMajorPlatformsVideoResourceTagSelector = (state: StoreState) => {
  const isNoCacheEnable = ottMajorPlatformsNoCacheVideoSelector(state);
  if (isNoCacheEnable) {
    return 'no-cache';
  }
  const isHttp3Enabled = ottMajorPlatformsHttp3VideoSelector(state);
  return isHttp3Enabled ? 'http3' : undefined;
};
