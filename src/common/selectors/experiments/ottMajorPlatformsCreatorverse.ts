import { MAJOR_PLATFORMS_CREATORVERSE, getConfig } from 'common/experiments/config/ottMajorPlatformsCreatorverse';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottMajorPlatformsCreatorverseSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...MAJOR_PLATFORMS_CREATORVERSE,
  config: getConfig(),
});
