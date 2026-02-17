import { parseQueryString, getQueryStringFromUrl } from '@adrise/utils/lib/queryString';

import { RESUME_TIME_QUERY } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import {
  FIRETV_NATIVE_SEARCH_PARAM,
  FIRETV_CATEGORY_ID_PARAM_NAME,
  FIRETV_CONTENT_ID_PARAM_NAME,
  FIRETV_CONTENT_TYPE_PARAM_NAME,
  FIRETV_CONTENT_TYPE_VALUE_SERIES,
  FIRETV_DEEPLINK_PREFIX,
  FIRETV_DEEPLINK_TUBI_HOST_PATH,
  FIRETV_DIAL_ALLOW_SIGN_IN,
  FIRETV_DIAL_CONTENT_ID,
  FIRETV_DIAL_DETAILS_PAGE,
  FIRETV_DIAL_DEVICE_ID,
  FIRETV_DIAL_DEVICE_TYPE,
  FIRETV_DIAL_IS_LIVE,
  FIRETV_DIAL_PARAM,
  FIRETV_DIAL_REFRESH_TOKEN,
  FIRETV_DIAL_RESUME_TIME,
  FIRETV_DIAL_USER_ID,
  FIRETV_FROM_NATIVE_URL_PARAM,
  FIRETV_FROM_DEVICE_ID_PARAM_NAME,
  FIRETV_FROM_PLATFORM_PARAM_NAME,
  FIRETV_LEGACY_VALID_PATH_MAP,
  FIRETV_LINK_ACTION_PARAM_NAME,
  FIRETV_LINK_ACTION_VIEW,
  FIRETV_PATH_URL_PARAM,
  FIRETV_REFRESH_TOKEN_PARAM_NAME,
  FIRETV_RESUME_TIME_PARAM_NAME,
  FIRETV_SEARCH_UTM_CAMPAIGN,
  FIRETV_SEARCH_UTM_MEDIUM,
  FIRETV_SEARCH_UTM_SOURCE,
  FIRETV_SOURCE_LAUNCHER,
  FIRETV_USER_ID_PARAM_NAME,
  UTM_MEDIUM,
  UTM_SOURCE,
  FIRETV_DIAL_MEDIA_TYPE,
  FIRETV_DIAL_MEDIA_TYPE_LINEAR_VALUE,
  FIRETV_NATIVE_DISCOVERY_TYPE,
} from 'common/features/ottDeeplink/constants';
import { extractUtmParams, buildVideoPlaybackDeeplinkUrl, buildSearchDeeplinkUrl, buildSeriesDetailDeeplinkUrl, buildLivePlaybackDeeplinkUrl, buildHomeDeeplinkUrl, buildContentModeDeeplinkUrl, buildRegularContainerDetailsDeeplinkUrl, isValidOTTRoute, buildVideoDetailDeeplinkUrl, stripStartingAndEndingCharacter } from 'common/features/ottDeeplink/utils/ottDeeplink';
import logger from 'common/helpers/logging';
import type { RouteFn } from 'common/helpers/routing';
import { isSeriesId, trimSeriesId } from 'common/utils/dataFormatter';
import { trackLogging } from 'common/utils/track';
import { trimStartSlash } from 'common/utils/urlManipulation';

export const getContentIdFromUrlPath = (urlPath: string, stringMatch: string) => {
  const urlStr = urlPath.split('?')[0];
  const contentStr = urlStr.split(`${stringMatch}/`)[1];
  return contentStr ? contentStr.split('/')[0] : '';
};

// nativeDeeplinkStringValue value example: tubi_id="590004";contentDiscoveryType=browse
// launching from FireOS will pass data like the example above (search, Dial casting etc)
// tubi_id will be either a movie ID or episode ID
export const parseNativeLaunchDeeplinkString = (nativeDeeplinkStringValue: string) => {
  return nativeDeeplinkStringValue.split(';').reduce((nativeObj, nativeStr) => {
    const [key, value = ''] = nativeStr.split('=');
    nativeObj[key] = stripStartingAndEndingCharacter(value, '"');
    return nativeObj;
  }, {} as Record<string, string | undefined>);
};

