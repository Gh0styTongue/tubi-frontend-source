import { DialogAction } from '@tubitv/analytics/lib/dialog';
import { Close, EmailStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, Fragment, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, shallowEqual } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { Link, withRouter } from 'react-router';

import { toggleRemindModal } from 'common/actions/ui';
import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import { WEB_ROUTES } from 'common/constants/routes';
import { LinearPageType } from 'common/features/linearReminder/types/linearReminder';
import useAppSelector from 'common/hooks/useAppSelector';
import { remindModalSelector, viewportTypeSelector } from 'common/selectors/ui';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import Overlay from 'web/components/Overlay/Overlay';
import RegisterButton from 'web/components/RegisterButton/RegisterButton';
import loginMessages from 'web/features/authentication/components/CredentialsForm/credentialsFormMessages';
import GuestActions, { FormType } from 'web/features/authentication/components/GuestActions/GuestActions';

import styles from './RemindModal.scss';
import { trackDialogEvent, trackLinearDialogEvent, trackDialogRegisterEvent, trackDialogLoginEvent } from './track';

const messages = defineMessages({
  title: {
    description: 'title for remind modal',
    defaultMessage: 'Be the First to Know',
  },
  desc: {
    description: 'description text for remind modal',
    defaultMessage: 'We’ll let you know when {contentTitle} and other new hits arrive.',
  },
  or: {
    description: 'text for other login option',
    defaultMessage: 'OR',
  },
  register: {
    description: 'Register button text',
    defaultMessage: 'Register with Email',
  },
});

export const RemindModal: React.FC<WithRouterProps> = ({ router, routes, location }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isOpen, contentTitle, onLogin, modalDescription, showLogin, linearPageType, programId } = useAppSelector(
    remindModalSelector,
    shallowEqual
  );
  const viewportType = useAppSelector(viewportTypeSelector);
  const isMobile = viewportType === 'mobile';

  useEffect(() => {
    if (isOpen) {
      if (programId) {
        trackLinearDialogEvent({ action: DialogAction.SHOW, programId });
      } else {
        trackDialogEvent(DialogAction.SHOW);
      }
    }
  }, [isOpen, programId]);

  useEffect(() => {
    if (isOpen) {
      router.setRouteLeaveHook(routes[routes.length - 1], () => {
        dispatch(toggleRemindModal({ isOpen: false }));
      });
    }
  }, [isOpen, dispatch, router, routes]);

  const closeModal = useCallback(() => {
    dispatch(toggleRemindModal({ isOpen: false }));
    if (programId) {
      trackLinearDialogEvent({ action: DialogAction.DISMISS_DELIBERATE, programId });
    } else {
      trackDialogEvent(DialogAction.DISMISS_DELIBERATE);
    }
  }, [dispatch, programId]);

  const setupLogin = useCallback(
    (type?: 'register' | 'login') => {
      if (onLogin) {
        onLogin();
      }

      if (programId) {
        if (linearPageType === LinearPageType.linearLandingPage) {
          trackLinearDialogEvent({ action: DialogAction.ACCEPT_DELIBERATE, programId });
        }

        if (linearPageType === LinearPageType.linearEpgPage && type) {
          (type === 'register' ? trackDialogRegisterEvent : trackDialogLoginEvent)();
        }
      } else {
        trackDialogEvent(DialogAction.ACCEPT_DELIBERATE);
      }
    },
    [linearPageType, onLogin, programId]
  );

  const setupRegisterAndCloseModal = useCallback(() => {
    setupLogin('register');
    dispatch(toggleRemindModal({ isOpen: false }));
  }, [setupLogin, dispatch]);

  const setupLoginAndCloseModal = useCallback(() => {
    setupLogin('login');
    dispatch(toggleRemindModal({ isOpen: false }));
  }, [setupLogin, dispatch]);

  const signInUrl = `${WEB_ROUTES.signIn}?redirect=${getCurrentPathname()}`;

  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <Overlay isOpen={isOpen} isCloseOnEscape={false} onClickOverlay={closeModal} nodeRef={modalRef}>
      <div ref={modalRef} className={classNames(styles.modal, { [styles.isMobile]: isMobile })}>
        {isMobile ? (
          <GuestActions
            dispatch={dispatch}
            redirect={location}
            showDivider={false}
            className={styles.guestAction}
            formType={FormType.ACTIVATE}
          />
        ) : (
          <Fragment>
            <button className={styles.close} onClick={closeModal}>
              <Close fill="white" width="20" height="20" />
            </button>
            <div>
              <h1>{formatMessage(messages.title)}</h1>
              <p>{modalDescription || formatMessage(messages.desc, { contentTitle })}</p>
              <SSOButtonGroup
                googleClass={styles.button}
                buttonOnClick={setupLogin}
              />
              <div className={styles.divider}>{formatMessage(messages.or)}</div>
              <RegisterButton
                icon={EmailStroke}
                className={styles.button}
                onClick={setupRegisterAndCloseModal}
              >
                {formatMessage(messages.register)}
              </RegisterButton>
              {showLogin ? (
                <div className={styles.signIn}>
                  {formatMessage(loginMessages.ownedAccountMessage, {
                    signInLink: ([msg]: React.ReactNode[]) => (
                      <Link className={styles.link} onClick={setupLoginAndCloseModal} to={signInUrl}>
                        {msg}
                      </Link>
                    ),
                  })}
                </div>
              ) : null}
            </div>
          </Fragment>
        )}
      </div>
    </Overlay>
  );
};

export default withRouter(RemindModal);
