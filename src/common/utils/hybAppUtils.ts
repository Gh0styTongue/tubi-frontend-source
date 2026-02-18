import get from 'lodash/get';

import { isInSuitest } from 'client/setup/tasks/setupSuitest';
import {
  FIRETV_HDMI_CONNECT_HANDLER_BUILD_CODE,
  HYB_APP_NATIVE_BACK_MIN_BUILD_CODE,
  HYB_APP_NATIVE_DRM_MIN_BUILD_CODE,
  HYB_APP_NATIVE_NEW_ANALYTICS_MIN_BUILD_CODE,
  MINIMUM_APP_VERSION_FOR_DRM,
  SHOW_UPDATE_APP_MODAL_BELOW_VERSION,
} from 'common/constants/constants';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { AppVersion } from 'common/types/fire';
import type { UserAgent } from 'common/types/ui';

export function isInDesktopBrowser(ua: Partial<UserAgent>): boolean {
  const osName = ua.os?.name;
  // we can assume it is running in browser for testing if the OS is Mac or Windows
  return __IS_HYB_APP__ && (osName === 'Mac OS' || osName === 'Windows');
}

/**
 * Return if the Android build version support is deprecated
 */
export function isDeprecatedHybBuild(userAgent: Partial<UserAgent>, buildCode?: number): boolean {
  return (
    !FeatureSwitchManager.isDisabled(['UpdateTubiAppModal'])
    && !__DEVELOPMENT__
    && __IS_HYB_APP__
    && (!__STAGING__ || FeatureSwitchManager.isEnabled(['UpdateTubiAppModal']))
    && !isInDesktopBrowser(userAgent)
    && !isInSuitest()
    && (!buildCode || buildCode < HYB_APP_NATIVE_BACK_MIN_BUILD_CODE)
  );
}

/**
 * Return if the Android build supports new analytics
 * Native player new analytics support is available on builds >= 295
 */
export function isNativeNewAnalyticsAvailable(buildCode?: number): boolean {
  if (!buildCode) return false;
  return __IS_HYB_APP__ && buildCode >= HYB_APP_NATIVE_NEW_ANALYTICS_MIN_BUILD_CODE;
}

/**
 * Return if the Android build supports DRM resource
 */
export function isNativeDRMAvailable(buildCode?: number): boolean {
  if (!buildCode) return false;
  return __IS_HYB_APP__ && buildCode >= HYB_APP_NATIVE_DRM_MIN_BUILD_CODE;
}

/**
 * Utility used to determine if the position of the video is a valid
 * number and falls below the admissible limit
 * @param {*} position The current position of video in seconds
 * @param {*} upperLimit: The max limit allowed in seconds
 */
export function isValidPositionAndInBounds(position: number | string | undefined, upperLimit: number | string) {
  if (position == null || isNaN(position as number)) return false;

  const positionInNumber = typeof position === 'string' ? parseInt(position, 10) : position;
  return positionInNumber >= 1 && positionInNumber <= upperLimit;
}

/**
 * Return if the FireTV build supports HDMI connect/disconnect handler
 */
export function isHdmiConnectHandlerAvailable(buildCode?: number): boolean {
  if (!buildCode) return false;
  return __OTTPLATFORM__ === 'FIRETV_HYB' && buildCode >= FIRETV_HDMI_CONNECT_HANDLER_BUILD_CODE;
}

export const doesAppMeetMinimumVersionForDRM = (platform: OTTPLATFORM, appVersion?: Partial<AppVersion>) => {
  if (FeatureSwitchManager.isEnabled(['DRM', 'NativeCompatibility']) || FeatureSwitchManager.isDisabled(['UpdateTubiAppModal'])) {
    return true;
  }

  const minimumVersion = MINIMUM_APP_VERSION_FOR_DRM[platform];
  return minimumVersion === undefined || (appVersion?.code != null && appVersion.code >= minimumVersion);
};

export const shouldShowUpdateAppModal = (platform: OTTPLATFORM, appVersion?: Partial<AppVersion>): boolean => {
  if (appVersion && appVersion.code !== undefined) {
    const hasOverridingVersion = platform in SHOW_UPDATE_APP_MODAL_BELOW_VERSION;
    const cutoffBuildCode = SHOW_UPDATE_APP_MODAL_BELOW_VERSION[platform];
    // TODO: Remove the following istanbul-ignore comment after uncommenting PS4 version code check once patch is live
    /* istanbul ignore next */
    if (hasOverridingVersion && appVersion.code < cutoffBuildCode!) {
      return true;
    }
  }
  return !doesAppMeetMinimumVersionForDRM(platform, appVersion);
};

/**
 * Determine if is using native player from location
 * @param {String} location
 */
export const isAndroidNativePlayer = (location: string) => {
  return /^\/ott\/androidplayer\/[^/]+/.test(location);
};

/**
 * shouldFireActiveEventOnVisibilityChange: Will let you know if you should trigger
 * active event on visibility change event.
 * On Hybrid Apps, when the user backs out of the native player and goes to details page
 * then the visibilitychange event is triggered which in turns calls the active event.
 * - Back button press on video player page should check if the srcElement is coming from video_player_page.
 * - Background to foreground or vice versa mode from player page on hybrid apps does not trigger visibility change event
 * as the fragment is VideoFragment and WebFragment is not ready yet. Fragments are a concept used by Android to differentiate
 * if the current page is native player (VideoFragment) or webview (WebFragment).
 * @param {*} event: as passed in with visibilitychange event listener
 */
export const shouldFireActiveEventOnVisibilityChange = (event: Event) => {
  // For non-hybrid apps always fire active event
  if (!__IS_HYB_APP__) return true;

  /**
   * If sourcePageUrl does not exist, then fire active event on visibility change
   */
  const sourcePageUrl = get(event, ['srcElement', 'location', 'pathname'], null);
  if (!sourcePageUrl) return true;

  /**
   * Fire active event if not android native player on visibility change event
   */
  return !isAndroidNativePlayer(sourcePageUrl);
};

export const isFireTVStickGen2 = (userAgent: string) => {
  if (!userAgent) {
    return false;
  }
  // Model # for Gen 2 stick is AFTT
  // https://developer.amazon.com/docs/fire-tv/identify-amazon-fire-tv-devices.html
  return __OTTPLATFORM__ === 'FIRETV_HYB' && userAgent.includes('AFTT ');
};
