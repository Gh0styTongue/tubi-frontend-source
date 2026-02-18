import type {
  Player,
  PlayerConfig,
} from '@adrise/player';
import type { MutableRefObject } from 'react';
import { useRef, useCallback } from 'react';

import type { setup } from 'client/features/playback/monitor/monitoring';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import { getYouboraContentType } from 'common/features/playback/components/VideoPlayer/utils/getYouboraContentType';
import { getSetupYoubora } from 'common/features/playback/utils/shouldUseNewYouboraMonitor';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type { Video, VideoResource } from 'common/types/video';

interface UseSetupYouboraMonitoringProps {
  data: Video;
  playerName: PlayerConfig['playerName'];
  title?: string;
  enableYouboraMonitoring?: boolean;
  trailerId?: string | number;
  videoPreviewUrl?: string;
  getVideoResource: () => VideoResource | undefined;
  // Safe to reference type
  // eslint-disable-next-line tubitv/no-client-folder-code-in-module-scope
  monitoringRef: MutableRefObject<ReturnType<typeof setup> | undefined>;
}

export const useSetupYouboraMonitoring = ({
  data,
  playerName,
  title,
  enableYouboraMonitoring,
  trailerId,
  videoPreviewUrl,
  getVideoResource,
  monitoringRef,
}: UseSetupYouboraMonitoringProps) => {
  const userId = useAppSelector(userIdSelector);
  const deviceId = useAppSelector(deviceIdSelector);
  const isSetupInProgressRef = useRef(false);

  return {
    setupYouboraMonitoring: useCallback(async (player: Player) => {
      if (!enableYouboraMonitoring) return;
      const videoResource = getVideoResource();
      const { id: contentId, lang, duration } = data;
      const isSeriesContent = !!data.series_id;

      monitoringRef.current?.remove();
      try {
        // prevent multiple setup calls
        if (isSetupInProgressRef.current) return;
        isSetupInProgressRef.current = true;
        const setupYoubora = await getSetupYoubora();
        monitoringRef.current = await setupYoubora(player, {
          deviceId: deviceId!,
          contentId,
          contentType: getYouboraContentType({
            trailerId,
            videoPreviewUrl,
            isSeriesContent,
          }),
          duration,
          lang,
          videoResourceType: videoResource?.type,
          videoResourceCodec: videoResource?.codec,
          title: !!title && title !== data.title ? `${title} ${data.title}` : data.title,
          userId,
          titanVersion: videoResource?.titan_version,
          generatorVersion: videoResource?.generator_version,
          playerName,
          ignoreShortBuffering: true,
        });
      } catch (error: unknown) {
        logger.error(error, 'Failed to setup youbora in useSetupYouboraMonitoring');
      } finally {
        isSetupInProgressRef.current = false;
      }

    }, [
      data,
      deviceId,
      enableYouboraMonitoring,
      getVideoResource,
      monitoringRef,
      playerName,
      title,
      trailerId,
      userId,
      videoPreviewUrl,
    ]),
  };
};
