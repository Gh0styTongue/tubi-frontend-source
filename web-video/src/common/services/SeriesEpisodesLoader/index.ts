import SeriesEpisodesLoader from './SeriesEpisodesLoader';
import type { StoreLike } from './types';

interface FactoryParams extends StoreLike {
  seriesId: string;
  pageSize: number;
  numVisibleSeasons: number;
}
export function seriesEpisodesLoaderFactory({ seriesId, dispatch, getState, subscribe, pageSize, numVisibleSeasons }: FactoryParams): SeriesEpisodesLoader {
  const storeLike = { dispatch, getState, subscribe };
  return new SeriesEpisodesLoader({
    seriesId,
    store: storeLike,
    pageSize,
    numVisibleSeasons,
  });
}
