import { createSelector } from 'reselect';
import shallowEqual from 'shallowequal';

import { FEATURED_CONTAINER_ID } from 'common/constants/constants';
import { containerChildrenIdMapSelector } from 'common/selectors/container';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';

const EMPTY_ARRAY: string[] = [];
let memoizeFeaturedVideos: Video[] = [];

const byIdSelector = ({ video }: StoreState) => video.byId;

const featuredContainerTitleIDsSelector = createSelector(
  containerChildrenIdMapSelector,
  (childIds) => childIds[FEATURED_CONTAINER_ID] || EMPTY_ARRAY,
);

export const featuredVideosSelector = createSelector(
  featuredContainerTitleIDsSelector,
  byIdSelector,
  (titleIds, byId) => {
    const featuredVideos = titleIds
      .map(contentId => byId[contentId])
      .filter(Boolean);
    if (__SERVER__ || !shallowEqual(featuredVideos, memoizeFeaturedVideos)) {
      memoizeFeaturedVideos = featuredVideos;
    }
    return memoizeFeaturedVideos;
  },
);
