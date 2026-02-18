import { trimQueryString } from '@adrise/utils/lib/url';
import type { LocationDescriptor } from 'history';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES } from 'common/constants/constants';
import { OTT_ROUTES, WEB_ROUTES, TRANSITION_PAGE_NAMES } from 'common/constants/routes';
import { matchesRoute } from 'common/utils/urlPredicates';

export const getWebContentModeFromPath = (pathname: string = '') => {
  pathname = trimQueryString(pathname);
  let contentMode: CONTENT_MODE_VALUE = CONTENT_MODES.all;
  if (pathname === WEB_ROUTES.movies) {
    contentMode = CONTENT_MODES.movie;
  } else if (pathname === WEB_ROUTES.tvShows) {
    contentMode = CONTENT_MODES.tv;
  }
  return contentMode;
};

export const getOttContentModeFromPath = (pathname: string = '') => {
  pathname = trimQueryString(pathname);
  let contentMode: CONTENT_MODE_VALUE = CONTENT_MODES.all;
  if (pathname === OTT_ROUTES.movieMode) {
    contentMode = CONTENT_MODES.movie;
  } else if (pathname === OTT_ROUTES.tvMode) {
    contentMode = CONTENT_MODES.tv;
  } else if (pathname === OTT_ROUTES.liveMode) {
    contentMode = CONTENT_MODES.linear;
  } else if (pathname === OTT_ROUTES.myStuff) {
    contentMode = CONTENT_MODES.myStuff;
  } else if (pathname === OTT_ROUTES.espanolMode) {
    contentMode = CONTENT_MODES.espanol;
  } else if (matchesRoute(OTT_ROUTES.player, pathname)) {
    contentMode = CONTENT_MODES.browseWhileWatching;
  }
  return contentMode;
};

export const getContentModeFromPath = (pathname: string) =>
  __ISOTT__
    ? getOttContentModeFromPath(pathname)
    : getWebContentModeFromPath(pathname);

export const getPathnameFromLocationDescriptor = (route: LocationDescriptor) => {
  return typeof route === 'string' ? route : (route.pathname ?? '');
};

const { HOME, VIDEO, SERIES, MODE_MOVIE, MODE_TV, MODE_LIVE, EPISODES_LIST, PLAYBACK, LIVE_PLAYBACK, SEARCH, ACTIVATE, CATEGORIES, CONTAINER_REGULAR, NETWORKS, ESPANOL } = TRANSITION_PAGE_NAMES;

export const getPageNameForTracking = (path: string) => {
  let pageName;
  if (path === '/' || path === WEB_ROUTES.home) {
    pageName = HOME;
  } else if (path.startsWith('/video/')) {
    pageName = VIDEO;
  } else if (path.startsWith('/series/')) {
    pageName = SERIES;
  } else if (path.startsWith('/ott/series/') || path.startsWith('/tv-shows/')) {
    pageName = EPISODES_LIST;
  } else if (path.startsWith('/ott/androidplayer/') || path.startsWith('/ott/player/')) {
    pageName = PLAYBACK;
  } else if (path.startsWith('/ott/live')) {
    pageName = LIVE_PLAYBACK;
  } else if (path.startsWith('/search')) {
    pageName = SEARCH;
  } else if (path.startsWith('/activate')) {
    pageName = ACTIVATE;
  } else if (path.startsWith('/containers/regular')) {
    pageName = CATEGORIES;
  } else if (path.startsWith('/containers/channel')) {
    pageName = NETWORKS;
  } else if (path.startsWith('/mode/espanol')) {
    pageName = ESPANOL;
  } else if (path.startsWith('/mode/movie')) {
    pageName = MODE_MOVIE;
  } else if (path.startsWith('/mode/tv')) {
    pageName = MODE_TV;
  } else if (path.startsWith('/mode/live')) {
    pageName = MODE_LIVE;
  } else if (path.startsWith('/container/regular')) {
    pageName = CONTAINER_REGULAR;
  }

  return pageName;
};
