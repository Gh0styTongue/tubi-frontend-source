import { createDescriptors } from '@tubitv/refetch';
import type { FetchAction } from '@tubitv/refetch/lib/types';
import union from 'lodash/union';

import * as actions from 'common/constants/action-types';
import type { LiveContentMode } from 'common/constants/constants';
import {
  FAVORITE_LINEAR_CHANNEL_CONTAINER_ID,
  RECOMMENDED_LINEAR_CONTAINER_ID,
  LIVE_CONTENT_MODES,
  LINEAR_CONTENT_TYPE,
} from 'common/constants/constants';
import { addStreamUrl, resetPriorityMap } from 'common/features/playback/utils/streamUrlPriority';
import type { ChannelEPGInfo, EPGAction, EPGContainer, EPGItemFromResponse, EPGState } from 'common/types/epg';
import { removePrefixOfVideoResource } from 'common/utils/transformContent';

export const favoritedContainer: EPGContainer = {
  container_slug: FAVORITE_LINEAR_CHANNEL_CONTAINER_ID,
  contents: [],
  name: 'Favorites',
};

export const recommendedContainer: EPGContainer = {
  container_slug: RECOMMENDED_LINEAR_CONTAINER_ID,
  contents: [],
  name: 'Recommended',
};

const PRIORITY_CONTAINER_IDS = [FAVORITE_LINEAR_CHANNEL_CONTAINER_ID, RECOMMENDED_LINEAR_CONTAINER_ID];

export const initialState: EPGState = {
  containerIdsLoaded: {
    [LIVE_CONTENT_MODES.all]: false,
    [LIVE_CONTENT_MODES.news]: false,
    [LIVE_CONTENT_MODES.sports]: false,
  },
  containerIdsLoading: {
    [LIVE_CONTENT_MODES.all]: false,
    [LIVE_CONTENT_MODES.news]: false,
    [LIVE_CONTENT_MODES.sports]: false,
  },
  contentIdsByContainer: {
    [LIVE_CONTENT_MODES.all]: [favoritedContainer, recommendedContainer],
    [LIVE_CONTENT_MODES.news]: [favoritedContainer, recommendedContainer],
    [LIVE_CONTENT_MODES.sports]: [favoritedContainer, recommendedContainer],
  },
  programsLoading: false,
  favoritedIdsLoaded: false,
  byId: {},
  fireTvLiveTabChannelIds: [],
};

const transformEPGItem = (item: EPGItemFromResponse, action: FetchAction, fallbackValidDuration?: number): ChannelEPGInfo => ({
  id: String(item.content_id),
  type: LINEAR_CONTENT_TYPE,
  backgrounds: item.images?.background || '',
  posterarts: item.images?.poster || '',
  thumbnails: item.images?.thumbnail || '',
  ...item,
  ...createDescriptors(action, item.valid_duration || fallbackValidDuration),
  lang: item.lang?.[0] || '',
});

