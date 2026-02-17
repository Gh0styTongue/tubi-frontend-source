import { supportsLocalStorage } from '@adrise/utils/lib/localStorage';
import type { EventTypes } from '@tubitv/analytics/lib/events';
import isEqual from 'lodash/isEqual';
import Cookie from 'react-cookie';

import { ONETRUST_CONSENT } from 'common/features/gdpr/onetrust/constants';
import logger from 'common/helpers/logging';
import type { OneTrustConsents } from 'types/onetrust';

// See: https://docs.google.com/spreadsheets/d/1WH9VeZVTAPXgBHRynfwMgkS-77f7wBRkNtWaluiqHdQ/edit#gid=1348033111
export const THIRD_PARTY_SDK_CONSENT_REQUIRE = {
  [ONETRUST_CONSENT.analytics]: ['ga4'],
  [ONETRUST_CONSENT.marketing]: ['braze'],
};

export const ONETRUST_SDK_INITED_EVENT_NAME = 'ONETRUST_SDK_INITED';
export const ONETRUST_CONSENT_CHANGE_EVENT_NAME = 'ONETRUST_CONSENT_CHANGED';
export const ONETRUST_CONSENT_READY_EVENT_NAME = 'ONETRUST_CONSENT_READY';

let instance: Onetrust;

export class Onetrust {
  consents: OneTrustConsents = [];

  tcfString: string = '';

  blockedAnalyticsEventKeys: EventTypes[] = [];

  blockedLocalDataKeys: string[] = [];

  isConsentReady: boolean = false;

  static get instance() {
    if (!instance) {
      instance = new this();
    }
    return instance;
  }

  private constructor() {
    if (__CLIENT__) {
      // The OT SDK is load asynchronously
      // We will dispatch ONETRUST_SDK_INITED_EVENT_NAME event once the SDK is inited
      /* istanbul ignore next */
      document.addEventListener(ONETRUST_SDK_INITED_EVENT_NAME, () => {
        this.listenConsentChanges();
        this.initBlockLists();
      });
      if (!window.__IS_GDPR_ENABLED__) {
        return;
      }
      if (__ISOTT__) {
        this.listenConsentChanges();
      }
    }
  }

  listenConsentChanges = () => {
    if (__ISOTT__ && window.oneTrustTV) {
      const observable = window.oneTrustTV.eventListener();
      observable.subscribe(() => {
        window.oneTrustTV.getPurposeConsentStatus(undefined, (error, data) => {
          if (data) {
            this.onConsentChanges(data);
          }
        });
      });
    }
    if (__WEBPLATFORM__) {
      // For Web
      // OnConsentChanged will not be called when init app
      // We need call this manually
      this.onConsentChanges(this.getWebConsents());
      window.OneTrust.OnConsentChanged(() => {
        this.onConsentChanges(this.getWebConsents());
      });
    }
  };

  // For Web, the OT SDK does not direct way to get consent status
  // We have to filter the status by ourself
  getWebConsents = () => {
    // We will get active consent string like `,C0001,C0003,`
    const activeGroupsString = window.OnetrustActiveGroups || '';
    const activeGroup = activeGroupsString.split(',').filter(Boolean);
    const consents: OneTrustConsents = activeGroup.map(item => ({
      id: item,
      consent: 1,
    }));
    return consents;
  };

  onConsentChanges = async (consents: OneTrustConsents) => {
    if (isEqual(consents, this.consents)) {
      return;
    }
    const hasConsents = !!this.consents.length;
    this.setConsents(consents);
    await this.setTCFString();
    this.initBlockLists();
    const event = new CustomEvent(ONETRUST_CONSENT_CHANGE_EVENT_NAME, { detail: { consents, tcf: this.tcfString } });
    document.dispatchEvent(event);
    // Notify that we get initial consents form Onetrust
    /* istanbul ignore next */
    if (!hasConsents && consents.length) {
      this.isConsentReady = true;
      document.dispatchEvent(new Event(ONETRUST_CONSENT_READY_EVENT_NAME));
    }
  };

  initBlockLists = () => {
    this.blockedAnalyticsEventKeys = this.getBlockedList(window.__REMOTE_CONFIG__.blockedAnalyticsEvents);
    this.blockedLocalDataKeys = this.getBlockedList(window.__REMOTE_CONFIG__.blockedLocalData);
  };

  setConsents = (consents: OneTrustConsents) => {
    this.consents = consents;
  };

