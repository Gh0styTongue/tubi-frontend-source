import type { History } from 'history';
import type { Store, Unsubscribe } from 'redux';

import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import {
  ONETRUST_CONSENT_CHANGE_EVENT_NAME,
  THIRD_PARTY_SDK_CONSENT_REQUIRE,
} from 'common/features/gdpr/onetrust/onetrust';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type StoreState from 'common/types/storeState';

import Braze from './braze';
import CastSender from './castSender';
import GA4 from './ga4';
import Sentry from './sentry';
import type { ThirdPartyScript } from './thirdPartyScript';

const observeStore = <T>(
  store: Store<StoreState>,
  selector: (state: StoreState) => T,
  onChange: (value: T) => void
) => {
  let currentState: T;

  function handleChange() {
    const nextState = selector(store.getState());
    if (nextState !== currentState) {
      currentState = nextState;
      onChange(currentState);
    }
  }

  const unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
};

class ThirdPartySDKManager {
  private scripts: Set<ThirdPartyScript> = new Set<ThirdPartyScript>();

  private unsubscribe: Unsubscribe | undefined;

  private unlisten: ReturnType<History['listen']> | undefined;

  constructor(private store: Store<StoreState>, private history: History) {}

  load() {
    const state = this.store.getState();
    const {
      ui: {
        userAgent: { ua },
      },
    } = state;
    const isChromeIOS = ua ? ua.includes('CriOS') : false;
    const needCastSdk = !__ISOTT__ && !isChromeIOS;

    [
      new Sentry(),
      needCastSdk ? new CastSender() : null,
      !__ISOTT__ ? new Braze() : null,
      !__ISOTT__ ? new GA4() : null,
    ].forEach((script) => {
      if (!script) {
        return;
      }
      this.scripts.add(script);
      script.onAppStart?.(state);
    });
    return this;
  }

  onConsentChanges = () => {
    const blockedList = OnetrustClient.getBlockedList(THIRD_PARTY_SDK_CONSENT_REQUIRE);
    this.scripts.forEach(script => {
      if (blockedList.includes(script.name)) {
        script.disable?.();
      } else {
        script.loadAndInit?.(this.store.getState());
      }
    });
  };

  setupTracking() {
    const isGDPREnabled = isGDPREnabledSelector(this.store.getState());
    // In GDPR country, we need to load SDK based on consent
    // It will call `loadAndInit` based on consent
    if (isGDPREnabled) {
      document.addEventListener(ONETRUST_CONSENT_CHANGE_EVENT_NAME, this.onConsentChanges);
      this.unsubscribe = () => {
        document.removeEventListener(ONETRUST_CONSENT_CHANGE_EVENT_NAME, this.onConsentChanges);
      };
      return;
    }
    this.unsubscribe = observeStore(this.store, isThirdPartySDKTrackingEnabledSelector, (isThirdPartySDKTrackingEnabled) => {
      const state = this.store.getState();
      if (isThirdPartySDKTrackingEnabled) {
        /* istanbul ignore next */
        this.scripts.forEach((script) => script.onCoppaCompliant?.(state));
      } else {
        /* istanbul ignore next */
        this.scripts.forEach((script) => script.onCoppaNotCompliant?.(state));
      }
    });

    this.unlisten = this.history.listen((location) => {
      this.scripts.forEach((script) => script.onRouteChange?.(location));
    });
  }

  /* istanbul ignore next */
  destroy() {
    this.scripts.clear();
    this.unsubscribe?.();
    this.unlisten?.();
  }
}

let manager: ThirdPartySDKManager | undefined;

export default function create(store: Store<StoreState>, history: History) {
  return manager || (manager = new ThirdPartySDKManager(store, history));
}

export const reset = () => {
  manager = undefined;
};
