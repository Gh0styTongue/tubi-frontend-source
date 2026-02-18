import { PLAYER_EVENTS, StartBufferingReason, StopBufferingReason, setAutoplayCapability } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';
import { PlayerDisplayMode, ToggleState, VideoResourceTypeState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import type {
  BufferEndEvent,
  BufferStartEvent,
  LivePlayerWrapper,
} from 'client/features/playback/live/LivePlayerWrapper';
import type { LiveAdEventData } from 'client/features/playback/live/utils/liveAdClient';
import * as LiveVideoSession from 'client/features/playback/session/LiveVideoSession';
import { PlayerType } from 'client/features/playback/track/client-log';
import { trackBufferStart, trackRebufferTime } from 'client/features/playback/track/client-log/trackBuffer';
import { trackLiveAdFinishedMetrics, trackLiveFirstFrame } from 'client/features/playback/track/datadog';
import { BUFFER_END_OPERATION, CC_OFF, LIVE_NUDGE_OFFSET } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { useViewTimeManager } from 'common/features/playback/hooks/useViewTimeManager';
import trackingManager from 'common/services/TrackingManager';
import { buildSubtitlesToggleEventObject, getPageObjectFromURL } from 'common/utils/analytics';
import { getLanguageCode } from 'common/utils/captionTools';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import type { ArrayedTimeRange } from '../utils/getLivePlayerBufferStatus';
import { getLivePlayerBufferStatus } from '../utils/getLivePlayerBufferStatus';

export const getBufferEndOperation = (bufferStart: BufferStartData, wrapper: LivePlayerWrapper): BUFFER_END_OPERATION => {
  const {
    wasAudioBufferedAtStart,
    wasVideoBufferedAtStart,
    nearestVideoBufferRanges: videoRangesAtStart,
    nearestAudioBufferRanges: audioRangesAtStart,
    elPositionAtStart = 0,
  } = bufferStart;

  const { nearestVideoBufferRanges: videoRangesAtEnd, nearestAudioBufferRanges: audioRangesAtEnd } = getLivePlayerBufferStatus(wrapper);

  // If buffer end changed, consider it was recovered by buffer append.
  if (!wasAudioBufferedAtStart) {
    const audioRangeAtStart = audioRangesAtStart?.pop();
    const audioRangeAtEnd = audioRangesAtEnd?.pop();
    const audioBufferEndAtStart = audioRangeAtStart ? audioRangeAtStart[1] : 0;
    const audioBufferEndAtEnd = audioRangeAtEnd ? audioRangeAtEnd[1] : 0;

    if (audioBufferEndAtEnd > audioBufferEndAtStart) {
      return BUFFER_END_OPERATION.BUFFER_APPENDED;
    } if (audioRangesAtEnd.length) {
      // If current time was in between two buffer ranges, consider it as a hole
      return BUFFER_END_OPERATION.JUMP_HOLE;
    }
  }

  if (!wasVideoBufferedAtStart) {
    const videoRangeAtStart = videoRangesAtStart?.pop();
    const videoRangeAtEnd = videoRangesAtEnd?.pop();
    const videobufferEndAtStart = videoRangeAtStart ? videoRangeAtStart[1] : 0;
    const videobufferEndAtEnd = videoRangeAtEnd ? videoRangeAtEnd[1] : 0;

    if (videobufferEndAtEnd > videobufferEndAtStart) {
      return BUFFER_END_OPERATION.BUFFER_APPENDED;
    } if (videoRangesAtEnd.length) {
      return BUFFER_END_OPERATION.JUMP_HOLE;
    }
  }

  if (wrapper.getPosition() - elPositionAtStart > LIVE_NUDGE_OFFSET) {
    return BUFFER_END_OPERATION.NUDGE;
  }

  return BUFFER_END_OPERATION.UNKNOWN;
};

/**
 * Intended to persist through re-renders through a ref; tracks
 * information about buffer starts to be logged during buffer end
 */
interface BufferStartData {
  wasVideoBufferedAtStart: boolean | undefined;
  wasAudioBufferedAtStart: boolean | undefined;
  elReadyStateAtStart: number | undefined;
  elPositionAtStart: number | undefined;
  bufferStartTime: number | undefined;
  bufferStartReason: StartBufferingReason | undefined;
  nearestVideoBufferRanges: ArrayedTimeRange[] | undefined;
  nearestAudioBufferRanges: ArrayedTimeRange[] | undefined,
}

// Tracking the following events:
// - LivePlayProgressEvent
// - StartLiveVideoEvent
// - SubtitleToggleEvent
export const useTrackLiveEvent = ({
  wrapper,
  videoPlayer,
  id,
  streamUrl,
  hasSubtitles,
  /* istanbul ignore next */isWebEpgEnabled = false,
}: {
  wrapper: LivePlayerWrapper | null;
  videoPlayer: PlayerDisplayMode;
  id: string;
  streamUrl: string;
  hasSubtitles?: boolean;
  isWebEpgEnabled?: boolean;
}) => {
  const dispatch = useDispatch();
  const useBufferStateRef = useRef<BufferStartData>({
    wasVideoBufferedAtStart: undefined,
    wasAudioBufferedAtStart: undefined,
    elReadyStateAtStart: undefined,
    elPositionAtStart: undefined,
    nearestAudioBufferRanges: undefined,
    nearestVideoBufferRanges: undefined,
    bufferStartTime: undefined,
    bufferStartReason: undefined,
  });

  const dispatchLivePlayProgressEvent = useCallback((_position: number, viewTime: number) => {
    const extraCtx = __WEBPLATFORM__ ? { isWebEpgEnabled } : /* istanbul ignore next */undefined;
    const pageType = getPageObjectFromURL(getCurrentPathname(), extraCtx) || undefined;

    trackingManager.trackLivePlayProgressEvent({
      contentId: id,
      videoPlayer,
      viewTime,
      pageType,
    });
  }, [isWebEpgEnabled, id, videoPlayer]);

  useViewTimeManager({
    player: wrapper,
    track: dispatchLivePlayProgressEvent,
  });

  function adStartHandler(evt: LiveAdEventData) {
    const { adIndex, /* istanbul ignore next */adId = '' } = evt;
    trackingManager.startLiveAdEvent({
      adSequence: adIndex,
      ad: {
        id: adId,
        video: id,
      },
      contentId: id,
      videoPlayer,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
    });
  }

  function bufferStartHandler(data: BufferStartEvent): void {
    /* istanbul ignore if */
    if (!wrapper) {
      return;
    }
    const { isVideoBuffered, isAudioBuffered, nearestVideoBufferRanges, nearestAudioBufferRanges } = getLivePlayerBufferStatus(wrapper);

    useBufferStateRef.current = {
      wasAudioBufferedAtStart: isAudioBuffered,
      wasVideoBufferedAtStart: isVideoBuffered,
      elReadyStateAtStart: /* istanbul ignore next */wrapper.getVideoElement()?.readyState,
      elPositionAtStart: wrapper.getPosition(),
      nearestVideoBufferRanges,
      nearestAudioBufferRanges,
      bufferStartTime: data.startTime,
      bufferStartReason: data.startBufferReason,
    };

    trackBufferStart({
      player: wrapper,
      playerType: PlayerType.Linear,
      isAudioBuffered: useBufferStateRef.current.wasAudioBufferedAtStart,
      isVideoBuffered: useBufferStateRef.current.wasVideoBufferedAtStart,
      nearestVideoBufferRanges,
      nearestAudioBufferRanges,
      ...data,
    });
  }

  function bufferEndHandler(data: BufferEndEvent) {
    /* istanbul ignore if */
    if (!wrapper) {
      return;
    }
    if (data.startBufferReason !== StartBufferingReason.el_load_start) {
      // ignore the first frame stall record.
      LiveVideoSession.bufferEnd(data.bufferingDuration);
    }

    const { nearestVideoBufferRanges, nearestAudioBufferRanges } = getLivePlayerBufferStatus(wrapper);
    const playerExit = data.stopBufferReason === StopBufferingReason.player_exit;
    trackRebufferTime({
      player: wrapper,
      playerType: PlayerType.Linear,
      wasAudioBufferedAtStart: useBufferStateRef.current.wasAudioBufferedAtStart,
      wasVideoBufferedAtStart: useBufferStateRef.current.wasVideoBufferedAtStart,
      nearestVideoBufferRanges,
      nearestAudioBufferRanges,
      bufferEndOperation: playerExit ? BUFFER_END_OPERATION.PLAYER_EXIT : getBufferEndOperation(useBufferStateRef.current, wrapper),
      elReadyStateAtStart: useBufferStateRef.current.elReadyStateAtStart,
      ...data,
    });

    useBufferStateRef.current = {
      wasAudioBufferedAtStart: undefined,
      wasVideoBufferedAtStart: undefined,
      elReadyStateAtStart: undefined,
      elPositionAtStart: undefined,
      nearestVideoBufferRanges: undefined,
      nearestAudioBufferRanges: undefined,
      bufferStartTime: undefined,
      bufferStartReason: undefined,
    };
  }

  function adCompleteHandler(evt: LiveAdEventData) {
    const { adIndex, exitType, adId = '', adPlayedDuration } = evt;
    trackingManager.finishLiveAdEvent({
      adSequence: adIndex,
      ad: {
        id: adId,
        duration: adPlayedDuration,
        video: id,
      },
      contentId: id,
      videoPlayer,
      isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
      exitType,
    });
    trackLiveAdFinishedMetrics();
  }

  function autoStartNotAllowedHandler() {
    dispatch(setAutoplayCapability(false));
  }

  function playHandler() {
    dispatch(setAutoplayCapability(true));
  }

  function firstFrameHandler() {
    trackLiveFirstFrame();
  }

  function playerRemove() {
    /* istanbul ignore if */
    if (!wrapper || !useBufferStateRef.current) {
      return;
    }
    const { bufferStartTime = 0, elPositionAtStart = 0 } = useBufferStateRef.current;
    bufferEndHandler({
      bufferingDuration: now() - bufferStartTime,
      startBufferReason: useBufferStateRef.current.bufferStartReason || StartBufferingReason.el_waiting_event,
      stopBufferReason: StopBufferingReason.player_exit,
      elBufferStartTime: elPositionAtStart,
      elBufferEndTime: wrapper.getPosition(),
    });
  }

  useEffect(() => {
    wrapper?.addListener(PLAYER_EVENTS.autoStartNotAllowed, autoStartNotAllowedHandler);
    wrapper?.addListener(PLAYER_EVENTS.play, playHandler);

    wrapper?.addListener(PLAYER_EVENTS.adStart, adStartHandler);
    wrapper?.addListener(PLAYER_EVENTS.adComplete, adCompleteHandler);
    // Video session collection
    const { adComplete, adStart, playerReady, timeupdate, contentError } = LiveVideoSession;
    wrapper?.addListener(PLAYER_EVENTS.time, timeupdate);
    wrapper?.addListener(PLAYER_EVENTS.adStart, adStart);
    wrapper?.addListener(PLAYER_EVENTS.firstFrame, firstFrameHandler);
    wrapper?.addListener(PLAYER_EVENTS.adComplete, adComplete);
    wrapper?.addListener(PLAYER_EVENTS.ready, playerReady);
    wrapper?.addListener(PLAYER_EVENTS.error, contentError);
    wrapper?.addListener(PLAYER_EVENTS.remove, playerRemove);
    return () => {
      wrapper?.removeListener(PLAYER_EVENTS.autoStartNotAllowed, autoStartNotAllowedHandler);
      wrapper?.removeListener(PLAYER_EVENTS.play, playHandler);
      wrapper?.removeListener(PLAYER_EVENTS.remove, playerRemove);

      wrapper?.removeListener(PLAYER_EVENTS.adStart, adStartHandler);
      wrapper?.removeListener(PLAYER_EVENTS.adComplete, adCompleteHandler);
      // Video session collection
      wrapper?.removeListener(PLAYER_EVENTS.time, timeupdate);
      wrapper?.removeListener(PLAYER_EVENTS.adStart, adStart);
      wrapper?.removeListener(PLAYER_EVENTS.adComplete, adComplete);
      wrapper?.removeListener(PLAYER_EVENTS.ready, playerReady);
      wrapper?.removeListener(PLAYER_EVENTS.error, contentError);
      wrapper?.removeListener(PLAYER_EVENTS.firstFrame, firstFrameHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper, videoPlayer]);

  useEffect(() => {
    const extraCtx = __WEBPLATFORM__ ? { isWebEpgEnabled } : /* istanbul ignore next */undefined;
    const pageType = getPageObjectFromURL(getCurrentPathname(), extraCtx) || undefined;
    wrapper?.once(PLAYER_EVENTS.play, () => {
      trackingManager.trackStartLiveVideoEvent({
        contentId: id,
        videoPlayer,
        videoResourceType: VideoResourceTypeState.VIDEO_RESOURCE_TYPE_HLSV3,
        streamUrl,
        hasSubtitles,
        isFullscreen: videoPlayer === PlayerDisplayMode.DEFAULT,
        pageType,
      });
    });
    wrapper?.addListener(PLAYER_EVENTS.captionsChange, (language: string) => {
      const lang = getLanguageCode(language || CC_OFF);
      const subtitlesToggleEventPayload = buildSubtitlesToggleEventObject(id, language ? ToggleState.ON : ToggleState.OFF, lang);
      trackEvent(eventTypes.SUBTITLES_TOGGLE, subtitlesToggleEventPayload);
    });

    wrapper?.addListener(PLAYER_EVENTS.bufferStart, bufferStartHandler);
    wrapper?.addListener(PLAYER_EVENTS.bufferEnd, bufferEndHandler);

    return () => {
      wrapper?.removeListener(PLAYER_EVENTS.bufferStart, bufferStartHandler);
      wrapper?.removeListener(PLAYER_EVENTS.bufferEnd, bufferEndHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper]);
};
