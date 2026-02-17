import { isSameDay, toAMOrPM } from '@adrise/utils/lib/time';
import { LockClosed24, BellNotification, BellNotificationFilled, Live24 } from '@tubitv/icons';
import type { ReactNode } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';

import { useLocation } from 'common/context/ReactRouterModernContext';
import { usePurpleCarpet } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import { shouldLockPurpleCarpetSelector } from 'common/features/purpleCarpet/selector';
import { PurpleCarpetContentStatus } from 'common/features/purpleCarpet/type';
import useAppSelector from 'common/hooks/useAppSelector';
import { isDetailsPageUrl } from 'common/utils/urlPredicates';
import { useIntl } from 'i18n/intl';

export const messages = defineMessages({
  signInToWatch: {
    description: 'Sign in to watch button text',
    defaultMessage: 'Sign In to Watch',
  },
  setReminder: {
    description: 'Add the video you loved into your reminder list so that you will be reminded when it\'s available',
    defaultMessage: 'Set Reminder',
  },
  reminderSet: {
    description: 'State shows you have set the video into your reminder list',
    defaultMessage: 'Remove Reminder',
  },
  details: {
    description: 'Go to details page',
    defaultMessage: 'Details',
  },
  watchLive: {
    description: 'Watch Live button',
    defaultMessage: 'Watch Live',
  },
  watchLiveInApp: {
    description: 'Watch Live on App',
    defaultMessage: 'Watch Live in the App',
  },
  availableAt: {
    description: 'The available time of the game',
    defaultMessage: 'Available at {time}',
  },
  notAvailable: {
    description: 'The game is not available',
    defaultMessage: 'Not available',
  },
  free: {
    description: 'FREE tag on registration button',
    defaultMessage: 'FREE',
  },
});

export type ActionButtonStatus =
  | 'signin_required'
  | 'set_reminder'
  | 'reminder_set'
  | 'live'
  | 'available'
  | 'not_available'
  | 'details';

export const useActionButton = (id: string) => {
  const shouldLockPurpleCarpet = useAppSelector(shouldLockPurpleCarpetSelector);
  const isReminderSet = useAppSelector((state) => !!state.reminder.contentIdMap[id]);
  const intl = useIntl();
  const { current: currentEvent } = usePurpleCarpet(id);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const location = useLocation();

  if (!currentEvent) {
    return {
      buttonStatus: 'not_available' as ActionButtonStatus,
      message: intl.formatMessage(messages.notAvailable),
    };
  }
  const { startTime, status: contentStatus } = currentEvent;

  const buttons: Record<ActionButtonStatus, { message: ReactNode; icon?: ReactNode; iconComp?: React.ComponentType<Omit<React.SVGProps<SVGSVGElement>, 'ref'>>; }> = {
    signin_required: {
      message: intl.formatMessage(messages.signInToWatch),
      icon: <LockClosed24 />,
      iconComp: LockClosed24,
    },
    set_reminder: {
      message: intl.formatMessage(messages.setReminder),
      icon: <BellNotification />,
      iconComp: BellNotification,
    },
    reminder_set: {
      message: intl.formatMessage(messages.reminderSet),
      icon: <BellNotificationFilled />,
      iconComp: BellNotificationFilled,
    },
    live: {
      message: isMobile ? intl.formatMessage(messages.watchLiveInApp) : intl.formatMessage(messages.watchLive),
      icon: <Live24 />,
      iconComp: Live24,
    },
    available: {
      message: intl.formatMessage(messages.availableAt, {
        time: toAMOrPM(startTime),
      }),
    },
    not_available: {
      message: intl.formatMessage(messages.notAvailable),
    },
    details: {
      message: intl.formatMessage(messages.details),
    },
  };

  let buttonStatus: ActionButtonStatus = 'not_available';

  // Game ended, always show not available
  if (contentStatus === PurpleCarpetContentStatus.Ended) {
    buttonStatus = 'not_available';
  } else if (shouldLockPurpleCarpet) {
    buttonStatus = 'signin_required';
  } else {
    if (contentStatus === PurpleCarpetContentStatus.Live) {
      buttonStatus = 'live';
    } else {
      if (isSameDay(new Date(startTime!), new Date())) {
        buttonStatus = 'available';
      } else {
        buttonStatus = isReminderSet ? 'reminder_set' : 'set_reminder';
      }
    }

    // For OTT, if the button is not on the details page
    // we should take user to details page
    if (__ISOTT__) {
      const isDetailsPage = isDetailsPageUrl(location.pathname);
      if (!isDetailsPage && contentStatus === PurpleCarpetContentStatus.NotStarted) {
        buttonStatus = 'details';
      }
    }
  }
  return {
    buttonStatus,
    ...buttons[buttonStatus],
  };
};
