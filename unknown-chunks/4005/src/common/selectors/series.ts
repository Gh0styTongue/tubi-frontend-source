import type { OutputParametricSelector, ParametricSelector } from 'reselect';
import { createSelector } from 'reselect';

import { FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import type { Season } from 'common/types/series';
import type StoreState from 'common/types/storeState';
import { getSeasonAndEpisodeNumberText } from 'common/utils/episode';
import type { TubiIntlShape } from 'i18n/intl';

interface SeasonsMetadataParams {
  seriesId: string; // must have leading '0'
}

const seriesSeasonsMetadataSelector: ParametricSelector<StoreState, SeasonsMetadataParams, Season[] | undefined> = createSelector(
  [
    (state: StoreState) => state.video.byId,
    (_: unknown, { seriesId }: SeasonsMetadataParams) => seriesId,
  ],
  (byId, seriesId): Season[] | undefined => {
    return byId[seriesId]?.seasons;
  },
);

interface SeasonAndEpisodeNumber {
  season: number;
  episode: number;
}

/**
 * A map from the episode's content ID to the season and episode number
 */
type SeasonAndEpisodeNumberMap = Record<string, SeasonAndEpisodeNumber>;

export const seasonAndEpisodeNumberMapSelector: OutputParametricSelector<
  StoreState,
  SeasonsMetadataParams,
  SeasonAndEpisodeNumberMap | undefined,
  (seasons: Season[] | undefined) => SeasonAndEpisodeNumberMap | undefined
> = createSelector(
  seriesSeasonsMetadataSelector,
  (seasons: Season[] | undefined): SeasonAndEpisodeNumberMap | undefined => {
    if (!seasons) return undefined;
    const map: SeasonAndEpisodeNumberMap = {};
    for (const season of seasons) {
      for (const episode of season.episodes) {
        map[episode.id] = { season: Number(season.number), episode: episode.num };
      }
    }
    return map;
  },
);

type FormatMessage = TubiIntlShape['formatMessage'];

interface PlaceholderTitleMapParams extends SeasonsMetadataParams {
  formatMessage: FormatMessage;
}

type PlaceholderTitleMap = Record<string, string>; // map from episode content ID => placeholder text like S01:E01

export const placeholderTitleMapSelector: OutputParametricSelector<
  StoreState,
  PlaceholderTitleMapParams,
  PlaceholderTitleMap,
  (map: SeasonAndEpisodeNumberMap | undefined, formatMessage: FormatMessage) => PlaceholderTitleMap
> = createSelector(
  [
    seasonAndEpisodeNumberMapSelector,
    (_: unknown, { formatMessage }: PlaceholderTitleMapParams) => formatMessage,
  ],
  (map: SeasonAndEpisodeNumberMap | undefined, formatMessage: FormatMessage): PlaceholderTitleMap => {
    /* istanbul ignore next */
    if (!map) return FREEZED_EMPTY_OBJECT;
    return Object.entries(map).reduce((acc, [key, val]) => {
      acc[key] = getSeasonAndEpisodeNumberText({
        formatMessage,
        ...val,
      });
      return acc;
    }, {});
  }
);

interface EpisodeIdParams extends SeasonsMetadataParams {
  episodeId: string;
}

const seasonAndEpisodeNumberForEpisodeIdSelector: OutputParametricSelector<
  StoreState,
  EpisodeIdParams,
  SeasonAndEpisodeNumber | undefined,
  (map: SeasonAndEpisodeNumberMap | undefined, episodeId: string) => SeasonAndEpisodeNumber | undefined
> = createSelector(
  [
    seasonAndEpisodeNumberMapSelector,
    (_: unknown, { episodeId }: EpisodeIdParams) => episodeId,
  ],
  (map: SeasonAndEpisodeNumberMap | undefined, episodeId) => {
    return map?.[episodeId];
  },
);

// Since we may not always be able to use a selector, but we might have access to the data from the state via other means,
// we want to expose some non-selector functions that utilize the same memoized functions our selectors above do.
export const getSeasonAndEpisodeNumberForEpisodeId = (
  episodeId: string,
  seasons: Season[] | undefined,
): SeasonAndEpisodeNumber | undefined => {
  const map = seasonAndEpisodeNumberMapSelector.memoizedResultFunc(seasons);
  return seasonAndEpisodeNumberForEpisodeIdSelector.memoizedResultFunc(map, episodeId);
};
