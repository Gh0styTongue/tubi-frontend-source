import { Col, Container, Row, ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { RefObject } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { connect } from 'react-redux';

import FollowUs from 'common/components/uilib/FollowUs/FollowUs';
import AppStoreBadge from 'common/components/uilib/SvgLibrary/AppStoreBadge';
import GooglePlayBadge from 'common/components/uilib/SvgLibrary/GooglePlayBadge';
import Heart from 'common/components/uilib/SvgLibrary/Heart';
import MicrosoftAppStoreBadge from 'common/components/uilib/SvgLibrary/MicrosoftAppStoreBadge';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { EMAIL_ADDRESS } from 'common/constants/constants';
import { WEB_ROUTES, EXTERNAL_LINKS } from 'common/constants/routes';
import gdprMessages from 'common/features/gdpr/messages';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import { isSpanishLanguageSelector, isUsCountrySelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { getMicrosoftAppStoreUrl } from 'common/utils/urlConstruction';
import conf from 'src/config';
import Breadcrumbs from 'web/components/Breadcrumbs/Breadcrumbs';
import LazyItem from 'web/components/LazyItem/LazyItem';

import styles from './Footer.scss';

const { isStagingOrAlpha } = conf;

const messages = defineMessages({
  // company
  companyColumnTitle: {
    description: 'Web footer COMPANY column title',
    defaultMessage: 'COMPANY',
  },
  aboutUsLink: {
    description: 'Web footer "About Us" link in the COMPANY column',
    defaultMessage: 'About Us',
  },
  careersLink: {
    description: 'Web footer "Careers" link in the COMPANY column',
    defaultMessage: 'Careers',
  },
  contactLink: {
    description: 'Web footer "Contact" link in the COMPANY column',
    defaultMessage: 'Contact',
  },
  // support
  supportColumnTitle: {
    description: 'Web footer SUPPORT column title',
    defaultMessage: 'SUPPORT',
  },
  contactSupportLink: {
    description: 'Web footer "Contact Support" link in the SUPPORT column',
    defaultMessage: 'Contact Support',
  },
  helpCenterLink: {
    description: 'Web footer "Help Center" link in the SUPPORT column',
    defaultMessage: 'Help Center',
  },
  supportedDevicesLink: {
    description: 'Web footer "Supported Devices" link in the SUPPORT column',
    defaultMessage: 'Supported Devices',
  },
  activateYourDeviceLink: {
    description: 'Web footer "Activate Your Device" link in the SUPPORT column',
    defaultMessage: 'Activate Your Device',
  },
  accessibility: {
    description: 'Web footer "Accessibility" link in the SUPPORT column',
    defaultMessage: 'Accessibility',
  },
  // partners
  partnersColumnTitle: {
    description: 'Web footer PARTNERS column title',
    defaultMessage: 'PARTNERS',
  },
  advertiseWithUsLink: {
    description: 'Web footer "Advertise with Us" link in the PARTNERS column',
    defaultMessage: 'Advertise with Us',
  },
  partnerWithUsLink: {
    description: 'Web footer "Partner with Us" link in the PARTNERS column',
    defaultMessage: 'Partner with Us',
  },
  // get the apps
  getTheAppsColumnTitle: {
    description: 'Web footer GET THE APPS column title',
    defaultMessage: 'GET THE APPS',
  },
  iOSLink: {
    description: 'Web footer "iOS" link in the GET THE APPS column',
    defaultMessage: 'iOS',
  },
  androidLink: {
    description: 'Web footer "Android" link in the GET THE APPS column',
    defaultMessage: 'Android',
  },
  rokuLink: {
    description: 'Web footer "Roku" link in the GET THE APPS column',
    defaultMessage: 'Roku',
  },
  amazonFireLink: {
    description: 'Web footer "Amazon Fire" link in the GET THE APPS column',
    defaultMessage: 'Amazon Fire',
  },
  // press
  pressColumnTitle: {
    description: 'Web footer PRESS column title',
    defaultMessage: 'PRESS',
  },
  pressReleasesLink: {
    description: 'Web footer "Press Releases" link in the PRESS column',
    defaultMessage: 'Press Releases',
  },
  tubiInTheNewsLink: {
    description: 'Web footer "Tubi in the News" link in the PRESS column',
    defaultMessage: 'Tubi in the News',
  },
  // legal
  legalColumnTitle: {
    description: 'Web footer LEGAL column title',
    defaultMessage: 'LEGAL',
  },
  privacyPolicyLink: {
    description: 'Web footer "Privacy Policy (Updated)" link in the LEGAL column',
    defaultMessage: 'Privacy Policy (Updated)',
  },
  termsOfUseLink: {
    description: 'Web footer "Terms of Use (Updated)" link in the LEGAL column',
    defaultMessage: 'Terms of Use (Updated)',
  },
  yourPrivacyChoicesLink: {
    description: 'Web footer "Your Privacy Choices" link in the LEGAL column',
    defaultMessage: 'Your Privacy Choices',
  },
  cookiesLink: {
    description: 'Web footer "Cookies" link in the LEGAL column',
    defaultMessage: 'Cookies',
  },
  copyright: {
    description: 'copyright text in footer',
    defaultMessage: 'Copyright {copyright} {year} Tubi, Inc.',
  },
  trademark: {
    description: 'trademark text in footer',
    defaultMessage: 'Tubi is a registered trademark of Tubi, Inc. <linebreak></linebreak> All rights reserved.',
  },
  madeIn: {
    description: 'made in SF text in footer',
    defaultMessage: 'Made with <hearticon></hearticon> in San Francisco',
  },
  deviceId: {
    description: 'device id label text',
    defaultMessage: 'Device ID: {deviceId}',
  },
});

type OwnProps = {
  cls?: string;
  contentId?: string;
  useRefreshStyle?: boolean;
  isSettingsSubtitleActive?: boolean;
  inverted?: boolean;
};

type StateProps = {
  deviceId: string | undefined;
  isUsCountry: boolean;
  isSpanishLanguage: boolean;
};

type FooterProps = OwnProps & StateProps;

interface AppDownloadLinksProps {
  active: boolean;
  isShowBuildHash?: boolean;
  isSpanishLanguage: boolean;
  isGDPREnabled: boolean;
  ref?: RefObject<HTMLDivElement>;
}

/* istanbul ignore next */
const WINDOWS_BADGE_CAMPAIGN_ID = __PRODUCTION__ && !__IS_ALPHA_ENV__ ? 'web-footer-badge' : 'web-footer-badge-test';

export const renderAppDownloadLinks = ({ active, isShowBuildHash, isSpanishLanguage, isGDPREnabled, ref }: AppDownloadLinksProps) => (
  <div className={styles.downloadLinks} ref={ref}>
    <ATag target="_blank" to={EXTERNAL_LINKS.appIOS} className={styles.appStoreBadge}>
      {active ? <AppStoreBadge isSpanishLanguage={isSpanishLanguage} /> : null}
    </ATag>
    <ATag target="_blank" to={EXTERNAL_LINKS.appAndroid} className={styles.googleBadge}>
      {active ? <GooglePlayBadge isSpanishLanguage={isSpanishLanguage} /> : null}
    </ATag>
    {__WEBPLATFORM__ === 'WEB' && !isGDPREnabled ? (
      <ATag target="_blank" to={getMicrosoftAppStoreUrl(WINDOWS_BADGE_CAMPAIGN_ID)} className={styles.microsoftAppStoreBadge}>
        {active ? <MicrosoftAppStoreBadge isSpanishLanguage={isSpanishLanguage} /> : null}
      </ATag>
    ) : null}
    {isShowBuildHash ? (
      // eslint-disable-next-line react/jsx-no-literals -- no i18n needed (for devs' eyes only)
      <ATag to={`https://github.com/adRise/www/commits/${__RELEASE_HASH__}`}>
        build ~ {__RELEASE_HASH__.substring(0, 11)}
      </ATag>
    ) : null}
  </div>
);

const Footer: React.FunctionComponent<FooterProps> = (
  { cls, contentId = '', isSpanishLanguage, useRefreshStyle, isUsCountry, inverted, deviceId },
) => {
  const { formatMessage } = useIntl();
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  const footerCls = classNames(
    styles.footer,
    {
      [styles.webRefresh]: useRefreshStyle,
      [styles.inverted]: inverted,
    },
    cls
  );
  const year = new Date().getFullYear();
  const colProps = {
    xs: '4',
    lg: '3',
    xl: '1-5',
    xxl: '2',
  };

  return (
    <div className={footerCls}>
      <Container className={styles.container}>
        <Row className={styles.topRow}>
          <div className={styles.iconAndPath}>
            <ATag to={WEB_ROUTES.home} className={styles.homeLink}>
              <Tubi className={styles.tubiIcon} />
            </ATag>
          </div>
          <Breadcrumbs contentId={contentId} inverted={inverted} />
          <Col {...colProps} className={styles.followUs}>
            <FollowUs inverted={inverted} />
          </Col>
        </Row>
        <Row className={styles.lineRow}>
          <Col {...colProps} className={styles.line} />
          <Col {...colProps} className={styles.line} />
        </Row>
        <Row className={styles.listContainer}>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.companyColumnTitle)}</li>
              <li>
                <ATag to={EXTERNAL_LINKS.about}>{formatMessage(messages.aboutUsLink)}</ATag>
              </li>
              <li>
                <ATag to={EXTERNAL_LINKS.careers}>{formatMessage(messages.careersLink)}</ATag>
              </li>
              <li>
                {isUsCountry ? (
                  <ATag to={EXTERNAL_LINKS.contact}>{formatMessage(messages.contactLink)}</ATag>
                ) : (
                  <ATag to={`mailto:${EMAIL_ADDRESS.CONTENT_SUBMISSIONS}`}>
                    {formatMessage(messages.contactLink)}
                  </ATag>
                )}
              </li>
            </ul>
          </Col>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.supportColumnTitle)}</li>
              <li>
                <ATag to={WEB_ROUTES.support}>{formatMessage(messages.contactSupportLink)}</ATag>
              </li>
              <li>
                <ATag to={WEB_ROUTES.helpCenter}>{formatMessage(messages.helpCenterLink)}</ATag>
              </li>
              <li>
                <ATag to={WEB_ROUTES.devices}>{formatMessage(messages.supportedDevicesLink)}</ATag>
              </li>
              <li>
                <ATag to={WEB_ROUTES.activate}>{formatMessage(messages.activateYourDeviceLink)}</ATag>
              </li>
              <li>
                <ATag to={WEB_ROUTES.accessibilityHelpCenter}>{formatMessage(messages.accessibility)}</ATag>
              </li>
            </ul>
          </Col>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.partnersColumnTitle)}</li>
              <li>
                <ATag to={EXTERNAL_LINKS.advertising}>{formatMessage(messages.advertiseWithUsLink)}</ATag>
              </li>
              <li>
                <ATag to={`mailto:${EMAIL_ADDRESS.PARTNERSHIPS}`}>{formatMessage(messages.partnerWithUsLink)}</ATag>
              </li>
            </ul>
          </Col>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.getTheAppsColumnTitle)}</li>
              <li>
                <ATag to={EXTERNAL_LINKS.appIOS}>{formatMessage(messages.iOSLink)}</ATag>
              </li>
              <li>
                <ATag to={EXTERNAL_LINKS.appAndroid}>{formatMessage(messages.androidLink)}</ATag>
              </li>
              {isGDPREnabled ? null : (
                <li>
                  <ATag to={EXTERNAL_LINKS.appRoku}>{formatMessage(messages.rokuLink)}</ATag>
                </li>
              )}
              <li>
                <ATag to={EXTERNAL_LINKS.appAmazonFireTV}>{formatMessage(messages.amazonFireLink)}</ATag>
              </li>
            </ul>
          </Col>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.pressColumnTitle)}</li>
              <li>
                <ATag to={EXTERNAL_LINKS.press}>{formatMessage(messages.pressReleasesLink)}</ATag>
              </li>
              <li>
                <ATag to={EXTERNAL_LINKS.news}>{formatMessage(messages.tubiInTheNewsLink)}</ATag>
              </li>
            </ul>
          </Col>
          <Col {...colProps}>
            <ul className={styles.links}>
              <li className={styles.lh}>{formatMessage(messages.legalColumnTitle)}</li>
              <li>
                <ATag to={WEB_ROUTES.privacy}>{formatMessage(messages.privacyPolicyLink)}</ATag>
              </li>
              <li>
                <ATag to={WEB_ROUTES.terms}>{formatMessage(messages.termsOfUseLink)}</ATag>
              </li>
              {isUsCountry ? (
                <li>
                  <ATag to={WEB_ROUTES.yourPrivacyChoices}>{formatMessage(messages.yourPrivacyChoicesLink)}</ATag>
                </li>
              ) : null}
              <li>
                <ATag to={WEB_ROUTES.cookies}>{formatMessage(messages.cookiesLink)}</ATag>
              </li>
              {isGDPREnabled ? (
                <li>
                  <ATag to={WEB_ROUTES.privacyCenter}>{formatMessage(gdprMessages.privacyCenter)}</ATag>
                </li>
              ) : null}
            </ul>
          </Col>
          {(!__PRODUCTION__ || __IS_ALPHA_ENV__) && (
            <Col {...colProps}>
              <ul className={styles.links}>
                {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed (for devs' eyes only) */}
                <li className={styles.lh}>DEV</li>
                <li>
                  {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed (for devs' eyes only) */}
                  <ATag to={WEB_ROUTES.featureSwitch}>🔨 Feature Switches</ATag>
                </li>
              </ul>
            </Col>
          )}
        </Row>
        <div className={styles.bottomSection}>
          <LazyItem rootMargin="500px 0px">
            {({ active, ref }) => {
              const props = { active, isSpanishLanguage, ref, isShowBuildHash: isStagingOrAlpha, isGDPREnabled };
              return renderAppDownloadLinks(props);
            }}
          </LazyItem>
          <div className={styles.finePrint}>
            <div className={styles.copyright}>
              <div>{formatMessage(messages.copyright, { year, copyright: '©' })}</div>
              <div>{formatMessage(messages.trademark, { linebreak: () => <br /> })}</div>
            </div>
            {typeof deviceId === 'string' ? (
              <div className={styles.additionalFinePrint}>{formatMessage(messages.deviceId, { deviceId })}</div>
            ) : /* istanbul ignore next */ null}
          </div>
          <div className={styles.signature}>{formatMessage(messages.madeIn, { hearticon: () => <Heart /> })}</div>
        </div>
      </Container>
    </div>
  );
};

const mapStateToProps = (state: StoreState): StateProps => ({
  isSpanishLanguage: isSpanishLanguageSelector(state),
  isUsCountry: isUsCountrySelector(state),
  deviceId: state.auth.deviceId,
});

const connectedComponent = hoistNonReactStatics(connect(mapStateToProps)(Footer), Footer);

export default connectedComponent;
