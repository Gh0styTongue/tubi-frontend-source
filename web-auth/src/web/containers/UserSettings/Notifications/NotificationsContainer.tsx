import type { History } from 'history';
import React, { useState, useEffect } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import type { ConnectedProps } from 'react-redux';
import { connect } from 'react-redux';
import type { Route, WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { updateUserSettings } from 'common/actions/userSettings';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';

import type { SubscribeOption } from './Notifications';
import Notifications from './Notifications';

const messages = defineMessages({
  warn: {
    description: 'warning message for unsaved changes',
    defaultMessage: 'Navigating away will discard your new settings. Are you sure you want to leave?',
  },
  generalError: {
    description: 'general error message',
    defaultMessage: 'Something went wrong...',
  },
  weekly: {
    description: 'weekly newsletter option text for user notification emails',
    defaultMessage: 'Weekly newsletter',
  },
  personalizedEmails: {
    description: 'personalized option text for user notification emails',
    defaultMessage: 'Personalised emails',
  },
  personalizedEmailsDesc: {
    description: 'Personalized emails description text',
    defaultMessage: 'Tubi uses account information to personalise emails and recommendations. You can unsubscribe at any time.',
  },
});

interface StateProps {
  newsletter: boolean;
  personalizedEmails: boolean;
  contentLeaving: boolean;
  isMobile: boolean;
}

interface DispatchProps {
  dispatch: TubiThunkDispatch;
}

interface OwnProps extends WithRouterProps {
  intl: IntlShape;
  history: History;
  route: Route;
}

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & DispatchProps & OwnProps;

export const NotificationsContainer: React.FC<Props> = ({
  intl,
  dispatch,
  route,
  router,
  newsletter,
  personalizedEmails,
  contentLeaving,
  isMobile,
}) => {
  const [formState, setFormState] = useState({
    newsletter,
    personalizedEmails,
    contentLeaving,
    unsaved: false,
    updateErrorMessage: '',
  });

  const location = useLocation();

  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);

  useEffect(() => {
    if (!isMobile) {
      router.setRouteLeaveHook(route, () => {
        /* istanbul ignore next */
        if (formState.unsaved) {
          return intl.formatMessage(messages.warn);
        }
      });
    }
  }, [intl, router, route, formState.unsaved, isMobile]);

  /* istanbul ignore next */
  const handleSelect = (key?: string | undefined) => {
    key && setFormState((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
      unsaved: true,
    }));
  };

  const handleSave = () => {
    const { newsletter, contentLeaving, personalizedEmails, unsaved } = formState;

    /* istanbul ignore next */
    if (!unsaved) return Promise.reject();

    const newUserSettings = {
      notification_settings: {
        newsletter,
        content_leaving: contentLeaving,
        gdpr_personalized_emails: personalizedEmails,
      },
    };

    return dispatch(updateUserSettings(location, newUserSettings))
      .then(() => setFormState(/* istanbul ignore next */(prevState) => ({ ...prevState, unsaved: false, updateErrorMessage: '' })))
      .catch(/* istanbul ignore next */(err: Error & { messages?: Record<string, string>[] }) => {
        const updateErrorMessage =
          err.message || (err.messages && err.messages[0].message) || intl.formatMessage(messages.generalError);
        setFormState((prevState) => ({ ...prevState, updateErrorMessage }));
        return Promise.reject();
      });
  };

  const optionStatus: SubscribeOption[] = [
    { text: intl.formatMessage(messages.weekly), key: 'newsletter', selected: formState.newsletter },
    ...(isGDPREnabled ? [{
      text: intl.formatMessage(messages.personalizedEmails),
      key: 'personalizedEmails',
      selected: formState.personalizedEmails,
      description: intl.formatMessage(messages.personalizedEmailsDesc),
    }] : []),
    // Coming V2:
    // {text: 'Notifications when titles in your history or queue are no longer available', key: 'contentLeaving', selected: formState.contentLeaving},
  ];

  return (
    <Notifications
      handleSave={handleSave}
      subscribeOptions={optionStatus}
      handleSelect={handleSelect}
      updateErrorMessage={formState.updateErrorMessage}
      unsaved={formState.unsaved}
    />
  );
};

const mapStateToProps = (state: StoreState): StateProps => {
  const { newsletter, content_leaving: contentLeaving, gdpr_personalized_emails: personalizedEmails } = state.userSettings.notification_settings;
  return {
    newsletter,
    contentLeaving,
    isMobile: state.ui.isMobile,
    personalizedEmails: !!personalizedEmails,
  };
};

const connector = connect(mapStateToProps);

export default connector(injectIntl(withRouter(NotificationsContainer)));
