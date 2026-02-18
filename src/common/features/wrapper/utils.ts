import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { ContainerChildType, ContainerType } from 'common/types/container';
import type { VideoType } from 'common/types/video';
import { trackLogging } from 'common/utils/track';

import { WRAPPER_CONTAINER_ID, WRAPPER_TAG } from './constants';
import type { Ads, Creatives, CreativeType, VideoCreative, VideoCustomCreatives } from './type';

export const getWrapperCreative = <T extends CreativeType>(creatives: Creatives | [], type: T) => {
  if (!creatives || !Array.isArray(creatives) || !type) return;
  for (const creative of creatives) {
    if (creative?.type === type) {
      return creative as (T extends VideoCreative['type'] ? VideoCreative : VideoCustomCreatives);
    }
  }
};

export const parseWrapperToContainer = (ads: Ads[]) => {
  const { id: adId, creatives } = ads[0] || {};
  const videoCustom = getWrapperCreative(creatives, 'native_custom_video');
  if (!videoCustom) {
    trackWrapperError('No native_custom_video creative found when parsing to container');
    return {};
  }

  const video = getWrapperCreative(creatives, 'video');
  const id = video?.ad_id || video?.id || adId || videoCustom.id;

  if (!id || typeof id !== 'string') {
    trackWrapperError(`Invalid ad ID: ${id} when parsing to container`);
    return {};
  }

  const container = {
    id: WRAPPER_CONTAINER_ID,
    slug: WRAPPER_CONTAINER_ID,
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
    tags: [WRAPPER_TAG],
    video_previews: [
      { url: videoCustom.media?.streamurl, uuid: '' },
    ],
  };

  return {
    container,
    content,
  };
};

export const trackWrapperError = (message: unknown) => {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.WRAPPER,
    message,
  });
};
