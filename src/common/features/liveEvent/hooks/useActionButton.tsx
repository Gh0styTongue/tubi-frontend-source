/**
 * @file Hook for determining the appropriate action button for live events.
 * Returns button status, message, and icon based on event state, user login status, and device support.
 */

import { BellNotification, BellNotificationFilled, Live24, Account24, Play } from '@tubitv/icons';
import type { ReactNode } from 'react';
import type React from 'react';
import { defineMessages } from 'react-intl';

import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { useLiveEvent } from 'common/features/liveEvent/hooks/useLiveEvent';
import { isLiveEventSupportedSelector, shouldLockLiveEventSelector } from 'common/features/liveEvent/selectors';
import useAppSelector from 'common/hooks/useAppSelector';
import { useHasReminder } from 'common/hooks/useQueue/useHasReminder';
import { removeLeadingZero } from 'common/utils/removeLeadingZero';
import { isDetailsPageUrl, isWebLiveEventDetailsUrl } from 'common/utils/urlPredicates';
import { useIntl } from 'i18n/intl';

import { LiveEventContentStatus } from '../types';

/** Internationalized messages for action button labels */
export const messages = defineMessages({
  signInToLiveWatch: {
    description: 'Sign in to watch live button text',
    defaultMessage: 'Sign In to Watch Live',
  },
  signInToWatch: {
    description: 'Sign in to watch button text',
    defaultMessage: 'Sign In to Watch',
  },
  setReminder: {
    description: 'Add the video you loved into your reminder list so that you will be reminded when it\'s available',
    defaultMessage: 'Set Reminder',
  },
  reminderSet: {
    description: 'Remove reminder button text',
    defaultMessage: 'Remove Reminder',
  },
  details: {
    description: 'Go to details page',
    defaultMessage: 'More Details',
  },
  detailsOnWeb: {
    description: 'Go to details page',
    defaultMessage: 'Details',
  },
  // web user
  watchLive: {
    description: 'Watch Live button',
    defaultMessage: 'Watch Live',
  },
  // mobile guest user
  watchInTheApp: {
    description: 'Watch in the App',
    defaultMessage: 'Watch in the App',
  },
  // mobile logged in user
  watchLiveInTheApp: {
    description: 'Watch Live in the App',
    defaultMessage: 'Watch Live in the App',
  },
  play: {
    description: 'Play button',
    defaultMessage: 'Play',
  },
  notAvailable: {
    description: 'The game is not available',
    defaultMessage: 'Content Unavailable',
  },
  free: {
    description: 'FREE tag on registration button',
    defaultMessage: 'FREE',
  },
  howToWatch: {
    description: 'How to watch button text',
    defaultMessage: 'How to Watch',
  },
});

/** Possible statuses for the live event action button */
export type ActionButtonStatus =
  | 'signin_required'
  | 'set_reminder'
  | 'reminder_set'
  | 'live'
  | 'play'
  | 'not_available'
  | 'details'
  | 'how_to_watch';

/**
 * Hook that determines the appropriate action button for a live event.
 * Considers event status, user authentication, device support, and current page context.
 * @param id - Content ID of the live event
 * @param options - Optional configuration with forceButtonStatus to override computed status
 * @returns Object with buttonStatus, message, and optional icon component
 */
export const useActionButton = (id: string, { forceButtonStatus }: { forceButtonStatus?: ActionButtonStatus } = {}) => {
  const shouldLockLiveEvent = useAppSelector(shouldLockLiveEventSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const { hasReminder: isReminderSet } = useHasReminder(removeLeadingZero(id));
  const intl = useIntl();
  const liveEvent = useLiveEvent(id);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const location = useLocation();
  const isSupportedDevice = useAppSelector(state => isLiveEventSupportedSelector(state, id));

  if (!liveEvent) {
    return {
      buttonStatus: 'not_available' as ActionButtonStatus,
      message: intl.formatMessage(messages.notAvailable),
    };
  }
  const { status: contentStatus } = liveEvent;
  const isLive = contentStatus === LiveEventContentStatus.Live;

  const buttons: Record<ActionButtonStatus, { message: ReactNode; icon?:React.ComponentType<Omit<React.SVGProps<SVGSVGElement>, 'ref'>>; }> = {
    signin_required: {
      message: isMobile
        ? intl.formatMessage(isLive ? messages.watchLiveInTheApp : messages.watchInTheApp)
        : isLive ? intl.formatMessage(messages.signInToLiveWatch) : intl.formatMessage(messages.signInToWatch),
      icon: isMobile ? Live24 : Account24,
    },
    set_reminder: {
      message: intl.formatMessage(messages.setReminder),
      icon: BellNotification,
    },
    reminder_set: {
      message: intl.formatMessage(messages.reminderSet),
      icon: BellNotificationFilled,
    },
    live: {
      message: isMobile
        ? intl.formatMessage(messages.watchLiveInTheApp)
        : intl.formatMessage(messages.watchLive),
      icon: Live24,
    },
    play: {
      message: intl.formatMessage(messages.play),
      icon: Play,
    },
    not_available: {
      message: intl.formatMessage(messages.notAvailable),
    },
    details: {
      message: __ISOTT__ ? intl.formatMessage(messages.details) : intl.formatMessage(messages.detailsOnWeb),
    },
    how_to_watch: {
      message: intl.formatMessage(messages.howToWatch),
    },
  };

  let buttonStatus: ActionButtonStatus = 'not_available';

  // Game ended, always show not available
  if (forceButtonStatus) {
    buttonStatus = forceButtonStatus;
  } else if (contentStatus === LiveEventContentStatus.Ended) {
    buttonStatus = 'not_available';
  } else if (!isSupportedDevice) {
    buttonStatus = 'how_to_watch';
  } else if (shouldLockLiveEvent && liveEvent.needs_login) {
    buttonStatus = 'signin_required';
  } else {
    if (contentStatus === LiveEventContentStatus.Live) {
      buttonStatus = 'live';
    } else {
      buttonStatus = isReminderSet && isLoggedIn ? 'reminder_set' : 'set_reminder';

      if (__WEBPLATFORM__) {
        const isLiveEventDetailsPage = isWebLiveEventDetailsUrl(location.pathname);
        if (!isLiveEventDetailsPage) {
          buttonStatus = 'details';
        }
      }
    }

    // we should take user to details page
    if (__ISOTT__) {
      const isDetailsPage = isDetailsPageUrl(location.pathname);
      if (!isDetailsPage && contentStatus === LiveEventContentStatus.NotStarted) {
        buttonStatus = 'details';
      }
    }
  }
  return {
    buttonStatus,
    ...buttons[buttonStatus],
  };
};