/**
 * handle firetv deeplinks, previously this mapping/routing was done on the firetv/android native side
 * native deeplink logic is here: https://github.com/adRise/adrise_android2/blob/26ee3a5acdf80f7f19fbf3770d9e3317116269d9/library/core/src/main/java/com/tubitv/core/deeplink/DeepLinkRepository.kt#L4
 */
export const handleFireTvDeeplinks = ({
  urlPathParamValue,
  urlParamsObj,
  utmParamsObj,
}: {
  urlPathParamValue: string;
  urlParamsObj: Record<string, string>;
  utmParamsObj: object;
}) => {
  let redirectUrl: string | null = '';

  switch (true) {
    /**
     * if contentType is 'series', redirect to the series page
     * else redirect to the video player page
     * media-playback/video/{videoId}?contentType={contentType}&utm_source={utm_source}&utm_campaign={utm_campaign}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['media-playback/video']): {
      const videoId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP['media-playback/video']);
      if (videoId) {
        if (urlParamsObj[FIRETV_CONTENT_TYPE_PARAM_NAME] === FIRETV_CONTENT_TYPE_VALUE_SERIES) {
          redirectUrl = buildSeriesDetailDeeplinkUrl(videoId, utmParamsObj);
        } else {
          redirectUrl = buildVideoPlaybackDeeplinkUrl(videoId, utmParamsObj);
        }
      }
      break;
    }
    /**
     * if contentType is 'series', redirect to the series page
     * else redirect to the video player page
     * media-playback?contentId={contentId}&contentType={contentType}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['media-playback']): {
      if (urlParamsObj[FIRETV_CONTENT_ID_PARAM_NAME]) {
        const contentId = urlParamsObj[FIRETV_CONTENT_ID_PARAM_NAME];
        if (urlParamsObj[FIRETV_CONTENT_TYPE_PARAM_NAME] === FIRETV_CONTENT_TYPE_VALUE_SERIES) {
          redirectUrl = buildSeriesDetailDeeplinkUrl(contentId, utmParamsObj);
        } else {
          redirectUrl = buildVideoPlaybackDeeplinkUrl(contentId, utmParamsObj);
        }
      }
      break;
    }
    /**
     * if contentType is 'series', redirect to the series page
     * else redirect to the video detail page
     * media-details?contentId={contentId}&contentType={contentType}&isComingSoon={isComingSoon}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&channel={channel}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['media-details']): {
      if (urlParamsObj[FIRETV_CONTENT_ID_PARAM_NAME]) {
        const contentId = urlParamsObj[FIRETV_CONTENT_ID_PARAM_NAME];
        if (urlParamsObj[FIRETV_CONTENT_TYPE_PARAM_NAME] === FIRETV_CONTENT_TYPE_VALUE_SERIES) {
          redirectUrl = buildSeriesDetailDeeplinkUrl(contentId, utmParamsObj);
        } else {
          redirectUrl = buildVideoDetailDeeplinkUrl(contentId, utmParamsObj);
        }
      }
      break;
    }
    /**
     * redirect to container details page
     * media-browse?categoryId={categoryId}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&channel={channel}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['media-browse']): {
      if (urlParamsObj[FIRETV_CATEGORY_ID_PARAM_NAME]) {
        redirectUrl = buildRegularContainerDetailsDeeplinkUrl(urlParamsObj[FIRETV_CATEGORY_ID_PARAM_NAME], utmParamsObj);
      }
      break;
    }
    /**
     * if link-action is `view` redirect to series/video details page
     * else redirect to the video player page with resume_time if it exists
     * video/{videoId}?isComingSoon={isComingSoon}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&resume_time={resume_time}&link-action={link-action}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.video): {
      const videoId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.video);
      if (videoId) {
        if (urlParamsObj[FIRETV_LINK_ACTION_PARAM_NAME] === FIRETV_LINK_ACTION_VIEW) {
          if (isSeriesId(videoId)) {
            redirectUrl = buildSeriesDetailDeeplinkUrl(trimSeriesId(videoId), utmParamsObj);
          } else {
            redirectUrl = buildVideoDetailDeeplinkUrl(videoId, utmParamsObj);
          }
        } else {
          const params = { ...utmParamsObj };
          if (urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME] && Number(urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME]) > 0) {
            params[RESUME_TIME_QUERY] = urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME];
          }
          redirectUrl = buildVideoPlaybackDeeplinkUrl(videoId, params);
        }
      }
      break;
    }
    /**
     * if link-action is `view` redirect to video details page
     * else redirect to the video player page
     * movies/{movieId}?action={action}&isComingSoon={isComingSoon}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&link-action={link-action}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.movies): {
      const videoId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.movies);
      if (videoId) {
        if (urlParamsObj[FIRETV_LINK_ACTION_PARAM_NAME] === FIRETV_LINK_ACTION_VIEW) {
          redirectUrl = buildVideoDetailDeeplinkUrl(videoId, utmParamsObj);
        } else {
          redirectUrl = buildVideoPlaybackDeeplinkUrl(videoId, utmParamsObj);
        }
      }
      break;
    }
    /**
     * redirect to video player page
     * tv-shows/{episodeId}/{episodeName}?isComingSoon={isComingSoon}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&link-action={link-action}&resume_time={resume_time}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['tv-shows']): {
      const videoId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP['tv-shows']);
      if (videoId) {
        const params = { ...utmParamsObj };
        if (urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME] && Number(urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME]) > 0) {
          params[RESUME_TIME_QUERY] = urlParamsObj[FIRETV_RESUME_TIME_PARAM_NAME];
        }
        redirectUrl = buildVideoPlaybackDeeplinkUrl(videoId, params);
      }
      break;
    }
    /**
     * redirect to series detail page
     * series/{seriesId}?action={action}&isComingSoon={isComingSoon}&utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&link-action={link-action}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.series): {
      const seriesId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.series);
      if (seriesId) {
        redirectUrl = buildSeriesDetailDeeplinkUrl(seriesId, utmParamsObj);
      }
      break;
    }
    /**
     * redirect to live player
     * live-news/{channelId}?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&channel={channel}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['live-news']): {
      const channelId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP['live-news']);
      if (channelId) {
        redirectUrl = buildLivePlaybackDeeplinkUrl(channelId, utmParamsObj);
      }
      break;
    }
    /**
     * redirect to live player
     * live/{channelId}?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}&channel={channel}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.live): {
      const channelId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.live);
      if (channelId) {
        redirectUrl = buildLivePlaybackDeeplinkUrl(channelId, utmParamsObj);
      }
      break;
    }
    /**
     * redirect to search
     * search/{searchText}?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.search): {
      let searchText = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.search);
      if (searchText) {
        // process person search text e.g. person-tom-hanks -> Tom Hanks
        if (searchText.startsWith('person-')) {
          const [_personText, ...personArr] = searchText.split('-');
          searchText = personArr.map((person) => {
            return person.charAt(0).toUpperCase() + person.slice(1);
          }).join(' ');
        }
        redirectUrl = buildSearchDeeplinkUrl(searchText, utmParamsObj);
      }
      break;
    }
    /**
     * redirect to home
     * home?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.home): {
      // native is adding an extra param `page=home`
      // https://github.com/adRise/adrise_android2/blob/28b3caed5d8101b365471f4e1430a4a23ccba2e6/library/core/src/main/java/com/tubitv/core/deeplink/DeepLinkConsts.kt#L124
      redirectUrl = buildHomeDeeplinkUrl({ ...utmParamsObj, page: 'home' });
      break;
    }
    /**
     * redirect to the content mode page
     * mode/{contentMode}?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP.mode): {
      const contentMode = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP.mode);
      if (contentMode) {
        redirectUrl = buildContentModeDeeplinkUrl(contentMode, utmParamsObj);
      }
      break;
    }
    /**
     * redirect to the container details page
     * container/regular/{containerId}?utm_campaign={utm_campaign}&utm_source={utm_source}&utm_medium={utm_medium}&utm_content={utm_content}
     */
    case urlPathParamValue.startsWith(FIRETV_LEGACY_VALID_PATH_MAP['container/regular']): {
      const containerId = getContentIdFromUrlPath(urlPathParamValue, FIRETV_LEGACY_VALID_PATH_MAP['container/regular']);
      if (containerId) {
        redirectUrl = buildRegularContainerDetailsDeeplinkUrl(containerId, utmParamsObj);
      }
      break;
    }
    default:
  }
  return redirectUrl;
};

