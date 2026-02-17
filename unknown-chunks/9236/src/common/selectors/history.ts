import { createSelector } from 'reselect';
import type { Selector } from 'reselect';

import { FREEZED_EMPTY_ARRAY, FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import type { HistoryState, HistoryEpisode, SeriesHistory } from 'common/types/history';
import type StoreState from 'common/types/storeState';
import { findEpisodeIdx, getSeasonAndEpisodeNumberText } from 'common/utils/episode';
import { getResumePositionFromHistory } from 'common/utils/history';

import type { Video } from '../types/video';

const byIdSelector: Selector<StoreState, Record<string, Video>> = ({ video: { byId } }) => byId;

export const historyEpisodeSelector: (a: { history: HistoryState }, seriesId: string) => HistoryEpisode = ({ history: { contentIdMap } }, seriesId: string) => {
  // assumes that we are passing seriesId with a leading 0 because that is how it is stored in contentIdMap
  const historyData = contentIdMap[seriesId] || FREEZED_EMPTY_OBJECT;
  const { position: idx, episodes } = (historyData as SeriesHistory);
  return (episodes || FREEZED_EMPTY_ARRAY)[idx];
};

const historySelector: Selector<HistoryState, HistoryState['contentIdMap']> = ({ contentIdMap }) => contentIdMap;

const seriesContentSelector: (a: StoreState, seriesId: string) => Video = ({ video: { byId } }, seriesId: string) => byId[seriesId] || FREEZED_EMPTY_OBJECT;

export const historyEpisodeDetailsSelector = createSelector([
  byIdSelector,
  historyEpisodeSelector,
], (byId, historyEpisode) => {
  if (historyEpisode) return byId[historyEpisode.contentId];
  return null;
});

export const firstEpisodeSelector = createSelector(
  byIdSelector,
  seriesContentSelector,
  (byId, seriesContent) => {
    if (Array.isArray(seriesContent.seasons) && seriesContent.seasons[0]) {
      return byId[seriesContent.seasons[0].episodes[0].id];
    }
    return null;
  }
);

type LatestEpisodeInfo = {
  id: string;
  series_id?: string;
  title: string;
  duration: number;
  type: string;
};

/**
 * Return latest episode brief info, either from history or the first episode from the first season.
 *
 * Example:
 * ```
 * const latestEpisodeInfo = latestEpisodeInfoSelector(state, seriesId);
 * ```
 */
export const latestEpisodeInfoSelector = createSelector([
  historyEpisodeSelector,
  historyEpisodeDetailsSelector,
  firstEpisodeSelector,
  (state, seriesId) => seriesId,

], (historyEpisode, historyEpisodeDetails, firstEpisode, seriesId) => {
  let latestEpisodeInfo: LatestEpisodeInfo | null = null;

  if (historyEpisode && historyEpisodeDetails) {
    latestEpisodeInfo = {
      ...historyEpisode,
      title: historyEpisodeDetails.title,
      duration: historyEpisodeDetails.duration,
      type: historyEpisodeDetails.type,
      // overwrite the history id
      id: historyEpisodeDetails.id,
    };
  }

  if (!latestEpisodeInfo && firstEpisode) {
    // fallback to the first episode
    latestEpisodeInfo = {
      ...firstEpisode,
    };
  }

  if (latestEpisodeInfo) {
    // guarantee store seriesId w/o leading 0
    latestEpisodeInfo.series_id = seriesId.slice(1);
  }

  return latestEpisodeInfo;
});

export const latestEpisodeShortTitleSelector = createSelector([
  (state, { seriesId }) => seriesContentSelector(state, seriesId),
  (state, { seriesId }) => historyEpisodeSelector(state, seriesId),
  (_, { formatMessage }) => formatMessage,
], (series, historyEpisode, formatMessage) => {
  if (!series || !Array.isArray(series.seasons)) return '';

  const episodeContentId = historyEpisode
    ? historyEpisode.contentId
    : series.seasons[0]?.episodes[0].id;

  const indexes = findEpisodeIdx(`${episodeContentId}`, series.seasons);

  if (!indexes) {
    return '';
  }

  const season = series.seasons && series.seasons[indexes.season];
  const episode = season && season.episodes[indexes.episode];
  /* istanbul ignore next */
  if (!season || !episode) {
    return '';
  }

  return getSeasonAndEpisodeNumberText({
    formatMessage,
    season: season.number,
    episode: episode.num,
  });
});

const seriesHistorySelector = createSelector(
  historySelector,
  (state: HistoryState, contentId: string) => contentId,
  (history: HistoryState['contentIdMap'], contentId) => {
    return history[contentId];
  }
);

export const episodeListSelector: Selector<HistoryState, Record<string, HistoryEpisode>> = createSelector(
  seriesHistorySelector,
  (seriesHistory) => {
  // create map of episodeId: { position }
    const episodeHistoryMap = {};
    if (seriesHistory && (seriesHistory as SeriesHistory).episodes) {
      (seriesHistory as SeriesHistory).episodes.forEach((ep) => {
        episodeHistoryMap[ep.contentId] = { position: getResumePositionFromHistory(ep) };
      });
    }
    return episodeHistoryMap;
  });
