import { PLAYER_ERROR_DETAILS } from '@adrise/player';
import { toCSSUrl } from '@adrise/utils/lib/url';
import React, { useState, useEffect } from 'react';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { setLiveActiveContent } from 'common/features/playback/actions/live';
import { useChromecastTabCasting } from 'common/features/purpleCarpet/hooks/useChromecastTabCasting';
import useFNGLive from 'common/features/purpleCarpet/hooks/useFNGLive';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { trackLogging } from 'common/utils/track';
import WebErrorModal from 'web/features/playback/components/WebErrorModal/WebErrorModal';
import type { WebPlayerViewMode } from 'web/features/playback/components/WebLivePlayer/WebLivePlayer';

import styles from './WebFoxLivePlayer.scss';
interface WebFoxLivePlayerProps {
  contentId: string;
}

const getPlayerViewClassStyle = (playerView: WebPlayerViewMode) => {
  switch (playerView) {
    case 'topPage':
    case 'mini':
      return styles.epgPlayerContainer;
    default:
      return styles.livePlayerContainer;
  }
};

export const WebFoxLivePlayer = ({ contentId }: WebFoxLivePlayerProps) => {
  const { playerRef, fatalError, setFatalError, reload, sourceLoaded, currentProgram } = useFNGLive({ contentId });
  const posterUrl = currentProgram?.background;
  const playerViewClasses = getPlayerViewClassStyle('default');
  const dispatch = useAppDispatch();
  const [retryCount, setRetryCount] = useState(0);

  useChromecastTabCasting();
  useEffect(() => {
    return () => {
      // clean up live active content when component unmounted
      dispatch(setLiveActiveContent({ contentId: '' }));
    };
  }, [dispatch]);

  const handleFatalErrorModalClose = (isRetry: boolean) => {
    if (isRetry) {
      /**
       * if user clicks "retry" button, increase retry count and reuse current video resource,
       * otherwise set retry count to 0.
       */
      const nextRetryCount = retryCount + 1;
      trackLogging({
        type: TRACK_LOGGING.videoInfo,
        subtype: LOG_SUB_TYPE.PLAYBACK.VIDEO_RETRY,
        message: { content_id: contentId, reason: PLAYER_ERROR_DETAILS.LIVE_PLAYBACK_ERROR, retry: nextRetryCount },
      });
      setRetryCount(nextRetryCount);
      reload();
    }
    setFatalError(false);
  };
  return (
    <>
      <div
        className={`${playerViewClasses}`}
        id="ott-player"
        ref={playerRef}
        style={{ left: 0, position: 'relative' }}
      >
        { sourceLoaded ? null : <div className={styles.livePlayerPoster} style={{ backgroundImage: toCSSUrl(posterUrl || '') }} /> }
      </div>
      <WebErrorModal
        isOpen={fatalError}
        onClose={handleFatalErrorModalClose}
        playerErrorDetails={PLAYER_ERROR_DETAILS.PURPLE_CARPET_LIVE_PLAYBACK_ERROR}
      />
    </>
  );
};
