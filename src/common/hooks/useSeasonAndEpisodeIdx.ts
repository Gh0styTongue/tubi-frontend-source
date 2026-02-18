import { useMemo } from 'react';

import type { SeriesPaginationInfo } from 'common/hooks/useContent/useSeriesPaginationInfo';
import { findEpisodeIdx } from 'common/utils/episode';

export const useSeasonAndEpisodeIdx = ({ seasonsMeta, contentId }: { seasonsMeta: SeriesPaginationInfo['seasons'] | undefined; contentId: string }) => {
  return useMemo(() => {
    if (!seasonsMeta) {
      return { seasonIndex: undefined, episodeIndex: undefined };
    }

    const { season: seasonIndex, episode: episodeIndex } = findEpisodeIdx(contentId, seasonsMeta) || {};

    return { seasonIndex, episodeIndex };
  }, [seasonsMeta, contentId]);
};
