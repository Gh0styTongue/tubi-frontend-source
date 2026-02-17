import { isCacheValid } from '@tubitv/refetch';
import type { Location } from 'history';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import { loadContainer } from 'common/actions/container';
import { fetchEpg, fetchEpgLiveProgramming, fetchEpgProgramming } from 'common/api/epg';
import {
  ADD_FAVORITE_CHANNEL,
  BATCH_ADD_CHANNELS,
  LOAD_EPG_CONTAINERS_IDS,
  LOAD_EPG_PROGRAMS,
  LOAD_FAVORITE_CHANNEL_IDS,
  LOAD_FIRETV_LIVE_TAB_CHANNEL_IDS,
  REMOVE_FAVORITE_CHANNEL,
  RESET_EPG, SET_RECOMMENDED_CHANNEL_IDS,
} from 'common/constants/action-types';
import type { LiveContentMode } from 'common/constants/constants';
import {
  LIVE_CONTENT_MODES,
  RECOMMEND_CHANNEL_MAX_COUNT,
  RECOMMENDED_LINEAR_CONTAINER_ID,
} from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { recommendedLinearContainerIdSelector } from 'common/selectors/container';
import { countryCodeSelector } from 'common/selectors/ui';
import type { EPGActionRF, EPGItemFromResponse } from 'common/types/epg';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';

type EPGThunk = TubiThunkAction<EPGActionRF>;

export const loadFireTvLiveTabChannelIds = (): EPGThunk => (
  dispatch,
  getState,
) => {
  const state = getState();
  const {
    epg: { fireTvLiveTabChannelIds },
  } = state;
  if (fireTvLiveTabChannelIds.length) {
    return Promise.resolve();
  }
  return dispatch({
    type: LOAD_FIRETV_LIVE_TAB_CHANNEL_IDS,
    payload: () => dispatch(fetchEpgLiveProgramming()),
  });
};

export const loadEPGContentIds = (mode: LiveContentMode): EPGThunk => (
  dispatch,
  getState,
) => {
  const state = getState();
  const {
    epg: { containerIdsLoaded, containerIdsLoading },
  } = state;
  if (containerIdsLoaded[mode] || containerIdsLoading[mode]) {
    return Promise.resolve();
  }
  return dispatch({
    type: LOAD_EPG_CONTAINERS_IDS,
    mode,
    payload: () =>
      dispatch(fetchEpg(mode)),
  });
};

export const loadFavoritedChannelIds = (mode: LiveContentMode): EPGThunk => (
  dispatch,
  getState,
  client
) => {
  const state = getState();
  const isLoggedIn = isLoggedInSelector(state);
  const {
    epg: { favoritedIdsLoaded },
  } = state;
  if (favoritedIdsLoaded || !isLoggedIn) {
    return Promise.resolve();
  }
  return dispatch({
    type: LOAD_FAVORITE_CHANNEL_IDS,
    mode,
    payload: () => client.get('/oz/user/preferences/rate', {
      params: {
        type: 'liked',
        target: 'linear',
      },
    }),
  });
};

export const loadRecommendedChannelIds = (location: Location, mode: LiveContentMode): EPGThunk => async (dispatch, getState) => {
  const state = getState();

  if (!isFeatureAvailableInCountry('recommendedChannelsInEPG', countryCodeSelector(state))) {
    return Promise.resolve();
  }

  const loaded = !!state.epg.contentIdsByContainer[mode].find(container => container.container_slug === RECOMMENDED_LINEAR_CONTAINER_ID)?.contents.length;
  if (loaded) {
    return Promise.resolve();
  }

  let channelIds: string[] = recommendedLinearContainerIdSelector(state);
  if (!channelIds.length) {
    try {
      await dispatch(loadContainer({
        location,
        id: RECOMMENDED_LINEAR_CONTAINER_ID,
        contentMode: 'all', // Only `all` mode have linear recommended channel container
      }));
      channelIds = recommendedLinearContainerIdSelector(getState());
    } catch (e) {
      logger.error(e, 'failed to load recommended channels');
      return;
    }
  }
  channelIds = channelIds.slice(0, RECOMMEND_CHANNEL_MAX_COUNT);

  return dispatch({
    mode,
    type: SET_RECOMMENDED_CHANNEL_IDS,
    payload: channelIds,
  });
};

interface Options {
  force?: boolean;
}

export const loadEPGInfoByContentIds = (contentIds: string[], options?: Options): EPGThunk => async (
  dispatch,
  getState
) => {
  const {
    epg: { programsLoading, byId },
  } = getState();
  if (programsLoading) {
    return Promise.resolve();
  }

  const idsNeedLoad = options?.force ? contentIds : contentIds.filter(id => {
    if (byId[id]?.ttl) {
      return !isCacheValid(byId[id].ttl!);
    }
    return true;
  });
  if (!idsNeedLoad.length) {
    return Promise.resolve();
  }
  const uniqueIds = idsNeedLoad.filter((value, index, array) => array.indexOf(value) === index);

  const videoResourceParams = await getVideoResourceQueryParameters();
  const limitResolutions = videoResourceParams.limit_resolutions;
  return dispatch({
    type: LOAD_EPG_PROGRAMS,
    payload: () =>
      dispatch(
        fetchEpgProgramming({
          contentIds: uniqueIds,
          lookahead: 1,
          limitResolutions,
        })
      ),
    force: !!options?.force,
  });
};

export const refetchEPGData = (location: Location, contentIds: string[]): EPGThunk => async (dispatch, getState) => {
  const { ottUI: { epg: { topNav: { activeContentMode } } } } = getState();
  dispatch({
    type: RESET_EPG,
  });
  const promises = [
    dispatch(loadFavoritedChannelIds(activeContentMode)),
    dispatch(loadRecommendedChannelIds(location, activeContentMode)),
  ];
  await Promise.all(promises);
  await dispatch(loadEPGContentIds(activeContentMode));
  await dispatch(loadEPGInfoByContentIds(contentIds));
};

const createToggleFavoriteChannelAction = (
  client: ApiClient,
  contentIds: string[],
  action: 'like' | 'remove-like',
  mode: string,
) => ({
  type: action === 'like' ? ADD_FAVORITE_CHANNEL : REMOVE_FAVORITE_CHANNEL,
  payload: () => client
    .patch('/oz/user/preferences/rate', {
      data: {
        target: 'linear',
        action,
        data: contentIds,
      },
    })
    .then(() => ({ contentIds, mode }))
    .catch((err) => {
      logger.error(err, `failed to add favorited channel ${contentIds}`);
      return Promise.reject(err);
    }),
});

export const addFavoriteChannel = (contentId: string, mode: LiveContentMode = LIVE_CONTENT_MODES.all): EPGThunk =>
  async (dispatch, _getState, client) => {
    await dispatch(createToggleFavoriteChannelAction(client, [contentId], 'like', mode));
  };

export const batchFavoriteChannel = (contentIds: string[], mode: LiveContentMode = LIVE_CONTENT_MODES.all): EPGThunk =>
  async (dispatch, _getState, client) => {
    await dispatch(createToggleFavoriteChannelAction(client, contentIds, 'like', mode));
  };

export const removeFavoriteChannel = (contentId: string, mode: LiveContentMode = LIVE_CONTENT_MODES.all): EPGThunk =>
  async (dispatch, _getState, client) => {
    await dispatch(createToggleFavoriteChannelAction(client, [contentId], 'remove-like', mode));
  };

export const batchAddChannels = (items: EPGItemFromResponse) => ({
  type: BATCH_ADD_CHANNELS,
  payload: items,
});

