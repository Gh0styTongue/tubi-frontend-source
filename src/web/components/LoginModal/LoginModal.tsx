import { Close, EmailStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, Fragment, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, shallowEqual } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { Link, withRouter } from 'react-router';

import { toggleLoginModal } from 'common/actions/ui';
import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { loginModalSelector, viewportTypeSelector } from 'common/selectors/ui';
import type { LoginModal as LoginModalType } from 'common/types/ui';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import Overlay from 'web/components/Overlay/Overlay';
import RegisterButton from 'web/components/RegisterButton/RegisterButton';
import loginMessages from 'web/features/authentication/components/CredentialsForm/credentialsFormMessages';
import GuestActions, { FormType } from 'web/features/authentication/components/GuestActions/GuestActions';

import styles from './LoginModal.scss';
import { messages } from './loginModalMessages';

export const LoginModal: React.FC<WithRouterProps> = ({ router, routes, location }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { title, isOpen, onLogin, description, showLogin, onOpen, onClose } = useAppSelector(
    loginModalSelector,
    shallowEqual
  ) as Partial<Omit<Extract<LoginModalType, { isOpen: true }>, 'isOpen'>> & { isOpen: boolean; };
  const viewportType = useAppSelector(viewportTypeSelector);
  const isMobile = viewportType === 'mobile';

  useEffect(() => {
    onOpen?.();
  }, [onOpen]);

  useEffect(() => {
    if (isOpen) {
      router.setRouteLeaveHook(routes[routes.length - 1], () => {
        dispatch(toggleLoginModal({ isOpen: false }));
      });
    }
  }, [isOpen, dispatch, router, routes]);

  const closeModal = useCallback(() => {
    dispatch(toggleLoginModal({ isOpen: false }));
    onClose?.();
  }, [dispatch, onClose]);

  const setupLogin = useCallback(
    (type?: 'register' | 'login') => {
      if (onLogin) {
        onLogin(type);
      }
    },
    [onLogin]
  );

  const setupRegisterAndCloseModal = useCallback(() => {
    setupLogin('register');
    dispatch(toggleLoginModal({ isOpen: false }));
  }, [setupLogin, dispatch]);

  const setupLoginAndCloseModal = useCallback(() => {
    setupLogin('login');
    dispatch(toggleLoginModal({ isOpen: false }));
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
              <h1>{title}</h1>
              <p>{description}</p>
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

export default withRouter(LoginModal);
