import { Container } from '@tubitv/web-ui';
import React, { Fragment, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';

import { loadContainer } from 'common/actions/container';
import { FEATURED_CONTAINER_ID, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { CONTENT_NOT_FOUND } from 'common/constants/error-types';
import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import { videosByIdsSelector } from 'common/selectors/video';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import DeviceList from 'web/components/DeviceList/DeviceList';
import Footer from 'web/components/Footer/Footer';
import { fetchPerson } from 'web/features/person/actions/person';
import { FEATURED_CONTENTS_LIMIT } from 'web/features/person/constants/person';
import { contentIdsSelector, nameSelector } from 'web/features/person/selectors/person';
import type { RouteParams } from 'web/features/person/types/person';
import { HASH_LENGTH, getHashedName, filterByPersonName } from 'web/features/person/utils/person';
import MovieItemListSchema from 'web/features/seo/components/MovieItemListSchema/MovieItemListSchema';
import PersonSchema from 'web/features/seo/components/PersonSchema/PersonSchema';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import FluidGrid from 'web/rd/components/FluidGrid/FluidGrid';

import Connections from './Connections';
import FeaturedRow from './FeaturedRow';
import NoResult from './NoResult';
import styles from './Person.scss';
import messages from './personMessages';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

const Person: TubiContainerFC<Props, RouteParams> = ({ params }) => {
  const { formatMessage } = useIntl();

  const contentIds = useAppSelector(contentIdsSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const name = useAppSelector(nameSelector);
  const videos = useAppSelector((state) => videosByIdsSelector(state, contentIds)).filter(filterByPersonName(name));

  const contentCount = videos.length;
  const firstThreeTitles = videos.slice(0, 3).map((video) => video.title);
  const convertedContentIds = videos.map((video) => {
    const { id, type } = video;
    return type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id;
  });

  const helmetProps = useMemo(() => {
    const canonical = getCanonicalLink(WEB_ROUTES.person, params);
    const title = formatMessage(messages.metaTitle, { name });
    const description = formatMessage(messages.metaDescription, {
      name,
      titleCount: firstThreeTitles.length,
      titles: firstThreeTitles.join(', '),
    });

    return {
      title,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };
  }, [name, firstThreeTitles, params, formatMessage]);

  // For a better LCP, we avoid lazy loading images that are in the first visible viewport. The number was
  // decided by PI (PageSpead Insights) screen size. PI loads 10 first screen images on desktop and 9 images
  // on mobile. But to adapt to larger screens, we adjust the desktop number to 12.
  // https://web.dev/browser-level-image-lazy-loading/#avoid-lazy-loading-images-that-are-in-the-first-visible-viewport
  /* istanbul ignore next */
  const lazyLoadStartIndex = isMobile ? 9 : 12;
  const highFetchPriorityRange: [number, number] = [0, lazyLoadStartIndex - 1];
  const preloadRange = highFetchPriorityRange;

  const fluidGridProps = {
    className: styles.movies,
    contentIds: convertedContentIds,
    highFetchPriorityRange,
    preloadRange,
    lazyLoadStartIndex,
    showProgress: true,
  };

  let content = <NoResult />;
  if (contentCount > 0) {
    content = (
      <Fragment>
        <FluidGrid {...fluidGridProps} />
        <Connections name={name} videos={videos} />
        {contentCount <= 3 ? <FeaturedRow /> : null}
      </Fragment>
    );
  }

  return (
    <div className={styles.root}>
      <Helmet {...helmetProps} />
      <MovieItemListSchema videos={videos} />
      <PersonSchema name={name} videos={videos} />
      <Container className={styles.content}>
        <h1>{formatMessage(messages.heading, { name })}</h1>
        {content}
        <DeviceList className={styles.deviceList} />
      </Container>
      <Footer useRefreshStyle />
    </div>
  );
};

Person.fetchData = ({ dispatch, params, location }) => {
  const { id, name } = params;

  // Display a 404 page if the hashed name doesn't match the id.
  const hashedName = getHashedName(name);
  if (hashedName !== id.slice(0, HASH_LENGTH)) {
    const error = new Error('Invalid hashed name') as Error & { errType: string };
    error.errType = CONTENT_NOT_FOUND;
    return Promise.reject(error);
  }

  return Promise.all([
    dispatch(fetchPerson(params)),
    dispatch(
      loadContainer({
        location,
        id: FEATURED_CONTAINER_ID,
        limit: FEATURED_CONTENTS_LIMIT,
      })
    ),
  ]);
};

export const fetchData = Person.fetchData;

// The 404 page needs to disable useStreamRendering. Otherwise, a "Can't set headers after they are sent" error
// will be thrown. That's because the server tries to update response code to 404 after the page has been rendered
// in the StreamRendering mode. I think that's something we can improve at "src/server/lib/renderUtils.js". But now,
// a quick fix/workaround is to disable useStreamRendering by setting hasDynamicMeta to true.
Person.hasDynamicMeta = true;

export default Person;
