import type { QueryStringParams } from '@adrise/utils/lib/queryString';
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES, SERIES_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import { getLiveUrl } from 'common/features/playback/utils/getLiveUrl';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import { getHomeURIForContentMode, getUrl } from 'common/utils/urlConstruction';
import { matchesRoute } from 'common/utils/urlPredicates';

export const stripStartingAndEndingCharacter = (stringVal: string, charToRemove: string) => {
  if (stringVal.startsWith(charToRemove) && stringVal.endsWith(charToRemove)) {
    return stringVal.slice(1, -1);
  }
  return stringVal;
};

export const extractUtmParams = (urlParamsObj: QueryStringParams<unknown>) => {
  return Object.keys(urlParamsObj).reduce<Record<string, unknown>>((utmParams, paramName) => {
    if (paramName.startsWith('utm_')) {
      utmParams[paramName] = urlParamsObj[paramName];
    }
    return utmParams;
  }, {});
};

export const buildVideoPlaybackDeeplinkUrl = (contentId: string, urlParams?: Record<string, any>) => {
  const playerUrl = getPlayerUrl(contentId);
  if (urlParams) {
    return addQueryStringToUrl(playerUrl, urlParams);
  }
  return playerUrl;
};

export const buildLivePlaybackDeeplinkUrl = (channelId: string, urlParams?: Record<string, any>) => {
  const playerUrl = getLiveUrl(channelId);
  if (urlParams) {
    return addQueryStringToUrl(playerUrl, urlParams);
  }
  return playerUrl;
};

export const buildHomeDeeplinkUrl = (urlParams?: Record<string, any>) => {
  const homeUrl = OTT_ROUTES.home;
  if (urlParams) {
    return addQueryStringToUrl(homeUrl, urlParams);
  }
  return homeUrl;
};

export const buildContentModeDeeplinkUrl = (mode: string, urlParams?: Record<string, any>) => {
  let contentMode = mode;

  // remap legacy news content mode to linear
  if (mode === 'news') {
    contentMode = CONTENT_MODES.linear as string;
  }
  const contentModeUrl = getHomeURIForContentMode(contentMode as CONTENT_MODE_VALUE);
  if (contentModeUrl && urlParams) {
    return addQueryStringToUrl(contentModeUrl, urlParams);
  }
  return contentModeUrl;
};

// build deeplink url to regular type containers (not networks) /category/regular/{containerId}
export const buildRegularContainerDetailsDeeplinkUrl = (containerId: string, urlParams?: Record<string, any>) => {
  const containerUrl = `/container/regular/${containerId}`;
  if (urlParams) {
    return addQueryStringToUrl(containerUrl, urlParams);
  }
  return containerUrl;
};

export const buildNetworkDeeplinkUrl = (networkId: string, urlParams?: Record<string, any>) => {
  const networkUrl = `/container/channel/${networkId}`;
  if (urlParams) {
    return addQueryStringToUrl(networkUrl, urlParams);
  }
  return networkUrl;
};

export const buildSearchDeeplinkUrl = (searchString: string, urlParams?: Record<string, any>) => {
  const searchUrl = `${OTT_ROUTES.search}?q=${encodeURIComponent(searchString)}`;
  if (urlParams) {
    return addQueryStringToUrl(searchUrl, urlParams);
  }
  return searchUrl;
};

export const buildVideoDetailDeeplinkUrl = (contentId: string, urlParams?: Record<string, any>) => {
  const videoDetailUrl = getUrl({
    id: contentId,
    type: VIDEO_CONTENT_TYPE,
  });
  if (urlParams) {
    return addQueryStringToUrl(videoDetailUrl, urlParams);
  }
  return videoDetailUrl;
};

export const buildSeriesDetailDeeplinkUrl = (seriesId: string, urlParams?: Record<string, any>) => {
  const seriesDetailUrl = getUrl({
    id: seriesId,
    type: SERIES_CONTENT_TYPE,
  });
  if (urlParams) {
    return addQueryStringToUrl(seriesDetailUrl, urlParams);
  }
  return seriesDetailUrl;
};

// @param path must be the url base path (no query string)
export const isValidOTTRoute = (path: string) => {
  let isValidRoute = false;
  for (const [_route, routePath] of Object.entries(OTT_ROUTES)) {
    if (matchesRoute(routePath, path)) {
      isValidRoute = true;
      break;
    }
  }
  return isValidRoute;
};
