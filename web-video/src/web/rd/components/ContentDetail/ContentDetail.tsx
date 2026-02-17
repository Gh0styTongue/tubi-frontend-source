import { Grid, Attributes, Poster } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useMemo, useEffect, Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { loadReminder } from 'common/actions/reminder';
import {
  BREAKPOINTS,
  CONTAINER_TYPES,
  RELATED_CONTENTS_LIMIT_LEGACY,
  FEATURED_CONTAINER_ID,
  CONTENT_MODES,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { TUPIAN_SRCSET_MEDIA_QUERY, TUPIAN_POSTERART_PREFIX } from 'common/constants/style-constants';
import WebVerticalYmal from 'common/experiments/config/webVerticalYmal';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import type { Season, Series } from 'common/types/series';
import type { ViewportType } from 'common/types/ui';
import type { AudioTrackMetadata, Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { parseEpisodeInfo } from 'common/utils/episode';
import { parseContentImages, formatSrcSet } from 'common/utils/imageResolution';
import { generateRatingDescriptorString } from 'common/utils/ratings';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import { getContainerUrl } from 'common/utils/urlConstruction';
import type { AddToQueueProviderProps } from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import ComingSoonLabel from 'web/components/ContentDetail/ComingSoonLabel';
import ContentUnavailable from 'web/components/ContentDetail/ContentUnavailable';
import { checkIfContentIsComingSoon } from 'web/features/playback/containers/Video/videoUtils';
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
}: MainContentProps) => {
  const appColumnCount = viewportType === 'tablet' ? 4 : 5;
  const leftColSize = appColumnCount === 4 ? '3' : '1-5';
  const rightColSize = appColumnCount === 4 ? '9' : '4-5';

  const posterContent = showButtonGroupUnderDescription ? poster : posterWithButtonGroup;

  return isOneColumnView ? (
    <Fragment>
      <div className={styles.topSection}>
        {!isSmallViewPort ? posterContent : null}
        <div className={styles.metadataWrapper}>{contentMeta}</div>
      </div>
      {seasonContents}
      {relatedContents}
      {extraRow}
    </Fragment>
  ) : (
    <Fragment>
      {!isSmallViewPort ? <Grid.Item xs={leftColSize}>{posterWithButtonGroup}</Grid.Item> : null}
      <Grid.Item lg={rightColSize} sm={12}>
        {contentMeta}
        {seasonContents}
        {relatedContents}
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
}

const ContentDetail: FC<ContentDetailProps> = ({
  content,
  posterUrl,
  seasons,
  episodeIndex = 0,
  seasonIndex = 0,
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
}) => {
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
  } = content as Video & Series; // TODO(zhuo): better type
  const humanReadDuration = secondsToHoursAndMinutes(duration, formatMessage);

  const { vw } = useViewportWidth();

  const shouldShowComingSoon = checkIfContentIsComingSoon({
    content,
    location,
  });

  const webVerticalYmal = useExperiment(WebVerticalYmal);

  const contentId = type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id;
  const isEpisode = !!seriesId;
  const viewportType = useAppSelector((state) => state.ui.viewportType);
  const { isKidsModeEnabled, isEspanolModeEnabled } = useAppSelector((state) => state.ui);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isSmallViewPort = vw < BREAKPOINTS.lg;

  /* vertical YMAL experiment, for titles unavailable */
  const webVerticalYmalEnabled = shouldShowContentUnavailable && webVerticalYmal.getValue() && !isSmallViewPort;
  const showButtonGroupUnderDescription = webVerticalYmalEnabled && vw > BREAKPOINTS.xl;

  const posters = parseContentImages(content.images as Record<string, string[]>, TUPIAN_POSTERART_PREFIX);
  const posterSrcSet = formatSrcSet(posters);

  const titleElement = useMemo(() => {
    if (isEpisode) {
      const info = parseEpisodeInfo(title);

      return (
        <React.Fragment>
          <h1 className={styles.title}>{seriesTitle}</h1>
          <h2 className={styles.subTitle}>{info.season ? formatMessage(messages.episodeTitle, info) : title}</h2>
        </React.Fragment>
      );
    }

    return <h1 className={styles.title}>{title}</h1>;
  }, [formatMessage, isEpisode, seriesTitle, title]);

  const labelElement = useMemo(() => {
    let label = null;
    if (shouldShowContentUnavailable) {
      if (shouldShowComingSoon) {
        label = <ComingSoonLabel date={availabilityStarts} />;
      } else {
        label = <ContentUnavailable />;
      }
    }
    return label;
  }, [shouldShowContentUnavailable, shouldShowComingSoon, availabilityStarts]);

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
      className={styles.buttonGroup}
      isSeriesDetail={isSeriesDetail}
      showRemindMe={showRemindMe}
      remindButtonClassName={showButtonGroupUnderDescription ? styles.remindButton : ''}
      video={content}
    />
  );

  const genreTags = !isKidsModeEnabled && !isEspanolModeEnabled ? <GenreTags tags={tags} /> : tags;

  const contentMeta = (
    <Fragment>
      {labelElement}
      {titleElement}
      <Attributes
        year={year}
        duration={humanReadDuration}
        rating={ratings?.[0]?.value}
        descriptor={generateRatingDescriptorString(ratings?.[0]?.descriptors)}
        tags={genreTags}
        channelLogoAltText={formatMessage(messages.channelLogo, { network: channelName })}
        channelLogo={channelLogo}
        channelUrl={channelId ? getContainerUrl(channelId, { type: CONTAINER_TYPES.CHANNEL }) : ''}
        cc={captionsAvailable}
        audioDescriptionsAvailable={audioDescriptionLanguages && audioDescriptionLanguages.length > 0}
      />
      {isSmallViewPort && isMatureContentGated ? <SignInRequiredText marginTop="16px" marginBottom="20px" /> : null}
      {isSmallViewPort ? buttonGroup : null}
      <div className={styles.textSection}>
        <div className={styles.description}>{description}</div>
        <AudioLanguagesAndSubtitles audioTracks={audioTracks} subtitles={subtitles} />
        {!__IS_FAILSAFE__ && ( // temporary until we migrate person pages to not use /oz/search
          <DirectorAndActor
            actors={actors}
            directors={directors}
            className={webVerticalYmalEnabled ? styles.directorAndStarring : ''}
          />
        )}
        {!isSmallViewPort && isMatureContentGated ? <SignInRequiredText marginTop="24px" /> : null}
      </div>
      {showButtonGroupUnderDescription ? buttonGroup : null}
    </Fragment>
  );

  const seasonContents =
    seasons && seasons.length ? (
      <VideoDetailSeriesSelect
        seriesId={`${belongSeries}`}
        seasons={seasons}
        episodeIndex={episodeIndex}
        seasonIndex={seasonIndex}
        onSeasonIndexChange={onSeasonIndexChange}
        fullWidthLayout={showButtonGroupUnderDescription}
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

  const relatedContents = (
    <RelatedContents
      breakpoints={webVerticalYmalEnabled ? columnBreakpoints : undefined}
      className={webVerticalYmalEnabled ? styles.related : ''}
      contentId={contentId}
      isVertical={shouldShowContentUnavailable}
      limit={relatedContentsLimit}
      isContentUnavailable={shouldShowContentUnavailable}
    />
  );

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

  const mainContentProps = {
    isOneColumnView: webVerticalYmalEnabled,
    isSmallViewPort,
    viewportType,
    showButtonGroupUnderDescription,
    poster,
    posterWithButtonGroup,
    contentMeta,
    relatedContents,
    extraRow,
    seasonContents,
  };

  return (
    <div
      className={classnames(styles.contentDetail, {
        [styles.oneColumnLayout]: webVerticalYmalEnabled,
        [styles.oneColumnLayoutWide]: showButtonGroupUnderDescription,
      })}
    >
      <Grid.Container>
        <MainContent {...mainContentProps} />
      </Grid.Container>
    </div>
  );
};

export default withRouter(ContentDetail);
