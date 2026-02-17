import { createDescriptors, getTTL } from '@tubitv/refetch';
import { combineReducers } from 'redux';

import { addStreamUrl } from 'common/features/playback/utils/streamUrlPriority';
import type {
  LoadSeriesEpisodesMetadataSuccessAction,
  BatchAddVideosAction,
  LoadAutoPlayContentsAction,
  LoadByIdFailAction,
  LoadByIdFetchAction,
  LoadByIdSuccessAction,
  LoadContentAction,
  LoadContentThumbnailSpritesAction,
  LoadRelatedContentsAction,
  RemoveResumePositionAction,
  SetResumePositionAction,
  VideoState,
  ResetLoadAutoPlayContentsAction,
  LoadAutoPlayContentsSuccessAction,
  LoadAutoPlayContentsFailAction,
} from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';

import {
  LOAD_CONTENT_RF,
  BATCH_ADD_VIDEOS_AND_REMOVE_OLD,
  BATCH_ADD_VIDEOS,
  LOAD_RELATED_CONTENTS_SUCCESS,
  SET_RESUME_POSITION,
  REMOVE_RESUME_POSITION,
  LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS,
  LOAD_AUTOPLAY_CONTENTS,
  LOAD_AUTOPLAY_CONTENTS_SUCCESS,
  LOAD_AUTOPLAY_CONTENTS_FAIL,
  LOAD_SERIES_EPISODES_METADATA_SUCCESS,
  RESET_AUTOPLAY_CONTENTS,
} from '../constants/action-types';

const actions = {
  LOAD_CONTENT_RF,
  BATCH_ADD_VIDEOS_AND_REMOVE_OLD,
  BATCH_ADD_VIDEOS,
  LOAD_RELATED_CONTENTS_SUCCESS,
  SET_RESUME_POSITION,
  REMOVE_RESUME_POSITION,
  LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS,
  LOAD_AUTOPLAY_CONTENTS,
  LOAD_AUTOPLAY_CONTENTS_SUCCESS,
  LOAD_AUTOPLAY_CONTENTS_FAIL,
  RESET_AUTOPLAY_CONTENTS,
  LOAD_SERIES_EPISODES_METADATA_SUCCESS,
};

/**
 * video detail map. This store is where we store the contents detail.
 * ttl: content cache ttl. This ttl could be affected by load content action or other routes which will return full
 * content information
 * @param state
 * @param action
 */
export function byId(state: VideoState['byId'] = {}, action: LoadContentAction): VideoState['byId'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_CONTENT_RF.SUCCESS:
      // todo(zhuo): current version of typescript does not support analysis for destructured discriminated unions
      // So we have to use the following ugly way(type assertion) to get the correct action type(action as LoadByIdSuccessAction)
      // we can remove following type assertion after we upgrade to typescript 4.6
      // @see https://devblogs.microsoft.com/typescript/announcing-typescript-4-6/#control-flow-analysis-for-destructured-discriminated-unions
      const loadSuccessAction = action as LoadByIdSuccessAction;
      // Only reuse the existing seasons in the store if this is a paginated result
      // (only true for series and only when in an Episode Pagination experiment).
      // Otherwise, use the seasons from the payload of the action (the ones returned from the API call).
      // If we were to use the seasons from paginated responses, we would overwrite the complete season list
      // with the partial seasons returned.
      const seasons = (loadSuccessAction.payload.isPaginatedResult
        ? state[loadSuccessAction.id]?.seasons
        : null) ?? loadSuccessAction.payload.result.seasons;
      const existingMetadataLoadedFlag = state[loadSuccessAction.id]?.isMetadataLoaded;
      // If num_seasons was prefetch, preserve the value
      const num_seasons = state[loadSuccessAction.id]?.num_seasons;
      return {
        ...state,
        [loadSuccessAction.id]: {
          ...loadSuccessAction.payload.result,
          isMetadataLoaded: existingMetadataLoadedFlag,
          seasons,
          num_seasons,
          ttl: !isNaN(loadSuccessAction.payload.validDuration)
            ? getTTL(loadSuccessAction.payload.validDuration)
            : 0,
        },
      };
    case actions.LOAD_SERIES_EPISODES_METADATA_SUCCESS:
      const metadataAction = action as LoadSeriesEpisodesMetadataSuccessAction;
      const contentId = convertSeriesIdToContentId(metadataAction.id);
      return {
        ...state,
        [contentId]: {
          ...state[contentId],
          seasons: metadataAction.seasons,
          isMetadataLoaded: true,
        },
      };
    case actions.BATCH_ADD_VIDEOS:
      Object.values((action as BatchAddVideosAction).contents)
        .forEach((media) => {
          media.video_resources
            ?.forEach((resource) => {
              addStreamUrl(resource.manifest.url);
            });
        });

      return {
        ...state,
        ...(action as BatchAddVideosAction).contents,
      };
    case actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD:
      return (action as BatchAddVideosAction).contents; // deleting existing content and adding these new contents
    default:
      return state;
  }
}

/**
 * this store is used for request cache.
 * Server will return a valid_duration field for some routes, we used that field to calculate the ttl for both the
 *  requests and content(could be movie/episode/series or container)
 */
