import classNames from 'classnames';
import type { Location } from 'history';
import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { browserHistory } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { checkIsMultipleAccountsV2Enabled } from 'common/features/authentication/utils/multipleAccounts';
import { shouldShowParentalRatingsSelector } from 'common/features/coppa/selectors/coppa';
import consentMessages from 'common/features/gdpr/messages';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import Footer from 'web/components/Footer/Footer';
import useModal from 'web/hooks/useModal';

import styles from './UserSettings.scss';

const messages = defineMessages({
  accountSettings: {
    description: 'account settings tab title',
    defaultMessage: 'Account Settings',
  },
  profile: {
    description: 'account settings tab title',
    defaultMessage: 'Profile',
  },
  parental: {
    description: 'account settings tab title',
    defaultMessage: 'Parental Controls',
  },
  contentSettings: {
    description: 'account settings tab title for content settings',
    defaultMessage: 'Content Settings',
  },
  notifications: {
    description: 'account settings tab title',
    defaultMessage: 'Notifications',
  },
  history: {
    description: 'account settings tab title',
    defaultMessage: 'Continue Watching & My List',
  },
  subtitles: {
    description: 'account settings tab title',
    defaultMessage: 'Closed Captions and Subtitles',
  },
  confirmNavToCaptionSettings: {
    description: 'confirm a new tab will be opened for closed captions and subtitles settings (this will be announced to screen readers)',
    defaultMessage: 'Closed Captions and Subtitles settings will be opened in a new tab. Are you sure you want to continue?',
  },
  confirmNavigationTitle: {
    description: 'title for navigation confirmation modal',
    defaultMessage: 'Confirm Navigation',
  },
  confirmNavigationDescription: {
    description: 'description for navigation confirmation modal explaining tab opening behavior',
    defaultMessage: 'This will open Closed Captions and Subtitles settings in a new browser tab.',
  },
  cancelButton: {
    description: 'cancel button text for navigation confirmation modal',
    defaultMessage: 'Cancel',
  },
  cancelButtonAria: {
    description: 'cancel button aria label for navigation confirmation modal',
    defaultMessage: 'Cancel - Return to previous tab',
  },
  continueButton: {
    description: 'continue button text for navigation confirmation modal',
    defaultMessage: 'Continue',
  },
});

interface UserSettingsProps {
  location: Location;
}

const ACCOUNT_ROUTES = [
  {
    element: <FormattedMessage {...messages.profile} />,
    key: 'profile',
    path: WEB_ROUTES.account,
  },
  {
    element: <FormattedMessage {...messages.parental} />,
    key: 'parental controls',
    path: WEB_ROUTES.parentalControl,
  },
  {
    element: <FormattedMessage {...messages.notifications} />,
    key: 'notifications',
    path: WEB_ROUTES.accountNotification,
  },
  {
    element: <FormattedMessage {...messages.history} />,
    key: 'history & my list',
    unavailableForMajorEventFailsafe: true,
    path: WEB_ROUTES.accountHistory,
  },
  {
    element: <FormattedMessage {...messages.subtitles} />,
    key: 'subtitles & appearance',
    path: WEB_ROUTES.customCaptions,
    openInNewTab: true,
  },
  {
    element: <FormattedMessage {...consentMessages.privacyCenter} />,
    key: 'privacy center',
    availableForGuest: true,
    path: WEB_ROUTES.accountPrivacyCenter,
  },
];

/*
 * This component is parent of all the User Settings components, and the accordion
 * Each child component is connected and handles its own state
 * Parent (through router) helps govern what is displayed with this.props.children
 */
