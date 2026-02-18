import type { ValueOf } from 'ts-essentials';

import { PageType } from 'client/systemApi/types';
import { DEEPLINK_KIDSMODE_IDENTIFIER } from 'common/constants/constants';
import { OTT_ROUTES, OTT_PLAYER_ROUTES, WEB_ROUTES } from 'common/constants/routes';

export const isOTTPlaybackUrl = (url: string): boolean => {
  const playbackUrls = ['ott/androidplayer', 'ott/player/'];
  return playbackUrls.some(playerUrl => url.indexOf(playerUrl) >= 0);
};

export const isOTTLiveNewsUrl = (url: string): boolean => {
  const liveNewsRegex = /^\/ott\/live\/[^/]+/;
  return liveNewsRegex.test(url);
};

export const isOTTOnboardingUrl = (url: string): boolean => {
  const onboardingRegex = /^\/onboarding\/[^/]+/;
  return onboardingRegex.test(url);
};

/**
 * Check if the URL is a details page URL
 * @param {*} url
 */
export const isDetailsPageUrl = (url: string): boolean => {
  const detailsPageRegex = /^\/(video|series)\/[^/]+/;
  return detailsPageRegex.test(url);
};

export const isWebDetailsPageUrl = (url: string): boolean => {
  const detailsPageRegex = /^\/(movies|tv-shows|series)\/[^/]+/;
  return detailsPageRegex.test(url);
};

export const isSeriesRelatedPageUrl = (url: string): boolean => {
  if (__WEBPLATFORM__) {
    // These web route constants don't currently contain parameter specifiers and to add them
    // would break and change too much other code, so I'm just using simplistic matching for now
    // instead of using `matchesRoute()`.
    return url.startsWith(WEB_ROUTES.series) || url.startsWith(WEB_ROUTES.tvShows);
  }
  return matchesRoute(OTT_ROUTES.series, url) || matchesRoute(OTT_ROUTES.episodeList, url);
};

export const isWebHomeRelatedPages = (pathname: string) =>
  [WEB_ROUTES.home, WEB_ROUTES.tvShows, WEB_ROUTES.movies].some((route) => matchesRoute(route, pathname));

export const isWebContentGridPages = (pathname: string) =>
  isWebHomeRelatedPages(pathname) ||
  [
    WEB_ROUTES.categoryIdTitle,
    WEB_ROUTES.channelId,
    WEB_ROUTES.myStuff,
    WEB_ROUTES.searchKeywords,
    WEB_ROUTES.person,
  ].some(route => matchesRoute(route, pathname));

/**
 * Check if the URL is a home page URL
 * @param {*} url
 */
export const isHomeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.split('?')[0] === '/';
};

/**
 * Identify if the given query params contains
 * utm_campaign equal to the kidsmode identifier.
 * This is used when we want to deeplink into kids mode.
 * @param {} query
 */
export function isKidsModeDeeplinkURL(query?: { utm_campaign?: string }): boolean {
  const utmCampaign = query?.utm_campaign;
  if (!utmCampaign) return false;

  return utmCampaign === DEEPLINK_KIDSMODE_IDENTIFIER;
}

export type RouteTemplateKey = keyof typeof WEB_ROUTES | keyof typeof OTT_ROUTES;
export type RouteTemplate = ValueOf<typeof WEB_ROUTES> | ValueOf<typeof OTT_ROUTES> | `/(:locale/)${ValueOf<typeof WEB_ROUTES>}`;

// caching the route regex objects so they don't need to be recreated each time if matchesRoute() gets called often
const routeRegexMap: { [key in RouteTemplate]?: RegExp } = {};
export function getRouteRegExp(route: RouteTemplate): RegExp {
  const existing = routeRegexMap[route];
  if (existing) return existing!;
  const routeRegexPattern = route
    .replace(')', ')?')
    .replace(/:\w+/g, '([\\w-]+)');
  const routeRegex = new RegExp(`^${routeRegexPattern}$`);
  routeRegexMap[route] = routeRegex;
  return routeRegex;
}

export const matchesRoute = (
  route: RouteTemplate,
  pathname: string
): boolean => {
  return getRouteRegExp(route).test(pathname);
};

export const isOTTPlayerUrl = (url: string) => {
  return OTT_PLAYER_ROUTES.some(route => matchesRoute(route, url));
};

export const isRouteMayNavigateFromEspanolMode = (url: string) =>
  [
    OTT_ROUTES.containerDetail,
    OTT_ROUTES.episodeList,
    OTT_ROUTES.series,
    OTT_ROUTES.video,
    OTT_ROUTES.player,
    OTT_ROUTES.androidPlayer,
    OTT_ROUTES.trailer,
  ].some(route => matchesRoute(route, url));

/**
 * Used for Android TV video preload feature
 * We treat all pages other than player page and episode page as home page
 * @param url string
 * @returns PLAYER_PAGE | ALL_EPISODES_PAGE | HOME_PAGE
 */
export const getPageTypeFromUrl = (url: string) => {
  if (isOTTPlayerUrl(url)) {
    return PageType.playerPage;
  }
  if (matchesRoute(OTT_ROUTES.episodeList, url)) {
    return PageType.allEpisodePage;
  }
  return PageType.homePage;
};

/**
 * Get content ID from the detail page URL
 * @param {*} url
 */
export const getContentIdFromDetailsPageUrl = (url: string): string => {
  const matchedObj = url.match(/^\/(video|series)\/([^/]+)/);
  if (!matchedObj) return '';
  const isSeries = matchedObj[1] === 'series';
  const contentId = isSeries ? `0${matchedObj[2]}` : matchedObj[2];
  return contentId;
};

export const ONBOARDING_REGEX = /^\/onboarding\/?(\d)?($|\?\w+)/;

export const getOnboardingStepNumber = (url: string) => {
  const match = ONBOARDING_REGEX.exec(url);
  return Number(match?.[1] || '');
};
