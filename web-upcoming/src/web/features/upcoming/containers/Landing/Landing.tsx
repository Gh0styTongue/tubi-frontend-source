import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';

import { loadEpisodesInSeries, loadRelatedContents, loadVideoById } from 'common/actions/video';
import {
  EPISODE_PAGINATION_PAGE_SIZE,
  FREEZED_EMPTY_OBJECT,
  RELATED_CONTENTS_LIMIT_LEGACY,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import type { UserFacingError } from 'common/types/fire';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { getLogLevel } from 'common/utils/log';
import { encodeTitle } from 'common/utils/seo';
import { getDeepLinkForVideo } from 'common/utils/urlConstruction';
import { makeFullUrl } from 'common/utils/urlManipulation';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink, getSEOPageTitle } from 'web/features/seo/utils/seo';
import { UPCOMING_CONTENTS } from 'web/features/upcoming/constants/landing';
import { getContentId } from 'web/features/upcoming/utils/landing';
import Branding from 'web/features/watchSchedule/containers/Landing/Branding/Branding';
import baseStyles from 'web/features/watchSchedule/containers/Landing/Landing.scss';
import VodContents from 'web/features/watchSchedule/containers/Landing/VodContents/VodContents';
import type { RouteParams } from 'web/features/watchSchedule/types/landing';

import Banner from './Banner/Banner';
import Faq from './Faq/Faq';
import styles from './Landing.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

const messages = defineMessages({
  keywords: {
    description: 'keywords meta for SEO',
    defaultMessage: '{title}, Free, Movies, TV shows, legal, streaming, HD, full length',
  },
  description: {
    description: 'description meta for SEO',
    defaultMessage:
      'Watch {title} Free Online | {seasonsTotal, select, 0 {{description}} 1 {{seasonsTotal} Season. {description}} other {{seasonsTotal} Seasons. {description}}}',
  },
});

const Landing: TubiContainerFC<Props, RouteParams> = ({ params }) => {
  const { formatMessage } = useIntl();
  const upcomingContent = UPCOMING_CONTENTS[params.title];
  const contentId = getContentId(upcomingContent);
  const byId = useAppSelector((state) => state.video.byId);

  const content = useMemo(
    () => {
      const cmsContent = byId[contentId] || FREEZED_EMPTY_OBJECT;
      return ({
        ...cmsContent,
        ...upcomingContent,
        tags: [...upcomingContent.tags ?? [], ...cmsContent.tags ?? []],
      });
    },
    [byId, contentId, upcomingContent],
  );

  const helmetProps = useMemo(() => {
    const { posterarts: posters = [], thumbnails = [], landscape_images: landscapeImages = [], description } = content;
    const canonical = getCanonicalLink(WEB_ROUTES.upcoming, {
      ...params,
      title: params.title || encodeTitle(content.title),
    });
    const deepLink = getDeepLinkForVideo(content);
    const imageUrl = makeFullUrl(landscapeImages[0] || posters[0] || thumbnails[0]);
    const title = content.title;

    return {
      title: getSEOPageTitle({ title, SEOCopy: '- For Free on Tubi' }),
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        {
          name: 'keywords',
          content: formatMessage(messages.keywords, {
            title,
          }),
        },
        {
          name: 'description',
          content: formatMessage(messages.description, {
            title,
            description,
            seasonsTotal: (content.seasons || []).length,
          }),
        },
        { property: 'og:title', content: title },
        { property: 'og:image', content: imageUrl },
        { property: 'og:url', content: canonical },
        { property: 'og:type', content: 'tv_show' },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
        { property: 'twitter:image', content: imageUrl },
        { property: 'al:web:url', content: canonical },
        { property: 'al:ios:url', content: deepLink },
      ],
    };
  }, [content, formatMessage, params]);

  return (
    <div className={classNames(baseStyles.root, styles.root)}>
      <Helmet {...helmetProps} />
      <div className={baseStyles.linearBg}>
        <div className={classNames(baseStyles.content, styles.content)}>
          <Banner content={content} />
          <VodContents />
          <Branding />
          <Faq />
        </div>
      </div>
      <Footer />
    </div>
  );
};

Landing.fetchData = ({ dispatch, params }) => {
  const content = UPCOMING_CONTENTS[params.title];
  const { id: targetId, type } = content;
  const isSeries = type === SERIES_CONTENT_TYPE;

  if (isSeries) {
    return dispatch(loadEpisodesInSeries({
      seriesId: targetId,
      force: true,
      season: 1,
      page: 1,
      size: EPISODE_PAGINATION_PAGE_SIZE,
    })).catch(/* istanbul ignore next */(error: UserFacingError) => {
      const loggerType = getLogLevel(error.errType);
      logger[loggerType]({ error, contentId: targetId }, 'error when loading paginated data for Series container');
      return Promise.reject(error);
    });
  }

  return dispatch(loadVideoById(targetId)).catch(/* istanbul ignore next */(error: UserFacingError) => {
    const loggerType = getLogLevel(error.errType);
    logger[loggerType]({ error, contentId: targetId }, 'error when loading video data');
    return Promise.reject(error);
  });
};

export const fetchData = Landing.fetchData;

Landing.fetchDataDeferred = ({ dispatch, params }) => {
  const contentId = getContentId(UPCOMING_CONTENTS[params.title]);

  return dispatch(loadRelatedContents(contentId, RELATED_CONTENTS_LIMIT_LEGACY)).catch(/* istanbul ignore next */(error: any) => {
    const loggerType = getLogLevel(error.errType);
    logger[loggerType]({ error, contentId }, 'error when loading related contents for series container');
    return Promise.reject(error);
  });
};

export const fetchDataDeferred = Landing.fetchDataDeferred;

Landing.hasDynamicMeta = true;

export default Landing;
