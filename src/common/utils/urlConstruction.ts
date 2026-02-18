import { buildQueryString, queryStringify } from '@adrise/utils/lib/queryString';
import pick from 'lodash/pick';
import type { StrictOmit } from 'ts-essentials';

import { ContentType, getContentType } from 'client/features/playback/utils/getContentType';
import { isWindowsDevice } from 'client/utils/clientTools';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  BRANCH_IO_CUSTOM_LINK_DOMAIN,
  BRANCH_IO_KEY,
  CONTAINER_TYPES,
  LINEAR_CONTENT_TYPE,
  SERIES_CONTENT_TYPE,
  VIDEO_CONTENT_TYPE,
  CONTENT_MODES,
} from 'common/constants/constants';
import { ottDeeplinkAssetType, ottDeeplinkLaunchPoint } from 'common/constants/ott-deeplink';
import { EXTERNAL_LINKS, OTT_LIVE_PLAYER_ROUTE_PREFIX, OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { getLiveUrl } from 'common/features/playback/utils/getLiveUrl';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Video, VideoType } from 'common/types/video';
import { encodeTitle } from 'common/utils/seo';
import conf from 'src/config';

const IMAGE_PREFIX = '//images.adrise.tv';
const { prodHost, imageDomains } = conf;

type GetUrlOptions = Readonly<{
  absolute?: boolean;
  host?: string;
  id: string;
  seriesId?: string;
  title?: string;
  type: VideoType;
}>;

/**
 * get series/video/episode detail page url
 * @param {object} options
 * @param {string} options.type item type, s for series, v for video/episodes
 * @param {string|number} options.id item id
 * @param {string} options.title video/series title
 * @param {number|bool} options.seriesId using it's truthy value to identify url as episode
 * @param {bool} options.absolute return absolute url with leading `http`
 * @param {host} options.host return url path with this host
 * @returns {string} encoded url
 */
export const getUrl = (options: GetUrlOptions): string => {
  const {
    absolute,
    host,
    id,
    seriesId,
    title,
    type,
  } = options;

  const isSeries = type === SERIES_CONTENT_TYPE;
  const isEpisode = !!seriesId;
  const isLiveContent = type === LINEAR_CONTENT_TYPE;

  let prefix;
  if (__ISOTT__) {
    if (isLiveContent) {
      return `${OTT_LIVE_PLAYER_ROUTE_PREFIX}/${id}`;
    }
    // not changing the ott routes as SEO is not a factor
    prefix = isSeries ? '/series' : '/video';
  } else {
    if (isSeries) { // series page urls.
      prefix = '/series';
    } else if (isEpisode) {
      prefix = '/tv-shows';
    } else if (isLiveContent) {
      prefix = WEB_ROUTES.live;
    } else {
      prefix = '/movies';
    }
  }

  let url = `${prefix}/${id}`;

  if (title) {
    url = `${url}/${encodeTitle(title)}`;
  }

  if (host) {
    url = host + url;
  } else if (absolute) {
    url = prodHost + url;
  }

  return url;
};

/**
 * same as getUrl but you can just pass the video object
 * See getUrl for full list of params supported
 * @param {object} video
 * @returns {string} encoded url
 */
export const getUrlByVideo = ({ video, ...rest }: { video: Video | ChannelEPGInfo } & StrictOmit<GetUrlOptions, 'type' | 'id' | 'title' | 'seriesId'>) => {
  const { type, id, title } = video;
  const seriesId = 'series_id' in video ? video.series_id : '';
  return getUrl({ type, id, title, seriesId, ...rest });
};

// important that trailerId be a string, and not int 0

/**
 * get episodes list url
 * @param id series id
 * @param title series title
 * @returns {*}
 */
export const getEpisodesListUrl = (id: string, title: string, ott = false): string => {
  const baseUrl = `/series/${id}/${encodeTitle(title)}/episodes`;
  if (ott) {
    return `/ott${baseUrl}`;
  }
  return baseUrl;
};

