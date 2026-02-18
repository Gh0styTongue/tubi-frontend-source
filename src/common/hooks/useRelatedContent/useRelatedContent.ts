import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useStore } from 'react-redux';

import { RELATED_CONTENTS_LIMIT } from 'common/constants/constants';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { enable4KSelector, enableHEVCSelector } from 'common/selectors/fire';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import type StoreState from 'common/types/storeState';
import type { RelatedContent } from 'common/types/video';

import { buildRelatedContentQueryKey, fetchRelatedContentData } from './utils';

interface UseRelatedContentParams {
  contentId: string;
  limit?: number;
  queryOptions?: Omit<UseQueryOptions<RelatedContent>, 'queryKey' | 'queryFn'>;
}

export const useRelatedContent = ({
  contentId,
  limit = RELATED_CONTENTS_LIMIT,
  queryOptions,
}: UseRelatedContentParams) => {
  // Grab the full state to build the query key and pass to the shared queryFn
  const store = useStore<StoreState>();
  const state = store.getState();
  const dispatch = useAppDispatch();

  return useQuery<RelatedContent>({
    queryKey: buildRelatedContentQueryKey({
      contentId,
      limit,
      isKidsModeEnabled: isKidsModeEnabledSelector(state),
      parentalRating: parentalRatingSelector(state),
      enableHEVC: !!enableHEVCSelector(state),
      enable4K: !!enable4KSelector(state),
    }),
    queryFn: () => fetchRelatedContentData(contentId, state, dispatch, limit),
    ...queryOptions,
  });
};

/**
 * useRelatedContentsContainerRows clones the behavior of the old relatedContentsRowSelector, but uses the cache from useRelatedContent.
 * rowIds is an array of container ids, we will return the contents for those containers only
 */
export interface UseRelatedContentsContainerRowsParams extends UseRelatedContentParams {
  rowIds: string[] | null;
}
export const useRelatedContentsContainerRows = ({ contentId, rowIds, limit = RELATED_CONTENTS_LIMIT, queryOptions }: UseRelatedContentsContainerRowsParams) => {
  const query = useRelatedContent({ contentId, limit, queryOptions });

  // Extract complex expression for static analysis
  // Memoize based on array contents, not reference
  const rowIdsKey = rowIds?.join(',') ?? null;
  const memoizedReturnData = useMemo(() => {
    const rowIds = rowIdsKey === null ? null : (rowIdsKey === '' ? [] : rowIdsKey.split(','));
    if (!query.data) {
      return undefined;
    }
    const { contents } = query.data;
    return {
      ...query.data,
      contents: contents ? contents.filter(({ id }) => rowIds === null || rowIds.includes(id)) : [],
    };
  }, [query.data, rowIdsKey]);

  return {
    ...query,
    data: memoizedReturnData,
  };
};
