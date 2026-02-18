import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';

import { getPlayerDisplayType } from './getPlayerDisplayType';
import type { LivePlayerAnalyticsBaseInfo } from './types';

interface GetLivePlayerAnalyticsBaseInfoParams {
  wrapper: LivePlayerWrapper;
  contentId: string;
  videoPlayer: PlayerDisplayMode;
  ssaiVersion: string;
}

export const getLivePlayerAnalyticsBaseInfo = (
  params: GetLivePlayerAnalyticsBaseInfoParams,
): LivePlayerAnalyticsBaseInfo => {
  const { wrapper, contentId, videoPlayer, ssaiVersion } = params;
  let ssai_version = 0;
  if (ssaiVersion === 'apollo') {
    ssai_version = 1;
  } else if (ssaiVersion === 'yospace') {
    ssai_version = 2;
  }
  return {
    track_id: wrapper.getPlaybackId(),
    video_id: contentId,
    player_type: getPlayerDisplayType(videoPlayer),
    ssai_version,
  };
};
