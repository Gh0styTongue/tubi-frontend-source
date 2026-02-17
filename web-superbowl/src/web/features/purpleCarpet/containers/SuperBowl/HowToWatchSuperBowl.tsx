/* istanbul ignore file */
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import type { TubiContainerFC } from 'common/types/tubiFC';
import Footer from 'web/components/Footer/Footer';
import useCardList from 'web/features/purpleCarpet/containers/SuperBowl/components/useCardList';
import { MAIN_CONTENT } from 'web/features/purpleCarpet/containers/SuperBowl/sb-constants';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import type { ContentCardProps } from './components/ContentCard';
import ContentCard, { SignInToWatchButton } from './components/ContentCard';
import GuideContainer from './components/GuideList';
import MainContent from './components/MainContent';
import QuestionList from './components/QuestionList';
import useGuideList from './components/useGuideList';
import messages from './howToWatchMessages';
import styles from './HowToWatchSuperBowl.scss';
import commonStyles from './SuperBowl.scss';

const HowToWatchSuperBowl: TubiContainerFC = () => {
  const intl = useIntl();
  const language = useAppSelector((state) => state.ui.userLanguageLocale);
  const { stepByStepList, whichAppsToDownloadList, matchupList } = useGuideList();
  const helmetProps = useMemo(() => {
    const metaTitle = intl.formatMessage(messages.superBowlTitle);
    const metaDescription = intl.formatMessage(messages.superBowlDescription);
    const canonical = getCanonicalLink(WEB_ROUTES.howToWatchSuperBowl);

    return {
      title: metaTitle,
      link: [
        getCanonicalMetaByLink(canonical),
        // ...getAlternateMeta(WEB_ROUTES.howToWatchSuperBowl),
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

  const cardList: ContentCardProps[] = useCardList();

  return (
    <div className={classNames(commonStyles.superBowl, styles.howToWatchSuperBowl)}>
      <Helmet {...helmetProps} />
      <div className={classNames(commonStyles.mainWrapper, commonStyles.container)}>
        <div className={commonStyles.main}>
          <MainContent isHowToWatchPage />

          {/* ==== doordash row  ==== */}
          {/* <div className={styles.doordash}>
            <div className={styles.foxLogo} />
            <h2 className={styles.doordashDescription}>{intl.formatMessage(messages.doordashDescription)}</h2>
            <div className={styles.doordashLogo} />
          </div> */}

          {language?.startsWith('es') ?
            <div className={styles.deportes}>
              {cardList.slice(2, 3).map((contentCard, index) => {
                const key = `key-${index}`;
                return <ContentCard oneLineAttributes key={key} {...contentCard} />;
              })}
            </div>
            : null
          }
        </div>
      </div>

      {/* ==== step by step guide ==== */}
      <GuideContainer title={stepByStepList.title} guides={stepByStepList.list} ordered>
        <div className={styles.stepByStepButton}>
          <SignInToWatchButton linkTo={WEB_ROUTES.howToWatchSuperBowl} content={MAIN_CONTENT} />
        </div>
      </GuideContainer>

      {/* ==== which apps to download guide ==== */}
      <GuideContainer
        title={whichAppsToDownloadList.title}
        description={whichAppsToDownloadList.description}
        guides={whichAppsToDownloadList.list}
      />

      {/* ==== matchup row ==== */}
      <GuideContainer title={matchupList.title} description={matchupList.description} guides={matchupList.list} />

      {/* ==== qa row ==== */}
      <div className={classNames(commonStyles.container)}>
        <QuestionList />
      </div>

      <Footer />
    </div>
  );
};

export default HowToWatchSuperBowl;
