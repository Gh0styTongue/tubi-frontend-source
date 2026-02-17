import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import { KIDS_MODE_CONSENTS_VALUE } from 'common/features/gdpr/constants';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import type { Consent } from '../types';

export interface GDPRConsentState {
  updatingConsent: boolean;
  consentRequired: boolean;
  privacyDescription: string;
  consents: Consent[];
}

export const initialState: GDPRConsentState = {
  updatingConsent: false,
  consentRequired: false,
  privacyDescription: '',
  consents: [],
};

const consentReducer = (state: GDPRConsentState = initialState, action: AnyAction) => {
  switch (action.type) {
    case actions.LOAD_GDPR_CONSENT.SUCCESS: {
      const {
        payload: {
          consents,
          privacy_description: privacyDescription,
          consent_required: consentRequired,
        },
      } = action;
      /* istanbul ignore next: force initial consent with feature switch for testing */
      return {
        ...state,
        consentRequired: consentRequired || FeatureSwitchManager.isEnabled(['GDPR', 'initial']),
        privacyDescription,
        consents,
      };
    }
    case actions.UPDATE_GDPR_CONSENT.FETCH: {
      return {
        ...state,
        updatingConsent: true,
      };
    }
    case actions.UPDATE_GDPR_CONSENT.SUCCESS: {
      const { payload: { consents, consent_required } } = action;
      return {
        ...state,
        consents,
        consentRequired: consent_required,
        updatingConsent: false,
      };
    }
    case actions.UPDATE_GDPR_CONSENT.FAILURE: {
      return {
        ...state,
        updatingConsent: false,
      };
    }
    case actions.SET_GDPR_CONSENT_FOR_KIDS_MODE: {
      return {
        ...state,
        consents: [...state.consents.map(item => {
          return {
            ...item,
            value: KIDS_MODE_CONSENTS_VALUE[item.key] ? KIDS_MODE_CONSENTS_VALUE[item.key] : item.value,
          };
        })],
      };
    }
    default: {
      return state;
    }
  }
};

export default consentReducer;
