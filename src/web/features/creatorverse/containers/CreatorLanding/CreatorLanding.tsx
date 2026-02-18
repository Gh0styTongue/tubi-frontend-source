import { Spinner } from '@tubitv/web-ui';
import React, { useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import { loadHistory } from 'common/actions/loadHistory';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import type { CreatorData } from 'common/hooks/useCreatorData';
import { useCreatorData } from 'common/hooks/useCreatorData';
import { fetchSurfaceWithDispatch } from 'common/hooks/useSurfaces/useSurfaceContainers';
import { viewportTypeSelector } from 'common/selectors/ui';
import type { FetchData } from 'common/types/tubiFC';
import type { Video } from 'common/types/video';
import { buildCreatorAppImagesQuery, transformContainers } from 'common/utils/creatorverse';
import { alwaysResolve } from 'common/utils/promise';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import RelatedContents from 'web/rd/components/RelatedContents/RelatedContents';

import styles from './CreatorLanding.scss';
import CreatorHero from '../../components/CreatorHero';
import CreatorRow from '../../components/CreatorRow';
import CreatorTile from '../../components/CreatorTile';

const CREATOR_BREAKPOINTS = {
  xs: '8',
  sm: '6',
  md: '4',
  lg: '4',
  xl: '4',
  xxl: '3',
} as const;

function selectHeroImage(
  images: Record<string, string[]> | undefined,
  viewportType: string
): string {
  if (!images) return '';

  const heroKey = `hero_${viewportType}`;
  if (images[heroKey]?.[0]) {
    return images[heroKey][0];
  }

  // Fallback to any available hero image
  return images.hero?.[0] || '';
}

function CreatorLanding() {
  const { pathname } = useLocation();
  const viewportType = useAppSelector(viewportTypeSelector);

  // Extract app ID from pathname - e.g., /creators/watcher
  const appId = pathname.split('/').pop() || '';

  const appImages = useMemo(() => buildCreatorAppImagesQuery(), []);

  const { data, isLoading, error } = useCreatorData(appId, {
    contents_limit: 9,
    include_ui_customization: true,
    app_images: appImages,
  });

  const helmetProps = useMemo(() => {
    const { title, description } = data?.app || {};
    const canonical = getCanonicalLink(WEB_ROUTES.creators, { id: appId });

    return {
      title,
      link: [
        getCanonicalMetaByLink(canonical),
      ],
      meta: [
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };
  }, [data?.app, appId]);

  const renderContent = useCallback((video: Video, _index: number, trackClick: (contentId: string) => void, isFirstRow: boolean) => (
    <CreatorTile
      key={video.id}
      video={video}
      disableLazyRender
      showSubTitleInTitleArea={isFirstRow}
      onTileClick={trackClick}
      showProgress
    />
  ), []);

  const renderContainerRow = useCallback(
    (container: CreatorData['containers'][number], containerIndex: number) => {
      const isFirstRow = containerIndex === 0;

      return (
        <CreatorRow
          key={container.id}
          title={container.title}
          data={container.contents}
          renderItem={renderContent}
          showChevron={!!container.detailsUrl}
          headerUrl={container.detailsUrl}
          breakpoints={CREATOR_BREAKPOINTS}
          containerSlug={container.id}
          indexInContainer={containerIndex}
          isFirstRow={isFirstRow}
          titleLineClamp={1}
        />
      );
    },
    [renderContent]
  );

  // Error handling - throw error to be caught by Error Boundary
  if (error) {
    throw error;
  }

  // Show loading state while data is being fetched
  if (isLoading || !data) {
    return (
      <div className={styles.creatorLanding}>
        <div className={styles.loadingState}>
          <Spinner />
        </div>
      </div>
    );
  }

  const { app, containers } = data;

  const heroImage = selectHeroImage(app.images, viewportType);

  return (
    <>
      <Helmet {...helmetProps} />
      <div className={styles.creatorLanding}>
        <div
          className={styles.background}
          style={{ backgroundImage: `url(${heroImage})` }}
        />

        <main className={styles.content}>
          <CreatorHero
            name={app.title}
            avatar={app.images?.logo?.[0] || ''}
            genres={app.genres}
            description={app.description}
          />

          {containers.map(renderContainerRow)}

          <div className={styles.relatedContents}>
            <RelatedContents appId={app.id} showOneRow />
          </div>

        </main>

        <Footer useRefreshStyle />
      </div>
    </>
  );
}

const fetchData: FetchData<{ id: string }> = async ({ params, queryClient, dispatch, getState }) => {
  const { id: appId } = params;

  try {
    const promises = [];

    const appImages = buildCreatorAppImagesQuery();

    const queryParams = {
      contents_limit: 9,
      include_ui_customization: true,
      app_images: appImages,
    };

    promises.push(queryClient.prefetchQuery<CreatorData, Error>({
      queryKey: ['creatorSurface', appId, queryParams],
      queryFn: async () => {
        const response = await fetchSurfaceWithDispatch(appId, queryParams, dispatch);

        if (!response.app) {
          throw new Error(`Failed to fetch creator surface: app data is missing for ${appId}`);
        }

        const transformedContainers = transformContainers(
          response.containers || [],
          response.contents || {}
        );

        return {
          app: response.app,
          containers: transformedContainers,
        };
      },
    }));

    if (isLoggedInSelector(getState())) {
      promises.push(alwaysResolve(dispatch(loadHistory())));
    }
    await Promise.all(promises);
  } catch (error) {
    logger.error({ error, contentId: appId }, 'error when loading for creator landing page');
    return Promise.reject(error);
  }
};

CreatorLanding.fetchData = fetchData;
CreatorLanding.hasDynamicMeta = true;

export default CreatorLanding;
