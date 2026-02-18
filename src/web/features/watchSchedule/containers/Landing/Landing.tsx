import dayjs from 'dayjs';
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';

import { CONTENT_NOT_FOUND } from 'common/constants/error-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { fetchLinearReminders } from 'common/features/linearReminder/actions/linearReminder';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import type { TubiContainerFC } from 'common/types/tubiFC';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import {
  batchFetchPrograms,
  fetchProgramming,
  setNow,
  setDates,
  reset,
} from 'web/features/watchSchedule/actions/landing';
import { METADATA, WATCH_SCHEDULE_VALUES } from 'web/features/watchSchedule/constants/landing';
import { contentIdsSelector, lastDateSelector, titleSelector } from 'web/features/watchSchedule/selectors/landing';
import type { RouteParams } from 'web/features/watchSchedule/types/landing';
import { assetsGenerator } from 'web/features/watchSchedule/utils/landing';

import Banner from './Banner/Banner';
import Branding from './Branding/Branding';
import Faq from './Faq/Faq';
import styles from './Landing.scss';
import messages from './landingMessages';
import LiveChannels from './LiveChannels/LiveChannels';
import Schedule from './Schedule/Schedule';
import VodContents from './VodContents/VodContents';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

const Landing: TubiContainerFC<Props, RouteParams> = ({ params }) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const title = useAppSelector(titleSelector);

  useEffect(() => {
    dispatch(fetchLinearReminders());

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const helmetProps = useMemo(() => {
    const metaTitle = formatMessage(messages.title, { title });
    const canonical = getCanonicalLink(WEB_ROUTES.watchSchedule, params);
    const { title: titleParam } = params;
    const titleAssets = assetsGenerator(titleParam);
    const bannerImage = titleAssets('desktop-banner-bg@1x.jpg');
    const { description } = METADATA[titleParam];

    return {
      title: metaTitle,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: metaTitle },
        { property: 'og:description', content: description },
        { property: 'og:image', content: bannerImage },
        { property: 'og:image:alt', content: metaTitle },
        { property: 'og:image:width', content: '1440' },
        { property: 'og:image:height', content: '600' },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
        { property: 'twitter:image', content: bannerImage },
      ],
    };
  }, [formatMessage, params, title]);

  return (
    <div className={styles.root}>
      <Helmet {...helmetProps} />
      <Banner />
      <div className={styles.linearBg}>
        <div className={styles.content}>
          <Schedule />
          <LiveChannels />
          <VodContents />
          <Branding />
          <Faq />
        </div>
        <Footer />
      </div>
    </div>
  );
};

Landing.fetchData = ({ dispatch, params }) => {
  // Display a 404 page if the title slug is invalid
  if (!WATCH_SCHEDULE_VALUES.includes(params.title)) {
    const error = new Error('Invalid title slug') as Error & { errType: string };
    error.errType = CONTENT_NOT_FOUND;
    return Promise.reject(error);
  }

  const now = dayjs();
  dispatch(setNow(now));

  const lookahead = 2;
  dispatch(setDates(Array.from({ length: lookahead + 1 }).map((_, idx) => now.add(idx, 'day'))));

  return dispatch(fetchProgramming({ ...params, lookahead })) as unknown as Promise<unknown>;
};

export const fetchData = Landing.fetchData;

Landing.fetchDataDeferred = ({ dispatch, getState }) => {
  const state = getState();
  const contentIds = contentIdsSelector(state);
  const lastDate = lastDateSelector(state);

  return batchFetchPrograms({
    contentIds,
    dispatch,
    lastDate,
    lookahead: 4,
  });
};

export const fetchDataDeferred = Landing.fetchDataDeferred;

// TODO: temporarily disable streaming render because of the react-helemt issue.
// Will remove after migrating to react-helmet-async in https://app.shortcut.com/tubi/story/571766,
Landing.hasDynamicMeta = true;

export default Landing;
