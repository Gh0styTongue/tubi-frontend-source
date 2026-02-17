import { SET_CONTENT_MODE } from 'common/constants/action-types';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';

export interface SetContentModeAction {
  type: typeof SET_CONTENT_MODE;
  contentMode: CONTENT_MODE_VALUE | undefined;
  notHomeOrContentModePage?: boolean;
}

export const setContentMode = ({ contentMode, notHomeOrContentModePage }:
  { contentMode: CONTENT_MODE_VALUE, notHomeOrContentModePage?: boolean }) => ({
  type: SET_CONTENT_MODE,
  contentMode,
  notHomeOrContentModePage,
});