export const getContainerUrl = (id: string | number, options: Record<string, unknown> = {}): string => {
  const { type = CONTAINER_TYPES.REGULAR, ott = false } = options;
  if (type === CONTAINER_TYPES.LINEAR) {
    return ott ? OTT_ROUTES.liveMode : WEB_ROUTES.live;
  }
  let baseUrl;
  if (ott) {
    baseUrl = OTT_ROUTES.containerDetail.split(':')[0];
    return `${baseUrl}${type}/${id}`;
  }

  // WEB
  baseUrl = type === CONTAINER_TYPES.CHANNEL ? WEB_ROUTES.channel : WEB_ROUTES.container;
  return `${baseUrl}/${id}`;
};

export interface BuildDeeplinkPathParams {
  action: string;
  contentType: string;
  contentId: string;
  campaign: string;
  medium: string;
  source: string;
  deviceId?: string;
}

export const buildDeeplinkPath = ({ action, contentType, contentId, deviceId, campaign, medium, source }: BuildDeeplinkPathParams) => {
  const params: {
    contentType: string;
    contentId: string;
    utm_campaign: string;
    utm_medium: string;
    utm_source: string;
    utm_content: string;
    deviceId?: string;
  } = {
    contentType,
    contentId,
    utm_campaign: campaign,
    utm_medium: medium,
    utm_source: source,
    utm_content: contentId,
  };
  if (deviceId) {
    params.deviceId = deviceId;
  }

  const routeString = `${action}${action === 'live-news' ? `/${contentId}` : ''}`;
  const paramString = queryStringify(params);

  return `${routeString}?${paramString}`;
};

interface GetBranchIoLinkParams {
  action: string;
  contentType: string;
  contentId: string;
  deviceId?: string;
  $do_not_process?: true;
}

/**
 * Generates a branch.io deeplink suitable for redirecting the user to the Android
 * or iOS app, possibly by way of the app store for the platform.
 */
export const getBranchIoLink = (
  desktopUrl: string,
  params: GetBranchIoLinkParams
): string => {
  const deeplinkPathParams = {
    ...params,
    // Can be filtered against in branch.io dashboard; may become `campaign`
    // sent up by native ReferredEvent
    campaign: 'applink',
    // Can be filtered against in branch.io dashboard; may become `medium`
    // sent up by native ReferredEvent
    medium: 'mobile_web',
    // Can be filtered against in branch.io dashboard; may become `source`
    // sent up by native ReferredEvent. TODO: is this fbapplink value correct,
    // for mobile web referrals, or did someone just copy this from documentation?
    source: 'fbapplink',
  };

  const paramString = queryStringify({
    // This property used as a filter in Branch.io dashboard
    channel: 'mobile_web',
    // This property used as a filter in Branch.io dashboard
    feature: 'mobile_web',
    ...params,
    $desktop_url: desktopUrl,
    /**
     * branch.io by default will crawl the URL passed as the $desktop_url
     * param and construct a deeplink for the user's platform (e.g. $deeplink_path
     * or $android_deeplink_path) based on some meta tags and other information it
     * finds when crawling. This can lead to situations in which incorrect information
     * is embedded in the deeplink-- such as the device ID the crawler encounters
     * on the page being embedded as a query param in the deeplink rather than the
     * user's actual device ID passed in to `getBranchIoLink`.
     *
     * So, the strategy here is this: to get around the mechanism by which branch.io
     * crawls to determine deeplink URLs, we hardcode the URLs here based on available
     * info about the content. This overrides whatever gets crawled by branch.io.
     */
    $android_deeplink_path: buildDeeplinkPath(deeplinkPathParams),
    $deeplink_path: buildDeeplinkPath(deeplinkPathParams),
  });
  return `http://${BRANCH_IO_CUSTOM_LINK_DOMAIN}/a/${BRANCH_IO_KEY}?${paramString}`;
};

