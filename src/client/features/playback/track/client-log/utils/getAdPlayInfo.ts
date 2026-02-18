import type { Player, AdCompleteEventData, AdDiscontinueEventData, AdStallEventData, AdStartEventData, AdHealthScores } from '@adrise/player';
import { timeInBufferedRange } from '@adrise/player';
import type { AdType } from '@tubitv/analytics/lib/adEvent';

import { PlayerType } from './types';

const HAVE_NEXT_GOP_OFFSET = 5; // The GOP duration of ad resource is 4 seconds, so here use a bit longer value.

export function getAdPlayInfo({
  contentId,
  player,
  adsCount,
  adSequence,
  ad,
  adPosition,
  isPreroll,
  isTimeupdateStall,
  timeupdateCount,
  bufferedArray,
  totalVideoFrames,
  droppedVideoFrames,
  corruptedVideoFrames,
  isPAL,
  healthScores,
  adType,
}: {
  contentId: string;
  player: Player;
  isTimeupdateStall?: boolean;
  timeupdateCount?: number;
  bufferedArray?: [number, number][];
  totalVideoFrames?: number;
  droppedVideoFrames?: number;
  corruptedVideoFrames?: number;
  isPAL?: boolean;
  healthScores?: AdHealthScores;
  adType?: AdType;
  presetAdType?: string;
} & (AdStartEventData | AdCompleteEventData | AdDiscontinueEventData | AdStallEventData)) {
  let isEnoughBuffered = false;
  let bufferedEnd = 0;
  if (bufferedArray && adPosition !== undefined) {
    const range = timeInBufferedRange(adPosition, bufferedArray);
    bufferedEnd = range?.[1] || 0;
    isEnoughBuffered = bufferedEnd > adPosition + HAVE_NEXT_GOP_OFFSET;
  }
  return {
    content_id: contentId,
    position: player.getPosition(),
    count: adsCount,
    index: adSequence,
    duration: ad?.duration,
    id: ad?.id,
    url: ad?.video,
    adPosition,
    isPreroll,
    retry: ad?.state?.stallRetryCount,
    healthScoreRetry: ad?.state?.healthScoreRetryCount,
    healthScoreSeek: ad?.state?.healthScoreSeekCount,
    isPAL,
    player: PlayerType.VOD,
    SDKVersion: player.SDKVersion,
    ...(typeof isTimeupdateStall !== 'undefined' ? { isTimeupdateStall } : {}),
    ...(typeof timeupdateCount !== 'undefined' ? { timeupdateCount } : {}),
    ...(typeof bufferedArray !== 'undefined' ? { bufferedArray } : {}),
    bufferedEnd,
    isEnoughBuffered,
    contentBwEstimate: Number((player.getBandwidthEstimate?.() / 1000).toFixed(3)), // kbps
    ...(typeof totalVideoFrames !== 'undefined' ? { totalVideoFrames } : {}),
    ...(typeof droppedVideoFrames !== 'undefined' ? { droppedVideoFrames } : {}),
    ...(typeof corruptedVideoFrames !== 'undefined' ? { corruptedVideoFrames } : {}),
    ...(typeof healthScores !== 'undefined' ? { healthScores } : {}),
    ...(typeof adType !== 'undefined' ? { adType } : {}),
    presetAdType: ad?.presetAdType,
  };
}
