/**
 * Analytics events for linear reminder
 * https://docs.google.com/document/d/1LnkPi-zvrzL5ajluljQLffZ65n_e7MzjbeWWBW05cgg
 * https://docs.google.com/document/d/15HO4py1E-p__mz-cm_GsnbNfkVVsjdvXsqL3hH_8vdY
 */
import type { UserInteraction } from '@tubitv/analytics/lib/componentInteraction';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';

import * as eventTypes from 'common/constants/event-types';
import { buildDialogEvent, buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import { LinearPageType } from '../types/linearReminder';

interface TrackRemindMeOnClickParams {
  linearPageType?: LinearPageType;
  programId: number;
}

export const trackRemindMeOnClick = ({ linearPageType, programId }: TrackRemindMeOnClickParams) => {
  if (linearPageType === LinearPageType.linearEpgPage) {
    const dialogEvent = buildDialogEvent(
      getCurrentPathname(),
      DialogType.PROGRAM_INFORMATION,
      ANALYTICS_COMPONENTS.reminderComponent,
      DialogAction.ACCEPT_DELIBERATE,
      { video_id: programId }
    );
    trackEvent(eventTypes.DIALOG, dialogEvent);
  }
};

interface TrackReminderActionParams {
  programId: number;
  redirectPath: string;
  userInteraction: UserInteraction;
}

export const trackReminderAction = ({ programId, redirectPath, userInteraction }: TrackReminderActionParams) => {
  const event = buildComponentInteractionEvent({
    pathname: redirectPath,
    userInteraction,
    component: 'REMINDER',
    section: programId,
  });
  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
};
