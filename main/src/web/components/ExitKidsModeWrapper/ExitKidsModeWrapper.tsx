import type { ReactElement } from 'react';
import type React from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import { addNotification, toggleAgeGateModal } from 'common/actions/ui';
import { WEB_ROUTES } from 'common/constants/routes';
import { isCoppaExitKidsModeEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isParentalRatingKidsSelector } from 'common/selectors/userSettings';
import type { Notification } from 'common/types/ui';
import { doesAgeGateCookieExist } from 'common/utils/ageGate';
import { setKidsModeStatusInCookie, kidsModeToggleRedirect } from 'common/utils/webKidsModeTools';

export interface ExitKidsModeWrapperProps {
  children: (handleExitKidsMode: (e: React.MouseEvent<HTMLElement>) => void) => ReactElement;
}

const messages = defineMessages({
  exitTitle: {
    description: 'notification title text',
    defaultMessage: 'Exit Kids Mode',
  },
  exitParentalDescription: {
    description: 'notification description text',
    defaultMessage: 'To exit Kids Mode please update your parental controls in account settings',
  },
  goToSettings: {
    description: 'notification description text to go to settings',
    defaultMessage: 'Go to Settings',
  },
  cancel: {
    description: 'notification button text to close modal',
    defaultMessage: 'Cancel',
  },
});

const getExitKidsModeNotification = (intl: IntlShape): Notification => ({
  title: intl.formatMessage(messages.exitTitle),
  description: intl.formatMessage(messages.exitParentalDescription),
  status: 'info',
  autoDismiss: false,
  buttons: [
    {
      title: intl.formatMessage(messages.goToSettings),
      primary: true,
      action:
        /* istanbul ignore next */
        () => {
          tubiHistory.push(WEB_ROUTES.parentalControl);
        },
    },
    {
      title: intl.formatMessage(messages.cancel),
    },
  ],
});

export const ExitKidsModeWrapper: React.FunctionComponent<ExitKidsModeWrapperProps> = ({ children }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const isParentalRatingKids = useAppSelector(isParentalRatingKidsSelector);
  const isCoppaExitKidsModeEnabled = useAppSelector(isCoppaExitKidsModeEnabledSelector);
  const preferredLocale = useAppSelector(state => state.ui.preferredLocale);

  const handleExitKidsMode = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (isParentalRatingKids) {
      return dispatch(addNotification(getExitKidsModeNotification(intl), 'exit-kids-prompt'));
    }

    const isAgeGateRequired = isCoppaExitKidsModeEnabled && !doesAgeGateCookieExist();

    if (isAgeGateRequired) {
      dispatch(toggleAgeGateModal({ isVisible: true, isFromExitKidsMode: true }));
    } else {
      setKidsModeStatusInCookie(false);
      kidsModeToggleRedirect(preferredLocale);
    }
  };

  return children(handleExitKidsMode);
};

export default ExitKidsModeWrapper;
