import { Carousel } from '@tubitv/web-ui';
import throttle from 'lodash/throttle';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { loadHomeScreen } from 'common/actions/container';
import { SET_CATEGORIES_CHANNELS_ACTIVE_CONTAINER } from 'common/constants/action-types';
import { BREAKPOINTS, CONTAINER_GROUPINGS, HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import { containerMenuSelector, historyAndMylistContainersSelector } from 'common/selectors/container';
import { contentModeForMenuListSelector } from 'common/selectors/contentMode';
import type { Container } from 'common/types/container';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { actionWrapper } from 'common/utils/action';
import { groupContainers } from 'common/utils/containerTools';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import Footer from 'web/components/Footer/Footer';
import { messages as browserMenuMessage } from 'web/components/TopNav/Browse/BrowseMenu/BrowseMenu';
import { WebRefreshConsumer } from 'web/context/webRefreshContext';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import ContainerGrid from './ContainerGrid';
import styles from './Containers.scss';
import ContainerTile, { ContainerTileType } from './ContainerTile';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

const Containers: TubiContainerFC<Props, never> = memo(() => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [viewport, setViewport] = useState(BREAKPOINTS.xxl);

  const handleResize = useCallback(() => {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    setViewport(width);
  }, [setViewport]);

  const throttledHandleResize = throttle(handleResize, 250);

  useEffect(() => {
    throttledHandleResize();
    addEventListener(window, 'resize', throttledHandleResize);
    return () => {
      removeEventListener(window, 'resize', throttledHandleResize);
    };
  }, [throttledHandleResize]);
  const { twoDigitCountryCode } = useAppSelector((state) => state.ui);
  const isChannelsVisible = isFeatureAvailableInCountry(
    'channels',
    twoDigitCountryCode
  );
  const location = useLocation();
  const containerMenuItems = useAppSelector(state => containerMenuSelector(state, { pathname: location.pathname }));
  const historyAndMylistItems = useAppSelector(state => historyAndMylistContainersSelector(state, { pathname: location.pathname }));
  const groupings = groupContainers(containerMenuItems);
  // The viewportType cannot meet the design, so we define some view in this component
  const isTabletOrMobileViewport = viewport < BREAKPOINTS.lg;
  const {
    [CONTAINER_GROUPINGS.POPULAR]: popularItems,
    [CONTAINER_GROUPINGS.GENRES]: genresItems,
    [CONTAINER_GROUPINGS.COLLECTIONS]: collectionsItems,
    [CONTAINER_GROUPINGS.CHANNELS]: channelsItems,
  } = groupings;
  const popularItemsWithoutHistoryAndMyList = useMemo(
    () => popularItems.filter((cont) => ![HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID].includes(cont.id)),
    [popularItems]
  );

  const { popularFirstShowCount, genresFirstShowCount, collectionsFirstShowCount, channelsFirstShowCount } = useMemo(() => {
    return {
      popularFirstShowCount: popularItemsWithoutHistoryAndMyList.length,
      genresFirstShowCount: genresItems.length,
      collectionsFirstShowCount: collectionsItems.length,
      channelsFirstShowCount: 2,
    };
  }, [collectionsItems.length, genresItems.length, popularItemsWithoutHistoryAndMyList.length]);

  const indexInChannels = useAppSelector(state => state.webUI.categoriesPage.channelsActiveContainerIndex);
  const onChannelsIndexChange = useCallback(({ itemIndex }: { itemIndex: number }) => {
    dispatch(
      actionWrapper(
        SET_CATEGORIES_CHANNELS_ACTIVE_CONTAINER,
        { containerIndex: itemIndex }
      )
    );
  }, [dispatch]);

  const renderChannelContainers = useCallback((container: Container) => {
    return (
      <ContainerTile
        key={container.id}
        container={container}
        tileOrientation="landscape"
        tileType={ContainerTileType.Channel}
      />
    );
  }, []);

  const helmetProps = useMemo(() => {
    const canonical = getCanonicalLink(WEB_ROUTES.categories);

    return {
      link: [getCanonicalMetaByLink(canonical)],
    };
  }, []);

  return (
    <div data-test-id="web-containers">
      <Helmet {...helmetProps} />
      <div className={styles.containers}>
        <div className={styles.containerGrids}>
          <ContainerGrid
            className={styles.containerGrid}
            tileOrientation="portrait"
            containers={historyAndMylistItems}
          />
          <ContainerGrid
            className={styles.containerGrid}
            title={intl.formatMessage(browserMenuMessage.popular)}
            tileOrientation="portrait"
            containers={popularItemsWithoutHistoryAndMyList}
            isPlainTile
            centerTitle
            firstShowCount={popularFirstShowCount}
            categoryName={CONTAINER_GROUPINGS.POPULAR.toLowerCase()}
          />
          <ContainerGrid
            className={styles.containerGrid}
            title={intl.formatMessage(browserMenuMessage.genres)}
            tileOrientation="portrait"
            containers={genresItems}
            isPlainTile
            firstShowCount={genresFirstShowCount}
            categoryName={CONTAINER_GROUPINGS.GENRES.toLowerCase()}
          />
          <ContainerGrid
            className={styles.containerGrid}
            title={intl.formatMessage(browserMenuMessage.collections)}
            tileOrientation="landscape"
            containers={collectionsItems}
            isPlainTile
            firstShowCount={collectionsFirstShowCount}
            categoryName={CONTAINER_GROUPINGS.COLLECTIONS.toLowerCase()}
          />
          {isTabletOrMobileViewport && isChannelsVisible ? (
            <ContainerGrid
              className={styles.containerGrid}
              title={intl.formatMessage(browserMenuMessage.channels)}
              containers={channelsItems}
              tileOrientation="landscape"
              tileType={ContainerTileType.Channel}
              firstShowCount={channelsFirstShowCount}
              categoryName={CONTAINER_GROUPINGS.CHANNELS.toLowerCase()}
            />
          ) : channelsItems.length && isChannelsVisible ? (
            <div className={styles.channelCarouselContainer}>
              <h2 className={styles.channelCarouselContainerTitle}>
                {intl.formatMessage(browserMenuMessage.channels)}
              </h2>
              <Carousel
                data={channelsItems}
                initialIndex={indexInChannels}
                index={indexInChannels}
                tileOrientation="landscape"
                renderItem={renderChannelContainers}
                onIndexChange={onChannelsIndexChange}
                adjustPrevNextForContentTile
                advance={false}
                showItemOverflow
              />
            </div>
          ) : null}
        </div>
      </div>
      <WebRefreshConsumer>{({ enabled }) => <Footer useRefreshStyle={enabled} />}</WebRefreshConsumer>
    </div>
  );
});

// For CLS/LCP metric, we would better use fetchData for server rendering
Containers.fetchData = ({ getState, dispatch, location }) => {
  const state = getState();
  const contentMode = contentModeForMenuListSelector(state, { pathname: location.pathname });

  // We currently lack a specific API for our needs,
  // and we need to display images for the MyList and History containers. As a temporary solution,
  // we'll utilize the homescreen API to achieve this
  const promise = dispatch(loadHomeScreen({
    location,
    contentMode,
  }));

  return promise
    .catch(/* istanbul ignore next */(error: Error) => {
      logger.error({ error }, 'fetchData error - Containers');
      return Promise.reject(error);
    });
};

export const fetchData = Containers.fetchData;
export default Containers;