const UserSettings = ({ children, location: { pathname } }: PropsWithChildren<UserSettingsProps>) => {
  const intl = useIntl();
  const { scrolledToTop } = useAppSelector((state) => state.ui);
  const isPrivacyEnabled = useAppSelector(isGDPREnabledSelector);
  const shouldShowParentalRatings = useAppSelector(shouldShowParentalRatingsSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{path: string} | null>(null);

  // Refs for modal buttons
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  const handleModalClose = useCallback(() => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  }, []);

  const { Modal, openModal, closeModal } = useModal({
    isDefaultOpen: showConfirmModal,
    onClose: handleModalClose,
    isCloseOnEscape: true,
    target: 'app', // Target the app element to stay within theme context
  });

  let navItems = ACCOUNT_ROUTES;
  if (isMajorEventFailsafe) {
    navItems = ACCOUNT_ROUTES.filter(({ unavailableForMajorEventFailsafe }) => !unavailableForMajorEventFailsafe);
  }
  if (!isLoggedIn) {
    navItems = ACCOUNT_ROUTES.filter(({ availableForGuest }) => !!availableForGuest);
  }
  navItems = navItems.filter(({ path }) => {
    if (path === WEB_ROUTES.accountPrivacyCenter) {
      return isPrivacyEnabled;
    }
    if (path === WEB_ROUTES.parentalControl) {
      return shouldShowParentalRatings;
    }
    return true;
  });

  // Update parental tab label to "Content Settings" when multiple accounts v2 is enabled
  if (checkIsMultipleAccountsV2Enabled()) {
    navItems = navItems.map((item) => {
      if (item.path === WEB_ROUTES.parentalControl) {
        return {
          ...item,
          element: <FormattedMessage {...messages.contentSettings} />,
        };
      }
      return item;
    });
  }

  const activeIdx = useMemo(() => {
    return navItems.findIndex(({ path }) => {
      return path === pathname;
    });
  }, [pathname, navItems]);

  const tabRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (tabRefs.current[activeIdx]) {
      tabRefs.current[activeIdx].focus();
    }
  }, [activeIdx]);

  const getRef = useCallback((el: HTMLButtonElement | null, idx: number) => {
    if (el && idx >= 0 && idx < navItems.length) {
      tabRefs.current[idx] = el;
    }
  }, [navItems.length]);

  const handleTabClick = useCallback((path: string, openInNewTab?: boolean) => {
    if (openInNewTab) {
      window.open(path, '_blank');
    } else {
      browserHistory.push(path);
    }
  }, []);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = e.key === 'ArrowLeft'
        ? (idx - 1 + navItems.length) % navItems.length
        : (idx + 1) % navItems.length;
      const nextItem = navItems[nextIdx];

      if (nextItem.openInNewTab) {
        // Add a confirmation dialog only when using keyboard navigation
        // This is to prevent screen readers from accidentally navigating to a new tab
        setPendingNavigation({ path: nextItem.path });
        setShowConfirmModal(true);
      } else {
        browserHistory.push(nextItem.path);
      }
    }
  }, [navItems]);

  const createTabClickHandler = useCallback((path: string, openInNewTab?: boolean) => {
    return function handleClick() {
      handleTabClick(path, openInNewTab);
    };
  }, [handleTabClick]);

  const createTabKeyDownHandler = useCallback((idx: number) => {
    return function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      handleTabKeyDown(e, idx);
    };
  }, [handleTabKeyDown]);

  const createRefHandler = useCallback((idx: number) => {
    return function handleRef(el: HTMLButtonElement | null) {
      getRef(el, idx);
    };
  }, [getRef]);

  const renderTab = useCallback(({ element, key, path, openInNewTab }: typeof navItems[0], idx: number) => {
    const isActive = idx === activeIdx;
    return (
      <button
        ref={createRefHandler(idx)}
        key={key}
        className={classNames(styles.navBarItem, { [styles.active]: isActive })}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${key}`}
        tabIndex={isActive ? 0 : -1}
        onClick={createTabClickHandler(path, openInNewTab)}
        onKeyDown={createTabKeyDownHandler(idx)}
      >
        {element}
      </button>
    );
  }, [activeIdx, createRefHandler, createTabClickHandler, createTabKeyDownHandler]);

  const navBar = navItems.length > 1 ? (
    <nav
      className={classNames(styles.navBar, { [styles.withBackground]: !scrolledToTop })}
      aria-label={intl.formatMessage(messages.accountSettings)}
    >
      <div className={styles.tabList} role="tablist">
        {navItems.map(renderTab)}
      </div>
    </nav>
  ) : null;

  const handleConfirmNavigation = useCallback(() => {
    // istanbul ignore else -- defensive check: modal only shows when pendingNavigation is set
    if (pendingNavigation) {
      window.open(pendingNavigation.path, '_blank');
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  }, []);

  // Handle arrow key navigation between modal buttons
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'ArrowLeft') {
        // Focus Cancel button
        cancelButtonRef.current?.focus();
      } else {
        // Focus Continue button
        continueButtonRef.current?.focus();
      }
    }
  }, []);

  // Control modal visibility
  useEffect(() => {
    if (showConfirmModal) {
      openModal();
    } else {
      closeModal();
    }
  }, [showConfirmModal, openModal, closeModal]);

  return (
    <div data-test-id="user-settings-refresh">
      <div className={styles.content}>
        {navBar}
        {children}
      </div>
      <Footer useRefreshStyle />

      <Modal>
        <div
          className={styles.confirmModal}
          role="dialog"
          aria-labelledby="confirm-navigation-title"
          aria-describedby="confirm-navigation-description"
          onKeyDown={handleModalKeyDown}
        >
          <h3 id="confirm-navigation-title">{intl.formatMessage(messages.confirmNavigationTitle)}</h3>
          <p id="confirm-navigation-description">{intl.formatMessage(messages.confirmNavigationDescription)}</p>
          <div className={styles.modalButtons}>
            <button
              ref={cancelButtonRef}
              onClick={handleCancelNavigation}
              className={styles.cancelButton}
              aria-label={intl.formatMessage(messages.cancelButtonAria)}
            >
              {intl.formatMessage(messages.cancelButton)}
            </button>
            <button
              ref={continueButtonRef}
              onClick={handleConfirmNavigation}
              className={styles.confirmButton}
              autoFocus
              aria-label={`${intl.formatMessage(messages.continueButton)} - ${intl.formatMessage(messages.confirmNavigationDescription)}`}
            >
              {intl.formatMessage(messages.continueButton)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserSettings;
