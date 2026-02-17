declare global {
  interface Window {
    ga: ((command: string, fieldsObject: unknown) => void) | undefined;
  }
}

export enum GoogleAnalyticsEventCat {
  WEB = 'web',
}
export enum GoogleAnalyticsEventAction {
  REGISTER = 'register',
}
export enum GoogleAnalyticsEventLabel {
  EMAIL = 'email',
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
  GOOGLE_ONE_TAP = 'google_one_tap',
}

interface EventPayload {
  eventCategory: GoogleAnalyticsEventCat;
  eventAction: GoogleAnalyticsEventAction;
  eventLabel: GoogleAnalyticsEventLabel;
}
/*
 * Google analytics: send event
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 */
export const sendGoogleAnalyticsEvent = (payload: EventPayload) => {
  /* istanbul ignore else */
  if (window && window.ga) {
    window.ga('send', {
      hitType: 'event',
      ...payload,
    });
  }
};

// https://developers.google.com/tag-platform/gtagjs/reference/events
export const sendGA4Event = (eventName: string, eventValue: any) => {
  /* istanbul ignore else */
  if (window && window.gtag) {
    window.gtag('event', eventName, eventValue);
  }
};
