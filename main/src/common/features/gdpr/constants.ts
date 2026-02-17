import type { ConsentValue } from 'common/features/gdpr/types';

// On kids mode, we disable consents by default
export const KIDS_MODE_CONSENTS_VALUE: Record<string, ConsentValue> = {
  analytics: 'opted_out',
  functional_: 'opted_out',
  personalization: 'opted_out',
  marketing_: 'opted_out',
};

export const CW_CONSENT_KEY = 'data_sharing';
