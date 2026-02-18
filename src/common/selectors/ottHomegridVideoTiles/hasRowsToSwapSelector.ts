import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, RECOMMENDED_CONTAINER_ID } from 'common/constants/constants';
import type { StoreState } from 'common/types/storeState';

// GOTCHA: can't use containersListSelector from
// src/common/selectors/container.ts because that would introduce a dependency
// cycle, so we'll just use this simplified one until we graduate. This one will
// only work properly on the home page because we're ignoring the content mode,
// but that's fine because we only run this experiment on the home page.
const containersListSelector = ({ container }: StoreState) =>
  container.containersList;

export const hasRowsToSwapSelector = createSelector(
  containersListSelector,
  (_: StoreState, { containerIds }: { containerIds?: string[]; } = {}) => containerIds,
  (containerIdsFromState, containerIdsFromProps) => {
    const containerIds = containerIdsFromProps ?? containerIdsFromState;
    const indexOfFeatured = containerIds.indexOf(FEATURED_CONTAINER_ID);
    const indexOfRecommended = containerIds.indexOf(RECOMMENDED_CONTAINER_ID);
    return indexOfFeatured !== -1 && indexOfRecommended !== -1 && indexOfFeatured < indexOfRecommended;
  }
);
