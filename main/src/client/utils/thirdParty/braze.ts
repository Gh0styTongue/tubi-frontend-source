import type * as Braze from '@braze/web-sdk';
import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import type { Location } from 'history';

import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import type StoreState from 'common/types/storeState';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import config from 'src/config';

import { ThirdPartyScript } from './thirdPartyScript';

declare global {
  interface Window {
    braze: typeof Braze;
  }
}

const trackDialogEvent = (action: DialogAction) => {
  const eventObj = buildDialogEvent(getCurrentPathname(), DialogType.DEVICE_PERMISSIONS, 'onboarding-push', action);
  trackEvent(eventTypes.DIALOG, eventObj);
};

export const requestPushPermission = () => {
  /* istanbul ignore else */
  if (window.braze?.isPushSupported() && !window.braze?.isPushPermissionGranted()) {
    trackDialogEvent(DialogAction.SHOW);
    window.braze?.requestPushPermission(
      () => {
        trackDialogEvent(DialogAction.ACCEPT_DELIBERATE);
      },
      () => {
        trackDialogEvent(DialogAction.DISMISS_DELIBERATE);
      }
    );
  }
};

const {
  brazeConfig: { apiKey, baseUrl },
} = config;
const RESOURCE = 'https://mcdn.tubitv.com/tubitv-assets/js/braze/4.3/braze.min.js';

export const shouldShowBrazeMessage = (pathname: string) => {
  // show IAM for pages except activation, sign in, sign up, page with player
  // because we don't want them change focus to the IAM
  return (
    !(
      [
        WEB_ROUTES.activate,
        WEB_ROUTES.signIn,
        WEB_ROUTES.register,
        WEB_ROUTES.forgotPassword,
        WEB_ROUTES.helpCenter,
      ] as string[]
    ).includes(pathname) &&
    [WEB_ROUTES.movies, WEB_ROUTES.tvShows, WEB_ROUTES.live, WEB_ROUTES.helpCenter].every(
      (prefix) => !pathname.startsWith(`${prefix}/`)
    )
  );
};

/**
 * SDK Setup:
 *  https://www.braze.com/docs/developer_guide/platform_integration_guides/web/initial_sdk_setup/
 * Tracking:
 *  https://www.braze.com/docs/developer_guide/platform_integration_guides/web/analytics/disabling_tracking
 */

class BrazeSDK extends ThirdPartyScript {
  name = 'braze';

  private message: Braze.InAppMessage | undefined;

  /* istanbul ignore next */
  protected load(onload: () => void) {
    /* eslint-disable */
    // prettier-ignore
    // @ts-ignore
    +(function (a, p, P, b, y) {
      // @ts-ignore
      a.braze = {}; a.brazeQueue = []; for (var s = 'BrazeSdkMetadata DeviceProperties Card Card.prototype.dismissCard Card.prototype.removeAllSubscriptions Card.prototype.removeSubscription Card.prototype.subscribeToClickedEvent Card.prototype.subscribeToDismissedEvent Card.fromContentCardsJson Banner CaptionedImage ClassicCard ControlCard ContentCards ContentCards.prototype.getUnviewedCardCount Feed Feed.prototype.getUnreadCardCount ControlMessage InAppMessage InAppMessage.SlideFrom InAppMessage.ClickAction InAppMessage.DismissType InAppMessage.OpenTarget InAppMessage.ImageStyle InAppMessage.Orientation InAppMessage.TextAlignment InAppMessage.CropType InAppMessage.prototype.closeMessage InAppMessage.prototype.removeAllSubscriptions InAppMessage.prototype.removeSubscription InAppMessage.prototype.subscribeToClickedEvent InAppMessage.prototype.subscribeToDismissedEvent InAppMessage.fromJson FullScreenMessage ModalMessage HtmlMessage SlideUpMessage User User.Genders User.NotificationSubscriptionTypes User.prototype.addAlias User.prototype.addToCustomAttributeArray User.prototype.addToSubscriptionGroup User.prototype.getUserId User.prototype.incrementCustomUserAttribute User.prototype.removeFromCustomAttributeArray User.prototype.removeFromSubscriptionGroup User.prototype.setCountry User.prototype.setCustomLocationAttribute User.prototype.setCustomUserAttribute User.prototype.setDateOfBirth User.prototype.setEmail User.prototype.setEmailNotificationSubscriptionType User.prototype.setFirstName User.prototype.setGender User.prototype.setHomeCity User.prototype.setLanguage User.prototype.setLastKnownLocation User.prototype.setLastName User.prototype.setPhoneNumber User.prototype.setPushNotificationSubscriptionType InAppMessageButton InAppMessageButton.prototype.removeAllSubscriptions InAppMessageButton.prototype.removeSubscription InAppMessageButton.prototype.subscribeToClickedEvent FeatureFlag FeatureFlag.prototype.getStringProperty FeatureFlag.prototype.getNumberProperty FeatureFlag.prototype.getBooleanProperty automaticallyShowInAppMessages destroyFeed hideContentCards showContentCards showFeed showInAppMessage toggleContentCards toggleFeed changeUser destroy getDeviceId initialize isPushBlocked isPushPermissionGranted isPushSupported logCardClick logCardDismissal logCardImpressions logContentCardImpressions logContentCardClick logContentCardsDisplayed logCustomEvent logFeedDisplayed logInAppMessageButtonClick logInAppMessageClick logInAppMessageHtmlClick logInAppMessageImpression logPurchase openSession requestPushPermission removeAllSubscriptions removeSubscription requestContentCardsRefresh requestFeedRefresh refreshFeatureFlags requestImmediateDataFlush enableSDK isDisabled setLogger setSdkAuthenticationSignature addSdkMetadata disableSDK subscribeToContentCardsUpdates subscribeToFeedUpdates subscribeToInAppMessage subscribeToSdkAuthenticationFailures toggleLogging unregisterPush wipeData handleBrazeAction subscribeToFeatureFlagsUpdates getAllFeatureFlags'.split(' '), i = 0; i < s.length; i++) { for (var m = s[i], k = a.braze, l = m.split('.'), j = 0; j < l.length - 1; j++)k = k[l[j]]; k[l[j]] = (new Function(`return function ${m.replace(/\./g, '_')}(){window.brazeQueue.push(arguments); return true}`))(); }window.braze.getCachedContentCards = function () { return new window.braze.ContentCards(); }; window.braze.getCachedFeed = function () { return new window.braze.Feed(); }; window.braze.getUser = function () { return new window.braze.User(); }; window.braze.getFeatureFlag = function () { return new window.braze.FeatureFlag(); }; (y = p.createElement(P)).type = 'text/javascript';
      // @ts-ignore
      y.src = RESOURCE;
      // @ts-ignore
      y.onload = onload;
      // @ts-ignore
      y.async = 1; (b = p.getElementsByTagName(P)[0]).parentNode.insertBefore(y, b);
    }(window, document, 'script'));
    /* eslint-enable */
  }