export function statusById(state: VideoState['statusById'] = {}, action: LoadContentAction): VideoState['statusById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_CONTENT_RF.FETCH:
      return {
        ...state,
        [(action as LoadByIdFetchAction).id]: createDescriptors(action),
      };
    case actions.LOAD_CONTENT_RF.SUCCESS:
      return {
        ...state,
        [(action as LoadByIdSuccessAction).id]: {
          ...createDescriptors(action, (action as LoadByIdSuccessAction).payload.validDuration),
        },
      };
    case actions.LOAD_CONTENT_RF.FAILURE:
      return {
        ...state,
        [(action as LoadByIdFailAction).id]: {
          error: (action as LoadByIdFailAction).error,
          ...createDescriptors(action),
        },
      };
    default:
      return state;
  }
}

/**
 * store contents which are considered fully loaded, for example
 *  - contents loaded through loadById action
 *  - contents loaded through loadAutoPlayContents action
 *  - contents returned from search result
 * @param state
 * @param action
 */
export function fullContentById(
  state: VideoState['fullContentById'] = {},
  action: LoadContentAction
): VideoState['fullContentById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_CONTENT_RF.SUCCESS:
      return {
        ...state,
        [(action as LoadByIdSuccessAction).id]: true,
      };
    case actions.BATCH_ADD_VIDEOS:
      return {
        ...state,
        ...(action as BatchAddVideosAction).fullContentsMap,
      };
    // fixme (zhiye) this should not be correct
    case actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD:
      return {};
    default:
      return state;
  }
}

export function adBreaksById(
  state: VideoState['adBreaksById'] = {},
  action: LoadContentAction
): VideoState['adBreaksById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_CONTENT_RF.SUCCESS:
      return {
        ...state,
        [(action as LoadByIdSuccessAction).id]: (action as LoadByIdSuccessAction).payload.cuePoints || [],
      };
    case actions.BATCH_ADD_VIDEOS:
      return {
        ...state,
        ...(action as BatchAddVideosAction).cuePointsMap,
      };
    case actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD:
      return (action as BatchAddVideosAction).cuePointsMap;
    case actions.LOAD_CONTENT_RF.FAILURE:
      return {
        ...state,
        [(action as LoadByIdFailAction).id]: [0],
      };
    default:
      return state;
  }
}

function relatedById(
  state: VideoState['relatedContentsById'] = {},
  action: LoadRelatedContentsAction
): VideoState['relatedContentsById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_RELATED_CONTENTS_SUCCESS:
      return {
        ...state,
        [action.id]: action.result,
      };
    default:
      return state;
  }
}

function resumePosition(
  state: VideoState['resumePositionById'] = {},
  action: SetResumePositionAction | RemoveResumePositionAction
): VideoState['resumePositionById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.SET_RESUME_POSITION:
      return {
        ...state,
        [(action as SetResumePositionAction).id]: (action as SetResumePositionAction).resumePosition,
      };
    case actions.REMOVE_RESUME_POSITION:
      const nextState = {};
      for (const contentId in state) {
        if ((action as RemoveResumePositionAction).ids.indexOf(contentId) < 0) {
          nextState[contentId] = state[contentId];
        }
      }
      return nextState;
    default:
      return state;
  }
}

function thumbnailSpritesById(
  state: VideoState['thumbnailSpritesById'] = {},
  action: LoadContentThumbnailSpritesAction
): VideoState['thumbnailSpritesById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS:
      // only keep the latest 1 content sprites
      const sprites = state[action.contentId] || {};
      return {
        [action.contentId]: {
          ...sprites,
          [action.result.type]: action.result,
        },
      };
    default:
      return state;
  }
}

function autoPlayContentsById(
  state: VideoState['autoPlayContentsById'] = {},
  action: LoadAutoPlayContentsAction
): VideoState['autoPlayContentsById'] {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_AUTOPLAY_CONTENTS:
      return {
        ...state,
        [(action as ResetLoadAutoPlayContentsAction).contentId]: {
          contents: null,
          loading: true,
          loaded: false,
        },
      };
    case actions.LOAD_AUTOPLAY_CONTENTS_SUCCESS:
      return {
        ...state,
        [(action as LoadAutoPlayContentsSuccessAction).id]: {
          contents: (action as LoadAutoPlayContentsSuccessAction).result,
          loading: false,
          loaded: true,
        },
      };
    case actions.LOAD_AUTOPLAY_CONTENTS_FAIL:
      return {
        ...state,
        [(action as LoadAutoPlayContentsFailAction).contentId]: {
          loading: false,
          loaded: true,
          contents: [],
        },
      };
    case actions.RESET_AUTOPLAY_CONTENTS:
      return {
        ...state,
        [(action as ResetLoadAutoPlayContentsAction).contentId]: {
          loading: false,
          loaded: false,
          contents: [],
        },
      };
    default:
      return state;
  }
}

const videoReducers = combineReducers({
  byId,
  adBreaksById,
  fullContentById,
  statusById,
  resumePositionById: resumePosition,
  relatedContentsById: relatedById,
  autoPlayContentsById,
  thumbnailSpritesById,
});

export default videoReducers;
