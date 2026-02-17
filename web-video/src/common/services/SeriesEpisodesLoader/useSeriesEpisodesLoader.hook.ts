import { useEffect, useRef } from 'react';
import { useStore } from 'react-redux';

import { EPISODE_PAGINATION_PAGE_SIZE } from 'common/constants/constants';
import type { Season } from 'common/types/series';
import type StoreState from 'common/types/storeState';

import { seriesEpisodesLoaderFactory } from './index';
import type SeriesEpisodesLoader from './SeriesEpisodesLoader';
import type { VisibleEpisodes } from './types';

export interface UseSeriesEpisodesLoaderParams extends VisibleEpisodes {
  seriesId: string;
  seasons?: Season[];
}

export default function useSeriesEpisodesLoader({ seriesId, seasonNumber, episodeStartIndex, episodeEndIndexInclusive }: UseSeriesEpisodesLoaderParams) {
  const loader = useRef<SeriesEpisodesLoader | null>(null);
  const { dispatch, getState, subscribe } = useStore<StoreState, any>(); // Using `any` makes me sad. -GregL

  useEffect(() => {
    if (!seriesId) {
      return;
    }
    if (!loader.current) {
      loader.current = seriesEpisodesLoaderFactory({
        seriesId,
        dispatch,
        getState,
        subscribe,
        numVisibleSeasons: __WEBPLATFORM__ ? 1 : 2,
        pageSize: EPISODE_PAGINATION_PAGE_SIZE,
      });
      loader.current.subscribeToStore();
    }
    loader.current?.updateVisibleEpisodes({
      seasonNumber,
      episodeStartIndex,
      episodeEndIndexInclusive,
    });
  }, [seasonNumber, episodeStartIndex, episodeEndIndexInclusive, seriesId, dispatch, getState, subscribe]);

  useEffect(() => {
    // cleanup on unmount of this component
    return () => {
      loader.current?.destroy();
      loader.current = null;
    };
  }, []);
}