export const generateFireTvDeeplinkUrl = (query: Record<string, any>) => {
  try {
    let deeplinkUrl: string | null = '';

    // pathQuery will be passed from Native -> Web for deeplinks that contain a URL path (launching from braze/campaigns, linear)
    const pathQuery = query[FIRETV_PATH_URL_PARAM];
    // nativeDeeplinkQuery will be passed from Native -> Web for deeplinks that contain a data map structure (launching from search, pmr)
    const nativeDeeplinkQuery = query[FIRETV_FROM_NATIVE_URL_PARAM];

    if (pathQuery) {
      // TODO @cbengtson TEMP LOGGING FOR unknown utm_source
      /* istanbul ignore next */
      if (typeof pathQuery === 'string' && pathQuery.toLowerCase().includes('unknown')) {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'deeplink_err_unknown',
          message: {
            errorMessage: 'unknown utm source in pathQuery',
            query,
          },
        });
      }
      // example path query value
      // //media-playback/video/690128?contentType=movie&utm_source=source
      // //tubitv.com/media-playback/video/690128?contentType=movie&utm_source=source
      let urlPathParamValue = decodeURIComponent(pathQuery);
      if (urlPathParamValue.startsWith('//')) {
        urlPathParamValue = urlPathParamValue.slice(2);
        if (urlPathParamValue.startsWith(FIRETV_DEEPLINK_TUBI_HOST_PATH)) {
          urlPathParamValue = urlPathParamValue.slice(FIRETV_DEEPLINK_TUBI_HOST_PATH.length);
        }
      } else {
        urlPathParamValue = trimStartSlash(decodeURIComponent(pathQuery));
      }
      const urlParamsObj = parseQueryString(getQueryStringFromUrl(urlPathParamValue)) as Record<string, string>;
      const utmParamsObj = extractUtmParams(urlParamsObj);

      /**
       * handle the new firetv deeplink format
       * example of a new firetv deeplink:
       * https://tubitv.com/deeplink/ott/player/100002007?utm_campaign=amazon-general
       * native side will generate and load the webview with the below URL
       * https://ott-firetv-hyb.tubitv.com/deeplink?path=deeplink/ott/player/678482?utm_campaign=amazon-general
       */
      if (urlPathParamValue.startsWith(FIRETV_DEEPLINK_PREFIX)) {
        const basePath = urlPathParamValue.split('?')[0].replace(FIRETV_DEEPLINK_PREFIX, '');
        if (isValidOTTRoute(basePath)) {
          deeplinkUrl = urlPathParamValue.replace(FIRETV_DEEPLINK_PREFIX, '');
        } else {
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'deeplink_err_invalid',
            message: {
              errorMessage: 'invalid route',
              query,
            },
          });
        }

      // handle firetv deeplinks
      } else {
        deeplinkUrl = handleFireTvDeeplinks({
          urlPathParamValue,
          urlParamsObj,
          utmParamsObj,
        });
      }

      // if UTM params are missing from the deeplink, log to periscope
      if (!utmParamsObj || Object.keys(utmParamsObj).length < 1) {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'deeplink_err_utm',
          message: {
            errorMessage: 'missing utm params',
            query,
          },
        });
      }
    /**
     * handle android native launch deeplinks
     * deeplinks from search, DIAL (firetv cast) will not have traditional deeplink urls
     * these deeplinks will pass data to the native app in an object which the native app will pass along the flattened object to web
     * https://github.com/adRise/adrise_android2/blob/607dab6ef785ed724a33603ce29977094a807c7f/library/core/src/main/java/com/tubitv/core/deeplink/DeepLinkHandler.kt#L16
     */
    } else if (nativeDeeplinkQuery) {
      const urlNativeParamValue = trimStartSlash(decodeURIComponent(nativeDeeplinkQuery));
      const nativeParamsObj = parseNativeLaunchDeeplinkString(urlNativeParamValue);
      // deeplink from search, recommended movies & tv, firetv home titles
      // https://github.com/adRise/adrise_android2/blob/607dab6ef785ed724a33603ce29977094a807c7f/library/core/src/main/java/com/tubitv/core/deeplink/DeepLinkHandler.kt#L69C50-L69C83
      if (nativeParamsObj[FIRETV_NATIVE_SEARCH_PARAM]) {
        const utmObject = {
          utm_campaign: FIRETV_SEARCH_UTM_CAMPAIGN,
          utm_source: nativeParamsObj[FIRETV_NATIVE_DISCOVERY_TYPE] || FIRETV_SEARCH_UTM_SOURCE,
          utm_medium: FIRETV_SEARCH_UTM_MEDIUM,
        };

        // TODO @cbengtson TEMP LOGGING FOR unknown utm_source
        /* istanbul ignore next */
        if (utmObject.utm_source.toLowerCase() === 'unknown') {
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'deeplink_err_unknown',
            message: {
              errorMessage: 'unknown utm source in nativeParams',
              query,
            },
          });
        }

        const contentId = nativeParamsObj[FIRETV_NATIVE_SEARCH_PARAM] as string;
        // redirect to series page if contentId starts with 0, else redirect to the video player page
        if (isSeriesId(contentId)) {
          deeplinkUrl = buildSeriesDetailDeeplinkUrl(trimSeriesId(contentId), utmObject);
        } else {
          deeplinkUrl = buildVideoPlaybackDeeplinkUrl(contentId, utmObject);
        }
      }

      // handle DIAL deeplinks (firetv casting from mobile app to firetv device)
      // https://github.com/adRise/adrise_android2/blob/607dab6ef785ed724a33603ce29977094a807c7f/library/tv/src/main/java/com/tubitv/tv/deeplink/TVDeepLinkParser.kt#L92
      const dialParam = nativeParamsObj[FIRETV_DIAL_PARAM];
      if (dialParam) {
        // the FIRETV_DIAL_PARAM param value will be a JSON string
        const dialParamValueJSONString = dialParam;
        try {
          const dialParamValuesObj = JSON.parse(dialParamValueJSONString);
          const contentId = dialParamValuesObj[FIRETV_DIAL_CONTENT_ID] as string;
          const addSignInParams = (urlParamsObject: Record<string, any>) => {
            urlParamsObject[FIRETV_REFRESH_TOKEN_PARAM_NAME] = dialParamValuesObj[FIRETV_DIAL_REFRESH_TOKEN] || '';
            urlParamsObject[FIRETV_USER_ID_PARAM_NAME] = dialParamValuesObj[FIRETV_DIAL_USER_ID] || '';
            urlParamsObject[FIRETV_FROM_DEVICE_ID_PARAM_NAME] = dialParamValuesObj[FIRETV_DIAL_DEVICE_ID] || '';
            urlParamsObject[FIRETV_FROM_PLATFORM_PARAM_NAME] = dialParamValuesObj[FIRETV_DIAL_DEVICE_TYPE] || '';
            urlParamsObject[FIRETV_DIAL_ALLOW_SIGN_IN] = dialParamValuesObj[FIRETV_DIAL_ALLOW_SIGN_IN] || '';
          };
          if (contentId) {
            // if DIAL deeplink is from a video details page
            if (dialParamValuesObj[FIRETV_DIAL_DETAILS_PAGE] === true || dialParamValuesObj[FIRETV_DIAL_DETAILS_PAGE] === 'true') {
              const urlParams = {
                [UTM_SOURCE]: FIRETV_SOURCE_LAUNCHER,
                [UTM_MEDIUM]: dialParamValuesObj[FIRETV_DIAL_DEVICE_TYPE],
                deeplink: true,
              };
              addSignInParams(urlParams);
              if (isSeriesId(contentId)) {
                deeplinkUrl = buildSeriesDetailDeeplinkUrl(trimSeriesId(contentId), urlParams);
              } else {
                deeplinkUrl = buildVideoDetailDeeplinkUrl(contentId, urlParams);
              }
            // if DIAL deeplink is from a linear channel
            } else if (dialParamValuesObj[FIRETV_DIAL_IS_LIVE] === true || dialParamValuesObj[FIRETV_DIAL_IS_LIVE] === 'true' || dialParamValuesObj[FIRETV_DIAL_MEDIA_TYPE] === FIRETV_DIAL_MEDIA_TYPE_LINEAR_VALUE) {
              const urlParams = {
                [UTM_SOURCE]: FIRETV_SOURCE_LAUNCHER,
                [UTM_MEDIUM]: dialParamValuesObj[FIRETV_DIAL_DEVICE_TYPE],
              };
              addSignInParams(urlParams);
              deeplinkUrl = buildLivePlaybackDeeplinkUrl(contentId, urlParams);
            // if DIAL deeplink is from video playback
            } else {
              const urlParams = {
                [UTM_SOURCE]: FIRETV_SOURCE_LAUNCHER,
                [UTM_MEDIUM]: dialParamValuesObj[FIRETV_DIAL_DEVICE_TYPE],
              };
              addSignInParams(urlParams);
              if (dialParamValuesObj[FIRETV_DIAL_RESUME_TIME] && Number(dialParamValuesObj[FIRETV_DIAL_RESUME_TIME]) > 0) {
                urlParams[RESUME_TIME_QUERY] = dialParamValuesObj[FIRETV_DIAL_RESUME_TIME];
              }

              deeplinkUrl = buildVideoPlaybackDeeplinkUrl(contentId, urlParams);
            }
          }
        } catch (error) {
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'deeplink_err_dial',
            message: {
              errorMessage: 'error parsing dial param',
              query,
            },
          });
        }
      }
    }

    if (!deeplinkUrl) {
      trackLogging({
        type: 'CLIENT:INFO',
        level: 'info',
        subtype: 'deeplink_err_nomatch',
        message: {
          errorMessage: 'error no deeplink pattern match',
          query,
        },
      });
      deeplinkUrl = OTT_ROUTES.home;
    }
    return deeplinkUrl;
  } catch (error) {
    logger.error(error, 'FIRETV_HYB DEEPLINK ERROR');
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'deeplink_err_gen',
      message: {
        errorMessage: error.message,
        query,
      },
    });
    return OTT_ROUTES.home;
  }
};

// Router hook that handles deeplinks from FIRETV in legacy and new formats
export const handleFireTvDeeplinkHook: RouteFn = (_store, nextState, replace) => {
  const { location: { query } } = nextState;
  replace(generateFireTvDeeplinkUrl(query));
};

