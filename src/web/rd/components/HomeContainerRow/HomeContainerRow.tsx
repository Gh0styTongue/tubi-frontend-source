import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { BreakpointProps, TileOrientation, PreviewAnchor } from '@tubitv/web-ui';
import { Carousel, Grid, RowHeader, useInView } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useMemo, memo, useCallback, useRef, useEffect, Fragment, forwardRef } from 'react';
import type { ReactNode } from 'react';

import {
  CONTAINER_TYPES,
  CREATORS_CONTAINER_ID,
  CREATORVERSE_BACKGROUND_URL_WEB_CONTAINER_ROW,
  CREATORVERSE_LOGO_URL,
  CW_FOR_REGISTRATION_CONTAINER_ID,
  FEATURED_CONTAINER_ID,
  HISTORY_CONTAINER_ID,
  QUEUE_CONTAINER_ID,
} from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebCreatorverse from 'common/experiments/config/webCreatorverse';
import WebCwRowForGuestUsers from 'common/experiments/config/webCwRowForGuestUsers';
import WebLandscape from 'common/experiments/config/webLandscape';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import useExposureLogger from 'common/hooks/useExposureLogger';
import { containerSelector } from 'common/selectors/container';
import { isFeaturedRowPreviewEnabledSelector } from 'common/selectors/experiments/webVideoPreview';
import { showLinearProgramsInRowsSelector } from 'common/selectors/linearProgramsInRows';
import { isDesktopHomeGridPages, isHoverOnTilePreviewSelector, shouldHideMetadataSelector } from 'common/selectors/ui';
import { videosByIdsSelector } from 'common/selectors/video';
import type { ContainerType } from 'common/types/container';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { isWebHomeRelatedPages } from 'common/utils/urlPredicates';
import { shouldRequestMoreVideos } from 'ott/utils/containerDetail';
import MovieItemListSchema from 'web/features/seo/components/MovieItemListSchema/MovieItemListSchema';
import LinearTile from 'web/rd/containers/LinearTile/LinearTile';
import MovieOrSeriesTile from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

import { ContinueWatchRegistrationRow } from './ContinueWatchRegistrationRow';
import styles from './HomeContainerRow.scss';
import MyStuffEmptyContainer from './MyStuffEmptyContainer';

interface NavigationParams {
  containerId: string;
  containerPosition: number;
  containerSlug: string;
  index: number;
}

interface CarouselIndexChangeParams {
  containerId: string;
  containerPosition: number;
  containerSlug: string;
  startIndex: number;
  endIndex: number;
}

export interface StoreContainerPositionParams {
  index: number;
  containerId: string;
}

export interface Props {
  breakpoints?: BreakpointProps;
  containerId: string;
  containerLogo?: string;
  containerSlug: string;
  containerTitle: ReactNode;
  containerPosition: number;
  containerType: ContainerType;
  containerHref: string;
  containerContents: string[];
  initialIndex: number;
  indexInContainer?: number;
  onStoreContainerPosition: (params: StoreContainerPositionParams) => void;
  onLoadMore: (containerId: string) => void;
  onCarouselIndexChange: (params: CarouselIndexChangeParams) => void;
  onNavigation: (params: NavigationParams) => void;
  footer?: React.ReactNode;
  className?: string;
  isMyStuffPage?: boolean;
  logForWebCwRowForGuestUsers?: boolean;
  personalizationId?: string;
  noDivider?: boolean;
}

interface CarouselItem {
  id: string;
  index: number;
}

const emptyContainerEventDialogSubtypeMap: Record<string, string> = {
  [HISTORY_CONTAINER_ID]: 'cw_empty',
  [QUEUE_CONTAINER_ID]: 'mylist_empty',
};

