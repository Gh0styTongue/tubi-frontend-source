import type { Video } from 'common/types/video';

export const enum LiveEventContentStatus {
  NotStarted = 'notStarted',
  Live = 'live',
  Ended = 'ended',
}

export interface LiveEvent
  extends Pick<
    Video,
    'id' | 'title' | 'images' | 'description' | 'player_type' | 'needs_login' | 'tags' | 'type'
  > {
  titleArt: string;
  backgroundImage: string;
  status: LiveEventContentStatus;
  startTime: string;
  showCC: boolean;
  showLiveIcon: boolean;
  timeDiff?: {
    days: number;
    hours: number;
    minutes: number;
  };
  support4K: boolean;
  channelLogo: string;
  landscapeImage: string;
  listingLoaded: boolean;
}
