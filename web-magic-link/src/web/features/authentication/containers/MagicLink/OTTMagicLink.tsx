import { CheckmarkCircleStroke } from '@tubitv/icons';
import { Col, Container, Row, ATag } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import HeroContainer from 'common/components/uilib/HeroContainer/HeroContainer';
import WarningIcon from 'common/components/uilib/SvgLibrary/WarningIcon';
import type { StatusKeys, StatusValues } from 'common/constants/magic-link';
import { MAGIC_LINK_STATUS as STATUS } from 'common/constants/magic-link';

import styles from './OTTMagicLink.scss';

const SUPPORT_CONTACT_URL = 'https://tubitv.com/support';
const SUPPORT_CONTACT_SHORT_URL = 'tubitv.com/support';

export const allMessages = defineMessages({
  successTitle: {
    description: 'title for successful state',
    defaultMessage: 'Verification Successful',
  },
  successDesc: {
    description: 'desc for successful state',
    // Now a support form instead of an email but the copy is still valid
    defaultMessage: 'Your TV screen will refresh in a few seconds.<linebreak></linebreak>Need help? Let us know at <email></email>',
  },
  failTitle: {
    description: 'title for failed state',
    defaultMessage: 'Link Expired',
  },
  failDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Try signing into your TV again to generate a new verification link.<linebreak></linebreak>Need help? Let us know at <email></email>',
  },
  errorTitle: {
    description: 'title for error state',
    defaultMessage: 'Something Went Wrong',
  },
  errorDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Try clicking on the verification link again.<linebreak></linebreak>Need help? Let us know at <email></email>',
  },
});

const getMessagesByStatus = (status: StatusKeys) => {
  return {
    title: allMessages[`${status}Title`],
    desc: allMessages[`${status}Desc`],
  };
};

const icons = {
  [STATUS.success]: <CheckmarkCircleStroke />,
  [STATUS.fail]: <WarningIcon />,
  [STATUS.error]: <WarningIcon />,
};

const OTTMagicLink = ({ status }: { status: StatusValues }) => {
  const messages = getMessagesByStatus(status as StatusKeys);
  const icon = icons[status];
  const intl = useIntl();

  return (
    <HeroContainer>
      <Container className={styles.content}>
        <Row className={styles.row}>
          <Col xs="9" lg="6" xl="6" xxl="4">
            <div className={styles[`icon-${status}`]}>
              {icon}
            </div>
            <h1 className={styles.title}>{intl.formatMessage(messages.title)}</h1>
            <p className={styles.text}>
              {intl.formatMessage(messages.desc, {
                linebreak: () => <br />,
                email: () => <ATag to={SUPPORT_CONTACT_URL}>{SUPPORT_CONTACT_SHORT_URL}</ATag>,
              })}
            </p>
          </Col>
        </Row>
      </Container>
    </HeroContainer>
  );
};

export default OTTMagicLink;
