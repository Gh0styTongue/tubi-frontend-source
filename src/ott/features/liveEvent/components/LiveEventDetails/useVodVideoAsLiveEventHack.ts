import type { LiveEvent } from 'common/features/liveEvent/types';
import { LiveEventContentStatus } from 'common/features/liveEvent/types';
import useAppSelector from 'common/hooks/useAppSelector';

// This is a hack to treat vod videos as live events for the purpose of rendering the live event details page with vod content.
export const useVodVideoAsLiveEventHack = (id: string): LiveEvent | undefined => {
  const content = useAppSelector(state => state.video.byId[id]);
  if (!content) {
    return undefined;
  }
  return {
    id: content.id,
    title: content.title,
    titleArt: content.images?.title_art?.[0] || '',
    images: content.images,
    description: content.description,
    player_type: content.player_type,
    needs_login: content.needs_login,
    backgroundImage: content.images?.backgrounds?.[0] || content.backgrounds?.[0] || '',
    landscapeImage: content.images?.landscape_images?.[0] || content.landscape_images?.[0] || '',
    status: LiveEventContentStatus.Live,
    startTime: content.availability_starts || '',
    tags: content.tags,
    type: content.type,
    showCC: !!content.has_subtitle,
    showLiveIcon: false,
    timeDiff: {
      days: 0,
      hours: 0,
      minutes: 0,
    },
    support4K: false,
    channelLogo: content.schedule_data?.channel_logo || '',
    listingLoaded: true,
    channelId: content.schedule_data?.channel_id || content.id,
  };
};
