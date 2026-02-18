import { createSelector } from 'reselect';

import { OTT_ROUTES } from 'common/constants/routes';
import { getExperiment } from 'common/experimentV2';
import { webottHomegridPivots } from 'common/experimentV2/configs/webottHomegridPivots';
import type { StoreState } from 'common/types/storeState';

export const isPivotsEnabledSelector = (_state: StoreState) => __IS_MAJOR_PLATFORM__ && getExperiment(webottHomegridPivots).get('show_pivots');

export const IS_CONTAINER_HOISTING_ENABLED = false as boolean;

export const shouldShowPivotsSelector = createSelector(
  isPivotsEnabledSelector,
  (_: StoreState, { pathname }: { pathname: string }) => pathname,
  (isEnabled, pathname) => isEnabled && ['', OTT_ROUTES.home].includes(pathname),
);
