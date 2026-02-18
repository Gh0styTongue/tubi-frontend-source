import useAppSelector from 'common/hooks/useAppSelector';
import { seriesByContentIdSelector } from 'common/selectors/video';
import { findEpisodeIdx } from 'common/utils/episode';

export const useSeasonAndEpisodeIdx = (contentId: string) => {
  const series = useAppSelector((state) => seriesByContentIdSelector(state, contentId));

  const {
    season: seasonIndex, episode: episodeIndex,
  } = (series && findEpisodeIdx(contentId, series.seasons)) || {};

  return { seasonIndex, episodeIndex };
};
