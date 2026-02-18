import { useQueryClient } from '@tanstack/react-query';
import { AutoPlayAction } from '@tubitv/analytics/lib/autoplayTypes';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import ArrowDownCircleIcon from 'common/components/uilib/SvgLibrary/ArrowDownCircleIcon';
import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import tubiHistory from 'common/history';
import { useAutoplay } from 'common/hooks/useAutoplay/useAutoplay';
import { buildQueryKeyForAutoplaySeriesChildren } from 'common/hooks/useAutoplay/utils';
import useInterval from 'common/hooks/useInterval';
import { usePrevious } from 'common/hooks/usePrevious';
import { ottMajorPlatformsVideoResourceTagSelector } from 'common/selectors/experiments/ottMajorVideoSelector';
import trackingManager from 'common/services/TrackingManager';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { buildAutoPlayEventBody } from 'common/utils/analytics';
import { getAutoPlayCounter, getAutoPlayUrl } from 'common/utils/autoplay';
import { getFirstEpisodeIdFromSeries } from 'common/utils/getFirstEpisodeIdFromSeries';
import { trackEvent } from 'common/utils/track';
import type { LocaleOptionType } from 'i18n/constants';
import AutoPlayContents from 'web/features/playback/components/AutoPlay/AutoPlayContents/AutoPlayContents';
import AutoPlayMinimizedDetail from 'web/features/playback/components/AutoPlay/AutoPlayMinimizedDetail/AutoPlayMinimizedDetail';

import styles from './AutoPlay.scss';

const messages = defineMessages({
  hideAutoplay: {
    description: 'hide autoplay',
    defaultMessage: 'Hide',
  },
  openAutoplay: {
    description: 'open autoplay',
    defaultMessage: 'Open',
  },
});

