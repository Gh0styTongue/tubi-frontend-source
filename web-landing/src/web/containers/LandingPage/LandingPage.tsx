import { Col, Container, Row, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { Link } from 'react-router';

import { loadHomeScreen } from 'common/actions/container';
import PlatformIconsList from 'common/components/uilib/PlatformIconsList/PlatformIconsList';
import { HOME_DATA_SCOPE, tubiLogoSize, tubiLogoURL } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import {
  countryCodeSelector,
  isLatamCountrySelector,
  isPacificCountrySelector,
  isUsCountrySelector,
} from 'common/selectors/ui';
import type { FetchDataParams } from 'common/types/container';
import { isMajorEventOnboardingActive } from 'common/utils/onboarding';
import { alwaysResolve } from 'common/utils/promise';
import type { SUPPORTED_COUNTRY } from 'i18n/constants';
import Collapse from 'web/components/Collapse/Collapse';
import Footer from 'web/components/Footer/Footer';
import PartnerIcons from 'web/components/PartnerIcons/PartnerIcons';
import FaqPageSchema from 'web/features/seo/components/FaqPageSchema/FaqPageSchema';
import OrganizationSchema from 'web/features/seo/components/OrganizationSchema/OrganizationSchema';
import SearchActionSchema from 'web/features/seo/components/SearchActionSchema/SearchActionSchema';
import {
  formatFaqItemsForSeo,
  getAlternateMeta,
  getCanonicalLink,
  getCanonicalMetaByLink,
} from 'web/features/seo/utils/seo';
import { getFAQMessages } from 'web/hooks/useFAQ';

import styles from './LandingPage.scss';
import { LANDING_PAGE_TEXT } from './landingPageConstants';

const CLOSED_FAQ_MENU_STATE_IDX = -1;

const getMeta = (intl: IntlShape) => {
  const description = intl.formatMessage(LANDING_PAGE_TEXT.pageMeta.description);
  const canonical = getCanonicalLink('');
  const title = intl.formatMessage(LANDING_PAGE_TEXT.pageMeta.title);

  return {
    title,
    link: [
      getCanonicalMetaByLink(canonical),
      ...getAlternateMeta(WEB_ROUTES.landing),
    ],
    meta: [
      {
        name: 'keywords',
        content: intl.formatMessage(LANDING_PAGE_TEXT.pageMeta.keywords),
      },
      { name: 'description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:description', content: description },
      { property: 'og:image', content: tubiLogoURL },
      { property: 'og:image:height', content: tubiLogoSize },
      { property: 'og:image:width', content: tubiLogoSize },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
    ],
  };
};

export const LandingPage = () => {
  const intl = useIntl();
  const [FAQSelectedIdx, setFAQSelectedIdx] = useState(CLOSED_FAQ_MENU_STATE_IDX);
  const isUsCountry = useAppSelector(isUsCountrySelector);
  const countryCode = useAppSelector(countryCodeSelector);
  const isLatamCountry = useAppSelector(isLatamCountrySelector);
  const isPacificCountry = useAppSelector(isPacificCountrySelector);
  const isMajorEventActive = useAppSelector(isMajorEventOnboardingActive);
  let region: string = String(countryCode);
  if (isLatamCountry) {
    region = 'latam';
  } else if (isPacificCountry) {
    region = 'pacific';
  }

  const faqItems = getFAQMessages(intl.formatMessage, isUsCountry);
  const extraClassName = styles[`landingPage-${region}`];

  const clickFAQCollapse = (idx: number) => {
    if (FAQSelectedIdx === idx) {
      setFAQSelectedIdx(CLOSED_FAQ_MENU_STATE_IDX);
      return;
    }

    setFAQSelectedIdx(idx);
  };

  const startWatchingBlockHeader = isMajorEventActive ? LANDING_PAGE_TEXT.majorEvent.header : LANDING_PAGE_TEXT.startWatchingBlock.header;
  const startWatchingBlockSubheader = isMajorEventActive ? LANDING_PAGE_TEXT.majorEvent.subheader : [LANDING_PAGE_TEXT.startWatchingBlock.subheader];

  return (
    <div className={classNames(styles.landingPage, extraClassName)}>
      <Helmet {...getMeta(intl)} />
      <OrganizationSchema />
      <SearchActionSchema />
      <div className={styles.watchnowblock}>
        <div className={classNames(styles.landingPageBg, { [styles.majorEvent]: isMajorEventActive })} />
        <div className={styles.flexWrapper}>
          <div className={styles.tvimage} />
          <Container className={styles.container}>
            <Row className={styles.row}>
              <Col xs="12" md="12" className={styles.col}>
                <h1 className="H1">
                  {startWatchingBlockHeader.map((header, index) => {
                    return (
                      <span key={index} className={classNames({ [styles.textPrimary]: index === startWatchingBlockHeader.length - 1 })}>
                        {intl.formatMessage(header)}
                        <br />
                      </span>
                    );
                  })}
                </h1>
                <div className={classNames(styles.text, styles.bodycopy)}>
                  {startWatchingBlockSubheader.map((subheader) => {
                    return <span>{intl.formatMessage(subheader)}<br /></span>;
                  })}
                </div>
                <Link to={WEB_ROUTES.home}>
                  <Button size="medium">{intl.formatMessage(LANDING_PAGE_TEXT.startWatchingBlock.button)}</Button>
                </Link>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
      <div className={styles.defaultBlock}>
        <Container className={styles.container}>
          <Row className={styles.center}>
            <Col xs="12" md="8">
              <h2 className="H1">{intl.formatMessage(LANDING_PAGE_TEXT.streamAnywhereBlock.header)}</h2>
            </Col>
          </Row>
          <Row className={styles.center}>
            <Col xs="12" md="6">
              <div className={classNames(styles.steelGrey, styles.text)}>
                {intl.formatMessage(LANDING_PAGE_TEXT.streamAnywhereBlock.subheader)}
              </div>
            </Col>
          </Row>
          <Row className={styles.center}>
            <Col xs="12" sMd="8" md="7" lg="6" xl="4">
              <PlatformIconsList className={styles.platforms} countryCode={countryCode as SUPPORTED_COUNTRY} />
              <div className={styles.center}>
                <Link to={WEB_ROUTES.devices}>
                  <Button size="medium" appearance="secondary">
                    {intl.formatMessage(LANDING_PAGE_TEXT.streamAnywhereBlock.button)}
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <div className={classNames(styles.defaultBlock, styles.browsetitlesblock)}>
        <Container className={styles.container}>
          <Row className={styles.center}>
            <Col xs="12">
              <h2 className="H1">{intl.formatMessage(LANDING_PAGE_TEXT.thousandsTitlesBlock.header)}</h2>
            </Col>
          </Row>
          <Row className={styles.center}>
            <Col xs="12" md="6">
              <div className={classNames(styles.text)}>
                {intl.formatMessage(LANDING_PAGE_TEXT.thousandsTitlesBlock.subheader)}
              </div>
            </Col>
          </Row>
          <Row className={styles.center}>
            <Col xs="10">
              <PartnerIcons className={styles.partners} />
              <div className={styles.center}>
                <Link to={WEB_ROUTES.home}>
                  <Button size="medium" appearance="secondary">
                    {intl.formatMessage(LANDING_PAGE_TEXT.thousandsTitlesBlock.button)}
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <div className={styles.defaultBlock}>
        <Container className={styles.container}>
          <Row className={styles.center}>
            <Col xs="12" md="8">
              <h2 className="H1">{intl.formatMessage(LANDING_PAGE_TEXT.FAQBlock.header)}</h2>
            </Col>
          </Row>
          <Row className={styles.center}>
            <Col xs="12" md="6">
              <Collapse list={faqItems} selectedIdx={FAQSelectedIdx} onClick={clickFAQCollapse} />
            </Col>
          </Row>
          <FaqPageSchema items={formatFaqItemsForSeo(faqItems)} />
        </Container>
      </div>
      <div className={styles.registerblock}>
        <Container className={styles.container}>
          <Row className={classNames(styles.row, styles.center)}>
            <Col xs="12" md="6" className={styles.col}>
              <h2>{intl.formatMessage(LANDING_PAGE_TEXT.registerBlock.header)}</h2>
              <div className={classNames(styles.white50, styles.text)}>
                {intl.formatMessage(LANDING_PAGE_TEXT.registerBlock.subheader)}
              </div>
              <Link to={WEB_ROUTES.register}>
                <Button size="medium" appearance="primary">
                  {intl.formatMessage(LANDING_PAGE_TEXT.registerBlock.button)}
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </div>
  );
};

// preload "Browse" and "Start Watching" data
export async function fetchDataDeferred({ dispatch, location }: FetchDataParams<Record<string, unknown>>) {
  await alwaysResolve(dispatch(loadHomeScreen({ location, scope: HOME_DATA_SCOPE.firstScreen })));
}

LandingPage.fetchDataDeferred = fetchDataDeferred;

export default LandingPage;