  /* istanbul ignore next */
  private enable() {
    const { braze } = window;
    // We must call initialize after enableSDK before calling other methods
    // https://js.appboycdn.com/web-sdk/latest/doc/modules/braze.html#enablesdk
    braze.enableSDK();
    braze.initialize(apiKey, {
      doNotLoadFontAwesome: true,
      enableLogging: __DEVELOPMENT__,
      serviceWorkerLocation: '/sw.js',
      baseUrl,
      manageServiceWorkerExternally: true,
      safariWebsitePushId: 'web.com.tubitv',
    });
  }

  /* istanbul ignore next */
  disable() {
    window.braze?.disableSDK();
  }

  /* istanbul ignore next */
  private init(state: StoreState) {
    const {
      auth: { deviceId },
    } = state;

    const { braze } = window;
    braze.getUser()?.addAlias(deviceId!, 'device_id');

    // manually control the show up timing of IAM
    // https://www.braze.com/docs/developer_guide/platform_integration_guides/web/in-app_messaging/in-app_message_delivery/
    braze.subscribeToInAppMessage((inAppMessage) => {
      // control group messages should always be "shown"
      // this will log an impression and not show a visible message
      // NOTE: if upgraded to 4.5.0+, use `inAppMessage.isControl`
      if (inAppMessage instanceof braze.ControlMessage) {
        return braze.showInAppMessage(inAppMessage);
      }

      if (shouldShowBrazeMessage(getCurrentPathname())) {
        braze.showInAppMessage(inAppMessage);
      } else {
        // Save the IAM for later, show it when next route is appropriate
        // Note: Braze will not show IAM when another IAM is visible, therefore we only need to keep one message
        this.message = inAppMessage;
      }
    });

    braze.openSession();
  }

  loadAndInit(state: StoreState) {
    // Braze starts to send data once the JS SDK is loaded, which violates the COPPA regulation;
    // therefore we don't load it in `onAppStart` but when user's COPPA state is compliant
    if (!window.braze) {
      return this.load(() => {
        this.enable();
        this.init(state);
      });
    }
    this.enable();
  }

  onCoppaCompliant(state: StoreState) {
    this.loadAndInit(state);
  }

  onCoppaNotCompliant() {
    this.disable();
  }

  onRouteChange(location: Location) {
    if (this.message && shouldShowBrazeMessage(location.pathname)) {
      /* istanbul ignore next */
      window.braze?.showInAppMessage(this.message);
      delete this.message;
    }
  }
}

export default BrazeSDK;
