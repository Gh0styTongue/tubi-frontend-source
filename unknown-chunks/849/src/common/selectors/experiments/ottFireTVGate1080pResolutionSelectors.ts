import {
  FIRETV_GATE_1080P_RESOLUTION,
  FIRETV_GATE_1080P_VALUE,
  getConfig,
  MAX_LEVEL_RESOLUTION,
} from 'common/experiments/config/ottFireTVGate1080pResolution';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

const hasFullHDLevelSelector = (state: StoreState, includeRestricted = true) => {
  const { qualityList, restrictedLevels } = state.player.quality;
  if (!includeRestricted) {
    return qualityList.some((level) => level.height > MAX_LEVEL_RESOLUTION);
  }

  const hasHighDefinitionLevel = restrictedLevels.some((level) => level.height > MAX_LEVEL_RESOLUTION)
    || qualityList.some((level) => level.height > MAX_LEVEL_RESOLUTION);
  return hasHighDefinitionLevel;
};

/**
 * Selects whether the exposure should be logged. This is based on whether the
 * the current video content has a full HD level
 */
export const shouldLogGate1080pExposureSelector = (state: StoreState) => {
  const hasFullHDLevel = hasFullHDLevelSelector(state);
  return hasFullHDLevel;
};

/**
 * Selects whether the sign up to watch in HD button should be shown in the
 * transport controls. This is based on whether the user is in the
 * the ui_with_registration treatment group, is not logged in, and the video content
 * has HD levels
 */
export const shouldShowWatchInFullHDButtonSelector = (state: StoreState) => {
  const result = popperExperimentsSelector(state, {
    ...FIRETV_GATE_1080P_RESOLUTION,
    config: getConfig(),
  });
  const isLoggedIn = isLoggedInSelector(state);
  const hasFullHDLevel = hasFullHDLevelSelector(state);
  return result === FIRETV_GATE_1080P_VALUE.UI_WITH_REGISTRATION && !isLoggedIn && hasFullHDLevel;
};

/**
 * Selects whether the video resolution should be limited to 720p.
 * This is based on whether the user is in the control group or
 * the UI without registration group, or the user is not logged in
 * and is in the UI with registration group
 */
export const shouldLimitVideoResolutionSelector = (state: StoreState) => {
  const result = popperExperimentsSelector(state, {
    ...FIRETV_GATE_1080P_RESOLUTION,
    config: getConfig(),
  });
  const isLoggedIn = isLoggedInSelector(state);
  const isControlGroup = result === FIRETV_GATE_1080P_VALUE.CONTROL;
  const meetsUiWithRegistrationCriteria = result === FIRETV_GATE_1080P_VALUE.UI_WITH_REGISTRATION && !isLoggedIn;

  return isControlGroup || meetsUiWithRegistrationCriteria;
};

/**
 * Selects whether the video quality toast should be shown. This is based on
 * whether the user is in the UI with registration group, content has full hd
 * level, and user is logged in
 */
export const shouldShowVideoQualityToastSelector = (state: StoreState) => {
  const result = popperExperimentsSelector(state, {
    ...FIRETV_GATE_1080P_RESOLUTION,
    config: getConfig(),
  });
  const isLoggedIn = isLoggedInSelector(state);
  const hasFullHDLevel = hasFullHDLevelSelector(state);

  return result === FIRETV_GATE_1080P_VALUE.UI_WITH_REGISTRATION
    && hasFullHDLevel
    && isLoggedIn;
};

export const shouldShowRatingOverlayFullHDBadgeSelector = (state: StoreState) => {
  const result = popperExperimentsSelector(state, {
    ...FIRETV_GATE_1080P_RESOLUTION,
    config: getConfig(),
  });

  const isControlGroup = result === FIRETV_GATE_1080P_VALUE.CONTROL;
  const hasUnrestrictedFullHDLevel = hasFullHDLevelSelector(state, false);

  return !isControlGroup && hasUnrestrictedFullHDLevel;
};