const HomeContainerRow = forwardRef<HTMLElement, Props>(({
  breakpoints,
  containerId,
  containerTitle,
  containerHref,
  containerContents,
  containerLogo,
  containerPosition,
  containerSlug,
  containerType,
  initialIndex,
  indexInContainer,
  onStoreContainerPosition,
  onLoadMore,
  onCarouselIndexChange,
  onNavigation,
  footer,
  className,
  isMyStuffPage,
  logForWebCwRowForGuestUsers,
  personalizationId,
  noDivider,
}, forwardedRef) => {
  const pathname = useLocation().pathname;
  const webLandscape = useExperiment(WebLandscape);
  const isWebLandscapeExperimentEnabled = useAppSelector(state => isDesktopHomeGridPages(state, pathname));
  const isInLandscapeExperimentVariant = isWebLandscapeExperimentEnabled && webLandscape.getValue() !== 'none';
  const isLinearContainer = containerType === CONTAINER_TYPES.LINEAR;
  const isFeaturedContainer = containerId === FEATURED_CONTAINER_ID;
  const tileOrientation: TileOrientation =
    isLinearContainer || isFeaturedContainer || isInLandscapeExperimentVariant ? 'landscape' : 'portrait';
  const isWebHomeGridPages = isWebHomeRelatedPages(pathname);
  const { refCallback, isInView } = useInView();
  const webCwRowForGuestUsers = useExperiment(WebCwRowForGuestUsers);
  const showLinearProgramsInRows =
    useAppSelector(showLinearProgramsInRowsSelector) && /* istanbul ignore next */ isWebHomeGridPages;
  const hideMetadata = useAppSelector(state => shouldHideMetadataSelector(state, pathname)) || /* istanbul ignore next */isInLandscapeExperimentVariant;

  const isCreatorsContainer = containerId === CREATORS_CONTAINER_ID;
  const webCreatorverseExperiment = useExperiment(WebCreatorverse);
  const isCreatorverseActive = webCreatorverseExperiment.getValue() && isCreatorsContainer;
  useExposureLogger(WebCreatorverse, isCreatorsContainer);

  // Get container data to access description for dynamic tagline
  const { containerIdMap = {} } = useAppSelector((state) =>
    containerSelector(state, { pathname })
  );
  const container = containerIdMap[containerId];
  const containerDescription = container?.description || '';

  const currentIndexRef = useRef(indexInContainer ?? initialIndex);
  const handleTileNavigation = useCallback(
    ({ index }: { index: number }) => {
      onNavigation({
        containerPosition,
        containerId,
        containerSlug,
        index,
      });
    },
    [containerPosition, containerId, containerSlug, onNavigation]
  );
  const carouselItems: CarouselItem[] = useMemo(
    () =>
      containerContents.map((id, index) => ({
        id,
        index,
      })),
    [containerContents]
  );
  const videos = useAppSelector((state) => videosByIdsSelector(state, containerContents));
  const renderCarouselItem = useCallback(
    (
      { id }: CarouselItem,
      index: number,
      { indexInViewport, itemsPerPage }: { indexInViewport: number; itemsPerPage: number }
    ) => {
      // The position of the preview is different depending on indexInViewport so we pass previewAnchor to content tiles
      let previewAnchor: PreviewAnchor = 'center';
      if (indexInViewport === 0) {
        previewAnchor = 'left';
      } else if (indexInViewport === itemsPerPage - 1) {
        previewAnchor = 'right';
      }

      if (isLinearContainer) {
        return (
          <LinearTile
            key={id}
            id={id}
            indexInContainer={index}
            onNavigation={handleTileNavigation}
            isProgram={showLinearProgramsInRows}
            hideMetadata={isInLandscapeExperimentVariant}
            labelPosition={isInLandscapeExperimentVariant ? /* istanbul ignore next */ 'top-left' : 'bottom-right'}
            previewAnchor={previewAnchor}
            personalizationId={personalizationId}
            containerPosition={containerPosition}
            containerId={containerId}
          />
        );
      }

      return (
        <MovieOrSeriesTile
          key={id}
          id={id}
          indexInContainer={index}
          containerPosition={containerPosition}
          tileOrientation={tileOrientation}
          showProgress={containerId === HISTORY_CONTAINER_ID}
          onNavigation={handleTileNavigation}
          containerId={containerId}
          previewAnchor={previewAnchor}
          isMyStuffPage={isMyStuffPage}
          personalizationId={personalizationId}
          hideMetadata={hideMetadata}
          disableLazyRender
        />
      );
    },
    [containerId, handleTileNavigation, isMyStuffPage, showLinearProgramsInRows, tileOrientation, personalizationId, hideMetadata, containerPosition, isLinearContainer, isInLandscapeExperimentVariant]
  );
  const handleIndexChange = useCallback(
    ({ colsPerPage, itemIndex }: { colsPerPage: number; itemIndex: number }) => {
      onStoreContainerPosition({ index: itemIndex, containerId });
      if (
        shouldRequestMoreVideos({
          titlesPerRow: colsPerPage,
          nextIndex: itemIndex,
          totalVideosCount: containerContents.length,
        })
      ) {
        onLoadMore(containerId);
      }
      onCarouselIndexChange({
        containerId,
        containerPosition,
        containerSlug,
        startIndex: currentIndexRef.current,
        endIndex: itemIndex,
      });
      currentIndexRef.current = itemIndex;
    },
    [
      containerContents.length,
      containerId,
      containerPosition,
      containerSlug,
      onCarouselIndexChange,
      onLoadMore,
      onStoreContainerPosition,
    ]
  );
  const isVideoPreviewEnabled = useAppSelector(isFeaturedRowPreviewEnabledSelector);
  const isHoverOnTilePreview = useAppSelector(isHoverOnTilePreviewSelector);
  const isMyStuffPageEmptyRow = isMyStuffPage && !containerContents?.length;
  const carouselCls = classNames(styles.carousel, {
    [styles.videoPreviewEnabled]: isVideoPreviewEnabled,
    [styles.hoverOnTilePreview]: isHoverOnTilePreview,
    [styles.landscapeCarousel]: isInLandscapeExperimentVariant,
  });

  const rowHeaderCls = classNames(styles.rowHeader, {
    [styles.videoPreviewEnabled]: isVideoPreviewEnabled,
    [styles.landscapeHeader]: isInLandscapeExperimentVariant,
    [styles.initialLandscapeHeader]: isInLandscapeExperimentVariant && containerPosition === 0,
  });
  const trackEmptyContainerEvent = useCallback(() => {
    trackEvent(
      eventTypes.DIALOG,
      buildDialogEvent(
        getCurrentPathname(),
        DialogType.CONTENT_NOT_FOUND,
        emptyContainerEventDialogSubtypeMap[containerId],
        DialogAction.SHOW
      )
    );
  }, [containerId]);

  useEffect(() => {
    if (isMyStuffPageEmptyRow) {
      trackEmptyContainerEvent();
    }
  }, [isMyStuffPageEmptyRow, trackEmptyContainerEvent]);

  useEffect(() => {
    if (isInView) {
      webCwRowForGuestUsers.logExposure();
    }
  }, [isInView, webCwRowForGuestUsers]);

  useExposureLogger(WebLandscape, isWebLandscapeExperimentEnabled && isMyStuffPageEmptyRow);

  let rowContent: ReactNode = null;
  if (isMyStuffPageEmptyRow) {
    rowContent = (
      <Fragment>
        <Grid.Container>
          <RowHeader href={containerHref} logo={containerLogo} className={rowHeaderCls}>
            <div className={styles.emptyHeader} />
          </RowHeader>
        </Grid.Container>
        <MyStuffEmptyContainer containerId={containerId} />
      </Fragment>
    );
  } else if (containerId === CW_FOR_REGISTRATION_CONTAINER_ID) {
    rowContent = (
      <Fragment>
        <Grid.Container>
          <RowHeader className={rowHeaderCls}>{containerTitle}</RowHeader>
        </Grid.Container>
        <Grid.Container>
          <ContinueWatchRegistrationRow />
        </Grid.Container>
      </Fragment>
    );
  } else {
    let carouselOrientation: TileOrientation = tileOrientation;
    if (isInLandscapeExperimentVariant) {
      carouselOrientation = 'previewableLandscape';
    } else if (isFeaturedContainer) {
      carouselOrientation = 'largeLandscape';
    }

    if (isCreatorverseActive) {
      containerTitle = (
        <div className={styles.creatorverseBranding}>
          <img src={CREATORVERSE_LOGO_URL} alt="Creatorverse" />
          <div className={styles.creatorverseDescription}>{containerDescription}</div>
        </div>
      );
    }

    rowContent = (
      <Fragment>
        <Grid.Container>
          <RowHeader href={containerHref} logo={containerLogo} className={rowHeaderCls}>
            {containerTitle}
          </RowHeader>
        </Grid.Container>
        <Carousel
          className={carouselCls}
          initialIndex={initialIndex}
          index={indexInContainer}
          data={carouselItems}
          tileOrientation={carouselOrientation}
          renderItem={renderCarouselItem}
          adjustPrevNextForContentTile={!isInLandscapeExperimentVariant}
          onIndexChange={handleIndexChange}
          advance={false}
          showItemOverflow
          breakpoints={breakpoints}
          shouldAlwaysShowIcons={isInLandscapeExperimentVariant}
        />
        <MovieItemListSchema videos={videos} />
      </Fragment>
    );
  }

  const sectionClass = classNames(styles.section, className, {
    [styles.noDivider]: hideMetadata || noDivider,
    [styles.landscapeSection]: isInLandscapeExperimentVariant,
  });

  const getNodeRef = useCallback((node: any) => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
    if (logForWebCwRowForGuestUsers) {
      refCallback(node);
    }
  }, [forwardedRef, logForWebCwRowForGuestUsers, refCallback]);

  return (
    <section
      data-test-id="rd-component-home-container-row"
      className={classNames(sectionClass, { [styles.creatorverseBackground]: isCreatorverseActive })}
      style={{ backgroundImage: isCreatorverseActive ? `url(${CREATORVERSE_BACKGROUND_URL_WEB_CONTAINER_ROW})` : undefined }}
      ref={getNodeRef}
    >
      {rowContent}
      {footer}
    </section>
  );
});

export default memo(HomeContainerRow);
