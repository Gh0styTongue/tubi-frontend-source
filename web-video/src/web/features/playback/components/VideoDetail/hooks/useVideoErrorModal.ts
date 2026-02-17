import type { ErrorEventData } from '@adrise/player';
import { DialogType } from '@tubitv/analytics/lib/dialog';
import { useCallback, useState } from 'react';

import type { ErrorModalType } from 'client/features/playback/services/ErrorManager';
import { showErrorModal, hideErrorModal } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import * as eventTypes from 'common/constants/event-types';
import type { Video } from 'common/types/video';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent, trackLogging } from 'common/utils/track';

export interface UseVideoErrorModalParams {
  video: Video;
  resumePosition: number;
  isFromAutoplay: boolean;
}
export type ShowAlertModal = ReturnType<typeof useVideoErrorModal>['showAlertModal'];

export const useVideoErrorModal = ({ video, resumePosition, isFromAutoplay }: UseVideoErrorModalParams) => {
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalOpenDetails, setErrorModalOpenDetails] = useState<string | undefined>();
  const [lastResourceRetryCount, setLastResourceRetryCount] = useState(0);

  const showAlertModal = useCallback(
    (_type: ErrorModalType, options: { error: ErrorEventData; errorCode: string }) => {
      const { error, errorCode } = options;
      showErrorModal();
      trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.PLAYER_ERROR, errorCode));
      setIsErrorModalOpen(true);
      setErrorModalOpenDetails(error.details);
    },
    [setIsErrorModalOpen, setErrorModalOpenDetails]
  );

  const handleErrorModalClose = useCallback(
    (isRetry: boolean) => {
      hideErrorModal();

      /**
       * if user clicks "retry" button, increase retry count and reuse current video resource,
       * otherwise set retry count to 0.
       */
      if (isRetry) {
        const nextRetryCount = lastResourceRetryCount + 1;
        trackLogging({
          type: TRACK_LOGGING.videoInfo,
          subtype: LOG_SUB_TYPE.PLAYBACK.VIDEO_RETRY,
          message: { content_id: video.id, retry: nextRetryCount },
        });

        setLastResourceRetryCount(nextRetryCount);
        VODPlaybackSession.getInstance().startPlayback({
          isSeries: !!video.series_id,
          contentId: video.id,
          isAutoplay: isFromAutoplay,
          isContinueWatching: (resumePosition ?? 0) > 0,
        });
      }
      setErrorModalOpenDetails(undefined);
      setIsErrorModalOpen(false);
    },
    [
      setIsErrorModalOpen,
      setErrorModalOpenDetails,
      video,
      resumePosition,
      lastResourceRetryCount,
      setLastResourceRetryCount,
      isFromAutoplay,
    ]
  );

  return {
    showAlertModal,
    handleErrorModalClose,
    isErrorModalOpen,
    errorModalOpenDetails,
    lastResourceRetryCount,
  };
};
