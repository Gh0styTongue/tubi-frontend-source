import { toFixed2 } from '@adrise/utils/lib/tools';
import { extractLiveStreamToken } from '@adrise/utils/lib/url';

import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { isAppHidden } from 'client/systemApi/utils';
import { getLivePlayerBufferStatus } from 'common/features/playback/utils/getLivePlayerBufferStatus';
import { getDisplayResolution } from 'common/utils/analytics';
import { getLinearPageType } from 'common/utils/linearPageType';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { getPlayerDisplayType } from './getPlayerDisplayType';
import type { LiveClientLogBaseInfo, LiveClientLogBaseParams } from './types';

export function getLiveClientLogBaseInfo({ contentId, wrapper, qualityManager, streamUrl }: LiveClientLogBaseParams): LiveClientLogBaseInfo {
  const contentBwEstimate = wrapper?.getBandwidthEstimate();
  return {
    is_live: true,
    usingApollo: !!wrapper?.getIsUsingApolloAdClient(),
    isAppHidden: isAppHidden(),
    position: wrapper?.getPosition(), // current time for live playback, in ms
    bitrate: wrapper?.getBitrate(),
    contentBwEstimate: contentBwEstimate !== undefined ? Number((contentBwEstimate / 1000).toFixed(3)) : undefined, // kbps
    content_id: contentId, // channel ID
    elReadyState: wrapper?.getContentVideoElement().readyState,
    playback_codec_detail: wrapper?.getCodecs(),
    cdn: wrapper?.getCDN(),
    pageType: getLinearPageType(), // channel or home page or EPG
    isUsingWebWorker: wrapper?.getIsUsingWebWorker(),
    sdkVersion: wrapper?.getSDKInfo()?.version,
    streamToken: extractLiveStreamToken(streamUrl || wrapper?.url || ''), // token query from stream url, truncated
    sessionStartTs: toFixed2(getLiveVideoSession()?.startTimestamp || -1),
    state: qualityManager ? qualityManager.getQuality()?.state : 'unknown',
    stateNum: qualityManager?.getQuality()?.stateNum ?? -1,
    playbackId: wrapper?.getPlaybackId(),
    resolution: qualityManager?.videoResource?.resolution,
    screenResolution: getDisplayResolution(),
    cdnProvider: nullishCoalescingWrapper(wrapper?.getCDNHeaders()['x-tubi-cdn-provider'], 'unknown'),
    cdnCache: wrapper?.getCDNHeaders()['x-cache'] || 'unknown',
    cdnCloudFrontId: wrapper?.getCDNHeaders()['x-amz-cf-id'] || 'unknown',
    cdnCloudFrontPop: wrapper?.getCDNHeaders()['x-amz-cf-pop'] || 'unknown',
    cdnServedBy: wrapper?.getCDNHeaders()['x-served-by'] || 'unknown',
    player_type: getPlayerDisplayType(getLiveVideoSession().playerDisplayMode),
    ...(wrapper ? getLivePlayerBufferStatus(wrapper) : {}),
  };
}
