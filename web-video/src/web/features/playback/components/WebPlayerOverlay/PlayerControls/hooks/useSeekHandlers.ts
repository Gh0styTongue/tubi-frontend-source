import { controlActions } from '@adrise/player/lib/action';
import { SeekType } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useRef } from 'react';

import type { WEB_PROGRESS_BAR_SEEK_INITIATOR, WEB_STEP_SEEK_INITIATOR } from 'client/features/playback/track/client-log/trackSeek';
import { trackSeek } from 'client/features/playback/track/client-log/trackSeek';
import * as eventTypes from 'common/constants/event-types';
import { PLAYER_STEP_SEEK_INTERVAL } from 'common/constants/player';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { buildSeekEventObject } from 'common/utils/analytics';
import { trackEvent } from 'common/utils/track';

export interface UseSeekHandlersProps {
  contentId: string;
  positionBeforeSeek: number;
  refreshActiveTimer: () => void;
}

export type WebSeekFn = (args: { toPosition: number, seekInitiator: WEB_PROGRESS_BAR_SEEK_INITIATOR }) => Promise<void>;

export type WebStepSeekFn = (seekInitiator: WEB_STEP_SEEK_INITIATOR) => Promise<number>;

export const useSeekHandlers = ({ contentId, positionBeforeSeek, refreshActiveTimer }: UseSeekHandlersProps) => {
  const dispatch = useAppDispatch();
  const refreshActiveTimerRef = useRef(refreshActiveTimer);
  refreshActiveTimerRef.current = refreshActiveTimer;
  const positionBeforeSeekRef = useRef(positionBeforeSeek);
  positionBeforeSeekRef.current = positionBeforeSeek;
  const pendingSeekCountRef = useRef(0);

  /**
   * This should only be used for user-intended seek
   * @param position
   * @returns {Promise.<TResult>|*}
   */
  const seek = useCallback<WebSeekFn>(async ({ toPosition, seekInitiator }) => {
    const seekStart = Date.now();
    const pendingSeekCount = pendingSeekCountRef.current;
    pendingSeekCountRef.current += 1;
    // need to capture fromPosition value before dispatching the seek
    const fromPosition = positionBeforeSeekRef.current;
    await dispatch(controlActions.seek(toPosition));
    pendingSeekCountRef.current -= 1;
    refreshActiveTimerRef.current();
    const seekEventObject = buildSeekEventObject({
      videoId: contentId,
      fromPosition,
      toPosition,
      seekType: SeekType.PLAY_PROGRESS_DRAG,
    });
    trackEvent(eventTypes.SEEK, seekEventObject);

    trackSeek({
      ...seekEventObject,
      seekInitiator,
      seekDuration: Date.now() - seekStart,
      pendingSeekCount,
    });
  }, [
    contentId,
    dispatch,
  ]);

  const stepRewind = useCallback<WebStepSeekFn>(async (seekInitiator) => {
    const seekStart = Date.now();
    const pendingSeekCount = pendingSeekCountRef.current;
    pendingSeekCountRef.current += 1;
    // need to capture fromPosition value before dispatching the seek
    const fromPosition = positionBeforeSeekRef.current;
    const toPosition = await dispatch(controlActions.stepRewind());
    pendingSeekCountRef.current -= 1;
    refreshActiveTimerRef.current();
    const seekEventObject = buildSeekEventObject({
      videoId: contentId,
      fromPosition,
      toPosition,
      seekType: SeekType.QUICK_SEEK_BUTTON,
      rate: PLAYER_STEP_SEEK_INTERVAL,
    });
    trackEvent(eventTypes.SEEK, seekEventObject);
    trackSeek({
      ...seekEventObject,
      seekInitiator,
      seekDuration: Date.now() - seekStart,
      pendingSeekCount,
    });
    return toPosition;
  }, [
    contentId,
    dispatch,
  ]);

  const stepForward = useCallback<WebStepSeekFn>(async (seekInitiator) => {
    const seekStart = Date.now();
    const pendingSeekCount = pendingSeekCountRef.current;
    pendingSeekCountRef.current += 1;
    // need to capture fromPosition value before dispatching the seek
    const fromPosition = positionBeforeSeekRef.current;
    const toPosition = await dispatch(controlActions.stepForward());
    pendingSeekCountRef.current -= 1;
    refreshActiveTimerRef.current();
    const seekEventObject = buildSeekEventObject({
      videoId: contentId,
      fromPosition,
      toPosition,
      seekType: SeekType.QUICK_SEEK_BUTTON,
      rate: PLAYER_STEP_SEEK_INTERVAL,
    });
    trackEvent(eventTypes.SEEK, seekEventObject);
    trackSeek({
      ...seekEventObject,
      seekInitiator,
      seekDuration: Date.now() - seekStart,
      pendingSeekCount,
    });
    return toPosition;
  }, [
    contentId,
    dispatch,
  ]);

  return { seek, stepForward, stepRewind };
};
