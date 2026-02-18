import throttle from 'lodash/throttle';

import { CUSTOM_EVENT_NAME, CUSTOM_EVENT_TYPES } from 'common/constants/constants';
import type { ExperimentDescriptor } from 'common/experimentV2/configs/types';

type LoginRequiredEventData = {
  originalUrl: string;
};

type AnonymousTokenRefreshedEventData = {
  accessToken: string;
};

type ExperimentExposureEventData = ExperimentDescriptor;

type CustomEventData = LoginRequiredEventData | AnonymousTokenRefreshedEventData | ExperimentExposureEventData;

// APIs are normally called in batches in proxy.ts, which means multiple custom errors (such as
// the "USER_NOT_FOUND" error) may be raised within a short time period. To handle the error more
// efficiently, it’s better to throttle the event dispatching and process the error only once.
const dispatchCustomEvent = (type: string, data?: CustomEventData) =>
  throttle(
    () => {
      window.dispatchEvent(
        new CustomEvent(CUSTOM_EVENT_NAME, {
          detail: {
            ...data,
            type,
          },
        })
      );
    },
    200,
    {
      leading: true,
      trailing: false,
    }
  );

export const dispatchUserNotFoundEvent = dispatchCustomEvent(CUSTOM_EVENT_TYPES.USER_NOT_FOUND);

export const dispatchLoginRequiredEvent = (data: LoginRequiredEventData) =>
  dispatchCustomEvent(CUSTOM_EVENT_TYPES.LOGIN_REQUIRED, data)();

export const dispatchAnonymousTokenRefreshedEvent = (data: AnonymousTokenRefreshedEventData) =>
  dispatchCustomEvent(CUSTOM_EVENT_TYPES.ANONYMOUS_TOKEN_REFRESHED, data)();

