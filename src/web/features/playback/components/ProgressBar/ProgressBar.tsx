import { clamp } from '@adrise/utils/lib/tools';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import useAppSelector from 'common/hooks/useAppSelector';
import { positionSelector } from 'common/selectors/playerStore';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import type { ThumbnailSprites } from 'common/types/video';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { secondsToHMS } from 'common/utils/timeFormatting';
import { useTrackDimensions } from 'web/features/playback/components/ProgressBar/useTrackDimensions';
import ThumbnailPreview from 'web/features/playback/components/ThumbnailPreview/ThumbnailPreview';
import type { WebSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { bufferPositionSelector, durationSelector, isAdSelector, castPositionSelector, castIsAdSelector, castDurationSelector } from 'web/features/playback/selectors/player';

import styles from './ProgressBar.scss';

const THUMBNAIL_ANIMATION_TIME = 300;

const MOUSE_ENTER_DELAY = 200;

const previewTransitions = {
  enter: styles.previewEnter,
  enterActive: styles.previewEnterActive,
  exit: styles.previewLeave,
  exitActive: styles.previewLeaveActive,
};

export interface ProgressBarProps {
  seek: WebSeekFn,
  thumbnailSprites?: ThumbnailSprites,
  adBreaks?: number[];
  isCasting?: boolean;
}

const ProgressBar = (props: ProgressBarProps) => {
  const { seek, thumbnailSprites, adBreaks, isCasting } = props;

  // selectors
  const bufferPosition = useAppSelector(bufferPositionSelector);
  const duration = useAppSelector(isCasting ? castDurationSelector : durationSelector);
  const position = useAppSelector(isCasting ? castPositionSelector : positionSelector);
  const isAd = useAppSelector(isCasting ? castIsAdSelector : isAdSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);

  // debounced tracking of outer div bounding rect
  const { timelineElRef, left, width } = useTrackDimensions();

  // are we moving the indicator on a mobile device
  const [mobileIndicatorMoveActive, setMobileIndicatorMoveActive] = useState(false);

  // Is the user actively dragging the scrubber? E.g. did the user
  // mousedown on the scrubber itself and move? Note that this is not
  // implemented for mobile
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);

  // Where the white line is showing an possible in-progress seek.
  // -1 means the UI is not in this state. Only visible visually if
  // ahead of the playhead. This UI shows on hover on desktop and
  // while touching on mobile, a distinct user action from dragging
  // the scrubber.
  const [indicatorPosition, setIndicatorPosition] = useState(-1);

  // When dragging the scrubber, this is its position
  const [dragPosition, setDragPosition] = useState(position);

  // help prevent mouseup from triggering a click event

  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // allow for a delay in showing the seek preview bar on hover
  const indicatorTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // given an x coordinate on screen, compute the target
  // position in content in seconds
  const computeTargetPosition = useCallback((x: number) => {
    const ratio = clamp((x - left) / width, 0, 1);
    return Math.floor(ratio * duration);
  }, [left, width, duration]);

  // user clicking on the thumbnail preview element which shows
  // when hovering over the progress bar
  const handlePreviewClick = useCallback(() => {
    seek({ toPosition: indicatorPosition, seekInitiator: 'THUMBNAIL_CLICK' });
  }, [indicatorPosition, seek]);

  // Clicking on the progress bar itself seeks
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAd && !clickTimerRef.current) {
      seek({ toPosition: computeTargetPosition(e.clientX), seekInitiator: 'PROGRESS_BAR_CLICK' });
    }
  }, [isAd, seek, computeTargetPosition]);

  // update the "ghost" indicator on hover and the position of the thumbnail
  const handleMouseMove = useCallback(({ clientX }: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingScrubber || isAd) return;
    if (indicatorTimerRef.current) return;
    setIndicatorPosition(computeTargetPosition(clientX));
  }, [isDraggingScrubber, isAd, computeTargetPosition]);

  // intended to end drags when user leaves outer div
  const handleMouseLeave = useCallback(() => {
    if (isDraggingScrubber || isAd) return;
    if (indicatorTimerRef.current) {
      clearTimeout(indicatorTimerRef.current);
      indicatorTimerRef.current = undefined;
    }
    setIndicatorPosition(-1);
  }, [isAd, isDraggingScrubber]);

  // intended to handle clicking on the scrubber circle / playhead directly
  const handleScrubberMouseDown = useCallback(({ clientX }: React.MouseEvent<HTMLDivElement>) => {
    if (isAd) return;
    // reset indicator
    handleMouseLeave();
    setIsDraggingScrubber(true);
    setDragPosition(computeTargetPosition(clientX));
  }, [isAd, handleMouseLeave, computeTargetPosition]);

  // Note we do not use the indicator timer here; makes the mobile UI feel much
  // more responsive to leave this out
  const handleTouchStart = useCallback(({ touches }: React.TouchEvent<HTMLDivElement>) => {
    if (isAd) return;
    const clientX = touches[0]?.clientX;
    // type guard
    /* istanbul ignore next */
    if (clientX === undefined) return;
    setIndicatorPosition(computeTargetPosition(clientX));
    setMobileIndicatorMoveActive(true);
  }, [isAd, computeTargetPosition]);

  // update the "ghost" indicator on hover
  const handleMouseEnter = useCallback(({ clientX }: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingScrubber || isAd) return;
    indicatorTimerRef.current = setTimeout(() => {
      indicatorTimerRef.current = undefined;

      setIndicatorPosition(computeTargetPosition(clientX));
    }, MOUSE_ENTER_DELAY);
  }, [isDraggingScrubber, isAd, computeTargetPosition]);

  // for scrubber/playhead dragging on desktop
  useEffect(() => {
    if (isMobile) return;
    const handleGlobalMouseMove = (({ clientX }: MouseEvent) => {
      if (!isDraggingScrubber || isAd) return;
      const targetPosition = computeTargetPosition(clientX);
      setDragPosition(targetPosition);
    });
    addEventListener(window, 'mousemove', handleGlobalMouseMove);
    return () => {
      removeEventListener(window, 'mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingScrubber, isAd, computeTargetPosition, isMobile]);

  // for scrubber/playhead dragging on desktop
  useEffect(() => {
    if (isMobile) return;
    const handleGlobalMouseUp = ({ clientX }: MouseEvent) => {
      if (!isDraggingScrubber || isAd) return;
      setIsDraggingScrubber(false);
      seek({ toPosition: computeTargetPosition(clientX), seekInitiator: 'PLAYHEAD_DRAG_DESKTOP' });
      // avoid the following `click` event
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = undefined;
      }, 0);
    };
    addEventListener(window, 'mouseup', handleGlobalMouseUp);
    return () => {
      removeEventListener(window, 'mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingScrubber, isAd, seek, computeTargetPosition, isMobile]);

  // for scrubber/playhead dragging on mobile
  useEffect(() => {
    if (!isMobile) return;
    const handleGlobalTouchMove = ({ touches }: TouchEvent) => {
      if (isAd) return;
      const clientX = touches[0]?.clientX;
      // type guard
      /* istanbul ignore next */
      if (clientX === undefined) return;
      if (mobileIndicatorMoveActive) {
        setIndicatorPosition(computeTargetPosition(clientX));
      }
    };
    addEventListener(window, 'touchmove', handleGlobalTouchMove);
    return () => {
      removeEventListener(window, 'touchmove', handleGlobalTouchMove);
    };
  }, [isAd, mobileIndicatorMoveActive, computeTargetPosition, isMobile]);

  // for scrubber/playhead dragging on mobile
  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      if (isAd) return;
      if (mobileIndicatorMoveActive) {
        seek({ toPosition: indicatorPosition, seekInitiator: 'PLAYHEAD_DRAG_MOBILE' });
        setIndicatorPosition(-1);
        setMobileIndicatorMoveActive(false);
      }
    };
    addEventListener(window, 'touchend', handleGlobalTouchEnd);
    return () => {
      removeEventListener(window, 'touchend', handleGlobalTouchEnd);
    };
  }, [isAd, mobileIndicatorMoveActive, indicatorPosition, seek]);

  const displayPosition = isDraggingScrubber ? dragPosition : position;

  const bufferLength = duration > 0 && bufferPosition !== undefined ? parseFloat((bufferPosition / duration).toFixed(4)) : 0;
  const bufferWidth: string = `${bufferLength * 100}%`;
  const indicatorLength = duration > 0 ? parseFloat((indicatorPosition / duration).toFixed(4)) : 0;
  const indicatorWidth = `${indicatorLength * 100}%`;
  const pastLength = duration > 0 ? parseFloat((displayPosition / duration).toFixed(4)) : 0;
  const pastWidth = `${pastLength * 100}%`;
  const showPreview = !isAd && indicatorPosition >= 0 && !!thumbnailSprites;
  const progressBarClass = classNames(styles.progressBar, {
    [styles.ad]: !!isAd,
  });
  const outerDivEventHandlers = isMobile ? {
    onTouchStart: handleTouchStart,
  } : {
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  const thumbnailPreviewNodeRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={progressBarClass}
      {...outerDivEventHandlers}
    >
      <div className={styles.timeRow}>
        <span className={styles.timeText}>
          {displayPosition ? secondsToHMS(displayPosition) : '00:00'}
        </span>
        <TransitionGroup
          component="div"
          className={styles.previewRail}
        >
          {showPreview ? (
            <CSSTransition
              key="thumbnailPreview"
              classNames={previewTransitions}
              timeout={THUMBNAIL_ANIMATION_TIME}
              nodeRef={thumbnailPreviewNodeRef}
            >
              <ThumbnailPreview
                nodeRef={thumbnailPreviewNodeRef}
                duration={duration}
                handleClick={handlePreviewClick}
                indicatorPosition={indicatorPosition}
                isAnimated
                isShowText
                key="thumbnailPreview"
                positionWidth={width}
                thumbnailSprites={thumbnailSprites}
              />
            </CSSTransition>
          ) : null}
        </TransitionGroup>
        <span className={styles.timeText}>
          {duration ? secondsToHMS(duration) : '00:00'}
        </span>
      </div>
      <div
        className={styles.timeline}
        onClick={isMobile ? undefined : handleClick}
        ref={timelineElRef}
      >
        <div className={styles.track}>
          {bufferPosition ? (
            <div
              className={styles.buffer}
              style={{ width: bufferWidth }}
            />
          ) : null}
          {!isAd && indicatorPosition >= 0 ? (
            <div
              className={styles.indicator}
              style={{ width: indicatorWidth }}
            />
          ) : null}
          <div
            className={styles.past}
            style={{ width: pastWidth }}
          />
          {(__DEVELOPMENT__ || __STAGING__ || __IS_ALPHA_ENV__)
            ? (adBreaks || []).filter(Boolean).map((t, index) =>
              <div className={styles.adBreak} key={`${t}-${index}`} style={{ left: `${(t / duration * 100).toFixed(2)}%` }} data-component="AdBreak" />)
            : null
          }
        </div>
        {!isAd ? (
          <span
            className={classNames(styles.scrubber, {
              [styles.scrubberActive]: isDraggingScrubber,
            })}
            style={{ left: pastWidth }}
            onMouseDown={isMobile ? undefined : handleScrubberMouseDown}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ProgressBar;
