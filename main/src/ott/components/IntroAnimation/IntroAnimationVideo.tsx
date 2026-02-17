/* istanbul ignore file */
import { mins, secs } from '@adrise/utils/lib/time';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { INTRO_VIDEO_ENDED_EVENT, VIDEO_SIGNAL_TIME } from 'client/introLib/constants';
import { clearVideoElement } from 'client/introLib/dom';
import { getMediaErrorMessage } from 'client/introLib/error';
import { trackIntroStart, trackMetricsOnIntroEnded } from 'client/introLib/performance';
import { getIntroVideoSources } from 'client/utils/introHelper';
import { getCookie, setCookie } from 'client/utils/localDataStorage';
import { SET_INTRO_ENDED } from 'common/constants/action-types';
import { DISABLE_ANIMATIONS_COOKIE_NAME } from 'common/constants/cookies';
import { TRACK_LOGGING } from 'common/constants/error-types';
import useAppSelector from 'common/hooks/useAppSelector';
import { shouldDisabledIntroVideoSelector } from 'common/selectors/experiments/ottFireTVRTUSelectors';
import { shouldRenderIntroVideoSelector } from 'common/selectors/ottUI';
import { actionWrapper } from 'common/utils/action';
import { dispatchCustomEvent } from 'common/utils/dom';
import { trackLogging } from 'common/utils/track';

import styles from './IntroAnimation.scss';

interface Props {
  onEnd?: VoidFunction;
}

const isAppHidden = () => {
  return !!(document.hidden || (document as unknown as any).webkitHidden);
};

const getBrowserVisibilityChangeName = () => {
  if (typeof document.hidden !== 'undefined') {
    return 'visibilitychange';
  }
  return 'webkitvisibilitychange';
};

function IntroAnimationVideo({ onEnd }: Props) {
  const shouldRenderIntro = useAppSelector(shouldRenderIntroVideoSelector);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSourceRef = useRef<HTMLSourceElement>(null);
  const timeout = useRef<number>();
  const dispatch = useDispatch();
  const shouldDisabledIntroVideo = useAppSelector(shouldDisabledIntroVideoSelector);

  useEffect(() => {
    if (shouldDisabledIntroVideo && getCookie(DISABLE_ANIMATIONS_COOKIE_NAME) !== 'true') {
      setCookie(DISABLE_ANIMATIONS_COOKIE_NAME, 'true', mins(10) / secs(1));
    }
  }, [shouldDisabledIntroVideo]);

  const onIntroEnded = useCallback(() => {
    trackMetricsOnIntroEnded();
    // video element cleanup, otherwise it may cause player issues when launched via deeplink
    if (videoRef.current) {
      clearVideoElement(videoRef.current, true);
    }
    dispatch(actionWrapper(SET_INTRO_ENDED, { ended: true }));
    dispatchCustomEvent(INTRO_VIDEO_ENDED_EVENT);
    onEnd?.();
  }, [dispatch, onEnd]);

  const onTimeout = useCallback(() => {
    if (videoRef.current?.currentTime === 0) {
      onIntroEnded();
    }
  }, [onIntroEnded]);

  const onVideoPlay = useCallback(() => {
    trackIntroStart();
    window.clearTimeout(timeout.current);
    videoRef.current?.removeEventListener('play', onVideoPlay);
  }, []);

  const handleVideoError = useCallback((message: string) => {
    trackLogging({
      type: TRACK_LOGGING.videoLoad,
      subtype: 'SOUND_ID_VIDEO',
      message,
    });
    window.clearTimeout(timeout.current);
    onIntroEnded();
  }, [onIntroEnded]);

  const onVideoError = useCallback(() => {
    const message = getMediaErrorMessage(videoRef.current!);
    handleVideoError(message);
  }, [handleVideoError]);

  const onLastSourceError = useCallback(() => {
    handleVideoError('All intro video source URLs failed to load.');
  }, [handleVideoError]);

  useEffect(() => {
    if (shouldRenderIntro) {
      timeout.current = window.setTimeout(onTimeout, VIDEO_SIGNAL_TIME);
      const videoElem = videoRef.current;
      videoElem?.addEventListener('error', onVideoError);
      videoElem?.addEventListener('play', onVideoPlay);
      videoElem?.addEventListener('ended', onIntroEnded);
      // TODO(xinsong) add canplaythrough event listener for PS4 and Comcast if we graduate this group
      const lastSource = lastSourceRef.current;
      lastSource?.addEventListener('error', onLastSourceError);

      return () => {
        window.clearTimeout(timeout.current);
        videoElem?.removeEventListener('error', onVideoError);
        videoElem?.removeEventListener('play', onVideoPlay);
        videoElem?.removeEventListener('ended', onIntroEnded);
        lastSource?.removeEventListener('error', onLastSourceError);
      };
    }
  }, [dispatch, onLastSourceError, onIntroEnded, onVideoError, onVideoPlay, shouldRenderIntro, onTimeout]);

  useEffect(() => {
    const listener = () => {
      const videoElem = videoRef.current;
      if (!videoElem) return;
      videoElem.muted = isAppHidden();
    };
    document.addEventListener(getBrowserVisibilityChangeName(), listener);
    return () => {
      document.removeEventListener(getBrowserVisibilityChangeName(), listener);
    };
  });

  if (!shouldRenderIntro) {
    return null;
  }

  const videoResources = getIntroVideoSources();
  return (
    <video
      ref={videoRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className={classNames(styles.intro, styles.video)}
      style={{ zIndex: Number.MAX_SAFE_INTEGER }}
      autoPlay
      disableRemotePlayback
      muted={isAppHidden()}
    >
      {videoResources.map(({ src, type }, idx) => (
        <source ref={idx === videoResources.length - 1 ? lastSourceRef : null} key={idx} src={src} type={type} />
      ))}
    </video>
  );
}

export default IntroAnimationVideo;
