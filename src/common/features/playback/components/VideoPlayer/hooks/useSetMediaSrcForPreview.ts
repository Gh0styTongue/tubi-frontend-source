import type { Player, PlayerConfig } from '@adrise/player';
import { isHls, isDash } from '@adrise/player/lib/utils/tools';
import { useCallback, useEffect, useRef } from 'react';

import { attachPlayerEvents } from 'client/features/playback/tubiPlayer';
import useLatest from 'common/hooks/useLatest';
import type { VideoResource } from 'common/types/video';

interface UseSetMediaSrcProps {
  player: Player | undefined;
  getVideoResource: () => VideoResource | undefined;
  enableVideoSessionCollect?: boolean;
  contentId: string;
  playerName: PlayerConfig['playerName'];
  setupYouboraMonitoring: (player: Player) => Promise<void>;
  allowReuse?: boolean;
  videoPreviewUrl?: string;
}

export const useSetMediaSrcForPreview = ({
  player,
  getVideoResource,
  enableVideoSessionCollect,
  contentId,
  playerName,
  setupYouboraMonitoring,
  allowReuse,
  videoPreviewUrl,
}: UseSetMediaSrcProps) => {
  const playerRef = useLatest(player);
  const getVideoResourceRef = useLatest(getVideoResource);
  const enableVideoSessionCollectRef = useLatest(enableVideoSessionCollect);
  const contentIdRef = useLatest(contentId);
  const playerNameRef = useLatest(playerName);
  const setupYouboraMonitoringRef = useLatest(setupYouboraMonitoring);
  const allowReuseRef = useLatest(allowReuse);
  const videoPreviewUrlRef = useLatest(videoPreviewUrl);
  const prevVideoPreviewUrlRef = useRef(videoPreviewUrl);

  const setMediaSrc = useCallback(
    async (url: string = '') => {
      if (!playerRef.current || !url) return;

      if (isHls(url) || isDash(url)) return;

      // Re-setup youbora when setting new media src
      await setupYouboraMonitoringRef.current(playerRef.current);

      attachPlayerEvents(playerRef.current, {
        getVideoResource: getVideoResourceRef.current,
        enableVideoSessionCollect: enableVideoSessionCollectRef.current,
        contentId: contentIdRef.current,
        playerName: playerNameRef.current,
      });

      playerRef.current.setMediaSrc(url);
    },
    [
      playerRef,
      getVideoResourceRef,
      enableVideoSessionCollectRef,
      contentIdRef,
      playerNameRef,
      setupYouboraMonitoringRef,
    ],
  );

  /**
   * Handle videoPreviewUrl changes when allowReuse is
   * true
   */
  useEffect(() => {
    if (allowReuseRef.current && prevVideoPreviewUrlRef.current !== videoPreviewUrlRef.current) {
      setMediaSrc(videoPreviewUrlRef.current);
    }
    prevVideoPreviewUrlRef.current = videoPreviewUrlRef.current;
  }, [videoPreviewUrl, allowReuseRef, videoPreviewUrlRef, setMediaSrc]);
};