// copied from getBranchIoLink, todo remove after sealion.
export const getSealionBranchIoLink = (
  desktopUrl: string,
  params: GetBranchIoLinkParams
): string => {
  const analyticsIdentifier = 'sealion_landing_page';
  const deeplinkPathParams = {
    ...params,
    campaign: analyticsIdentifier,
    source: analyticsIdentifier,
    medium: analyticsIdentifier,
  };

  const paramString = queryStringify({
    channel: 'mobile_web',
    feature: analyticsIdentifier,
    ...params,
    $desktop_url: desktopUrl,
    $android_deeplink_path: buildDeeplinkPath(deeplinkPathParams),
    $deeplink_path: buildDeeplinkPath(deeplinkPathParams),
  });

  return `http://${BRANCH_IO_CUSTOM_LINK_DOMAIN}/sealion?${paramString}`;
};

export function getActionAndContentTypeForVideo(content: Video | ChannelEPGInfo): { action: string; contentType: string } {
  const contentTypeEnum = getContentType(content);

  let action = '';
  let contentType = '';

  switch (contentTypeEnum) {
    case ContentType.LINEAR:
      action = 'live-news';
      contentType = 'linear';
      break;
    case ContentType.EPISODE:
    case ContentType.SERIES:
      action = 'media-details';
      contentType = 'series';
      break;
    default:
      action = 'media-details';
      contentType = 'movie';
  }

  return { action, contentType };
}

/**
 * returns a URL string for universal/DeepLink using Branch
 * @param content {object} as provided by uapi. can be series or video.
 * @param deviceId {string} device id
 */
export function getDeepLinkForVideo(content: Video | ChannelEPGInfo, deviceId?: string, options: { stopTracking?: boolean } = {}): string {
  const seriesId = 'series_id' in content ? content.series_id : '';
  const { action, contentType } = getActionAndContentTypeForVideo(content);

  const params: GetBranchIoLinkParams = {
    // contentType can be movie or series
    contentType,
    // contentId is either movie ID or series ID
    contentId: seriesId || content.id,
    action,
  };

  if (options.stopTracking) {
    // Prevent click tracking and storage of link analytics
    // https://help.branch.io/using-branch/docs/creating-a-deep-link#content
    params.$do_not_process = true;
  }

  if (deviceId) {
    params.deviceId = deviceId;
  }

  // todo: remove __PRODUCTION__ flag after testing
  if ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && 'player_type' in content && content.player_type === 'fox') {
    return getSealionBranchIoLink(getUrlByVideo({ video: content, absolute: true }), params);
  }
  return getBranchIoLink(getUrlByVideo({ video: content, absolute: true }), params);
}

/**
 * returns a URL string for Android Watch action link
 * @param video - object as provided by uapi.
 */
export function androidDeepLinkVideoPlayBack(video: Video): string {
  return `android-app://com.tubitv/media-playback?contentId=${video.id}&contentType=video&campaign=watchAction&utm_campaign=watchAction&utm_source=androidPlayGuide&utm_medium=web&utm_content=content`;
}

/**
 * get hash code of string, borrow from Java
 * @link http://stackoverflow.com/a/7616484/1131882
 * @param {string} str
 * @returns {number}
 */
export const hashCode = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0, len = str.length; i < len; i++) {
    /* eslint-disable no-bitwise */
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
    /* eslint-enable no-bitwise */
  }
  return hash;
};

/**
 * hash image url with different cdn domains
 * @param {string} url
 * @returns {string}
 */
export const hashImageDomain = (url: string): string => {
  if (!url) return url;
  if (!url?.startsWith(IMAGE_PREFIX)) return url;

  const hashedDomain = imageDomains[Math.abs(hashCode(url)) % imageDomains.length];
  return `${hashedDomain}${url.slice(IMAGE_PREFIX.length)}`;
};

/**
 * @param contentId
 * @param assetType
 * @param launchPoint
 * @returns {string} - get a base url (playback / series page) from which to append deeplink params
 */
