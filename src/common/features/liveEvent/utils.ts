import type { Container } from 'common/types/container';
import { ContainerUiCustomizationType } from 'common/types/container';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { ScheduleData, Video } from 'common/types/video';

import { LiveEventContentStatus } from './types';

export const isLiveEvent = (content: Video) => content?.player_type === 'fox';
export const isFoxPlayer = (content: Video | ChannelEPGInfo | undefined) => content?.player_type === 'fox';

export const isLiveEventContainer = (container: Container) => container?.ui_customization?.type === ContainerUiCustomizationType.liveEvent;
export const isLiveEventBannerContainer = (container: Container) => container?.ui_customization?.type === ContainerUiCustomizationType.liveEventBanner;
export const isLiveEventOrBannerContainer = (container: Container) => isLiveEventContainer(container) || isLiveEventBannerContainer(container);

export const getLiveEventContentStatus = (currentTime: Date, schedule_data: ScheduleData | undefined) => {
  if (!schedule_data) {
    return LiveEventContentStatus.Ended;
  }
  const { start_time, end_time } = schedule_data;
  const startTime = new Date(start_time);
  const endTime = new Date(end_time);
  if (currentTime < startTime) {
    return LiveEventContentStatus.NotStarted;
  }
  if (currentTime > endTime) {
    return LiveEventContentStatus.Ended;
  }
  return LiveEventContentStatus.Live;
};

