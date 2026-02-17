export const OTT_DEEPLINK_ROUTE = '/deeplink';

export const UTM_SOURCE = 'utm_source';
export const UTM_MEDIUM = 'utm_medium';

// FIRETV_HYB constants
// most copied from https://github.com/adRise/adrise_android2/blob/28b3caed5d8101b365471f4e1430a4a23ccba2e6/library/core/src/main/java/com/tubitv/core/deeplink/DeepLinkConsts.kt
export const FIRETV_DEEPLINK_PREFIX = 'deeplink';
export const FIRETV_DEEPLINK_TUBI_HOST_PATH = 'tubitv.com/';

export const FIRETV_CONTENT_ID_PARAM_NAME = 'contentId';
export const FIRETV_CATEGORY_ID_PARAM_NAME = 'categoryId';
export const FIRETV_CONTENT_TYPE_PARAM_NAME = 'contentType';
export const FIRETV_CONTENT_TYPE_VALUE_SERIES = 'series';
export const FIRETV_RESUME_TIME_PARAM_NAME = 'resume_time';
export const FIRETV_LINK_ACTION_PARAM_NAME = 'link-action';
export const FIRETV_FROM_DEVICE_ID_PARAM_NAME = 'from_device_id';
export const FIRETV_REFRESH_TOKEN_PARAM_NAME = 'refresh_token';
export const FIRETV_USER_ID_PARAM_NAME = 'user_id';
export const FIRETV_FROM_PLATFORM_PARAM_NAME = 'from_platform';

export const FIRETV_LINK_ACTION_VIEW = 'view';
export const FIRETV_PATH_URL_PARAM = 'path';
export const FIRETV_FROM_NATIVE_URL_PARAM = 'extras';
export const FIRETV_NATIVE_SEARCH_PARAM = 'tubi_id';
export const FIRETV_NATIVE_DISCOVERY_TYPE = 'contentDiscoveryType';

export const FIRETV_SEARCH_UTM_CAMPAIGN = 'amazon-general';
export const FIRETV_SEARCH_UTM_MEDIUM = 'partnership';
export const FIRETV_SEARCH_UTM_SOURCE = 'search';
export const FIRETV_SOURCE_LAUNCHER = 'launcher';

export const FIRETV_DIAL_PARAM = 'com.amazon.extra.DIAL_PARAM';
export const FIRETV_DIAL_CONTENT_ID = 'contentID';
export const FIRETV_DIAL_MEDIA_TYPE = 'mediaType';
export const FIRETV_DIAL_USER_ID = 'userId';
export const FIRETV_DIAL_DEVICE_ID = 'deviceId';
export const FIRETV_DIAL_DEVICE_TYPE = 'deviceType';
export const FIRETV_DIAL_RESUME_TIME = 'resumeTime';
export const FIRETV_DIAL_REFRESH_TOKEN = 'refreshToken';
export const FIRETV_DIAL_DETAILS_PAGE = 'detailsPage';
export const FIRETV_DIAL_IS_LIVE = 'isLive';
export const FIRETV_DIAL_ALLOW_SIGN_IN = 'allowSignIn';
export const FIRETV_DIAL_MEDIA_TYPE_LINEAR_VALUE = 'livefeed';

export const FIRETV_LEGACY_VALID_PATH_MAP = {
  'media-playback/video': 'media-playback/video',
  'media-playback': 'media-playback',
  'media-details': 'media-details',
  'media-browse': 'media-browse',
  'video': 'video',
  'movies': 'movies',
  'tv-shows': 'tv-shows',
  'series': 'series',
  'live-news': 'live-news',
  'live': 'live',
  'search': 'search',
  'home': 'home',
  'mode': 'mode',
  'container/regular': 'container/regular',
};
