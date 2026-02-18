import isPlainObject from 'lodash/isPlainObject';

import type { VideoContentResponse } from 'client/utils/clientDataRequest';
import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { Season } from 'common/types/series';
import type { VideoResource, VIDEO_RESOURCE_CODEC, VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';
import type { Video } from 'src/common/types/video';

const episodeNumRegex = /^S\d+:E(\d+)\b/;
export const convertChildrenToSeasonsForSeries = (content: VideoContentResponse | Video | undefined): Video | undefined => {
  if (content === undefined || content.type !== SERIES_CONTENT_TYPE || !('children' in content)) {
    return content;
  }

  /* istanbul ignore next */
  const { children = [], ...contentRest } = content;
  const seasons: Season[] = children.filter(season => season.children && season.children.length > 0)
    .map(season => {
      /* istanbul ignore next */
      const { children: episodes = [], id } = season;
      const newEpisodes = episodes.map(({ id, episode_number, title }, index) => {
        // When not using the metadata because episode pagination is not enabled, we want to use the episode number from
        // the title if one is not explicitly provided. Otherwise, as a final fallback, use the index+1 as the episode number.
        let epNumStr: string = episode_number;
        if (!epNumStr) {
          const epNumFromTitle = (title || '').match(episodeNumRegex)?.[1];
          if (epNumFromTitle) {
            epNumStr = epNumFromTitle;
          } else {
            epNumStr = `${index + 1}`;
          }
        }
        return { id, num: Number(epNumStr) };
      });
      return { number: id, episodes: newEpisodes };
    });
  return { ...contentRest, seasons };
};

/**
 * Turn http/https urls to protocol-relative format
 * @param {object} origin video data object
 * @returns {object} - video data object with transformed urls
 */
export const makeProtocolRelativeUrl = <T extends object | undefined>(content: T): T => {
  /* istanbul ignore next */
  if (!content || typeof content !== 'object') {
    return content;
  }

  const keys = ['backgrounds', 'hero_images', 'posterarts', 'landscape_images', 'thumbnails', 'thumbnail', 'logo', 'channel_logo'];
  const transform = (url: string) => {
    if (!url) return url;

    return __OTTPLATFORM__ === 'TIZEN'
      ? url.replace(/^http:/, 'https:') // use https full URL since Tizen is running under file: protocol
      : url.replace(/^https?:/, ''); // use protocol-relative URL
  };

  keys.forEach((key) => {
    const value = content[key];
    if (value) {
      if (Array.isArray(value)) {
        content[key] = (value).map(url => transform(url));
      } else if (typeof value === 'string') {
        content[key] = transform(value);
      }
    }
  });

  return content;
};

export const replaceWithOptimizedImagesIfExist = <T extends Video | undefined>(content: T, existingContent?: T): T => {
  /* istanbul ignore next */
  if (!content || typeof content !== 'object' || typeof content.images !== 'object') {
    return content;
  }

  const contentKeys = ['backgrounds', 'hero_images', 'posterarts', 'landscape_images', 'thumbnails'] as const;
  const optimizedImages = content.images;

  contentKeys.forEach((key) => {
    const optimizedImagesItems = optimizedImages[key] || [];

    /*
     * Currently for different request we might pass different image query,
     * which might cause an issue that a title is either using image from `images.posterarts`, or from `posterarts`.
     * This part guarantees to use images from Tupian when available, and not causing conflicts.
     * TODO: Remove it when episode pagination is online and when every request keeps same image query. @xdai
     */
    const existingOptimizedImageItems = existingContent?.images?.[key] || [];
    const useExistingSource = optimizedImagesItems.length === 0 && existingOptimizedImageItems.length > 0;

    if (useExistingSource) {
      content[key] = existingContent![key];
    } else if (optimizedImagesItems.length > 0) {
      content[key] = optimizedImagesItems;
    }
  });

  content.images = { ...existingContent?.images, ...content.images };
  return content;
};

export const removePrefixOfVideoResource = <T extends {video_resources?: VideoResource[]} | undefined>(content: T): T => {
  content?.video_resources?.forEach(item => {
    item.codec = item.codec?.replace('VIDEO_CODEC_', '') as VIDEO_RESOURCE_CODEC;
    item.resolution = item.resolution?.replace('VIDEO_RESOLUTION_', '') as VIDEO_RESOURCE_RESOLUTION;
  });
  return content;
};

/**
 * Transform video data to add required fields and correct data format
 * @param {content} origin video data object
 * @returns {object} - video data object being transformed
 */
export function formatContent(content: VideoContentResponse | Video, existingContent?: Video): Video;
export function formatContent(content: undefined, existingContent?: Video): undefined;
export function formatContent(content: VideoContentResponse | Video | undefined, existingContent?: Video): Video | undefined {
  return removePrefixOfVideoResource(
    makeProtocolRelativeUrl(
      convertChildrenToSeasonsForSeries(
        replaceWithOptimizedImagesIfExist(content, existingContent)
      )
    )
  );
}

const isObjectOrArray = (arg: unknown): arg is unknown[] | Record<string, unknown> =>
  isPlainObject(arg) || Array.isArray(arg);

/**
 * In-place change urls in the object from http to https protocol
 */
export const convertToHttps = (obj: unknown) => {
  if (!isObjectOrArray(obj)) {
    return obj;
  }

  Object.keys(obj as unknown[] | Record<string, unknown>).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('http:')) {
      obj[key] = value.replace('http:', 'https:');
    } else {
      convertToHttps(value);
    }
  });

  return obj;
};
