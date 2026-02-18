import type { QueryClient } from '@tanstack/react-query';

import { insertProcessedContents } from 'common/actions/video';
import { prefetchContent, prefetchSeriesContent } from 'common/hooks/useContent/prefetchUtils';
import { getCachedVideoData, isContentExpired } from 'common/hooks/useContent/queryFunctions';
import { isDeepLinkedSelector } from 'common/selectors/deepLink';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { alwaysResolve } from 'common/utils/promise';

/**
 * ensure we have everything needed for playback. this includes:
 * adbreaks, url, duration, credit_cuepoints, subtitles, thumbnailSprites, series data + episode metadata
 * (but not the full data for all the episodes when not in episode pagination experiment)
 */
export const fetchDataForPlayback = (
  getState: () => StoreState,
  dispatch: TubiThunkDispatch,
  params: { id: string },
  queryClient: QueryClient,
) => {
  const { id: contentId } = params;
  const state = getState();
  const promises = [];

  const cachedContent = getCachedVideoData({ queryClient, contentId, state });
  const isExpired = isContentExpired(cachedContent);
  const isDeepLink = isDeepLinkedSelector(state);
  const isKidsModeEnabled = isKidsModeEnabledSelector(state);
  const shouldForceRefetch = isDeepLink && isKidsModeEnabled;
  if (!cachedContent || isExpired || shouldForceRefetch) {
    promises.push(prefetchContent(queryClient, contentId, {}, dispatch, getState));
  } else {
    // Ensure legacy redux byId is using the same content here, it may have been updated elsewhere.
    dispatch(insertProcessedContents([cachedContent]));
  }

  return Promise.all(promises)
    .then(() => {
      // if content is an episode, fetch the series data too
      const content = getCachedVideoData({ queryClient, contentId, state: getState() });
      if (!content?.series_id) return;
      return alwaysResolve(prefetchSeriesContent(queryClient, content.series_id, {}, dispatch, getState));
    });
};
