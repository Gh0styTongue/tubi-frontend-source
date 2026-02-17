import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { Consent, ConsentValue } from 'common/features/gdpr/types';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { getPlatform } from 'common/utils/platform';

const platform = getPlatform();

const consentURL = getConfig().accountServiceConsent;

export type ConsentResponse = {
  consents: Consent[];
  /** initial consent flow or not */
  consent_required: boolean;
  /** the privacy description based on different jurisdictions */
  privacy_description: string;
};

export const getConsent = (dispatch: TubiThunkDispatch) => {
  const params: Record<string, unknown> = {
    platform,
  };
  /* istanbul ignore next */
  if (__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__) {
    const fakeCountry = FeatureSwitchManager.get('Country');
    if (fakeCountry !== 'default') {
      params.fakeCountry = fakeCountry;
    }
  }
  return dispatch(fetchWithToken<ConsentResponse>(consentURL, { params }));
};

export const patchConsent = (dispatch: TubiThunkDispatch, consent: Record<string, ConsentValue>) => {
  let query = '';
  /* istanbul ignore next */
  if (__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__) {
    const fakeCountry = FeatureSwitchManager.get('Country');
    query = fakeCountry !== 'default' ? `?fakeCountry=${fakeCountry}` : '';
  }

  const options: FetchWithTokenOptions = {
    method: 'patch',
    data: consent,
  };
  return dispatch(fetchWithToken(`${consentURL}${query}`, options));
};
