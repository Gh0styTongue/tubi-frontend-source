import type { Video } from 'common/types/video';
import { findEpisodeIdx } from 'common/utils/episode';

export const getSeasonAndEpisodeIdx = (series: Video | undefined, contentId: string) => {
  const {
    season: seasonIndex, episode: episodeIndex,
  } = (series && findEpisodeIdx(contentId, series.seasons)) || {};
  return { seasonIndex, episodeIndex };
};
