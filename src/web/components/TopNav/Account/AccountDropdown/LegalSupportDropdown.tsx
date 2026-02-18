import { useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { memo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from './AccountDropdown.scss';

interface LegalSupportDropdownProps {
  show: boolean;
  isMobile: boolean;
}

const messages = defineMessages({
  helpCenterLink: {
    description: 'help center menu link',
    defaultMessage: 'Help Center',
  },
  contactSupportLink: {
    description: 'Web footer "Contact Support" link in the SUPPORT column',
    defaultMessage: 'Contact Support',
  },
  termsOfUseLink: {
    description: 'Web footer "Terms of Use (Updated)" link in the LEGAL column',
    defaultMessage: 'Terms of Use',
  },
  privacyPolicyLink: {
    description: 'Web footer "Privacy Policy (Updated)" link in the LEGAL column',
    defaultMessage: 'Privacy Policy',
  },
});

const LegalSupportDropdown: FC<LegalSupportDropdownProps> = ({ show, isMobile }) => {
  // Don't hold it open on hover on mobile because we only receive the mouseenter event on tap, not the mouseleave.
  // The mouseleave event is only fired when the user taps outside the dropdown. This means the dropdown would stay
  // open even after clicking one of the links, which is not what we want.
  const [ref, isHovered] = useHover({ delay: 200, skip: isMobile });

  const shouldShow = show || isHovered;
  const className = classnames(styles.accountDropdown, {
    [styles.show]: shouldShow,
  });

  return (
    <div className={className} ref={ref}>
      <div className={styles.menuItemContainer}>
        <Link to={WEB_ROUTES.helpCenter} className={styles.menuItem}>
          <FormattedMessage {...messages.helpCenterLink} />
        </Link>
        <Link to={WEB_ROUTES.terms} className={styles.menuItem}>
          <FormattedMessage {...messages.termsOfUseLink} />
        </Link>
        <Link to={WEB_ROUTES.privacy} className={styles.menuItem}>
          <FormattedMessage {...messages.privacyPolicyLink} />
        </Link>
        <Link to={WEB_ROUTES.support} className={styles.menuItem}>
          <FormattedMessage {...messages.contactSupportLink} />
        </Link>
      </div>
    </div>
  );
};

export default memo(LegalSupportDropdown);
