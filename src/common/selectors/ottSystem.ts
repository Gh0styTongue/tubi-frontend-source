import { createSelector } from 'reselect';

import { FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import type { StoreState } from 'common/types/storeState';

const ottSystemSelector = ({ ottSystem }: StoreState) => ottSystem || FREEZED_EMPTY_OBJECT;

export const deviceDealSelector = createSelector(ottSystemSelector, ({ deviceDeal }) => deviceDeal);

export const isdSelector = createSelector(ottSystemSelector, ({ isd }) => isd);

export const rsdSelector = createSelector(ottSystemSelector, ({ rsd }) => rsd);
