import { isInProgress } from '@adrise/utils/lib/time';
import { useMemo } from 'react';

import { doesVideoSupport4K } from 'common/features/playback/utils/doesVideoSupport4K';
import useAppSelector from 'common/hooks/useAppSelector';
import { byIdSelector } from 'common/selectors/video';

import { LiveEventContentStatus, type LiveEvent } from '../types';
import { getLiveEventContentStatus } from '../utils';
import { useListing } from './useListing';
import { useLiveEventCountdown } from './useLiveEventCountdown';

export const useLiveEvent = (id: string): LiveEvent | undefined => {
  const content = useAppSelector(byIdSelector)[id];
  const currentDate = useAppSelector(state => state.ui.currentDate);
  const listing = useListing({ ids: [id] });
  const scheduleData = listing.data?.[id];
  const listingLoaded = listing.loaded;
  const status = useMemo(() => getLiveEventContentStatus(currentDate, scheduleData), [currentDate, scheduleData]);
  const { timeDiff } = useLiveEventCountdown(scheduleData?.start_time, id, status === LiveEventContentStatus.Ended);
  if (!content || !scheduleData) {
    return undefined;
  }
  const { start_time, end_time } = scheduleData;

  const {
    needs_login,
    genres,
    has_subtitle,
    images,
    title,
    description,
    player_type = 'fox',
    landscape_images,
    backgrounds,
    type,
  } = content;

  const showLiveIcon = isInProgress(start_time, end_time, currentDate);
  const support4K = !!(content.video_renditions?.length && doesVideoSupport4K(content.video_renditions));

  return {
    id: content.id,
    title,
    titleArt: images?.title_art?.[0] || '',
    images,
    description,
    player_type,
    needs_login,
    backgroundImage: images?.backgrounds?.[0] || backgrounds?.[0] || '',
    landscapeImage: images?.landscape_images?.[0] || landscape_images?.[0] || '',
    status,
    startTime: start_time,
    tags: genres,
    type,
    showCC: !!has_subtitle,
    showLiveIcon,
    timeDiff,
    support4K,
    channelLogo: content.schedule_data?.channel_logo || '',
    listingLoaded,
  };
};