export const buildDeeplinkBaseUrl = (contentId: string, assetType?: string, launchPoint?: ottDeeplinkLaunchPoint): string => {
  const isSeriesId = contentId[0] === '0';
  let baseUrl;
  if (assetType === ottDeeplinkAssetType.Linear) {
    baseUrl = __OTTPLATFORM__ === 'COMCAST' ? getLiveUrl(contentId) : '';
  } else if (isSeriesId) {
    baseUrl = getUrl({ id: contentId.slice(1), type: SERIES_CONTENT_TYPE });
  } else if (__OTTPLATFORM__ === 'TIZEN' || launchPoint === ottDeeplinkLaunchPoint.Detail) {
    // Because of Samsung parental controls requirement, no one should be able to watch R content without checking their age.
    // We need to do that check on title details.
    baseUrl = getUrl({ id: contentId, type: VIDEO_CONTENT_TYPE });
  } else {
    baseUrl = `${getPlayerUrl(contentId)}`;
  }
  return baseUrl;
};

/**
 * Get the CDN resource url if needed
 * @param {string} srcUrl resource url
 * @returns {string} - transformed remote resource url
 */
export const getResourceUrl = (srcUrl: string) => {
  if (!__CDN_HOST__ || !srcUrl?.startsWith('/dist/')) return srcUrl;

  // `/dist/blabla.js` => cdnPrefix + '/blabla.js'
  return `//${__CDN_HOST__}${srcUrl.substring(5)}`;
};

/**
 * getContainerIdForNextAPI to provide the containerId in the right format
 * @param  {[type]} containerContext (string)
 * @return {[type]}            (string)
 */
export const getContainerIdForNextAPI = (containerContext: string): string => {
  let containerIdForNextAPI = containerContext;
  // subcontainer uses format parent/sub/child
  if (containerContext && containerContext.indexOf(':') >= 0) {
    const [parentId, childId] = containerContext.split(':');
    containerIdForNextAPI = `${parentId}/sub/${childId}`;
  }
  return containerIdForNextAPI;
};

export function getContentModeParams(contentMode: CONTENT_MODE_VALUE): { contentMode?: CONTENT_MODE_VALUE } {
  // the browse while watching content mode we use is not a real content mode
  // that the backend knows about, so in this case we just do not pass a content mode
  // parameter
  if (contentMode === 'browseWhileWatching') return { };
  return contentMode === 'all' ? {} : { contentMode };
}

export function getHomeURIForContentMode(contentMode: CONTENT_MODE_VALUE): string | null {
  switch (contentMode) {
    case CONTENT_MODES.all:
      return OTT_ROUTES.home;
    case CONTENT_MODES.movie:
      return OTT_ROUTES.movieMode;
    case CONTENT_MODES.linear:
      return OTT_ROUTES.liveMode;
    case CONTENT_MODES.tv:
      return OTT_ROUTES.tvMode;
    case CONTENT_MODES.espanol:
      return OTT_ROUTES.espanolMode;
    case CONTENT_MODES.myStuff:
      return OTT_ROUTES.myStuff;
    default:
      return null;
  }
}

const ALLOWED_LOGIN_REDIRECT_PARAMS = ['action', 'contentId'];

const getLoginRedirectQueryString = (query: Record<string, unknown>) => {
  const filteredParams = pick(query, ALLOWED_LOGIN_REDIRECT_PARAMS);
  const queryString = buildQueryString(filteredParams);
  return encodeURIComponent(queryString);
};

export const getLoginRedirect = (pathname: string = WEB_ROUTES.landing, query: Record<string, unknown> = {}) =>
  pathname === WEB_ROUTES.landing || pathname === WEB_ROUTES.home || pathname.includes(WEB_ROUTES.reset)
    ? ''
    : `?redirect=${pathname}${getLoginRedirectQueryString(query)}`;

export const getMicrosoftAppStoreUrl = (campaignId: string) => {
  const url = isWindowsDevice() ? EXTERNAL_LINKS.appMicrosoftNative : EXTERNAL_LINKS.appMicrosoftBrowser;
  return url.replace('$campaignId', campaignId);
};

export const getBase64ImageUrl = (base64Image: string) => {
  return `data:image;base64,${base64Image}`;
};
