import { controlActions } from '@adrise/player';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback } from 'react';

import * as eventTypes from 'common/constants/event-types';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { captionsIndexSelector, captionsListSelector } from 'common/selectors/playerStore';
import { buildDialogEvent, buildSubtitlesToggleEventObject } from 'common/utils/analytics';
import { getLanguageCode } from 'common/utils/captionTools';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

interface UseCaptionsHandlersProps {
  contentId: string;
  refreshActiveTimer: () => void;
  setCaptionSettingsVisible: (visible: boolean) => void;
}

export const useCaptionsHandlers = ({ contentId, refreshActiveTimer, setCaptionSettingsVisible }: UseCaptionsHandlersProps) => {
  const dispatch = useAppDispatch();
  const captionsList = useAppSelector(captionsListSelector);
  const captionsListRef = useLatest(captionsList);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const captionsIndexRef = useLatest(captionsIndex);
  const refreshActiveTimerRef = useLatest(refreshActiveTimer);
  const setCaptionSettingsVisibleRef = useLatest(setCaptionSettingsVisible);

  const setCaptions = useCallback(async (index: number) => {
    // close over these before the await so we track the right value
    // after setting in store (in case they change)
    const captionsList = captionsListRef.current;
    const captionsIndex = captionsIndexRef.current;

    await dispatch(controlActions.setCaptions(index));

    refreshActiveTimerRef.current();

    const activeCaption = captionsList[captionsIndex];
    const status = activeCaption.label.toLowerCase() === 'off' ? ToggleState.OFF : ToggleState.ON;
    const languageCode = getLanguageCode(activeCaption?.lang || '');
    const subtitlesToggleEventPayload = buildSubtitlesToggleEventObject(contentId, status, languageCode);
    trackEvent(eventTypes.SUBTITLES_TOGGLE, subtitlesToggleEventPayload);

  }, [dispatch, captionsListRef, captionsIndexRef, contentId, refreshActiveTimerRef]);

  const handleCaptionSettingsToggle = useCallback((visible: boolean) => {
    setCaptionSettingsVisibleRef.current(visible);
    if (visible) {
      const dialogEvent = buildDialogEvent(getCurrentPathname(), DialogType.SUBTITLE_AUDIO, '', DialogAction.SHOW);
      trackEvent(eventTypes.DIALOG, dialogEvent);
    }
    refreshActiveTimerRef.current();
  }, [setCaptionSettingsVisibleRef, refreshActiveTimerRef]);

  return {
    setCaptions,
    handleCaptionSettingsToggle,
  };
};
