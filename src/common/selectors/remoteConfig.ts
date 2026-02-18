import { createSelector } from 'reselect';

import { userLanguageLocaleSelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
import { isBetweenStartAndEndTime, checkIfMajorEventIsActive, checkIfMajorEventFailsafeIsActive } from 'common/utils/remoteConfig';
import { SUPPORTED_LANGUAGE } from 'i18n/constants';

const remoteConfigSelector = ({ remoteConfig }: StoreState) => remoteConfig;

export const majorEventNameSelector = createSelector(remoteConfigSelector, (remoteConfig) => {
  return remoteConfig.major_event_name;
});

/**
 * A selector to determine if a major event is active
 * See src/common/utils/remoteConfig.ts for a simple util that is usable outside of redux context
 * DO NOT use remoteConfigSelector with createSelector as it will cache the result
 */
export const isMajorEventActiveSelector = ({ remoteConfig }: StoreState) => {
  const { major_event_start: start, major_event_end: end } = remoteConfig || {};

  return checkIfMajorEventIsActive(start, end);
};

/**
 * A selector to determine if a major failsafe event is active
 * DO NOT use remoteConfigSelector with createSelector as it will cache the result
 */
export const isMajorEventFailsafeActiveSelector = ({ remoteConfig }: StoreState) => {
  const { major_event_failsafe_start: start, major_event_failsafe_end: end } = remoteConfig;

  return checkIfMajorEventFailsafeIsActive(start, end);
};

export const majorEventFailsafeMessageSelector = createSelector(
  remoteConfigSelector,
  userLanguageLocaleSelector,
  (remoteConfig, userLanguageLocale) => {
    const language = userLanguageLocale.slice(0, 2);

    let header = remoteConfig.major_event_failsafe_maintenance_header;
    let subtext = remoteConfig.major_event_failsafe_maintenance_subtext;
    if (language === SUPPORTED_LANGUAGE.FR) {
      header = remoteConfig.major_event_failsafe_maintenance_header_fr;
      subtext = remoteConfig.major_event_failsafe_maintenance_subtext_fr;
    } else if (language === SUPPORTED_LANGUAGE.ES) {
      header = remoteConfig.major_event_failsafe_maintenance_header_es;
      subtext = remoteConfig.major_event_failsafe_maintenance_subtext_es;
    }
    return {
      header,
      subtext,
      endTime: remoteConfig.major_event_failsafe_end,
    };
  }
);

/**
 * The selector to determine if the ONBOARDING of a major event is active
 * We didn't check the Feature Switch. Please use isMajorEventOnboardingActive in common/utils/onboarding.ts instead
 * DO NOT use remoteConfigSelector with createSelector as it will cache the result
 */
export const isMajorEventOnboardingActiveSelector = ({ remoteConfig }: StoreState) => {
  const { major_event_onboarding_start: start, major_event_onboarding_end: end } = remoteConfig || {};

  return isBetweenStartAndEndTime(start, end);
};

export const youboraConfigSelector = createSelector(remoteConfigSelector, (remoteConfig) => {
  return remoteConfig?.youbora;
});

// https://app.shortcut.com/tubi/story/814837/remote-config-for-third-party-auth-providers
type AuthKey =
  | 'auth_comcast_email_prefill_enabled'
  | 'auth_google_onetap_enabled'
  | 'auth_login_with_amazon_enabled'
  | 'auth_magic_link_enabled'
  | 'auth_vizio_email_prefill_enabled';

const genAuthEnabledSelector = (key: AuthKey, defaultValue: boolean = true) =>
  createSelector(remoteConfigSelector, (remoteConfig) => {
    const parentKey = 'RemoteConfig';

    const mapping = {
      undefined: defaultValue,
      true: true,
      false: false,
    };

    if (!FeatureSwitchManager.isDefault(parentKey)) {
      const featureSwitch = FeatureSwitchManager.get(parentKey);
      const value = mapping[featureSwitch[key]];

      if (value !== undefined) {
        return value;
      }
    }

    return remoteConfig?.[key] ?? defaultValue;
  });

export const isAuthGoogleOnetapEnabledSelector = genAuthEnabledSelector('auth_google_onetap_enabled');
export const isAuthLoginWithAmazonEnabledSelector = genAuthEnabledSelector('auth_login_with_amazon_enabled');
export const isAuthMagicLinkEnabledSelector = genAuthEnabledSelector('auth_magic_link_enabled');

export const isAuthComcastEmailPrefillEnabledSelector = createSelector(
  isAuthMagicLinkEnabledSelector,
  genAuthEnabledSelector('auth_comcast_email_prefill_enabled'),
  (isAuthMagicLinkEnabled, isAuthComcastEmailPrefillEnabled) =>
    isAuthMagicLinkEnabled && isAuthComcastEmailPrefillEnabled
);

export const isAuthVizioEmailPrefillEnabledSelector = createSelector(
  isAuthMagicLinkEnabledSelector,
  genAuthEnabledSelector('auth_vizio_email_prefill_enabled'),
  (isAuthMagicLinkEnabled, isAuthVizioEmailPrefillEnabled) => isAuthMagicLinkEnabled && isAuthVizioEmailPrefillEnabled
);

const bypassRegistrationGateSelector = createSelector(remoteConfigSelector, (remoteConfig) => {
  if (FeatureSwitchManager.isEnabled('BypassRegistrationGate')) {
    return true;
  }
  const { bypass_registration_gate = false } = remoteConfig || {};
  return bypass_registration_gate;
});

export const shouldBypassRegistrationGateSelector = createSelector(
  isMajorEventActiveSelector,
  bypassRegistrationGateSelector,
  (isMajorEventActive, bypassRegistrationGate) => isMajorEventActive && bypassRegistrationGate
);
