import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

/**
 * These are React components in the app which can render a deeplink or redirect
 * the user offsite.
 */
type DeeplinkSource =
'LiveNewsTile'
| 'SeriesDetail'
| 'PlayerArea'
| 'InstallButton'
| 'LinearTile';

interface TrackMobileWebDeeplinkParams {
  deeplinkSource: DeeplinkSource;
}

/**
 * On some devices--especially mobile and when playback is not supported--the web
 * app provides means to deeplink to the mobile app or app store.
 * This function allows logging user interactions with these deeplinks to allow
 * us to observe this user behavior.
 */
export function trackMobileWebDeeplink({ deeplinkSource }: TrackMobileWebDeeplinkParams) {
  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.MOBILE_WEB_DEEPLINK,
    message: {
      deeplinkSource,
    },
  });
}
