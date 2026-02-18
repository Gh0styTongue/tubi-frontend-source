import { createSelector } from 'reselect';

import { getConfig, WEB_PERSONALIZATION_PROMPT } from 'common/experiments/config/webPersonalizationPrompt';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import { isKidsModeSelector } from 'common/selectors/ui';
import type { StoreState } from 'common/types/storeState';

const webPersonalizationPromptExperimentSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_PERSONALIZATION_PROMPT,
    config: getConfig(),
  });

export const isTargetedUserSelector = createSelector(
  isKidsModeSelector,
  ({ ui: { isEspanolModeEnabled } }: StoreState) => isEspanolModeEnabled,
  ({
    webUI: {
      personalization: { isValidUserForPersonalization },
    },
  }: StoreState) => isValidUserForPersonalization,
  (isKidsModeEnabled, isEspanolModeEnabled, isValidUser) => !isKidsModeEnabled && !isEspanolModeEnabled && isValidUser
);

export const shouldShowPersonalizationPromptSelector = createSelector(
  webPersonalizationPromptExperimentSelector,
  isTargetedUserSelector,
  ({
    webUI: {
      personalization: { dismissedPrompt },
    },
  }: StoreState) => dismissedPrompt,

  (expValue, isTargetedUser, dismissedPrompt) => expValue && isTargetedUser && !dismissedPrompt
);
