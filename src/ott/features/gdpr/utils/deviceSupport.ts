import { LGTV_WEBOS_3_CHROME_VERSION } from 'common/constants/constants';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type StoreState from 'common/types/storeState';

// Onetrust SDK does not support some device, includes:
// WebOS(LGTV) 3 and before
// We need to redirect to device not support page
export const isDeviceSupportOnetrust = (state: StoreState) => {
  const isGDPREnabled = isGDPREnabledSelector(state);
  if (isGDPREnabled) {
    if (__OTTPLATFORM__ === 'LGTV') {
      const version = Number(state.ui.userAgent.browser.version?.split('.')[0]);
      if (version && version <= LGTV_WEBOS_3_CHROME_VERSION) {
        return false;
      }
    }
  }
  return true;
};

export const deviceNotSupportPagePath = (languageLocale: string) =>
  `static/ott_device_not_support_${languageLocale}.html`;
