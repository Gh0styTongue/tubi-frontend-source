import { secs } from '@adrise/utils/lib/time';
import { ExitType } from '@tubitv/analytics/lib/adEvent';
import { PlayerDisplayMode, VideoResourceTypeState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useRef } from 'react';

import trackingManager from 'common/services/TrackingManager';
import type { FoxAdStart, FoxAdComplete } from 'common/utils/analytics';
import { getPageObjectFromURL } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';

export const useTrackFoxLiveEvent = ({
  videoPlayer,
  id,
}: {
  videoPlayer: PlayerDisplayMode;
  id: string;
}) => {

  const liveEventListeners = useRef<{
    onLiveProgress:(e: any) => void;
    onLiveProgressFlush: () => void;
    onLiveAdStart: (foxAd: FoxAdStart) => void;
    onLiveAdFinished: (foxComplete: FoxAdComplete) => void;
    onLiveStart: (contentId: string) => void;
      }>({
        onLiveProgress: () => { },
        onLiveStart: () => { },
        onLiveProgressFlush: () => { },
        onLiveAdStart: () => { },
        onLiveAdFinished: () => { },
      });

  const viewTimeRef = useRef({
    viewTime: -1,
    lastTime: -1,
  });

  const onLiveProgress = useCallback((e: any) => {
    if (viewTimeRef.current.viewTime === -1) {
      viewTimeRef.current.viewTime = 0;
      viewTimeRef.current.lastTime = e.time;
      return;
    }
    if (e.time > viewTimeRef.current.lastTime) {
      viewTimeRef.current.viewTime += e.time - viewTimeRef.current.lastTime;
      viewTimeRef.current.lastTime = e.time;
    }
    const viewTime = parseInt(String(viewTimeRef.current.viewTime), 10);
    // For fox playback the play progress event should be sent every 60 seconds
    if (secs(viewTime) >= secs(10)) {
      trackingManager.trackLivePlayProgressEvent({
        contentId: id,
        videoPlayer,
        viewTime,
        pageType: getPageObjectFromURL(getCurrentPathname()) || undefined,
      });
      viewTimeRef.current.viewTime = 0;
    }
  }, [id, videoPlayer]);

  const onLiveProgressFlush = useCallback(() => {
    if (viewTimeRef.current.viewTime < 1) {
      return;
    }

    const viewTime = parseInt(String(viewTimeRef.current.viewTime), 10);
    trackingManager.trackLivePlayProgressEvent({
      contentId: id,
      videoPlayer,
      viewTime: Math.min(viewTime, 60),
      pageType: getPageObjectFromURL(getCurrentPathname()) || undefined,
    });
    viewTimeRef.current.viewTime = 0;
  }, [id, videoPlayer]);

  const onLiveStart = useCallback((contentId: string) => {
    trackingManager.trackStartLiveVideoEvent({
      contentId,
      videoPlayer,
      videoResourceType: VideoResourceTypeState.VIDEO_RESOURCE_TYPE_HLSV3,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
      streamUrl: '',
      pageType: getPageObjectFromURL(getCurrentPathname()) || undefined,
    });
  }, [videoPlayer]);

  const onLiveAdStart = useCallback((foxAd: FoxAdStart) => {
    trackingManager.startLiveEventLiveAdEventV2({
      contentId: id,
      videoPlayer,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
      foxAd,
    });
  }, [id, videoPlayer]);

  const onLiveAdFinished = useCallback((foxComplete: FoxAdComplete) => {
    trackingManager.finishLiveEventLiveAdEventV2({
      contentId: id,
      videoPlayer,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
      foxComplete,
      exitType: ExitType.AUTO,
    });
  }, [id, videoPlayer]);

  liveEventListeners.current = {
    onLiveProgress,
    onLiveStart,
    onLiveProgressFlush,
    onLiveAdStart,
    onLiveAdFinished,
  };
  return liveEventListeners;
};
