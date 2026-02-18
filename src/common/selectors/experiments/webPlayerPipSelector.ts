import { useCallback } from 'react';

import { getExperiment } from 'common/experimentV2';
import { webottWebPlayerInAppPip } from 'common/experimentV2/configs/webottWebPlayerInAppPip';
import { liveEventContainersChildrenMapSelector } from 'common/features/liveEvent/selectors';
import useAppSelector from 'common/hooks/useAppSelector';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';

/* istanbul ignore file */
const webPlayerPipEnabledSelector = (state: StoreState) => {
  if (__SERVER__ || __WEBPLATFORM__ !== 'WEB') {
    return false;
  }

  /**
   * If there are any live sea tiger events, we don't want to show the pip
   * unless feature switch is enabled
   */
  const isFeatureSwitchEnabled = FeatureSwitchManager.isEnabled(['Player', 'InAppPictureInPicture']);
  const liveEvents = liveEventContainersChildrenMapSelector(state, { pathname: '/' });
  if (Object.values(liveEvents).length > 0) {
    return isFeatureSwitchEnabled;
  }

  return true;
};

export const webPlayerPipSelector = (state: StoreState) => {
  const isExperimentEnabled = webPlayerPipEnabledSelector(state);

  if (!isExperimentEnabled) {
    return false;
  }

  return getExperiment(webottWebPlayerInAppPip, { disableExposureLog: true }).get('in_app_pip_enabled');
};

export const useWebPlayerPipExposureLogger = () => {
  const isExperimentEnabled = useAppSelector(webPlayerPipEnabledSelector);

  const logExposure = useCallback(() => {
    if (!isExperimentEnabled) return false;
    return getExperiment(webottWebPlayerInAppPip).get('in_app_pip_enabled');
  }, [isExperimentEnabled]);

  return logExposure;
};

export const useWebPlayerPipExperiment = () => {
  const result = useAppSelector(webPlayerPipSelector);
  return result;
};
