import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { LiveAdEventData } from 'client/features/playback/live/utils/liveAdClient';

import { playerAnalyticsLiveAdStart } from '../analytics-ingestion-v3';
import { getLivePlayerAnalyticsBaseInfo } from './utils/getLivePlayerAnalyticsBaseInfo';

export function trackLiveAdStart(event: LiveAdEventData, { wrapper, contentId, videoPlayer, ssaiVersion }: { wrapper: LivePlayerWrapper, contentId: string, videoPlayer: PlayerDisplayMode, ssaiVersion: string }) {
  const baseInfo = getLivePlayerAnalyticsBaseInfo({
    wrapper,
    contentId,
    videoPlayer,
    ssaiVersion,
  });

  const playerAnalyticsData = {
    ...baseInfo,
    ad_id: event.adId || '',
    url: '', // leave it empty cause it's embedded
    ad_index: event.adIndex,
    ad_count: 0, // TODO: get ad count
    duration: 0, // TODO: get ad duration
  };
  playerAnalyticsLiveAdStart(playerAnalyticsData);
}
