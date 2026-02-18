/* eslint-disable react/jsx-no-literals */
/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { Subtitles, Play } from '@tubitv/icons';
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
import NFLDraftCenterSchema from 'web/features/seo/components/NFLDraftCenterSchema/NFLDraftCenterSchema';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import ContentCard from 'web/features/superbowl/containers/SuperBowl/components/ContentCard';
import useCardList from 'web/features/superbowl/containers/SuperBowl/components/useCardList';

import QuestionList from './components/QuestionList';
import styles from './SuperBowl.scss';
import messages from './superBowlMessages';

const NFLDraftCenter: TubiContainerFC = () => {
  const intl = useIntl();
  const cardList = useCardList(true);
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const helmetProps = useMemo(() => {
    const metaTitle = intl.formatMessage(messages.nflDraftCenterTitle);
    const metaDescription = intl.formatMessage(messages.nflDraftCenterDescription);
    const canonical = getCanonicalLink(WEB_ROUTES.nflDraft);

    return {
      title: metaTitle,
      link: [
        getCanonicalMetaByLink(canonical),
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
    <div className={styles.nflDraftCenter}>
      <Helmet {...helmetProps} />
      <div className={classNames(styles.mainWrapper, styles.container)}>
        <div className={styles.main}>
          {/* ==== top row ==== */}
          <div className={styles.mainContent}>
            <div className={classNames(styles.draftLogo)} />
            <h1 className={styles.heading1}>{intl.formatMessage(messages.nflDraftCenterPageTitle)}</h1>
            <h4 className={styles.attributes}>
              {intl.formatMessage(messages.gameTag)}
              <Subtitles className={styles.tagIcon} />
            </h4>
            <p className={styles.description}>{intl.formatMessage(messages.draftDescription1)}</p>
            <p className={styles.description}>
              <Link to="/live/613761/nfl-channel">
                <Button
                  size="small"
                  className={styles.signInButton}
                  tag={isLoggedIn ? undefined : intl.formatMessage(messages.freeTag)}
                  icon={Play}
                >
                  {intl.formatMessage(messages.watchNow)}
                </Button>
              </Link>
            </p>
            <p className={styles.description}>{intl.formatMessage(messages.draftDescription11)}</p>
            <p className={styles.description}>{intl.formatMessage(messages.draftDescription2)}</p>
            <p className={styles.description} style={{ fontWeight: 'bold' }}>{intl.formatMessage(messages.draftDescription3)}</p>
            <p className={styles.description2}>{intl.formatMessage(messages.draftDescription4)}</p>
            <p className={styles.description2}>{intl.formatMessage(messages.draftDescription5)}</p>
            <p className={styles.description2}>{intl.formatMessage(messages.draftDescription6)}</p>

            <h2 className={styles.heading2draft}>{intl.formatMessage(messages.preDraftHeader)}</h2>
            <div>
              {cardList.slice(0, 2).map((contentCard, index) => {
                const key = `key-${index}`;
                return <ContentCard oneLineAttributes key={key} {...contentCard} />;
              })}
            </div>

            <h2 className={styles.heading2draft}>{intl.formatMessage(messages.draftHeader)}</h2>
            <p className={styles.description2}>{intl.formatMessage(messages.draftDescription, {
              tag: (msg: ReactNode) => (
                <b><i>{msg}</i></b>
              ),
            })}</p>
          </div>

          <NFLDraftCenterSchema />

          {/* ==== how to watch row ==== */}
          <div className={styles.howToWatch}>
            <h2 className={styles.howToWatchTitle}>
              {intl.formatMessage(messages.howToWatchTitleDraft)}
            </h2>
            <div className={styles.enhance}> {intl.formatMessage(messages.howToWatchTitleEnhance)}</div>
            <a href="https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410086811163">
              <Button appearance="secondary" size="small">
                {intl.formatMessage(messages.howToWatchButtonDraft)}
              </Button>
            </a>
          </div>

          {/* ==== content cards ==== */}
          <div>
            {cardList.slice(2, 3).map((contentCard, index) => {
              const key = `key-${index}`;
              return <ContentCard oneLineAttributes key={key} {...contentCard} />;
            })}
          </div>
        </div>
      </div>

      {/* ==== qa row ==== */}
      <div className={classNames(styles.container)}>
        <QuestionList isDraftPage />
      </div>
      <div className={classNames(styles.howToWatch)}>
        <h2 className={styles.heading1draft}>{intl.formatMessage(messages.draftTeamHeading)}</h2>
        <a className={styles.teamLink} href="https://www.tennesseetitans.com/" target="_blank">
          <span>1. Tennessee Titans</span>
        </a>
        <a className={styles.teamLink} href="https://www.clevelandbrowns.com/" target="_blank">
          <span>2. Cleveland Browns</span>
        </a>
        <a className={styles.teamLink} href="https://www.newyorkgiants.com/" target="_blank">
          <span>3. New York Giants</span>
        </a>
        <a className={styles.teamLink} href="https://www.newenglandpatriots.com/" target="_blank">
          <span>4. New England Patriots</span>
        </a>
        <a className={styles.teamLink} href="https://www.jacksonvillejaguars.com/" target="_blank">
          <span>5. Jacksonville Jaguars</span>
        </a>
        <a className={styles.teamLink} href="https://www.lasvegasraiders.com/" target="_blank">
          <span>6. Las Vegas Raiders</span>
        </a>
        <a className={styles.teamLink} href="https://www.newyorkjets.com/" target="_blank">
          <span>7. New York Jets</span>
        </a>
        <a className={styles.teamLink} href="https://www.carolinapanthers.com/" target="_blank">
          <span>8. Carolina Panthers</span>
        </a>
        <a className={styles.teamLink} href="https://www.saints.com/" target="_blank">
          <span>9. New Orleans Saints</span>
        </a>
        <a className={styles.teamLink} href="https://www.chicagobears.com/" target="_blank">
          <span>10. Chicago Bears</span>
        </a>
        <a className={styles.teamLink} href="https://www.sanfrancisco49ers.com/" target="_blank">
          <span>11. San Francisco 49ers</span>
        </a>
        <a className={styles.teamLink} href="https://www.dallascowboys.com/" target="_blank">
          <span>12. Dallas Cowboys</span>
        </a>
        <a className={styles.teamLink} href="https://www.miamidolphins.com/" target="_blank">
          <span>13. Miami Dolphins</span>
        </a>
        <a className={styles.teamLink} href="https://www.indianapoliscolts.com/" target="_blank">
          <span>14. Indianapolis Colts</span>
        </a>
        <a className={styles.teamLink} href="https://www.atlantafalcons.com/" target="_blank">
          <span>15. Atlanta Falcons</span>
        </a>
        <a className={styles.teamLink} href="https://www.arizonacardinals.com/" target="_blank">
          <span>16. Arizona Cardinals</span>
        </a>
        <a className={styles.teamLink} href="https://www.cincinnatibengals.com/" target="_blank">
          <span>17. Cincinnati Bengals</span>
        </a>
        <a className={styles.teamLink} href="https://www.seahawks.com/" target="_blank">
          <span>18. Seattle Seahawks</span>
        </a>
        <a className={styles.teamLink} href="https://www.tampabaybuccaneers.com/" target="_blank">
          <span>19. Tampa Bay Buccaneers</span>
        </a>
        <a className={styles.teamLink} href="https://www.denverbroncos.com/" target="_blank">
          <span>20. Denver Broncos</span>
        </a>
        <a className={styles.teamLink} href="https://www.pittsburghsteelers.com/" target="_blank">
          <span>21. Pittsburgh Steelers</span>
        </a>
        <a className={styles.teamLink} href="https://www.losangeleschargers.com/" target="_blank">
          <span>22. Los Angeles Chargers</span>
        </a>
        <a className={styles.teamLink} href="https://www.greenbaypackers.com/" target="_blank">
          <span>23. Green Bay Packers</span>
        </a>
        <a className={styles.teamLink} href="https://www.minnesotavikings.com/" target="_blank">
          <span>24. Minnesota Vikings</span>
        </a>
        <a className={styles.teamLink} href="https://www.houstontexans.com/" target="_blank">
          <span>25. Houston Texans</span>
        </a>
        <a className={styles.teamLink} href="https://www.losangelesrams.com/" target="_blank">
          <span>26. Los Angeles Rams</span>
        </a>
        <a className={styles.teamLink} href="https://www.baltimoreravens.com/" target="_blank">
          <span>27. Baltimore Ravens</span>
        </a>
        <a className={styles.teamLink} href="https://www.detroitlions.com/" target="_blank">
          <span>28. Detroit Lions</span>
        </a>
        <a className={styles.teamLink} href="https://www.washingtoncommanders.com/" target="_blank">
          <span>29. Washington Commanders</span>
        </a>
        <a className={styles.teamLink} href="https://www.buffalobills.com/" target="_blank">
          <span>30. Buffalo Bills</span>
        </a>
        <a className={styles.teamLink} href="https://www.kansascitychiefs.com/" target="_blank">
          <span>31. Kansas City Chiefs</span>
        </a>
        <a className={styles.teamLink} href="https://www.philadelphiaeagles.com/" target="_blank">
          <span>32. Philadelphia Eagles</span>
        </a>
        <p className={styles.note}><i>{intl.formatMessage(messages.draftTeamNote)}</i></p>
      </div>
      <Footer />
    </div>
  );
};

export default NFLDraftCenter;
