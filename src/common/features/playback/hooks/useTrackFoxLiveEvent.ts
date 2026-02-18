import { secs } from '@adrise/utils/lib/time';
import { PlayerDisplayMode, VideoResourceTypeState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useRef } from 'react';

import trackingManager from 'common/services/TrackingManager';
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
    onLiveStart: () => void;
      }>({
        onLiveProgress: () => { },
        onLiveStart: () => { },
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
    if (secs(viewTime) >= secs(60)) {
      trackingManager.trackLivePlayProgressEvent({
        contentId: id,
        videoPlayer,
        viewTime,
        pageType: getPageObjectFromURL(getCurrentPathname()) || undefined,
        purpleCarpet: true,
      });
      viewTimeRef.current.viewTime = 0;
    }
  }, [id, videoPlayer]);

  const onLiveStart = useCallback(() => {
    trackingManager.trackStartLiveVideoEvent({
      contentId: id,
      videoPlayer,
      videoResourceType: VideoResourceTypeState.VIDEO_RESOURCE_TYPE_HLSV3,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
      streamUrl: '',
      pageType: getPageObjectFromURL(getCurrentPathname()) || undefined,
      purpleCarpet: true,
    });
  }, [id, videoPlayer]);

  liveEventListeners.current = {
    onLiveProgress,
    onLiveStart,
  };
  return liveEventListeners;
};
