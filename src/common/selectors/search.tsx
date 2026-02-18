import flatten from 'lodash/flatten';
import { createSelector } from 'reselect';

import type StoreState from 'common/types/storeState';
import { dedupSimpleArray } from 'common/utils/collection';

const recommendedContainerIdsSelector = ({ search }: StoreState) => search.recommendedContainerIds;
const containerChildrenIdMap = ({ container }: StoreState) => container.containerChildrenIdMap;

// load recommendations for search
export const recommendationSelector = createSelector(
  recommendedContainerIdsSelector,
  containerChildrenIdMap,
  (contIds, idMap) => dedupSimpleArray(contIds
    .reduce<string[]>((pre, contId) => [
      ...pre,
      ...flatten(idMap[contId]),
    ], []))
);

export const recommendationPersonalizationIdSelector = createSelector(
  recommendedContainerIdsSelector,
  ({ container }: StoreState) => container.containerIdMap,
  (containerIds, containers) => containerIds.map(containerId => containers[containerId]?.personalizationId || '').filter(Boolean)
);
