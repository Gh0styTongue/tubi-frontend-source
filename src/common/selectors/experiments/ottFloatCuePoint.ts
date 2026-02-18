import { FIRETV_FLOAT_CUE_POINT_VALUE } from 'common/constants/experiments';
import {
  getConfig,
  FIRETV_FLOAT_CUE_POINT_NAMESPACE,
} from 'common/experiments/config/ottFiretvFloatCuePoint';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';

const ottFloatCuePoint = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_FLOAT_CUE_POINT_NAMESPACE,
  config: getConfig(),
});

export const useFloatCuePointsSelector = (state: StoreState) => {
  return getFloatCuePointMode(state) === FIRETV_FLOAT_CUE_POINT_VALUE.FLOAT_CUE_POINT_WITH_TEXT_TRACK
    || !!(__OTTPLATFORM__ === 'ANDROIDTV' && (state.fire?.appVersion?.code ?? 0) >= 833);
};

export const getFloatCuePointMode = (state: StoreState) => {
  /* istanbul ignore next */
  if (!FeatureSwitchManager.isDefault(['Player', 'FloatCuePointMode'])) {
    return FeatureSwitchManager.get(['Player', 'FloatCuePointMode']) as FIRETV_FLOAT_CUE_POINT_VALUE;
  }

  return ottFloatCuePoint(state);
};
