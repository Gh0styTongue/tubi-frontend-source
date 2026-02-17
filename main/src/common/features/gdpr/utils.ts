import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type StoreState from 'common/types/storeState';

import type { Consent, OptionalConsentValue } from './types';

export const toggleConsentValue = (value: OptionalConsentValue) => value === 'opted_in' ? 'opted_out' : 'opted_in';

export const isOptionalConsent = ((consent: Consent) => consent.value !== 'required');

export const getUserInteraction = (value: OptionalConsentValue) => value === 'opted_in' ? 'TOGGLE_ON' : 'TOGGLE_OFF';

export const initGlobalStateForOnetrust = (state: StoreState) => {
  const isGDPREnabled = isGDPREnabledSelector(state);
  window.__IS_GDPR_ENABLED__ = isGDPREnabled;
};
