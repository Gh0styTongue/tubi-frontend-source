import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';

import { loadContainer } from 'common/actions/container';
import { loadHistory } from 'common/actions/loadHistory';
import { HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import { contentModeForMenuListSelector } from 'common/selectors/contentMode';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { alwaysResolve } from 'common/utils/promise';
import Containers from 'web/components/Containers/Containers';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import styles from './MyStuff.scss';

const messages = defineMessages({
  title: {
    description: 'title of the My Stuff page, metadata',
    defaultMessage: 'My Stuff',
  },
  description: {
    description: 'description of the My Stuff page, metadata',
    defaultMessage: 'Find your favorites fast, pick up where you left off–all in one place.',
  },
  keywords: {
    description: 'keywords for home page, meta data',
    defaultMessage: 'Free, Movies, TV shows, legal, streaming, HD, full length, full movie',
  },
});

const MyStuffContainer: TubiContainerFC = () => {
  const intl = useIntl();
  const title = intl.formatMessage(messages.title);
  const description = intl.formatMessage(messages.description);
  const meta = useMemo(() => {
    const canonical = getCanonicalLink(WEB_ROUTES.myStuff);
    return {
      title,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'keywords', content: intl.formatMessage(messages.keywords) },
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        {
          property: 'al:android:url',
          content: 'tubitv://open?utm_campaign=organic&utm_medium=mobile_web&utm_source=mobile_web',
        },
      ],
    };
  }, [description, intl, title]);

  return (
    <div className={styles.myStuff} data-test-id="web-mystuff">
      <Helmet {...meta} />
      <div className={styles.metaRowContainer}>
        <div className={styles.metaRow}>
          <h1 className={styles.title}>{title}</h1>
          <h2 className={styles.description}>{description}</h2>
        </div>
      </div>
      <Containers isMyStuffPage />
      <Footer useRefreshStyle />
    </div>
  );
};

MyStuffContainer.fetchData = ({ getState, dispatch, location }) => {
  const state = getState();
  const isLoggedIn = isLoggedInSelector(state);
  const contentModeForAll = contentModeForMenuListSelector(state, { pathname: location.pathname });
  const promises: Promise<unknown>[] = [
    dispatch(loadContainer({ location, id: HISTORY_CONTAINER_ID, contentMode: contentModeForAll })),
    dispatch(loadContainer({ location, id: QUEUE_CONTAINER_ID, contentMode: contentModeForAll })),
  ];

  if (isLoggedIn) promises.push(alwaysResolve(dispatch(loadHistory())));

  return Promise.all(promises).catch((error) => {
    logger.error({ error }, 'fetchData error - MyStuff');
    return Promise.reject(error);
  });
};

export default MyStuffContainer;