export interface AutoPlayProps {
  id: string;
  isEpisode: boolean;
  videoPaused: boolean;
  isFromAutoplay: boolean;
  isCounterEnabled: boolean;
  className?: string;
  onAutoplay?: (
    options: {
      contentId: string;
      isFromAutoplayDeliberate: boolean;
      isFromAutoplayAutomatic: boolean;
      isLive?: boolean;
    }) => void;
  onAutoplayContentLoaded?: (contents: Video[], timeLeft: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  contentLimit?: number;
  preferredLocale?: LocaleOptionType;
  videoResourceTag?: string;
}

interface AutoPlayState {
  timeLeft?: number;
  activeIndex: number;
  minimized: boolean;
}

/**
 * Handle logic surrounding autoplay
 * Pass most UI concerns to AutoPlayContents
 */
export const AutoPlay = ({
  className,
  contentLimit,
  id,
  isEpisode,
  isFromAutoplay,
  isCounterEnabled,
  preferredLocale,
  videoResourceTag,
  videoPaused,
  onAutoplay,
  onAutoplayContentLoaded,
  onPause,
  onResume,
}: AutoPlayProps) => {
  const queryClient = useQueryClient();
  // UI State
  const [{ timeLeft, activeIndex, minimized }, setState] = useState<AutoPlayState>({
    timeLeft: isCounterEnabled ? getAutoPlayCounter({ isEpisode }) : undefined,
    activeIndex: 0,
    minimized: false,
  });

  // On mount, track the autoplay show event
  useEffect(() => {
    trackEvent(eventTypes.AUTO_PLAY, buildAutoPlayEventBody(id, AutoPlayAction.SHOW));
  }, [id]);

  // Handle fetching the autoplay contents
  const defaultLimit = isEpisode ? 1 : 5;
  const { data: autoplayData } = useAutoplay({
    contentId: id,
    isAutoPlayVideo: isFromAutoplay,
    videoResourceTag,
    limit: contentLimit ?? defaultLimit,

  });
  const { contents, personalizationId } = autoplayData || {};

  // When loading finishes, call the onAutoplayContentLoaded callback
  const previousContents = usePrevious(contents);
  const isAutoplayJustLoaded = !previousContents && !!contents && !!timeLeft;
  useEffect(() => {
    if (isAutoplayJustLoaded) {
      onAutoplayContentLoaded?.(contents, timeLeft);
    }
  }, [isAutoplayJustLoaded, contents, onAutoplayContentLoaded, timeLeft]);

  // If the selected tile is a series, we need the first episode. It will be in the query cache.
  const getAutoplayVideo = useCallback(() => {
    const selectedVideo = contents?.[activeIndex];
    if (!selectedVideo) return;

    const { type } = selectedVideo;
    if (type === SERIES_CONTENT_TYPE) {
      const firstEpisodeContentId = getFirstEpisodeIdFromSeries(selectedVideo);
      if (!firstEpisodeContentId) {
        return selectedVideo;
      }
      const episodeVideo = queryClient.getQueryData<Video>(buildQueryKeyForAutoplaySeriesChildren({ sourceContentId: id, seriesId: selectedVideo.id, episodeId: firstEpisodeContentId }));
      return episodeVideo || selectedVideo;
    }
    return selectedVideo;
  }, [contents, activeIndex, queryClient, id]);

  // Handle navigate to the autoplay title, including events and side effects
  const playSelection = useCallback(({ isFromAutoplayDeliberate = false }: { isFromAutoplayDeliberate?: boolean; }) => {
    const selectedVideo = getAutoplayVideo();
    if (!selectedVideo) return;

    const toUrl = getAutoPlayUrl(selectedVideo, preferredLocale);
    tubiHistory.push(toUrl);
    if (onAutoplay) {
      onAutoplay({
        contentId: selectedVideo.id,
        isFromAutoplayDeliberate,
        isFromAutoplayAutomatic: !isFromAutoplayDeliberate,
      });
    }
  }, [onAutoplay, preferredLocale, getAutoplayVideo]);

  // Timer callback for countdown
  const timerCallback = useCallback(() => {
    setState(state => {
      if (state.timeLeft === undefined || videoPaused || minimized) return state;

      if (state.timeLeft <= 0) {
        // Set autoplay deliberate to false
        trackingManager.setAutoplayDeliberate(false);
        // Trigger automatic autoplay
        playSelection({ isFromAutoplayDeliberate: false });
        return state;
      }

      // Decrement timeLeft by 1 second
      return { ...state, timeLeft: state.timeLeft - 1 };
    });
  }, [videoPaused, minimized, playSelection]);

  // Determine when the timer should be active
  const shouldRunTimer = isCounterEnabled && !!contents?.length && timeLeft !== undefined && !videoPaused && !minimized;
  const timerDelay = shouldRunTimer ? 1000 : null;
  useInterval(timerCallback, timerDelay);

  // Handle pause/resume logic equivalent to class component's componentDidUpdate
  const isCurrentPaused = minimized || videoPaused;
  const previousPaused = usePrevious(isCurrentPaused);
  useEffect(() => {
    if (previousPaused !== undefined && isCurrentPaused !== previousPaused) {
      if (isCurrentPaused && onPause) {
        onPause();
      }
      if (!isCurrentPaused && onResume) {
        onResume();
      }
    }
  }, [isCurrentPaused, previousPaused, onPause, onResume]);

  // Handle User-initialized autoplay
  const manualAutoPlay = useCallback(() => {
    const video = contents?.[activeIndex];
    if (!video) return;

    const { type, id } = video;
    trackingManager.createNavigateToPageComponent({
      startX: activeIndex,
      startY: 0,
      contentId: type === SERIES_CONTENT_TYPE ? `0${id}` : id,
      componentType: ANALYTICS_COMPONENTS.autoplayComponent,
    });
    trackingManager.setAutoplayDeliberate(true);
    playSelection({ isFromAutoplayDeliberate: true });
  }, [contents, activeIndex, playSelection]);

  // Set up event handlers for child components
  const onTileClick = useCallback((index: number) => {
    if (index === activeIndex) {
      manualAutoPlay();
    } else {
      // Track navigate within page event for Auto play component
      trackingManager.trackCarouselTrigger({
        startX: activeIndex,
        endX: index,
        contentId: id,
        slug: '',
        componentType: ANALYTICS_COMPONENTS.autoplayComponent,
      });

      setState(state => ({
        ...state,
        activeIndex: index,
        timeLeft: isCounterEnabled ? getAutoPlayCounter({ isEpisode }) : undefined,
      }));
    }
  }, [activeIndex, manualAutoPlay, id, isCounterEnabled, isEpisode]);

  if (!contents?.length) return null;

  const activeVideo = getAutoplayVideo();
  if (!activeVideo) return null;

  const toUrl = getAutoPlayUrl(activeVideo);
  const triggerIconCls = classNames(styles.triggerIcon, {
    [styles.open]: minimized,
  });
  const triggerText = minimized ? messages.openAutoplay : messages.hideAutoplay;
  const toggleMinimized = () => setState(state => ({ ...state, minimized: !state.minimized }));

  return (
    <div
      className={classNames(styles.autoplayWrapper, className)}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={e => e.stopPropagation()}
    >
      <div className={styles.gradient} />
      <div className={styles.row}>
        <div
          className={styles.triggerRow}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={toggleMinimized}
        >
          <ArrowDownCircleIcon className={triggerIconCls} />
          <div className={styles.trigger}>
            <FormattedMessage {...triggerText} />
          </div>
        </div>
        {minimized ? (
          <AutoPlayMinimizedDetail
            title={activeVideo.title}
            toUrl={toUrl}
            onLinkClick={manualAutoPlay}
          />
        ) : (
          <AutoPlayContents
            contents={contents}
            counter={timeLeft}
            activeIndex={activeIndex}
            isEpisode={isEpisode}
            toUrl={toUrl}
            onTileClick={onTileClick}
            onLinkClick={manualAutoPlay}
            personalizationId={personalizationId}
          />
        )}
      </div>
    </div>
  );
};

function mapStateToProps(state: StoreState) {
  const { ui: { preferredLocale } } = state;
  return {
    preferredLocale,
    videoResourceTag: ottMajorPlatformsVideoResourceTagSelector(state),
  };
}

export default connect(mapStateToProps)(AutoPlay);
