import type StoreState from 'common/types/storeState';

export const hasShownRegistratonPromptSelector = (state: StoreState) => {
  return state.ui.registrationPrompt.isSkipped;
};

export const renderControlsSelector = (state: StoreState) => {
  return state.ui.renderControls;
};

