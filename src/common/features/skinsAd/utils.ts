import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { ContainerChildType, ContainerType } from 'common/types/container';
import type { VideoType } from 'common/types/video';
import { trackLogging } from 'common/utils/track';

import { SKINS_AD_CONTAINER_ID, SKINS_AD_TAG } from './constants';
import type { Ads, Creatives, CreativeType, VideoCreative, VideoCustomCreatives } from './type';

export const getSkinsAdCreative = <T extends CreativeType>(creatives: Creatives | [], type: T) => {
  if (!creatives || !Array.isArray(creatives) || !type) return;
  for (const creative of creatives) {
    if (creative?.type === type) {
      return creative as (T extends VideoCreative['type'] ? VideoCreative : VideoCustomCreatives);
    }
  }
};

export const parseSkinsAdToContainer = (ads: Ads[]) => {
  const { id: adId, creatives } = ads[0] || {};
  const videoCustom = getSkinsAdCreative(creatives, 'native_custom_video');
  if (!videoCustom) {
    trackSkinsAdError('No native_custom_video creative found when parsing to container');
    return {};
  }

  const video = getSkinsAdCreative(creatives, 'video');
  const id = video?.ad_id || video?.id || adId || videoCustom.id;

  if (!id || typeof id !== 'string') {
    trackSkinsAdError(`Invalid ad ID: ${id} when parsing to container`);
    return {};
  }

  const container = {
    id: SKINS_AD_CONTAINER_ID,
    slug: SKINS_AD_CONTAINER_ID,
    title: '',
    description: '',
    type: ContainerType.regular,
    childType: ContainerChildType.content,
    background: null,
    children: [id],
    cursor: null,
  };
  const content = {
    id,
    title: '',
    description: '',
    year: 2024,
    type: 'v' as VideoType,
    images: {
      backgrounds: [videoCustom.image],
      art_title: [videoCustom.offer?.logo],
      landscape_images: [videoCustom.custom?.tile_img],
    },
    backgrounds: [],
    duration: 0,
    hero_images: [],
    landscape_images: [],
    posterarts: [],
    publisher_id: '',
    thumbnails: [],
    has_subtitle: true,
    tags: [SKINS_AD_TAG],
    video_preview_url: videoCustom.media?.streamurl,
  };

  return {
    container,
    content,
  };
};

export const trackSkinsAdError = (message: unknown) => {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.SKINS_AD,
    message,
  });
};
