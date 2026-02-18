import { useEffect } from 'react';

import { useSeries } from 'common/hooks/useContent/useSeries';

const EPISODE_BUFFER_SIZE = 15;
/**
 * The hook uses seasonsMeta (metadata about all episodes in each season) and
 * series.seasons (actual loaded episode data) to determine if more episodes should be loaded.
 * It triggers the load internally.
 */
export const useShouldLoadMoreEpisodes = (seriesId: string, selectedSeasonIndex: number, lastVisibleCarouselIndex: number) => {
  const { data: series, seasonsMeta = [], canLoadMore, isLoading, isFetching, loadMore } = useSeries(seriesId);

  useEffect(() => {
    if (isLoading || isFetching) {
      return;
    }

    if (!series || !seasonsMeta.length || selectedSeasonIndex >= seasonsMeta.length) {
      return;
    }

    const selectedSeasonMeta = seasonsMeta[selectedSeasonIndex];
    const selectedSeasonNumber = selectedSeasonMeta.number;

    // Check if we can load more episodes for this season
    if (!canLoadMore(selectedSeasonNumber)) {
      return;
    }

    // Get the loaded episodes for this season from the series data
    const loadedSeason = series.seasons?.find(season => season.number === selectedSeasonNumber);
    if (!loadedSeason) {
      void loadMore(selectedSeasonNumber); // No episodes loaded yet, should load
      return;
    }

    const totalEpisodesInSeason = selectedSeasonMeta.episodes.length;
    const loadedEpisodesCount = loadedSeason.episodes.length;

    // Calculate how many loaded episodes remain after the last visible index
    // If we're viewing episodes 0-2 (lastVisibleCarouselIndex = 2) and have 20 loaded episodes,
    // then we have 20 - 3 = 17 episodes remaining to display
    const episodesRemainingAfterVisible = loadedEpisodesCount - (lastVisibleCarouselIndex + 1);

    // Should load more if we're within EPISODE_BUFFER_SIZE of the end of loaded episodes
    // and there are more episodes available in this season
    const shouldLoadMore = episodesRemainingAfterVisible < EPISODE_BUFFER_SIZE && loadedEpisodesCount < totalEpisodesInSeason;
    if (shouldLoadMore) {
      void loadMore(selectedSeasonNumber);
    }
  }, [series, seasonsMeta, selectedSeasonIndex, lastVisibleCarouselIndex, canLoadMore, isLoading, isFetching, loadMore]);
};