  getBlockedList = <T>(blockMap: Record<string, T[]> = {}): T[] => {
    if (__SERVER__) {
      return [];
    }
    let blockedList: T[] = [];
    Object.entries(blockMap).forEach(([key, list]) => {
      const consented = !!this.getConsentStatus(key as ONETRUST_CONSENT);
      if (!consented) {
        blockedList = [...blockedList, ...list];
      }
    });
    return blockedList;
  };

  canSetLocalData = (key: string) => {
    if (__CLIENT__ && window.__IS_GDPR_ENABLED__) {
      return !this.blockedLocalDataKeys.includes(key);
    }
    return true;
  };

  canSendAnalyticsEvents = (key: EventTypes) => {
    if (__CLIENT__ && window.__IS_GDPR_ENABLED__) {
      return !this.blockedAnalyticsEventKeys.includes(key);
    }
    return true;
  };

  canSendClientLog = () => {
    if (__CLIENT__ && window.__IS_GDPR_ENABLED__) {
      return !!this.getConsentStatus(ONETRUST_CONSENT.analytics);
    }
    return true;
  };

  canSendAnalyticsIngestionV3 = () => {
    if (__CLIENT__ && window.__IS_GDPR_ENABLED__) {
      return !!this.getConsentStatus(ONETRUST_CONSENT.analytics);
    }
    return true;
  };

  canUsePlayerFeedback = () => {
    return !(__CLIENT__ && window.__IS_GDPR_ENABLED__);
  };

  canLocallySaveVODQosLogOnInterval = () => {
    return !(__CLIENT__ && window.__IS_GDPR_ENABLED__);
  };

  getConsentStatus = (key: ONETRUST_CONSENT) => {
    return this.consents.find((item) => item.id === key)?.consent;
  };

  // We need to pass GDPR parameters to rainmaker
  // See: https://www.notion.so/tubi/Standard-CMP-Implementation-Evaluation-83c9793d38704812b3e8ed670f2ec9d3?pvs=4#7127197050b74b6a9c34d0f40a4e74c5
  getRainmakerParams = () => {
    const defaultRainmakerParams = {
      query: {
        gdpr: 0,
      },
      header: undefined,
    } as const;
    if (!window.__IS_GDPR_ENABLED__) {
      return defaultRainmakerParams;
    }
    /* istanbul ignore next */
    const tcfString = this.tcfString || (__ISOTT__ && supportsLocalStorage() ? localStorage.getItem('IABTCF_TCString') : Cookie.load('eupubconsent-v2'));
    // If somehow we didn't get tcf string, e.g some error on Onetrust side
    // We want to send the default params instead of params with empty tcf string
    if (!tcfString) {
      logger.info('No tcf string when get rainmaker params');
      return defaultRainmakerParams;
    }
    const query = {
      gdpr: 1,
      gdpr_analytics: this.getConsentStatus(ONETRUST_CONSENT.analytics) ? 1 : 0,
      gdpr_personalized_ads: this.getConsentStatus(ONETRUST_CONSENT.personalized_advertising) ? 1 : 0,
    } as const;
    const header = {
      'X-Tubi-TCF-String': tcfString,
    } as const;
    return {
      query,
      header,
    } as const;
  };

  getTCFString = (): Promise<string> => new Promise((resolve, reject) => {
    if (__SERVER__) {
      resolve('');
      return;
    }
    if (__WEBPLATFORM__) {
      if (!window.OneTrust.getVendorConsentsRequestV2) {
        reject('getVendorConsentsRequestV2 API does not exist');
      }
      // See: https://developer.onetrust.com/onetrust/docs/javascript-api#get-vendor-consent-requests
      window.OneTrust.getVendorConsentsRequestV2((tcData) => {
        if (tcData) {
          resolve(tcData.tcString);
        } else {
          reject('Did not get tcf string from OT API');
        }
      });
    }
    if (__ISOTT__) {
      if (!supportsLocalStorage()) {
        return reject('Device does not support localStorage');
      }
      // see: https://developer.onetrust.com/onetrust/docs/iab-tcf-22#accessing-tc-data
      const tcfString = localStorage.getItem('IABTCF_TCString');
      if (!tcfString) {
        return reject('TCF string does not exist in localStorage');
      }
      resolve(tcfString);
    }
  });

  setTCFString = async () => {
    if (__SERVER__) {
      return;
    }
    try {
      this.tcfString = await this.getTCFString();
    } catch (e) {
      // TODO: revisit the errors from onetrust to see if we need have further actions
      logger.info('error onetrust setTCFString', e);
    }
  };
}
