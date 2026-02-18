import { Grid, Attributes, Poster } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useMemo, useEffect, Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { loadReminder } from 'common/actions/reminder';
import TileBadge from 'common/components/TileBadge/TileBadge';
import { TubiPresentsLogo } from 'common/components/TubiPresentsLogo/TubiPresentsLogo';
import {
  BREAKPOINTS,
  CONTAINER_TYPES,
  RELATED_CONTENTS_LIMIT_LEGACY,
  FEATURED_CONTAINER_ID,
  CONTENT_MODES,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { GENRE_TAGS } from 'common/constants/genre-tags';
import { TUPIAN_SRCSET_MEDIA_QUERY, TUPIAN_POSTERART_PREFIX } from 'common/constants/style-constants';
import WebVerticalYmal from 'common/experiments/config/webVerticalYmal';
import { useExperiment as useExperimentV2 } from 'common/experimentV2';
import { webottWebDesktopMovieRegGating } from 'common/experimentV2/configs/webottWebDesktopMovieRegGating';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isAdSelector } from 'common/selectors/playerStore';
import { isKidsModeEnabledSelector, isNewEpisodeSelector, isTubiPresentsContentSelector } from 'common/selectors/ui';
import type { Season, Series } from 'common/types/series';
import type { ViewportType } from 'common/types/ui';
import type { AudioTrackMetadata, Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { parseEpisodeInfo } from 'common/utils/episode';
import { getSeasonDisplayText } from 'common/utils/getSeasonDisplayText';
import { parseContentImages, formatSrcSet } from 'common/utils/imageResolution';
import { generateRatingDescriptorString } from 'common/utils/ratings';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import { getContainerUrl } from 'common/utils/urlConstruction';
import { getIsMovie } from 'ott/features/playback/utils/isMovie';
import type { AddToQueueProviderProps } from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import ComingSoonLabel from 'web/components/ContentDetail/ComingSoonLabel';
import ContentUnavailable from 'web/components/ContentDetail/ContentUnavailable';
import { useVideoProgressRegistrationGate } from 'web/features/playback/components/WebPlayer/hooks/useVideoProgressRegistrationGate';
import { checkIfContentIsComingSoon } from 'web/features/playback/containers/Video/videoUtils';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import type { HeadingContextProps } from 'web/features/seo/contexts/HeadingContext';
import { HeadingProvider } from 'web/features/seo/contexts/HeadingContext';
import { useViewportWidth } from 'web/rd/components/ContentDetail/hooks/useViewportWidth';
import PosterWithButtonGroup from 'web/rd/components/ContentDetail/PosterWithButtonGroup/PosterWithButtonGroup';
import RelatedContents from 'web/rd/components/RelatedContents/RelatedContents';
import VideoDetailSeriesSelect from 'web/rd/components/VideoDetailSeriesSelect/VideoDetailSeriesSelect';
import type { VideoDetailSeriesSelectProps } from 'web/rd/components/VideoDetailSeriesSelect/VideoDetailSeriesSelect';

import AudioLanguagesAndSubtitles from './AudioLanguagesAndSubtitles/AudioLanguagesAndSubtitles';
import ButtonGroup from './ButtonGroup/ButtonGroup';
import ContainerRow from './ContainerRow/ContainerRow';
import styles from './ContentDetail.scss';
import DirectorAndActor from './DirectorAndActor/DirectorAndActor';
import GenreTags from './GenreTags/GenreTags';
import SignInRequiredText from './SignInRequiredText/SignInRequiredText';

const messages = defineMessages({
  channelLogo: {
    description: 'alternative text for network logo',
    defaultMessage: '{network} network logo',
  },
  contentUnavailable: {
    description: 'label for unavailable content',
    defaultMessage: 'content unavailable',
  },
  episodeTitle: {
    description: 'episode title',
    defaultMessage: 'Season {season} Episode {episode} - {title}',
  },
  featuredRowTitle: {
    description: 'text for featured row title',
    defaultMessage: 'Featured on Tubi',
  },
  youMayAlsoLike: {
    description: 'text for you may also like',
    defaultMessage: 'You May Also Like',
  },
  details: {
    description: 'text for details',
    defaultMessage: 'Details',
  },
  genre: {
    description: 'text for genre',
    defaultMessage: 'Genre',
  },
});

export interface MainContentProps {
  viewportType: ViewportType;
  isOneColumnView: boolean;
  isSmallViewPort: boolean;
  showButtonGroupUnderDescription: boolean;
  poster: JSX.Element;
  posterWithButtonGroup: JSX.Element;
  contentMeta: JSX.Element;
  relatedContents: JSX.Element;
  extraRow: JSX.Element | null;
  seasonContents: JSX.Element | null;
  isNewDesign: boolean;
  ymalDetailsHeading: JSX.Element | null;
  detailsSection: JSX.Element | null;
}

export const MainContent = ({
  viewportType,
  isOneColumnView,
  isSmallViewPort,
  showButtonGroupUnderDescription,
  poster,
  posterWithButtonGroup,
  contentMeta,
  relatedContents,
  extraRow,
  seasonContents,
  isNewDesign,
  ymalDetailsHeading,
  detailsSection,
}: MainContentProps) => {
  const appColumnCount = viewportType === 'tablet' ? 4 : 5;
  const leftColSize = appColumnCount === 4 ? '3' : '1-5';
  const rightColSize = appColumnCount === 4 ? '9' : '4-5';

  const posterContent = showButtonGroupUnderDescription ? poster : posterWithButtonGroup;

  if (isNewDesign) {
    return (
      <Fragment>
        <div className={styles.topSection}>
          {contentMeta}
        </div>
        {seasonContents}
        {relatedContents}
      </Fragment>
    );
  }
  return isOneColumnView ? (
    <Fragment>
      <div className={styles.topSection}>
        {!isSmallViewPort ? posterContent : null}
        <div className={styles.metadataWrapper}>{contentMeta}</div>
      </div>
      {seasonContents}
      {ymalDetailsHeading}
      {relatedContents}
      {detailsSection}
      {extraRow}
    </Fragment>
  ) : (
    <Fragment>
      {!isSmallViewPort ? <Grid.Item xs={leftColSize}>{posterWithButtonGroup}</Grid.Item> : null}
      <Grid.Item lg={rightColSize} sm={12}>
        {contentMeta}
        {seasonContents}
        {ymalDetailsHeading}
        {relatedContents}
        {detailsSection}
      </Grid.Item>
    </Fragment>
  );
};

export interface ContentDetailProps extends WithRouterProps {
  content: Video;
  posterUrl?: string;
  seasons?: Season[];
  seasonIndex?: number;
  episodeIndex?: number;
  belongSeries?: AddToQueueProviderProps['belongSeries'];
  seriesTitle?: string;
  onClickWatch?: VoidFunction | null;
  isSeriesDetail?: boolean;
  shouldShowContentUnavailable: boolean;
  onSeasonIndexChange?: VideoDetailSeriesSelectProps['onSeasonIndexChange'];
  audioTracks?: AudioTrackMetadata[];
  isMatureContentGated: boolean;
  showRemindMe: boolean;
  isNewDesign?: boolean;
  relatedContentsHeadingLevel?: HeadingContextProps['headingLevel'];
  episodeId?: string;
  isMobileRedesign?: boolean;
  seriesContent?: Video;
}

const ContentDetail: FC<ContentDetailProps> = ({
  content,
  posterUrl,
  seasons,
  seasonIndex: propSeasonIndex,
  episodeIndex: propEpisodeIndex,
  belongSeries,
  seriesTitle,
  onClickWatch,
  isSeriesDetail = false,
  shouldShowContentUnavailable,
  onSeasonIndexChange,
  location,
  audioTracks,
  isMatureContentGated,
  showRemindMe,
  isNewDesign = false,
  relatedContentsHeadingLevel,
  episodeId,
  isMobileRedesign,
}) => {
  useTrackRerenders('ContentDetail');
  const dispatch = useAppDispatch();
  const { formatMessage } = useIntl();
  const {
    id,
    year,
    title,
    duration,
    ratings,
    tags,
    description,
    actors,
    directors,
    type,
    series_id: seriesId,
    channel_logo: channelLogo,
    channel_id: channelId,
    channel_name: channelName,
    is_recurring: isRecurring,
    availability_starts: availabilityStarts,
    has_subtitle: captionsAvailable,
    ad_languages: audioDescriptionLanguages,
    subtitles,
    images,
  } = content as Video & Series; // TODO(zhuo): better type

  const [isYmalActive, setIsYmalActive] = useState(true);
  const humanReadDuration = secondsToHoursAndMinutes(duration, { formatMessage });

  const { vw } = useViewportWidth();

  const shouldShowComingSoon = checkIfContentIsComingSoon({
    content,
    location,
  });

  const webVerticalYmal = useExperiment(WebVerticalYmal);

  const isSeries = type === SERIES_CONTENT_TYPE;
  const contentId = isSeries ? convertSeriesIdToContentId(id) : id;
  const isEpisode = !!seriesId;
  const seasonIndex = propSeasonIndex ?? 0;
  const episodeIndex = propEpisodeIndex ?? 0;

  const viewportType = useAppSelector((state) => state.ui.viewportType);
  const { isKidsModeEnabled, isEspanolModeEnabled } = useAppSelector((state) => state.ui);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isNewEpisode = useAppSelector(state => isNewEpisodeSelector(state, id));
  const isTubiPresentsContent = useAppSelector(state => isTubiPresentsContentSelector(state, id));
  const isSmallViewPort = vw < BREAKPOINTS.lg;

  // Registration gate experiment for preview banner spacing
  const isMovie = getIsMovie(content);
  const isKidsMode = useAppSelector(isKidsModeEnabledSelector);
  const isAd = useAppSelector(isAdSelector);
  const regGatingExperiment = useExperimentV2(webottWebDesktopMovieRegGating, {
    disableExposureLog: true,
  });
  const previewType = regGatingExperiment.get('preview_type');

  const isRegGateExperimentEnabledPreviewWithBanner = !isLoggedIn && !isKidsMode
    && previewType === 'preview_with_banner'
    && isMovie && !isAd;

  const { shouldShowGate } = useVideoProgressRegistrationGate(isRegGateExperimentEnabledPreviewWithBanner);

  const showPreviewBanner = isRegGateExperimentEnabledPreviewWithBanner && !shouldShowGate;

  /* vertical YMAL experiment, for titles unavailable */
  const webVerticalYmalEnabled = shouldShowContentUnavailable && webVerticalYmal.getValue() && !isSmallViewPort;
  const showButtonGroupUnderDescription = webVerticalYmalEnabled && vw > BREAKPOINTS.xl;
  const showButtonGroupAboveDescription = isSmallViewPort || isNewDesign;

  const posters = parseContentImages(content.images as Record<string, string[]>, TUPIAN_POSTERART_PREFIX);
  const posterSrcSet = formatSrcSet(posters);

  const artTitle = images?.title_art?.[0];

  const titleElement = useMemo(() => {
    if (isMobileRedesign) {
      return null;
    }
    if (isEpisode) {
      const info = parseEpisodeInfo(title);
      return (
        <React.Fragment>
          <h1 className={styles.title}>{seriesTitle}</h1>
          <h2 className={styles.subTitle}>{info.season ? formatMessage(messages.episodeTitle, info) : title}</h2>
        </React.Fragment>
      );
    }

    return artTitle && isNewDesign
      ? <img className={styles.artTitle} src={artTitle} alt={title} />
      : <h1 className={styles.title}>{title}</h1>;
  }, [isEpisode, artTitle, isNewDesign, title, seriesTitle, formatMessage, isMobileRedesign]);

  const labelElement = useMemo(() => {
    let label = null;
    if (shouldShowContentUnavailable) {
      if (shouldShowComingSoon) {
        label = <ComingSoonLabel className={styles.label} date={availabilityStarts} />;
      } else {
        label = <ContentUnavailable cls={styles.label} />;
      }
    } else if (isNewEpisode) {
      label = <TileBadge type="new-episode" className={styles.label} />;
    }
    return label;
  }, [shouldShowContentUnavailable, shouldShowComingSoon, availabilityStarts, isNewEpisode]);

  useEffect(() => {
    if (shouldShowContentUnavailable && !isKidsModeEnabled && isLoggedIn) {
      // only load reminder when content is unavailable
      // loadReminder will resolve if it's already loaded
      dispatch(loadReminder());
    }
  }, [shouldShowContentUnavailable, isKidsModeEnabled, isLoggedIn, dispatch]);

  useEffect(() => {
    if (shouldShowContentUnavailable && !isSmallViewPort) {
      webVerticalYmal.logExposure();
    }
  }, [shouldShowContentUnavailable, webVerticalYmal, isSmallViewPort]);

  const posterWithButtonGroup = (
    <PosterWithButtonGroup
      content={content}
      posterAlt={title}
      posterUrl={posterUrl}
      posterSrcSet={posterSrcSet}
      posterSizes={TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_POSTERART_PREFIX]}
      belongSeries={belongSeries}
      onClickWatch={onClickWatch}
      isContentUnavailable={shouldShowContentUnavailable}
      showRemindMe={showRemindMe}
      isSeriesDetail={isSeriesDetail}
      className={styles.poster}
    />
  );

  const poster = (
    <Poster
      alt={title}
      src={posterUrl}
      srcSet={posterSrcSet}
      sizes={TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_POSTERART_PREFIX]}
      className={styles.poster}
    />
  );

  const buttonGroup = (
    <ButtonGroup
      belongSeries={belongSeries}
      id={id}
      isRecurring={isRecurring}
      type={type}
      title={title}
      onClickWatch={onClickWatch}
      className={classnames(styles.buttonGroup, { [styles.buttonGroupMobileRedesign]: isMobileRedesign })}
      isSeriesDetail={isSeriesDetail}
      showRemindMe={showRemindMe}
      remindButtonClassName={showButtonGroupUnderDescription ? styles.remindButton : ''}
      isNewDesign={isNewDesign}
      episodeId={episodeId}
      content={content}
    />
  );

  let genreTags = !isKidsModeEnabled && !isEspanolModeEnabled && !isMobileRedesign ? <GenreTags tags={tags} separator={isNewDesign ? ', ' : undefined} /> : tags;
  if (!isKidsModeEnabled && !isEspanolModeEnabled && isMobileRedesign && tags?.length) {
    genreTags = <a href={getContainerUrl(GENRE_TAGS[tags?.[0] ?? '#'])}>{tags?.[0]}</a>;
  }
  const seriesSeasonNum = isSeries ? (content?.num_seasons ?? content?.seasons?.length ?? 0) : 0;

  const contentMeta = (
    <Fragment>
      <div className={styles.headers}>
        {labelElement}
        {titleElement}
        <Attributes
          year={year}
          seriesSeasonNum={seriesSeasonNum}
          seriesSeasonNumDisplayText={getSeasonDisplayText(formatMessage, seriesSeasonNum)}
          duration={humanReadDuration}
          rating={ratings?.[0]?.value}
          descriptor={generateRatingDescriptorString(ratings?.[0]?.descriptors)}
          tags={genreTags}
          channelLogoAltText={formatMessage(messages.channelLogo, { network: channelName })}
          channelLogo={channelLogo}
          channelUrl={channelId ? getContainerUrl(channelId, { type: CONTAINER_TYPES.CHANNEL }) : ''}
          cc={captionsAvailable}
          audioDescriptionsAvailable={audioDescriptionLanguages && audioDescriptionLanguages.length > 0}
          isNewDesign={isNewDesign}
          isMobileRedesign={isMobileRedesign}
          tubiPresentsLogo={isTubiPresentsContent ? <TubiPresentsLogo /> : undefined}
        />
      </div>
      {showButtonGroupAboveDescription && isMatureContentGated ? <SignInRequiredText marginTop="16px" marginBottom="20px" /> : null}
      {showButtonGroupAboveDescription ? buttonGroup : null}

      <div className={classnames(styles.textSection, { [styles.textSectionMobileRedesign]: isMobileRedesign })}>
        <div className={styles.description}>{description}</div>
        {!isMobileRedesign && (
          <>
            <AudioLanguagesAndSubtitles audioTracks={audioTracks} subtitles={subtitles} className={styles.audioLanguagesAndSubtitles} />
            <DirectorAndActor
              actors={actors}
              directors={directors}
              className={webVerticalYmalEnabled ? styles.directorAndStarring : ''}
            />
          </>
        )}
        {!showButtonGroupAboveDescription && isMatureContentGated ? <SignInRequiredText marginTop="24px" /> : null}
      </div>
      {showButtonGroupUnderDescription ? buttonGroup : null}
    </Fragment>
  );

  const shouldShowSeasonSelector = isNewDesign
    // In the redesigned details modal, we should show the season selector as a placeholder before loaded if the series is available
    ? isSeries && !shouldShowContentUnavailable && !shouldShowComingSoon
    : seasons && seasons.length;
  const seasonContents = (shouldShowSeasonSelector && !shouldShowContentUnavailable) ? (
    <VideoDetailSeriesSelect
      seriesId={`${belongSeries}`}
      seasons={seasons}
      episodeIndex={episodeIndex}
      seasonIndex={seasonIndex}
      onSeasonIndexChange={onSeasonIndexChange}
      fullWidthLayout={showButtonGroupUnderDescription}
      isNewDesign={isNewDesign}
    />
  ) : null;

  const columnBreakpoints = {
    xs: '4',
    lg: '1-5',
    xl: '2',
    xxl: '1-7',
  };

  let relatedContentsLimit = RELATED_CONTENTS_LIMIT_LEGACY;
  if (webVerticalYmalEnabled) {
    // in vertical YMAL experiment, show maximum 2 rows of related contents when viewport is above lg
    relatedContentsLimit = vw > BREAKPOINTS.xxl ? 14 : vw > BREAKPOINTS.xl ? 12 : 10;
  }

  let relatedContents = (
    <RelatedContents
      breakpoints={webVerticalYmalEnabled ? columnBreakpoints : undefined}
      className={classnames(styles.related, { [styles.visibilityHidden]: !isYmalActive })}
      contentId={contentId}
      isVertical={shouldShowContentUnavailable}
      limit={relatedContentsLimit}
      isContentUnavailable={shouldShowContentUnavailable}
      isNewDesign={isNewDesign}
      isMobileRedesign={isMobileRedesign}
    />
  );
  if (relatedContentsHeadingLevel) {
    relatedContents = <HeadingProvider headingLevel={relatedContentsHeadingLevel}>{relatedContents}</HeadingProvider>;
  }

  /* istanbul ignore next */
  const extraRow = webVerticalYmalEnabled ? (
    <ContainerRow
      id={FEATURED_CONTAINER_ID}
      className={styles.extraRow}
      breakpoints={columnBreakpoints}
      title={formatMessage(messages.featuredRowTitle)}
      forceCurrentMode={CONTENT_MODES.all}
    />
  ) : null;

  const handleYmalClick = useCallback(() => {
    setIsYmalActive(true);
  }, []);

  const handleDetailClick = useCallback(() => {
    setIsYmalActive(false);
  }, []);

  const ymalDetailsHeading = isMobileRedesign ? (
    <div className={styles.ymalDetailsHeading}>
      <span className={isYmalActive ? styles.enabled : styles.disabled} onClick={handleYmalClick}>
        {formatMessage(messages.youMayAlsoLike)}
      </span>
      <span className={isYmalActive ? styles.disabled : styles.enabled} onClick={handleDetailClick}>
        {formatMessage(messages.details)}
      </span>
    </div>
  ) : null;

  const detailsSection = isMobileRedesign ? (
    <div className={classnames(styles.textSection, styles.textSectionContentMobileRedesign, { [styles.hidden]: isYmalActive })}>
      <DirectorAndActor
        actors={actors}
        directors={directors}
        className={webVerticalYmalEnabled ? styles.directorAndStarring : ''}
      />
      <AudioLanguagesAndSubtitles audioTracks={audioTracks} subtitles={subtitles} className={styles.audioLanguagesAndSubtitles} />
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
      {!isKidsModeEnabled && !isEspanolModeEnabled && tags && tags.length > 0 && <><div className={styles.genreContainer}><span className={styles.genre}>{formatMessage(messages.genre)}:&nbsp;</span><GenreTags tags={tags} separator=", " /></div></>}
    </div>
  ) : null;

  const mainContentProps = {
    isOneColumnView: webVerticalYmalEnabled,
    isSmallViewPort,
    viewportType,
    showButtonGroupUnderDescription,
    poster,
    posterWithButtonGroup,
    contentMeta,
    relatedContents,
    ymalDetailsHeading,
    detailsSection,
    extraRow,
    seasonContents,
    isNewDesign,
  };

  return (
    <div
      className={classnames(styles.contentDetail, {
        [styles.oneColumnLayout]: webVerticalYmalEnabled,
        [styles.oneColumnLayoutWide]: showButtonGroupUnderDescription,
        [styles.newDesign]: isNewDesign,
        [styles.hasPreviewBannerSpacing]: showPreviewBanner,
      })}
    >
      <Grid.Container className={styles.gridContainer}>
        <MainContent {...mainContentProps} />
      </Grid.Container>
    </div>
  );
};

export default withRouter(ContentDetail);
