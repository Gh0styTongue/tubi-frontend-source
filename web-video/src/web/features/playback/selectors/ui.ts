import { isMobileWebkit, isWebkitIPad, isWebkitIPhone } from '@adrise/utils/lib/ua-sniffing';

import { isMobileWebAndroidPlaybackEnabledSelector } from 'common/selectors/experiments/webAndroidPlaybackSelector';
import { isMobileWebIosPlaybackEnabledSelector } from 'common/selectors/experiments/webIosPlaybackSelector';
import { isMobileDeviceSelector, userAgentSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { mobilePlaybackSupported } from 'common/utils/capabilityDetection';

export const hasShownRegistratonPromptSelector = (state: StoreState) => {
  return state.ui.registrationPrompt.isSkipped;
};

export const renderControlsSelector = (state: StoreState) => {
  return state.ui.renderControls;
};

// untested for being a wrapper over a well-tested package fn
export const isWebkitIPhoneSelector = (state: StoreState) => {
  return isWebkitIPhone(state.ui.userAgent);
};

// untested for being a wrapper over a well-tested package fn
export const isWebkitIPadSelector = (state: StoreState) => {
  return isWebkitIPad(state.ui.userAgent);
};

// untested for being a wrapper
// on web, "in browser fullscreen" is a variant of the player
// fullscreen experience used on certain mobile devices for which
// there are problems with the native fullscreen experience
export const shouldUseInBrowserFullscreenSelector = (state: StoreState) => {
  return isMobileWebkit(userAgentSelector(state));
};

export const isInMobileWhitelistSelector = (state: StoreState) => {
  const enableMobileWebIosPlayback = isMobileWebIosPlaybackEnabledSelector(state);
  const enableWebAndroidPlayback = isMobileWebAndroidPlaybackEnabledSelector(state);

  const isMobile = isMobileDeviceSelector(state);
  const userAgent = userAgentSelector(state);
  return isMobile && mobilePlaybackSupported({ userAgent, enableMobileWebIosPlayback, enableWebAndroidPlayback });
};
