import classNames from 'classnames';
import React, { memo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import messages from 'common/features/gdpr/messages';

import styles from './LegalLinks.scss';

export const TUBI_DOMAIN = 'www.tubi.tv';

interface LegalLinkProps {
  title: string;
  description: string | React.ReactNode;
}
const LegalLink = memo(({ title, description }: LegalLinkProps) => (
  <div className={styles.legalLink}>
    <div className={styles.title}>{title}</div>
    <div className={styles.description}>{description}</div>
  </div>
));

interface Props {
  className?: string;
}
const LegalLinks = ({ className }: Props) => {
  const intl = useIntl();
  return (
    <div className={classNames(styles.legalLinks, className)}>
      <LegalLink
        title={intl.formatMessage(messages.termsOfUse)}
        description={intl.formatMessage(messages.termsOfUseDescriptionWeb, {
          // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs
          url: <Link to={WEB_ROUTES.terms}>{TUBI_DOMAIN}/terms</Link>,
        })}
      />
      <LegalLink
        title={intl.formatMessage(messages.privacyPolicy)}
        description={intl.formatMessage(messages.privacyPolicyDescriptionWeb, {
          // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs
          url: <Link to={WEB_ROUTES.privacy}>{TUBI_DOMAIN}/privacy</Link>,
        })}
      />
    </div>
  );
};

export default LegalLinks;