const epgReducer = (state: EPGState = initialState, action?: EPGAction) => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_FIRETV_LIVE_TAB_CHANNEL_IDS.SUCCESS: {
      return {
        ...state,
        fireTvLiveTabChannelIds: action.payload.fireTvLiveTabChannelIds || [],
      };
    }
    case actions.LOAD_EPG_CONTAINERS_IDS.FETCH: {
      return {
        ...state,
        containerIdsLoading: {
          ...state.containerIdsLoading,
          [action.mode!]: true,
        },
      };
    }
    case actions.LOAD_EPG_CONTAINERS_IDS.SUCCESS: {
      const priorityContainers = PRIORITY_CONTAINER_IDS.map(id => state.contentIdsByContainer[action.mode!].find(item => item.container_slug === id));
      return {
        ...state,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [action.mode!]: [...priorityContainers, ...action.payload.containers.map((item: EPGContainer) => ({
            ...item,
            contents: item.contents.map((id) => String(id)),
          }))],
        },
        containerIdsLoading: {
          ...state.containerIdsLoading,
          [action.mode!]: false,
        },
        containerIdsLoaded: {
          ...state.containerIdsLoaded,
          [action.mode!]: true,
        },
      };
    }
    case actions.LOAD_EPG_CONTAINERS_IDS.FAILURE: {
      return {
        ...state,
        containerIdsLoading: {
          ...state.containerIdsLoading,
          [action.mode!]: false,
        },
        containerIdsLoaded: {
          ...state.containerIdsLoaded,
          [action.mode!]: false,
        },
      };
    }
    case actions.LOAD_EPG_PROGRAMS.FETCH: {
      return {
        ...state,
        programsLoading: true,
      };
    }
    case actions.LOAD_EPG_PROGRAMS.SUCCESS: {
      const data = action.payload;
      const epgInfo: { [key: string]: ChannelEPGInfo} = {};
      data.rows.forEach((item: EPGItemFromResponse) => {
        removePrefixOfVideoResource(item);
        epgInfo[item.content_id] = transformEPGItem(item, action, data.valid_duration);
        item.video_resources?.forEach(res => {
          const streamUrl = res.manifest.url;
          addStreamUrl(streamUrl, { incStreamPriority: !!action.force });
        });
      });
      return {
        ...state,
        byId: {
          ...state.byId,
          ...epgInfo,
        },
        programsLoading: false,
      };
    }
    case actions.LOAD_EPG_PROGRAMS.FAILURE: {
      return {
        ...state,
        programsLoading: false,
      };
    }
    case actions.BATCH_ADD_CHANNELS: {
      const data = action.payload;
      const epgInfo: { [key: string]: ChannelEPGInfo} = {};
      data.forEach((item: EPGItemFromResponse) => {
        removePrefixOfVideoResource(item);
        epgInfo[item.content_id] = transformEPGItem(item, action);
      });
      return {
        ...state,
        byId: {
          ...state.byId,
          ...epgInfo,
        },
      };
    }
    case actions.RESET_EPG: {
      resetPriorityMap();
      return initialState;
    }
    case actions.ADD_FAVORITE_CHANNEL.SUCCESS: {
      const { contentIds, mode } = action.payload;
      const favoritedContainer = state.contentIdsByContainer[mode as LiveContentMode].find(item => item.container_slug === FAVORITE_LINEAR_CHANNEL_CONTAINER_ID);
      const newFavoritedContainer = {
        ...favoritedContainer,
        contents: union([...contentIds, ...favoritedContainer!.contents]),
      };
      return {
        ...state,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [mode!]: [newFavoritedContainer, ...state.contentIdsByContainer[mode as LiveContentMode].filter(item => item.container_slug !== FAVORITE_LINEAR_CHANNEL_CONTAINER_ID)],
        },
      };
    }
    case actions.BATCH_ADD_FAVORITE_CHANNEL: {
      const { contentIds, mode } = action.payload;
      const favoritedContainer = state.contentIdsByContainer[mode as LiveContentMode].find(item => item.container_slug === FAVORITE_LINEAR_CHANNEL_CONTAINER_ID);
      const newFavoritedContainer = {
        ...favoritedContainer,
        contents: union([...contentIds, ...favoritedContainer!.contents]),
      };
      return {
        ...state,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [mode!]: [newFavoritedContainer, ...state.contentIdsByContainer[mode as LiveContentMode].filter(item => item.container_slug !== FAVORITE_LINEAR_CHANNEL_CONTAINER_ID)],
        },
      };
    }
    case actions.REMOVE_FAVORITE_CHANNEL.SUCCESS: {
      const { contentIds, mode } = action.payload;
      const favoritedContainer = state.contentIdsByContainer[mode as LiveContentMode].find(item => item.container_slug === FAVORITE_LINEAR_CHANNEL_CONTAINER_ID);
      const newFavoritedContainer = {
        ...favoritedContainer,
        contents: favoritedContainer!.contents.filter(item => !contentIds.includes(item)),
      };
      return {
        ...state,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [mode!]: [newFavoritedContainer, ...state.contentIdsByContainer[mode as LiveContentMode].filter(item => item.container_slug !== FAVORITE_LINEAR_CHANNEL_CONTAINER_ID)],
        },
      };
    }
    case actions.LOAD_FAVORITE_CHANNEL_IDS.SUCCESS: {
      const { payload, mode } = action;
      if (!payload) {
        return state;
      }
      const { data } = payload;
      const favoritedContainer = state.contentIdsByContainer[mode!].find(item => item.container_slug === FAVORITE_LINEAR_CHANNEL_CONTAINER_ID);
      const newFavoritedContainer = {
        ...favoritedContainer,
        contents: data,
      };
      return {
        ...state,
        favoritedIdsLoaded: true,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [mode!]: [newFavoritedContainer, ...state.contentIdsByContainer[mode as LiveContentMode].filter(item => item.container_slug !== FAVORITE_LINEAR_CHANNEL_CONTAINER_ID)],
        },
      };
    }
    case actions.SET_RECOMMENDED_CHANNEL_IDS: {
      const { payload, mode } = action;
      if (!payload) {
        return state;
      }
      const [favoritedContainer, recommendedContainer, ...otherContainers] = state.contentIdsByContainer[mode as LiveContentMode];
      const newRecommendedContainer = {
        ...recommendedContainer,
        contents: payload,
      };
      return {
        ...state,
        contentIdsByContainer: {
          ...state.contentIdsByContainer,
          [mode!]: [favoritedContainer, newRecommendedContainer, ...otherContainers],
        },
      };
    }
    default: {
      return state;
    }
  }
};

export default epgReducer;
