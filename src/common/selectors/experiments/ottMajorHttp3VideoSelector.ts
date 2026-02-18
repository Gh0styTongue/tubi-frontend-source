import { MAJOR_PLATFORMS_HTTP3_VIDEO, getConfig } from 'common/experiments/config/ottMajorPlatformsHttp3Video';
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

export const ottMajorPlatformsHttp3VideoResourceTagSelector = (state: StoreState) => {
  const isHttp3Enabled = ottMajorPlatformsHttp3VideoSelector(state);
  return isHttp3Enabled ? 'http3' : undefined;
};
