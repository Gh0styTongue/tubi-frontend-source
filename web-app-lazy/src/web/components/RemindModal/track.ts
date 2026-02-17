import type { DialogAction } from '@tubitv/analytics/lib/dialog';
import { DialogType } from '@tubitv/analytics/lib/dialog';
import { LoginChoiceType } from '@tubitv/analytics/lib/pages';
import { ProgressType } from '@tubitv/analytics/lib/registerEvent';

import * as eventTypes from 'common/constants/event-types';
import { buildDialogEvent, trackRegisterEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track/default';

/**
 * Analytics events for VOD reminder
 * https://docs.google.com/document/d/1HfOwyxq3UnXW9wue5CgFWDMEHugGE0sstg7D5N_jp5M/edit#heading=h.szyiw536iqrw
 */
export const trackDialogEvent = (action: DialogAction) => {
  const eventObj = buildDialogEvent(getCurrentPathname(), DialogType.SIGNIN_REQUIRED, 'remind_me', action, {
    isUpcoming: true,
  });
  trackEvent(eventTypes.DIALOG, eventObj);
};

/**
 * Analytics events for linear reminder
 * https://docs.google.com/document/d/1LnkPi-zvrzL5ajluljQLffZ65n_e7MzjbeWWBW05cgg
 * https://docs.google.com/document/d/15HO4py1E-p__mz-cm_GsnbNfkVVsjdvXsqL3hH_8vdY
 */
interface TrackLinearDialogEventParams {
  action: DialogAction;
  programId: number;
}

export const trackLinearDialogEvent = ({ action, programId }: TrackLinearDialogEventParams) => {
  const dialogEvent = buildDialogEvent(getCurrentPathname(), DialogType.REGISTRATION, 'set_reminder', action, {
    video_id: programId,
  });
  trackEvent(eventTypes.DIALOG, dialogEvent);
};

export const trackDialogRegisterEvent = () => {
  trackRegisterEvent({
    progress: ProgressType.CLICKED_SIGNIN,
    current: LoginChoiceType.EMAIL,
  });
};

export const trackDialogLoginEvent = () => {
  trackRegisterEvent({
    progress: ProgressType.CLICKED_SIGNIN,
    current: LoginChoiceType.EMAIL_OR_FACEBOOK,
  });
};
