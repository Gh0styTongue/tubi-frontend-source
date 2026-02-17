import { Col, Container, ATag, Button, Row as _Row } from '@tubitv/web-ui';
import React, { Component, Fragment } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl, defineMessages } from 'react-intl';
import { connect } from 'react-redux';

import { WEB_ROUTES } from 'common/constants/routes';
import { isBrowserSupported } from 'common/utils/capabilityDetection';

import styles from './SupportedBrowsers.scss';

const messages = defineMessages({
  supportedHeader: {
    description: 'page header',
    defaultMessage: 'Amazing!',
  },
  notSupportedHeader: {
    description: 'page header',
    defaultMessage: 'Uh oh!',
  },
  notSupportedHeader1: {
    description: 'page header',
    defaultMessage: 'Your web browser',
  },
  notSupportedHeader2: {
    description: 'page header',
    defaultMessage: 'isn’t supported',
  },
  supportedDescription: {
    description: 'message browser is supported',
    defaultMessage: 'Your browser is up to date, which means you can continue watching our thousands of movies and TV shows.',
  },
  notSupportedDescription: {
    description: 'message browser is NOT supported',
    defaultMessage: 'Tubi works with a wide range of browsers. However, to continue watching our thousands of movies and TV shows, please upgrade to a modern, fully supported browser.',
  },
  supportedReason: {
    description: 'reason browser is supported',
    defaultMessage: 'This message is based on the user agent string reported by your browser. Tubi officially supports Chrome, Safari, Firefox, and Edge. There may be unexpected issues if you\'re using other browsers. Any extensions and plugins you have installed might modify the user agent string. We received: {browserName}, {browserMajor}',
  },
  notSupportedReason: {
    description: 'reason browser is NOT supported',
    defaultMessage: 'This message is based on the user agent string reported by your browser. Any extensions and plugins you have installed might modify the user agent string. We received: {browserName}, {browserMajor}',
  },
  supportedTitle: {
    description: 'title browser is supported',
    defaultMessage: 'Get the latest browser:',
  },
  notSupportedTitle: {
    description: 'title browser is NOT supported',
    defaultMessage: 'Download a supported browser:',
  },
  watchNow: {
    description: 'Watch Now Button Text',
    defaultMessage: 'Watch Now',
  },
});

const Footer = require('../../components/Footer/Footer').default;

type Props = {
  intl: IntlShape;
  userAgent: {
    browser: {
      name: string,
      major: string,
    },
  };
};

class SupportedBrowsers extends Component<Props> {
  private isSupported: boolean;

  constructor(props: Props) {
    super(props);
    this.isSupported = isBrowserSupported(this.props.userAgent as any);
  }

  render() {
    const { intl } = this.props;
    const { browser } = this.props.userAgent;
    const title = this.isSupported ? intl.formatMessage(messages.supportedHeader) : (
      <Fragment>
        {intl.formatMessage(messages.notSupportedHeader)}
        <br />
        {intl.formatMessage(messages.notSupportedHeader1)}
        <br />
        {intl.formatMessage(messages.notSupportedHeader2)}
      </Fragment>
    );
    const description = intl.formatMessage(this.isSupported ? messages.supportedDescription : messages.notSupportedDescription);
    const reason = intl.formatMessage(this.isSupported
      ? messages.supportedReason : messages.notSupportedReason, { browserName: browser.name, browserMajor: browser.major });
    const browserListTitle = intl.formatMessage(this.isSupported ? messages.supportedTitle : messages.notSupportedTitle);

    const Row = _Row as any;

    return (
      <Fragment>
        <div className={styles.page}>
          <Container className={styles.container}>
            <Row>
              <Col lg="10" xl="8" xxl="7">
                <h1 className="H1">
                  {title}
                </h1>
                <p className={styles.description}>
                  {description}
                </p>
                {
                  this.isSupported ? (
                    <ATag to={WEB_ROUTES.home} className={styles.homeLink}>
                      <Button appearance="primary">{intl.formatMessage(messages.watchNow)}</Button>
                    </ATag>
                  ) : null
                }
                <p className={styles.reason}>
                  {reason}
                </p>
                <div className={styles.supportedBrowserList}>
                  <h3>{browserListTitle}</h3>
                  <ATag to="https://www.google.com/chrome/">
                    {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for browser name */}
                    <Button appearance="tertiary" color="transparent">Chrome</Button>
                  </ATag>
                  <ATag to="https://www.mozilla.org/en-US/firefox/">
                    {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for browser name */}
                    <Button appearance="tertiary" color="transparent">Firefox</Button>
                  </ATag>
                  <ATag to="https://www.microsoft.com/en-us/edge">
                    {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for browser name */}
                    <Button appearance="tertiary" color="transparent">Microsoft Edge</Button>
                  </ATag>
                </div>
              </Col>
            </Row>
          </Container>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

export default connect(
  (state: any) => {
    const { ui: { userAgent } } = state;

    return { userAgent };
  },
)(injectIntl(SupportedBrowsers));
