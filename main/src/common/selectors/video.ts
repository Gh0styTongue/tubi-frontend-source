import { createSelector } from 'reselect';

import {
  FREEZED_EMPTY_ARRAY,
  RELATED_CONTENTS_LIMIT,
  CONTAINER_ID_FOR_RELATED_RANKING,
} from 'common/constants/constants';
import { containerChildrenIdMapSelector } from 'common/selectors/container';
import { linearContentModeSelector } from 'common/selectors/contentMode';
import type { Series } from 'common/types/series';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { dedupSimpleArray } from 'common/utils/collection';
import { getNextEpisodeId, getPreviousEpisodeId } from 'common/utils/episode';
import { getHistoryFromContentIdMap } from 'common/utils/history';

export const byIdSelector = ({ video }: StoreState) => video.byId || {};
const adBreaksByIdSelector = ({ video }: StoreState) => video.adBreaksById;
const thubmanilSpritesByIdSelector = ({ video }: StoreState) => video.thumbnailSpritesById;
const autoPlayContentsByIdSelector = ({ video }: StoreState) => video.autoPlayContentsById;
const relatedContentsByIdSelector = ({ video }: StoreState) => video.relatedContentsById;
const activeContainerGridIdSelector = ({ ottUI }: StoreState) => ottUI.containerGrid.activeContainerGridId;
const fullContentByIdSelector = ({ video }: StoreState) => video.fullContentById;

// these ignore state
const selectContentID = (_state: StoreState, id: string) => id;

/**
 * get video by id
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const videoByContentIdSelector = createSelector(
  byIdSelector,
  selectContentID,
  (byId, contentId) => byId[contentId]
);

/**
 * Get the ad breaks for contentId
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const adBreaksByContentIdSelector = createSelector(
  adBreaksByIdSelector,
  selectContentID,
  (adBreaksById, contentId) => adBreaksById[contentId] || FREEZED_EMPTY_ARRAY
);

/**
 * Get the thumbnail sprites for a contentId
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const thumbnailSpritesByContentIdSelector = createSelector(
  thubmanilSpritesByIdSelector,
  selectContentID,
  (thumbnailSpritesById, contentId) => thumbnailSpritesById[contentId] || FREEZED_EMPTY_ARRAY
);

/**
 * get series by contentId, maybe
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const seriesByContentIdSelector = createSelector(
  byIdSelector,
  selectContentID,
  videoByContentIdSelector,
  (byId, _contentId, video) => {
    const { series_id } = video || {};
    return series_id ? byId[`0${series_id}`] : undefined;
  }
);

/**
 * Is the given contentID an episode?
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const isEpisodeSelector = createSelector(
  videoByContentIdSelector,
  (video) => !!video?.series_id
);

/**
 * Get history for a contentId
 * (cross-slice selector)
 *
 * @param {Object} state
 * @param {Number} id content id
 */
export const contentHistoryByContentIdSelector = createSelector(
  byIdSelector,
  selectContentID,
  videoByContentIdSelector,
  seriesByContentIdSelector,
  (state: StoreState) => state.history.contentIdMap,
  (_byId, contentId, _video, series, contentIdMap) => {
    const parentId = series ? `0${series.id}` : contentId;
    return getHistoryFromContentIdMap(contentIdMap, parentId);
  }
);

/**
 * get auto play video list
 *
 * @param {Object} state
 * @param {Number} id content id
 * @return {Object[]}
 */
export const autoPlayContentsSelector = createSelector(
  byIdSelector,
  autoPlayContentsByIdSelector,
  (_state: StoreState, id: string) => id,
  (byId, autoPlayContentsById, id) => {
    return ((autoPlayContentsById[id] || {}).contents || []).map((contentId) => byId[contentId]);
  }
);

/**
 * Get the next and previous episodes based on the current episode
 * @param {Object} state
 * @param {String|Number} id content id
 * @return {Object} { previous: videoObj, next: videoObj }
 */
export const nextAndPreviousEpisodesSelector = createSelector(
  byIdSelector,
  (_state: StoreState, id: string) => id,
  (byId, id) => {
    const { series_id: seriesId } = byId[id] || {};
    if (!seriesId) return {};

    const series = byId[`0${seriesId}`];
    if (!series) return {};
    const { seasons, is_recurring } = series as unknown as Series;
    // If series is recurring, we need to exchange the nextId and previousId
    if (is_recurring) {
      return {
        nextEpisodeId: getPreviousEpisodeId(seasons, id),
        previousEpisodeId: getNextEpisodeId(seasons, id),
      };
    }

    return {
      nextEpisodeId: getNextEpisodeId(seasons, id),
      previousEpisodeId: getPreviousEpisodeId(seasons, id),
    };
  }
);

/*
 * 1. related contents are grouped to different rows,
 *    by default return the RANKING row as an array.
 * 2. limit all related contents to max 10 titles
 */
export const relatedContentsSelector = createSelector(
  relatedContentsByIdSelector,
  (_state: StoreState, id: string, limit?: number) => ({ id, limit }),
  (relatedContentsById, { id, limit }) => {
    const related = relatedContentsById[id] || [];
    const relatedRow = related.find(({ id }) => id === CONTAINER_ID_FOR_RELATED_RANKING);
    return relatedRow?.contents.slice(0, limit || RELATED_CONTENTS_LIMIT) || [];
  }
);

// selector all related content rows
export const relatedContentsRowSelector = createSelector(
  relatedContentsByIdSelector,
  (_state: StoreState, id: string, rowIds: string[], limit?: number) => ({ id, rowIds, limit }),
  (relatedContentsById, { id, rowIds, limit }) => {
    const related = relatedContentsById[id] || [];
    return related
      .filter(({ id }) => rowIds.includes(id))
      .map(({ id, title, contents }) => ({
        id,
        title,
        contents: contents.slice(0, limit || RELATED_CONTENTS_LIMIT),
      }));
  }
);

// videos within active container/channel on container grid
export const activeContainerVideosSelector = createSelector(
  containerChildrenIdMapSelector,
  activeContainerGridIdSelector,
  byIdSelector,
  (containerChildrenIdMap, activeContainerGridId, byId) => {
    const containerChildrenIds = containerChildrenIdMap[activeContainerGridId] || [];
    return containerChildrenIds.filter((videoId) => !!byId[videoId]);
  }
);

export const liveNewsVideosSelector = createSelector(
  linearContentModeSelector,
  byIdSelector,
  (linearContentMode, byId) => {
    if (!linearContentMode) return FREEZED_EMPTY_ARRAY;
    const {
      containersList: linearContainersList,
      containerChildrenIdMap: linearContainerChildrenIdMap,
    } = linearContentMode;
    let linearContentIds: string[] = [];
    linearContainersList.forEach((containerId) => {
      linearContentIds = linearContentIds.concat(linearContainerChildrenIdMap[containerId]);
    });
    linearContentIds = dedupSimpleArray(linearContentIds);
    return linearContentIds.map((videoId) => byId[videoId]).filter(Boolean);
  }
);

export const videosByIdsSelector = createSelector(
  byIdSelector,
  (_state: StoreState, ids: string[]) => ids,
  (byId, ids) => ids.map((id) => byId[id]).filter(Boolean)
);

export const isVideoExpiredSelector = createSelector(
  fullContentByIdSelector,
  (_state: StoreState, video: Video) => video,
  (fullContentById, video) => !!fullContentById[video.id] && (video.video_resources || []).length === 0,
);
