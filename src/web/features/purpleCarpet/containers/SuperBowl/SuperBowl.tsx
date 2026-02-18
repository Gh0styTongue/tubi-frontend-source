/* istanbul ignore file */
/* istanbul ignore file */
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import type { TubiContainerFC } from 'common/types/tubiFC';
import Footer from 'web/components/Footer/Footer';
import EventSchema from 'web/features/seo/components/EventSchema/EventSchema';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import type { ContentCardProps } from './components/ContentCard';
import ContentCard from './components/ContentCard';
import MainContent from './components/MainContent';
import QuestionList from './components/QuestionList';
import useCardList from './components/useCardList';
import styles from './SuperBowl.scss';
import messages from './superBowlMessages';

const SuperBowl: TubiContainerFC = () => {
  const intl = useIntl();
  const cardList: ContentCardProps[] = useCardList();
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const helmetProps = useMemo(() => {
    const metaTitle = intl.formatMessage(messages.superBowlTitle);
    const metaDescription = intl.formatMessage(messages.superBowlDescription);
    const canonical = getCanonicalLink(WEB_ROUTES.superBowl);

    return {
      title: metaTitle,
      link: [
        getCanonicalMetaByLink(canonical),
        // ...getAlternateMeta(WEB_ROUTES.superBowl),
      ],
      meta: [
        { name: 'description', content: metaDescription },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: metaTitle },
        { property: 'og:description', content: metaDescription },
        { property: 'twitter:title', content: metaTitle },
        { property: 'twitter:description', content: metaDescription },
      ],
    };
  }, [intl]);

  return (
    <div className={styles.superBowl}>
      <Helmet {...helmetProps} />
      <div className={classNames(styles.mainWrapper, styles.container)}>
        <div className={styles.main}>
          <h1 className={styles.heading1}>{intl.formatMessage(messages.superBowlTitle)}</h1>
          {/* ==== top row ==== */}
          <MainContent />
          <EventSchema />

          {!isLoggedIn ?
            <div className={styles.dashPass}>
              <div className={styles.dashPassLogo} />
              <h2 className={styles.dashPassTitle}>
                {intl.formatMessage(messages.dashPassTitle)}
              </h2>
              <h2 className={styles.dashPassTitle2}>
                {intl.formatMessage(messages.dashPassTitleEnhance)}
              </h2>
              <p className={styles.dashPassDescription}>{intl.formatMessage(messages.dashPassDescription, {
                tag: (msg: ReactNode) => (
                  <span className={styles.dashhighlight}>{msg}</span>
                ),
              })}</p>
              <div className={styles.dashTermsContainer}>
                <Link to={`${WEB_ROUTES.register}?redirect=${WEB_ROUTES.superBowl}`}>
                  <Button size="small" tag={intl.formatMessage(messages.freeTag)}>
                    {intl.formatMessage(messages.registerButton)}
                  </Button>
                </Link>
                <div className={styles.dashTerms}>
                  {intl.formatMessage(messages.dashPassTerms, {
                    link1: (msg: ReactNode) => (
                      <Link to="https://tubitv.com/terms" target="_blank" className={styles.dashLink}>
                        {msg}
                      </Link>
                    ),
                    link2: (msg: ReactNode) => (
                      <Link to="https://tubitv.com/privacy" target="_blank" className={styles.dashLink}>
                        {msg}
                      </Link>
                    ),
                    link3: (msg: ReactNode) => (
                      <Link to="https://tubitv.com/privacy#fi" target="_blank" className={styles.dashLink}>
                        {msg}
                      </Link>
                    ),
                  })}
                  <br />
                  {intl.formatMessage(messages.dashPassTerms2, {
                    link: (msg: ReactNode) => (
                      <Link to="https://tubitv.com/dashpass" target="_blank" className={styles.dashLink}>
                        {msg}
                      </Link>
                    ),
                  })}
                </div>
              </div>
            </div>
            : null
          }

          {/* ==== game row ==== */}
          {/* <div className={styles.game}>
            <div className={styles.gameContent}>
              <div className={styles.gameLogo} />
              <h2 className={styles.gameTitle}>
                {intl.formatMessage(messages.gameTitle)}
                <span className={styles.enhance}> {intl.formatMessage(messages.gameTitleEnhance)}</span>
              </h2>
            </div>
            <PlayButton className={styles.playButton} onClick={handleClickPlayButton} />
          </div> */}

          {/* ==== how to watch row ==== */}
          <div className={styles.howToWatch}>
            <h2 className={styles.howToWatchTitle}>
              {intl.formatMessage(messages.howToWatchTitle)}
            </h2>
            <div className={styles.enhance}> {intl.formatMessage(messages.howToWatchTitleEnhance)}</div>
            <Link to={WEB_ROUTES.howToWatchSuperBowl}>
              <Button appearance="secondary" size="small">
                {intl.formatMessage(messages.howToWatchButton)}
              </Button>
            </Link>
          </div>

          {/* ==== content cards ==== */}
          <div>
            {cardList.slice(0, 2).map((contentCard, index) => {
              const key = `key-${index}`;
              return <ContentCard oneLineAttributes key={key} {...contentCard} />;
            })}
          </div>
        </div>
      </div>

      {/* ==== qa row ==== */}
      <div className={classNames(styles.container)}>
        <QuestionList isSuperbowlPage />
      </div>

      {/* ==== bottom content cards ==== */}
      <div className={classNames(styles.container)}>
        <div className={styles.bottomContentContainer}>
          <h2 className={classNames(styles.containerTitle)}>
            {intl.formatMessage(messages.bottomContentContainerTitle)}
          </h2>
          <p className={classNames(styles.containerDescription)}>
            {intl.formatMessage(messages.bottomContentContainerDescription)}
          </p>
          {cardList.slice(3).map((contentCard, index) => {
            const key = `key-${index}`;
            return <ContentCard key={key} {...contentCard} isBottomContent />;
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SuperBowl;
