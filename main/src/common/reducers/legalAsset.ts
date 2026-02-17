import * as actions from 'common/constants/action-types';
import { LEGAL_TYPES } from 'common/constants/legalAsset';
import type { LegalAssetAction, LegalAssetState } from 'common/types/legalAsset';

export const initialState: LegalAssetState = {
  [LEGAL_TYPES.privacy]: {
    html: '',
    error: null,
  },
  [LEGAL_TYPES.terms]: {
    html: '',
    error: null,
  },
  [LEGAL_TYPES.yourPrivacyChoices]: {
    html: '',
    error: null,
  },
  [LEGAL_TYPES.b2bPrivacy]: {
    html: '',
    error: null,
  },
  [LEGAL_TYPES.cookies]: {
    html: '',
    error: null,
  },
  [LEGAL_TYPES.dashpass]: {
    html: '',
    error: null,
  },
};

export default function legalAssetReducer(state: LegalAssetState = initialState, action: LegalAssetAction): LegalAssetState {
  switch (action.type) {
    case actions.LOAD_LEGAL_ASSET_SUCCESS:
      return {
        ...state,
        [action.legalType]: {
          html: action.html,
          error: null,
        },
      };
    case actions.LOAD_LEGAL_ASSET_FAIL:
      return {
        ...state,
        [action.legalType]: {
          html: '',
          error: action.error,
        },
      };
    default:
      return {
        ...state,
      };
  }
}
