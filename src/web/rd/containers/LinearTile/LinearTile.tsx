import { ContentTile } from '@tubitv/web-ui';
import type { ContentTileProps, FetchPriority, TileOrientation, LabelPosition, PreviewAnchor } from '@tubitv/web-ui';
import React, { memo, useMemo, useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import { trackMobileWebDeeplink } from 'client/features/playback/track/client-log/trackMobileWebDeeplink';
import TileBadge from 'common/components/TileBadge/TileBadge';
import {
  TUPIAN_SRCSET_MEDIA_QUERY,
  TUPIAN_LANDSCAPE_PREFIX,
  TUPIAN_POSTERART_PREFIX,
} from 'common/constants/style-constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebLandscape from 'common/experiments/config/webLandscape';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useContentTileInfo from 'common/hooks/useContentTileInfo';
import useExperiment from 'common/hooks/useExperiment';
import { deviceIdSelector } from 'common/selectors/auth';
import { isDesktopHomeGridPages, isAdultsModeSelector } from 'common/selectors/ui';
import { isWebLinearPlaybackSupportedSelector } from 'common/selectors/webLive';
import { ImpressionTile } from 'common/services/ImpressionsManager';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { parseContentImages, formatSrcSet } from 'common/utils/imageResolution';
import redirect from 'common/utils/redirect';
import { getDeepLinkForVideo, getUrlByVideo } from 'common/utils/urlConstruction';
import LazyItem from 'web/components/LazyItem/LazyItem';

interface NavigationParams {
  index: number;
  contentId: string;
}

export interface Props {
  fetchPriority?: FetchPriority;
  id: string;
  indexInContainer: number;
  lazyLoad?: boolean;
  onNavigation?: (params: NavigationParams) => void;
  preload?: boolean;
  showLiveBadge?: boolean;
  tileOrientation?: TileOrientation;
  isProgram?: boolean;
  hideMetadata?: boolean;
  labelPosition?: LabelPosition;
  previewAnchor?: PreviewAnchor;
  personalizationId?: string;
  containerPosition?: number;
  containerId?: string;
  colInContainer?: number;
}

const makeContentSelector = () =>
  createSelector(
    (state: StoreState) => state.video.byId,
    (_state: StoreState, contentId: string) => contentId,
    (byId, contentId) => byId[contentId] as Video | undefined
  );

const messages = defineMessages({
  play: {
    description: 'Play button tooltip',
    defaultMessage: 'Play',
  },
});

function LinearTile({
  fetchPriority,
  id,
  indexInContainer,
  lazyLoad,
  onNavigation,
  preload,
  showLiveBadge,
  tileOrientation = 'landscape',
  isProgram,
  hideMetadata,
  labelPosition = 'bottom-right',
  previewAnchor,
  personalizationId,
  containerPosition,
  containerId,
  colInContainer,
}: Props) {
  const contentSelector = useMemo(makeContentSelector, []);
  const content = useSelector<StoreState, Video | undefined>((state) => contentSelector(state, id));
  const isMobilePlaybackEnabled = useAppSelector(isWebLinearPlaybackSupportedSelector);
  const titleUrl = content && getUrlByVideo({ video: content });
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const deviceId = useAppSelector(deviceIdSelector);
  const deepLinkUrl =
    content && getDeepLinkForVideo(content, deviceId, { stopTracking: !isThirdPartySDKTrackingEnabled });

  const isAdultMode = useAppSelector(isAdultsModeSelector);
  const intl = useIntl();
  const { pathname } = useLocation();
  const webLandscape = useExperiment(WebLandscape);
  const isWebLandscapeExperimentEnabled = useAppSelector(state => isDesktopHomeGridPages(state, pathname));
  const isInLandscapeExperimentVariant = isWebLandscapeExperimentEnabled && webLandscape.getValue() !== 'none';

  const handleTileClick = useCallback(() => {
    // Deep link to content in native mobile app if browser playback is not supported
    if (!isMobilePlaybackEnabled && deepLinkUrl) {
      trackMobileWebDeeplink({ deeplinkSource: 'LinearTile' as const });
      redirect(deepLinkUrl);
    } else if (titleUrl) {
      onNavigation?.({ contentId: id, index: indexInContainer });
      tubiHistory.push(titleUrl);
    }
  }, [deepLinkUrl, id, indexInContainer, isMobilePlaybackEnabled, onNavigation, titleUrl]);

  const {
    title,
    subTitle,
    year,
    rating,
    descriptor,
    duration,
    timeLeft,
    progress,
    tags,
    labels,
    imageURL,
    backgroundImage,
  } = useContentTileInfo({ content, tileOrientation, showLinearProgramsInRows: isProgram });

  if (!content) return null;

  const { landscape_images: [landscape] = [], posterarts, images } = content;
  const thumbnail = parseContentImages(images as Record<string, string[]>, TUPIAN_LANDSCAPE_PREFIX);
  const thumbnailSrcSet = formatSrcSet(thumbnail);
  const posters = parseContentImages(images as Record<string, string[]>, TUPIAN_POSTERART_PREFIX);
  const posterSrcSet = formatSrcSet(posters);
  const imagesProps: Partial<ContentTileProps> =
    tileOrientation === 'landscape'
      ? {
        thumbnailSrc: isProgram ? imageURL : thumbnail?.[0]?.[1] || landscape,
        thumbnailSrcSet: isProgram ? undefined : thumbnailSrcSet,
        thumbnailSizes: TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_LANDSCAPE_PREFIX],
      }
      : {
        posterSrc: posters[0]?.[1] || posterarts?.[0],
        posterSrcSet,
        posterSizes: TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_POSTERART_PREFIX],
      };

  const extraInfo = isProgram ? {
    subTitle,
    year,
    tags,
    rating,
    ratingPosition: 'tags-row',
    descriptor,
    duration,
    timeLeft,
    progress,
    labelPosition,
    label: labels,
  } as const : {
    label: showLiveBadge ? <TileBadge type="live" /> : undefined,
  };

  const isShowImpressionTile =
    isAdultMode &&
    containerId &&
    personalizationId &&
    typeof containerPosition === 'number';

  return (
    <LazyItem>
      {({ active, ref }) => {
        const contentTile = (
          <ContentTile
            ref={ref}
            lazyActive={active}
            tileOrientation={tileOrientation}
            title={title}
            {...imagesProps}
            onClick={handleTileClick}
            onPlayClick={handleTileClick}
            href={titleUrl}
            fetchPriority={fetchPriority}
            lazyLoad={lazyLoad}
            preload={preload}
            {...extraInfo}
            shouldShowDetailsOnMobile={isProgram}
            hideMetadata={hideMetadata}
            isPreviewEnabled={isInLandscapeExperimentVariant}
            shouldNotShowTitleOnHover={isInLandscapeExperimentVariant && webLandscape.getValue() === 'hover_no_title'}
            previewBackgroundImageSrc={backgroundImage}
            previewAnchor={previewAnchor}
            hideProgress={isInLandscapeExperimentVariant}
            playLabel={intl.formatMessage(messages.play)}
          />
        );

        if (isShowImpressionTile) {
          return (
            <ImpressionTile
              contentId={id}
              containerId={containerId}
              row={containerPosition + 1}
              col={typeof colInContainer === 'number' ? colInContainer + 1 : indexInContainer + 1}
              personalizationId={personalizationId}
            >
              {contentTile}
            </ImpressionTile>
          );
        }

        return contentTile;
      }}
    </LazyItem>
  );
}

export default memo(LinearTile);
