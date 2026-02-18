import { PLAYER_EVENTS, type AdPod, type TimeEventData, type SeekEventData, type SeekedEventData } from '@adrise/player';
import { debug } from '@adrise/player/lib/utils/tools';
import { useCallback, useEffect, useRef } from 'react';

import { TRACK_LOGGING, AD_REQUEST_AFTER_SEEK_LOG_SUB_TYPE } from 'common/constants/error-types';
import { getExperiment } from 'common/experimentV2';
import { webRequestAdsAfterSeek } from 'common/experimentV2/configs/webRequestAdsAfterSeek';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import { fetchAds } from 'common/features/playback/utils/adTools';
import { useOTTMajorRequestAdsAfterSeek } from 'common/selectors/experiments/ottRequestAdsAfterSeek';
import { formatCuePoint } from 'common/utils/formatCuePoint';
import { trackLogging } from 'common/utils/track';

const log = debug('useRequestAdsAfterSeek');

type Params = {
  adBreaks: readonly number[];
  getAdUrl: (position: number) => string;
  playAdResponse: (response: AdPod) => void;
  contentId: string;
};

function findNearestPreviousCrossedCuePoint(start: number, end: number, cuePoints: readonly number[]): number | undefined {
  if (end <= start) return undefined;
  const crossed = cuePoints.filter((cp) => cp > start && cp <= end);
  if (!crossed.length) return undefined;
  return Math.max(...crossed);
}

function useRequestAdsAfterSeek({ adBreaks, getAdUrl, playAdResponse, contentId }: Params) {
  const { cuePointList } = formatCuePoint(adBreaks);

  const lastSeekStartRef = useRef<number | undefined>();
  const lastSeekEndRef = useRef<number | undefined>();
  const wasInWaitWindowRef = useRef<boolean>(false);
  const pendingCuePointRef = useRef<number | undefined>();
  const pendingTriggerPositionRef = useRef<number | undefined>();
  const isMountedRef = useRef(true);
  const { value: ottEnabled, logExposure } = useOTTMajorRequestAdsAfterSeek();

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const onAdPlay = useCallback(() => {
    log('PLAYER_EVENTS.adPlay received - cancel pending trigger');
    wasInWaitWindowRef.current = false;
    lastSeekStartRef.current = undefined;
    lastSeekEndRef.current = undefined;
    pendingCuePointRef.current = undefined;
    pendingTriggerPositionRef.current = undefined;
  }, []);

  // seeking has no payload; just clear any pending trigger at the beginning of a new seek
  const onSeeking = useCallback(() => {
    pendingCuePointRef.current = undefined;
    pendingTriggerPositionRef.current = undefined;
    log('Seeking: clear pending trigger');
  }, []);

  // seek carries position (from) and offset (to)
  const onSeek = useCallback(({ position, offset }: SeekEventData) => {
    const isForward = offset > position;
    if (!wasInWaitWindowRef.current) {
      lastSeekStartRef.current = position;
      wasInWaitWindowRef.current = true;
      log('Seek: start window', { position, offset });
    } else if (!isForward) {
      lastSeekStartRef.current = position;
      log('Seek: backward within window, reset start', { position, offset });
    } else {
      log('Seek: forward within window, keep original start', { position, offset, windowStart: lastSeekStartRef.current });
    }
  }, []);

  const onSeeked = useCallback(({ offset }: SeekedEventData) => {
    lastSeekEndRef.current = offset;
    const start = lastSeekStartRef.current;
    if (start === undefined) {
      log('Seeked: missing start, ignore', { offset });
      return;
    }
    const crossedCuePoint = findNearestPreviousCrossedCuePoint(start, offset, cuePointList);
    if (!crossedCuePoint) {
      log('Seeked: no crossed cue point', { start, offset });
      wasInWaitWindowRef.current = false;
      lastSeekStartRef.current = undefined;
      return;
    }
    pendingCuePointRef.current = crossedCuePoint;
    pendingTriggerPositionRef.current = offset + 5; // trigger when position reaches seeked target + 5s
    log('Seeked: crossed cue point, set trigger position', { start, offset, crossedCuePoint, triggerAt: pendingTriggerPositionRef.current });
  }, [cuePointList]);

  const onTime = useCallback(({ position }: TimeEventData) => {
    if (pendingCuePointRef.current !== undefined && pendingTriggerPositionRef.current !== undefined) {
      if (position >= pendingTriggerPositionRef.current) {
        const cuePoint = pendingCuePointRef.current;
        // reset state before request
        wasInWaitWindowRef.current = false;
        lastSeekStartRef.current = undefined;
        lastSeekEndRef.current = undefined;
        pendingTriggerPositionRef.current = undefined;

        const webEnabled = getExperiment(webRequestAdsAfterSeek).get('enable');
        const featureFlagEnabled = ottEnabled || webEnabled;
        log('Reached trigger position - requesting ads', { featureFlagEnabled, cuePoint: pendingCuePointRef.current, adTag: getAdUrl(pendingCuePointRef.current), position });
        logExposure();
        if (!featureFlagEnabled) {
          pendingCuePointRef.current = undefined;
          return;
        }

        const adTag = getAdUrl(cuePoint);
        trackLogging({ type: TRACK_LOGGING.adInfo, subtype: AD_REQUEST_AFTER_SEEK_LOG_SUB_TYPE.REQUEST, message_map: { contentId, cuePoint: String(cuePoint), position: String(position), adTag } });
        fetchAds(adTag, {
          maxRetries: 0,
        })
          .then((response) => {
            if (!isMountedRef.current) return;
            log('Ad response received (position trigger)', { adsCount: response.ads?.length });
            playAdResponse(response.ads);
            trackLogging({ type: TRACK_LOGGING.adInfo, subtype: AD_REQUEST_AFTER_SEEK_LOG_SUB_TYPE.SUCCESS, message_map: { contentId, cuePoint: String(cuePoint), position: String(position) } });
          })
          .catch((e) => {
            if (!isMountedRef.current) return;
            log('Ad request error (position trigger)', { error: e });
            trackLogging({ type: TRACK_LOGGING.adInfo, subtype: AD_REQUEST_AFTER_SEEK_LOG_SUB_TYPE.ERROR, message_map: { contentId, cuePoint: String(cuePoint), position: String(position) } });
          })
          .finally(() => {
            if (!isMountedRef.current) return;
            pendingCuePointRef.current = undefined;
          });
      }
    }
  }, [ottEnabled, getAdUrl, logExposure, contentId, playAdResponse]);

  usePlayerEvent(PLAYER_EVENTS.adPlay, onAdPlay);
  usePlayerEvent(PLAYER_EVENTS.seeking, onSeeking);
  usePlayerEvent(PLAYER_EVENTS.seek, onSeek);
  usePlayerEvent(PLAYER_EVENTS.seeked, onSeeked);
  usePlayerEvent(PLAYER_EVENTS.time, onTime);
}

export default useRequestAdsAfterSeek;

