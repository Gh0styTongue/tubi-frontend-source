import isEmpty from 'lodash/isEmpty';

import { FREEZED_EMPTY_ARRAY, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import type { BackgroundImageProps } from 'common/types/backgroundImages';
import type { Container } from 'common/types/container';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';
import { isDetailsPageUrl } from 'common/utils/urlPredicates';

export enum BgPageType {
  HOME = 'HOME',
  MY_STUFF = 'MY_STUFF',
  VOD_PLAYER = 'VOD_PLAYER',
  LIVE_PLAYER = 'LIVE_PLAYER',
  DETAILS = 'DETAILS',
  CONTAINER_LIST = 'CONTAINER_LIST',
  CONTAINER_DETAILS = 'CONTAINER_DETAILS',
  EPISODES = 'EPISODES',
  SEARCH = 'SEARCH',
  PERSONALIZATION = 'PERSONALIZATION',
  NONE = 'NONE',
}

// Check for low quality images
function bgIsLowQualityImage(images: string[], posters: string[]): boolean {
  return images.length > 0 && posters.length > 0 ? images[0] === posters[0] : false;
}

// Get imageUrls from the content
export const getImageUrlsFromContent = (
  content: Container | Video | Series | ChannelEPGInfo | undefined,
  isContainer: boolean
): BackgroundImageProps => {
  if (!content) return { imageUrls: FREEZED_EMPTY_ARRAY };

  const isEpisode = content.type === VIDEO_CONTENT_TYPE && 'series_id' in content && Boolean(content.series_id);
  const backgrounds = isEpisode
    ? (content as Video).series_images?.backgrounds ?? []
    : content.backgrounds ?? [];
  const posterarts = !isContainer ? (content as Video | Series).posterarts : [];
  const isLowQualityBgImages = bgIsLowQualityImage(backgrounds, posterarts || []);
  const imageUrls = isEmpty(backgrounds) ? FREEZED_EMPTY_ARRAY : backgrounds;
  return {
    // Ignore imageUrls if the image quality is low
    imageUrls: isLowQualityBgImages ? FREEZED_EMPTY_ARRAY : imageUrls,
  };
};

export const getPageType = (locationPath: string): BgPageType => {
  if (!locationPath) return BgPageType.NONE;

  switch (true) {
    case locationPath.startsWith('/ott/player'):
    case locationPath.startsWith('/ott/androidplayer'):
      return BgPageType.VOD_PLAYER;
    case locationPath.startsWith('/ott/live'):
      return BgPageType.LIVE_PLAYER;
    case locationPath.startsWith('/search'):
      return BgPageType.SEARCH;
    case locationPath === '/containers/regular' || locationPath === '/containers/channel':
      return BgPageType.CONTAINER_LIST;
    case locationPath.startsWith('/container/regular') || locationPath.startsWith('/container/channel') || locationPath.startsWith('/container/related'):
      return BgPageType.CONTAINER_DETAILS;
    case locationPath === '/' || locationPath.startsWith('/mode'):
      return BgPageType.HOME;
    case locationPath.startsWith('/my-stuff'):
      return BgPageType.MY_STUFF;
    case isDetailsPageUrl(locationPath):
      return BgPageType.DETAILS;
    case locationPath.startsWith('/ott/series') && locationPath.indexOf('/episodes') > -1:
      return BgPageType.EPISODES;
    case locationPath.startsWith('/personalization'):
      return BgPageType.PERSONALIZATION;
    default:
      return BgPageType.NONE;
  }
};
