import { controlActions } from '@adrise/player';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { ActionStatus, VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import { useCallback } from 'react';

import * as eventTypes from 'common/constants/event-types';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { buildDialogEvent, buildQualityToggleEventObject } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getVideoResolutionType } from 'common/utils/qualityLevels';
import { trackEvent } from 'common/utils/track';
import { qualityListSelector } from 'web/features/playback/selectors/player';

export interface UseSetQualityProps {
  refreshActiveTimer: () => void;
  contentId: string
  setQualitySettingsVisible: (visible: boolean) => void
}

export const useQualityHandlers = ({
  refreshActiveTimer,
  contentId,
  setQualitySettingsVisible,
}: UseSetQualityProps) => {
  const dispatch = useAppDispatch();
  const qualityList = useAppSelector(qualityListSelector);
  const qualityListRef = useLatest(qualityList);
  const refreshActiveTimerRef = useLatest(refreshActiveTimer);
  const playerContext = usePlayerContext();

  const setQuality = useCallback(async (qualityIndex: number) => {
    const qualityList = qualityListRef.current;
    await dispatch(controlActions.setQuality(qualityIndex));
    const level = qualityList[qualityIndex];
    if (!level) return;
    refreshActiveTimerRef.current();

    const videoResolutionType = getVideoResolutionType(level);
    /**
     * If the user is on auto, we should track the current bitrate level if available
     */
    let bitrate: number | undefined = level.bitrate;
    if (videoResolutionType === VideoResolutionType.VIDEO_RESOLUTION_AUTO || videoResolutionType === VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN) {
      bitrate = playerContext.player?.getQualityLevel()?.bitrate;
    }
    const qualityToggleEventObject = buildQualityToggleEventObject(
      contentId,
      bitrate,
      getVideoResolutionType(level),
      ActionStatus.SUCCESS,
    );
    trackEvent(eventTypes.QUALITY_TOGGLE, qualityToggleEventObject);

  }, [dispatch, qualityListRef, refreshActiveTimerRef, contentId, playerContext]);

  const handleQualitySettingsToggle = useCallback((visible: boolean) => {
    setQualitySettingsVisible(visible);
    refreshActiveTimerRef.current();
    if (visible) {
      trackEvent(
        eventTypes.DIALOG,
        buildDialogEvent(
          getCurrentPathname(),
          DialogType.VIDEO_QUALITY,
          undefined,
          DialogAction.SHOW,
        ),
      );
    }
  }, [setQualitySettingsVisible, refreshActiveTimerRef]);

  return {
    setQuality,
    handleQualitySettingsToggle,
  };
};
