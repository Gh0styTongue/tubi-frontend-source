import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

// selector to return the banner object
const fixedBannerSelector = ({ fixedBanner }: StoreState) => fixedBanner;

export const bannerStateSelector = createSelector(fixedBannerSelector, ({ bannerState }) => bannerState);
