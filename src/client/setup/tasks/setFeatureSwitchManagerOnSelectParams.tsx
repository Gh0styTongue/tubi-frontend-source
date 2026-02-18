import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

export function setFeatureSwitchManagerOnSelectParams(dispatch: TubiThunkDispatch) {
  FeatureSwitchManager.setOnSelectParams({ dispatch });
}
