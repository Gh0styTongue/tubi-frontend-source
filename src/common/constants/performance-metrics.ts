export const PAGE_TRANSITION_METRIC = 'pageTransition';
export const PLAYER_INIT_TO_FIRST_FRAME = 'initToFirstFrame';
export const SCROLL_TO_CONTAINER_DELAY_METRIC = 'scrollToContainerUIDelay';
export const SCROLL_TO_CONTAINER_DETAILS_METRIC = 'scrollToContainerUIDetails';
export const SCROLL_IN_CONTAINER_ROW_DELAY_METRIC = 'scrollInContainerRowUIDelay';
export const SCROLL_IN_CONTAINER_DETAILS_METRIC = 'scrollInContainerRowUIDetails';
export const SCROLL_DELAY_SHOULD_COLLECT_TIMES = 5;

export const TRANSITION_PAGE_NAMES = {
  HOME: 'home',
  VIDEO: 'video',
  SERIES: 'series',
  EPISODES_LIST: 'episodesList',
  PLAYBACK: 'playback',
  SEARCH: 'search',
  ACTIVATE: 'activate',
  CATEGORIES: 'categories',
  NETWORKS: 'networks',
  ESPANOL: 'espanol',
};

export const SERVER_RENDER_METRICS = {
  FETCH_ALL_DATA: 'fetchAllData',
  FETCH_USER_AGE: 'fetchUserAge',
  RENDER_CONTENT: 'renderContent',
  REQUESTS_BEFORE_ROUTE: 'requestsBeforeRoute',
};

export const PATH_WHITELIST = [
  '/',
  '/ott/player/:id',
  '/home',
  '/movies/:id(/:title)',
  '/series/:id(/:title)',
  '/tv-shows/:id(/:title)',
];

interface WhitelistConfig {
  regex: RegExp;
  reportedUrl: string;
}
export const REQ_WHITELIST_CONFIGS: WhitelistConfig[] = [
  {
    regex: new RegExp('^/oz/videos/(0[^/]+)/content$'),
    reportedUrl: '/oz/videos/:seriesId/content',
  },
];

/**
 * These are intended to be passed as Datadog tags to allow for separating
 * out performance metrics coming from browse while watching vs. the home screen.
 */
export const BROWSE_WHILE_WATCHING_DD_TAG = { page: '/player' };
