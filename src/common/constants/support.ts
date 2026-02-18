export const SCREENSHOTS_FIELD = 'screenshots';
export const SOURCE_FIELD = 'source';
export const ALLOWED_SUPPORT_FIELDS = [
  'name',
  'email',
  'platform',
  'title',
  'topic',
  'subtopic',
  'appVersion',
  'softwareVersion',
  'detail',
  'message',
  'deviceId',
  SCREENSHOTS_FIELD,
  SOURCE_FIELD,
];
export const MAX_SCREENSHOTS_LENGTH = 5;
export const MAX_TOTAL_SCREENSHOT_FILE_SIZE = 15 * 1000 * 1000;

export const ES_LOCALE_ID = 1364;

export const DEVICE_ID_FIELD_ID = 33243428;
export const USER_ID_FIELD_ID = 33243408;
export const PLATFORM_FIELD_ID = 1260827369589;
export const CONTENT_FIELD_ID = 1260828442750;
export const TOPIC_FIELD_ID = 1260819573389;
const SUBTOPIC_ISSUE_FIELD_ID = 1900006953204;
const SUBTOPIC_REQUEST_FIELD_ID = 1260827373289;
const DETAIL_ACCOUNT_FIELD_ID = 1900005423684;
const DETAIL_PLAYBACK_FIELD_ID = 1260825910769;
const DETAIL_APP_FIELD_ID = 1260825910809;
const DETAIL_CONTENT_FIELD_ID = 1260825910829;
const DETAIL_ADS_FIELD_ID = 1260827328309;
const DETAIL_NEW_CONTENT_FIELD_ID = 1260827964230;
export const SOURCE_FIELD_ID = 20756425007259;
const DETAIL_LIVE_GAME_FIELD_ID = 33712989707547; // Superbowl, Seatiger, etc.
export const APP_VERSION_FIELD_ID = 33715446397467;
export const SOFTWARE_VERSION_FIELD_ID = 33715503096731;

export const SUB_FIELD_ID_MAP: Record<string, number> = {
  'topic-issue': SUBTOPIC_ISSUE_FIELD_ID,
  'topic-question': SUBTOPIC_ISSUE_FIELD_ID,
  'topic-feedback': SUBTOPIC_ISSUE_FIELD_ID,
  'topic-request': SUBTOPIC_REQUEST_FIELD_ID,
  'subtopic-account': DETAIL_ACCOUNT_FIELD_ID,
  'subtopic-playback': DETAIL_PLAYBACK_FIELD_ID,
  'subtopic-app': DETAIL_APP_FIELD_ID,
  'subtopic-content': DETAIL_CONTENT_FIELD_ID,
  'subtopic-ads': DETAIL_ADS_FIELD_ID,
  'subtopic-content_request': DETAIL_NEW_CONTENT_FIELD_ID,
  'subtopic-seatiger': DETAIL_LIVE_GAME_FIELD_ID,
};

export const SUBTOPICS_NEED_TITLE_FIELD = ['subtopic-playback', 'subtopic-content', 'subtopic-ads', 'subtopic-content_request'];

export const SUBTOPICS_NEED_VERSION_FIELD = ['subtopic-seatiger'];

export const COPYRIGHT_INFRINGEMENT_DETAIL_FIELD_VALUE = 'detail-copyright_infringement';

export const ANDROID_MOBILE_PLATFORM_VALUE = 'android_mobile';
export const ANDROID_TV_PLATFORM_VALUE = 'android_tv';
export const ANDROID_AUTO_PLATFORM_VALUE = 'android_auto';
export const IOS_PLATFORM_VALUE = 'ios';

export const MOBILE_METADATA_HEADERS = {
  userId: 'x-tubi-mobile-user-id',
  username: 'x-tubi-mobile-user-name',
  email: 'x-tubi-mobile-email',
  deviceId: 'x-tubi-mobile-device-id',
  platform: 'x-tubi-mobile-platform',
  platformVersion: 'x-tubi-mobile-platform-version',
  appVersion: 'x-tubi-mobile-app-version',
  deviceType: 'x-tubi-mobile-device-type',
  buildType: 'x-tubi-mobile-build-type',
};
