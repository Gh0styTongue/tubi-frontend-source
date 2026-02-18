import type { Location } from 'history';
import { defineMessages } from 'react-intl';

import systemApi from 'client/systemApi';
import { loadContainer } from 'common/actions/container';
import { CLEAR_TIZEN_DEEPLINK_PAGE, SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import { BACK_FROM_LIVE_PLAYBACK_TO_HOME, BACK_FROM_PLAYBACK_TO_DETAIL, RECOMMENDED_LINEAR_CONTAINER_ID, CONTENT_MODES } from 'common/constants/constants';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { OTT_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { type PreviewTile, type PreviewData, type CWHistory, DeeplinkContentType } from 'common/types/tizen';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { getContentIdFromHistoryItem, getRecentHistory } from 'common/utils/history';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { buildPreviewTiles } from 'common/utils/tizen';
import { trackLogging } from 'common/utils/track';
import { getIntl } from 'i18n/intl';
import { SAMSUNG_PMR_CW_SOURCE, SAMSUNG_PMR_DEFAULT_SOURCE, TIZEN_REFERRED_CW_EXTRA_CTX as CW_CTX, SAMSUNG_PMR_LIVE_SOURCE } from 'ott/constants/tizen';

export type SamsungCWItem = {
  app_icon: string;
  app_id: string;
  app_name: string;
  content_id: string;
  content_title: string;
  description: string;
  duration: number; // total time
  expiry?: number;
  field: string;
  genre: string;
  image_url: string;
  payload: string;
  playback: number; // played time
  rate: string;
  release: number;
  sub_title?: string;
  timestamp: number;
};

const messages = defineMessages({
  defaultTitle: {
    description: 'the title of the default section',
    defaultMessage: 'Popular on Tubi',
  },
  cwTitle: {
    description: 'the title of the continue watching section',
    defaultMessage: 'Continue Watching',
  },
  liveTvTitle: {
    description: 'the title of the live tv section',
    defaultMessage: 'Live TV',
  },
});

export const getCwTilesFromHistory = async (
  location: Location,
  getState: () => StoreState,
  dispatch: TubiThunkDispatch,
): Promise<PreviewTile[]> => {
  const { auth, history: { contentIdMap }, video } = getState();
  let byId = video.byId;
  if (!auth.user) return [];

  const historyContents = getRecentHistory({ historyDataMap: contentIdMap });
  if (historyContents.length === 0) return [];

  const cwHistories: CWHistory[] = historyContents.slice(0, 1).map((historyItem) => ({
    contentId: getContentIdFromHistoryItem(historyItem),
    position: historyItem.position,
  }));

  const isVideosLoaded = cwHistories.every(({ contentId }) => byId[contentId]);
  // in some scenarios the content details might have not been loaded, so we need to load the CW container to build the tiles
  if (!isVideosLoaded) {
    await dispatch(loadContainer({ location, id: 'continue_watching' }));
    byId = getState().video.byId;
  }

  return buildPreviewTiles(cwHistories, byId, { source: SAMSUNG_PMR_CW_SOURCE });
};

export const getLiveNewsTiles = async (location: Location, getState: () => StoreState, dispatch: TubiThunkDispatch): Promise<PreviewTile[]> => {
  let state = getState();

  const { userSettings: { parentalRating }, ui: { isKidsModeEnabled } } = state;
  // logic copied from src/common/actions/container.js
  const isKidsMode = isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;
  if (isKidsMode) {
    return [];
  }

  // context here: https://tubi.slack.com/archives/C07JU4PU3RS/p1733972096412379
  if (!state.remoteConfig.isRecommendedChannelsEnabledInCountry) {
    return [];
  }

  const containerId = RECOMMENDED_LINEAR_CONTAINER_ID;
  let liveNewsList = state.container.containerChildrenIdMap[containerId];
  if (!liveNewsList || liveNewsList.length === 0) {
    await dispatch(loadContainer({ location, id: containerId, contentMode: CONTENT_MODES.all }));
    state = getState();
    liveNewsList = state.container.containerChildrenIdMap[containerId] || [];
  }
  const historyItems: CWHistory[] = liveNewsList.slice(0, 2).map(contentId => ({ contentId }));
  const usePoster = true;
  return buildPreviewTiles(historyItems, state.video.byId, { source: SAMSUNG_PMR_LIVE_SOURCE, content_type: DeeplinkContentType.LINEAR }, usePoster);
};

export const getTilesFromPmr = (getState: () => StoreState): PreviewTile[] => {
  const { pmr: { contentIds, contentIdMap } } = getState();
  const cwHistories: CWHistory[] = contentIds.map(contentId => ({ contentId }));
  const usePoster = true;
  return buildPreviewTiles(cwHistories, contentIdMap, { source: SAMSUNG_PMR_DEFAULT_SOURCE }, usePoster);
};

// generate the preview data from redux store
// the structure and parameters defined in https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/preview-api.html
export async function getPreviewData(location: Location, getState: () => StoreState, dispatch: TubiThunkDispatch): Promise<PreviewData> {
  const state = getState();
  const { ui: { userLanguageLocale } } = state;
  const intl = getIntl(userLanguageLocale);

  // currently we don't use poster images for the CW title as it is more important
  const cwTiles = await getCwTilesFromHistory(location, getState, dispatch);
  const liveNewsTiles = await getLiveNewsTiles(location, getState, dispatch);
  const previewSections = [{
    title: intl.formatMessage(messages.cwTitle),
    tiles: cwTiles,
  }, {
    title: intl.formatMessage(messages.liveTvTitle),
    tiles: liveNewsTiles,
  }, {
    title: intl.formatMessage(messages.defaultTitle),
    // dedupe the continue watching contents
    tiles: getTilesFromPmr(getState).filter(tile => !cwTiles.map(tile => tile.content_id).includes(tile.content_id)),
  }]
    // sections are shown in ascending position order
    .map((section, index) => ({ ...section, position: index }));

  return { sections: previewSections };
}

const CW_APP_ID = '3201504001965';
const CW_APP_NAME = 'Tubi TV';
const CW_BASIC_HEADERS = {
  field: '0', // data field, must be '0' for continue watching
  app_id: CW_APP_ID, // Tubi app id
  app_icon: 'https://mcdn.tubitv.com/tubitv-assets/img/new_brand_logo_square_small.png',
};

type Overrides = {
  contentId: string,
  duration: number,
  imageUrl: string,
  position: number,
  title: string,
  updatedAt: string,
};
export const constructContinueWatchingItem = (
  video: Video, overrides: Overrides
): SamsungCWItem => {
  const { tags, ratings = [], year } = video;
  const { contentId, duration, imageUrl, position, title, updatedAt } = overrides;
  const timestamp = Math.floor((new Date(updatedAt)).getTime() / 1000) - 1; // Minus 1 to make sure it won't be larger than the system time in Samsung TV.

  const payloadString = `content_id=${contentId}, source=${CW_CTX.source}, medium=${CW_CTX.medium}, campaign=${CW_CTX.campaign}, content_type=${CW_CTX.content_type}`;
  const continueWatchingItem: SamsungCWItem = {
    ...CW_BASIC_HEADERS,
    app_name: CW_APP_NAME, // Tubi app name
    content_id: contentId,
    payload: `{"contentId":"${payloadString}","cwPosition":${position}}`,
    content_title: title,
    description: '', // TODO(yuhao): There is a bug that causes some titles can't be added due to their description, leave this empty for now.
    image_url: imageUrl,
    rate: ratings[0]?.code,
    genre: (tags || [])[0] || '',
    release: year,
    duration, // total time
    playback: position, // played time
    timestamp, // last watched time
  };

  if (video.availability_ends) {
    continueWatchingItem.expiry = Math.floor(new Date(video.availability_ends).getTime() / 1000);
  }

  return continueWatchingItem;
};

export const goToTizenDeeplinkPage = ({
  deeplinkPage,
  dispatch,
  isAppControl,
}: {
  deeplinkPage?: string,
  dispatch: TubiThunkDispatch,
  isAppControl?: boolean,
}) => {
  if (!deeplinkPage) return;

  // Detect if the startpoint is playback page, if so, we need to set back override to handle the back event
  if (deeplinkPage.startsWith(OTT_ROUTES.player.split(':')[0])) {
    dispatch(actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_PLAYBACK_TO_DETAIL]: true } }));
  } else if (deeplinkPage.startsWith(OTT_ROUTES.livePlayer.split(':')[0])) {
    dispatch(actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_LIVE_PLAYBACK_TO_HOME]: true } }));
  }

  const packageVersion = systemApi.getNativeAppVersion?.();
  if (!isAppControl) {
    tubiHistory.push(deeplinkPage);
  } else {
    tubiHistory.push(deeplinkPage);
  }

  dispatch(actionWrapper(CLEAR_TIZEN_DEEPLINK_PAGE));

  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.DEEPLINK,
    message: {
      path: deeplinkPage,
      packageVersion,
    },
  });
};

export const trackLoggingForPmr = (message: string, payload?: Record<string, unknown>) => {
  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: 'samsungPMR',
    message: {
      message,
      ...payload,
    },
  });
};
