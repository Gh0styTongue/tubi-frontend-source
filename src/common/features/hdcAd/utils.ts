import cloneDeep from 'lodash/cloneDeep';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { ContainerChildType, ContainerType } from 'common/types/container';
import type { Container } from 'common/types/container';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { trackLogging } from 'common/utils/track';

import {
  defaultRowPlacementMap,
  HDC_SPOTLIGHT,
  HDC_CAROUSEL,
  HDC_CONTAINER_PREFIX,
  HDC_WRAPPER,
  HDC_WRAPPER_VIDEO,
} from './constants';
import type { HdcAd, HdcAdAssets, HdcAdNativeCreative, HdcAdUnit, HdcAdVideoCreative } from './type';
import { WRAPPER_TAG } from '../wrapper/constants';

interface ConvertResult {
  containers: Container[];
  contents: Video[];
  containerChildrenIdMap: Record<string, string[]>;
  rowPlacementMap: Record<string, number>;
}

const defaultPartialVideo: Omit<Video, 'id' | 'title'> = {
  type: 'v',
  backgrounds: [],
  hero_images: [],
  landscape_images: [],
  posterarts: [],
  thumbnails: [],
  year: 2025,
  duration: 0,
  ratings: [],
  tags: [],
  actors: [],
  directors: [],
  publisher_id: '',
  images: {},
  video_previews: [],
  description: '',
};

function initVideo(contentMap: Record<string, Video>, contentId: string) {
  if (!contentMap[contentId]) {
    contentMap[contentId] = {
      id: contentId,
      title: '',
      ...cloneDeep(defaultPartialVideo),
    };
  }
}

function fillSpotlightFields(contentMap: Record<string, Video>, { assets, id }: HdcAd) {
  const contentId = `${HDC_SPOTLIGHT}_1_${id}`;
  initVideo(contentMap, contentId);
  const video = contentMap[contentId];
  video.tags = [id.toString()];
  if (assets.poster_image && 'url' in assets.poster_image && assets.poster_image.url) {
    video.hero_images = [assets.poster_image.url];
  }
  if (assets.background_image && 'url' in assets.background_image && assets.background_image.url) {
    video.backgrounds = [assets.background_image.url];
  }
  if (assets.brand_text && 'text' in assets.brand_text && assets.brand_text.text) {
    video.title = assets.brand_text.text;
  }
  // Map ad.assets.video to video_previews
  if (assets.video) {
    video.video_previews = assets.video
      .map((v, idx) => ({
        url: v.url || v.value || '',
        uuid: `${contentId}_${idx}`,
      }));
  }
}

function getCarouselTileIndices(adAssets: HdcAdAssets) {
  return Object.keys(adAssets)
    .filter(key => key.startsWith('tile_'))
    .map(key => key.replace('tile_', ''))
    .map(Number)
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
}

function fillCarouselFields(contentMap: Record<string, Video>, { assets, id }: HdcAd) {
  const contentBaseId = HDC_CAROUSEL;

  const tileIndices = getCarouselTileIndices(assets);

  for (const index of tileIndices) {
    const contentId = `${contentBaseId}_${index}_${id}`;
    const bgKey = `background_${index}`;
    const thumbKey = `tile_${index}`;

    const bgAsset = assets[bgKey];
    const thumbAsset = assets[thumbKey];

    if (!bgAsset || !thumbAsset || !('url' in bgAsset) || !('url' in thumbAsset)) {
      continue;
    }

    initVideo(contentMap, contentId);
    const video = contentMap[contentId];
    video.tags = [id.toString()];

    if (assets.brand_text) {
      video.title = assets.brand_text.text ?? '';
    }

    video.hero_images = video.backgrounds = [bgAsset.url || ''];
    video.thumbnails = [thumbAsset.url || ''];

    if (assets.video && Array.isArray(assets.video) && index === Math.min(...tileIndices)) {
      video.video_previews = assets.video.map((v, idx) => ({
        url: v.url || v.value || '',
        uuid: `${contentId}_${idx}`,
      }));
    }
  }
}

function fillWrapperFields(contentMap: Record<string, Video>, { assets, id }: HdcAd) {
  const contentId = `${HDC_WRAPPER}_1_${id}`;
  initVideo(contentMap, contentId);
  const video = contentMap[contentId];
  video.tags = [WRAPPER_TAG];
  if (assets.logo_url && 'url' in assets.logo_url && assets.logo_url.url) {
    if (!video.images) video.images = {};
    video.images.title_art = [assets.logo_url.url];
  }
  if (assets.main_image && 'url' in assets.main_image && assets.main_image.url) {
    if (!video.images) video.images = {};
    video.images.backgrounds = [assets.main_image.url];
  }
  if (assets.landscape_images && 'url' in assets.landscape_images && assets.landscape_images.url) {
    if (!video.images) video.images = {};
    video.images.backgrounds = [assets.landscape_images.url];
  }
  // Map ad.assets.video to video_previews
  if (assets.video) {
    video.video_previews = assets.video
      .map((v, idx) => ({
        url: v.url || v.value || '',
        uuid: `${contentId}_${idx}`,
      }));
  }
}

function getContentIds(adUnits: HdcAdUnit[], renderingCode: string) {
  if (renderingCode.startsWith(HDC_SPOTLIGHT)) {
    const nativeAdUnit = adUnits.find((adUnit) => adUnit.rendering_code === HDC_SPOTLIGHT);
    if (nativeAdUnit) {
      return [`${HDC_SPOTLIGHT}_1_${nativeAdUnit.ad.id}`];
    }
    return [];
  }

  if (renderingCode.startsWith(HDC_CAROUSEL)) {
    const nativeAdUnit = adUnits.find((adUnit) => adUnit.rendering_code === HDC_CAROUSEL);
    const contentIds: string[] = [];

    if (nativeAdUnit) {
      const assets = nativeAdUnit.ad.assets;

      const tileIndices = getCarouselTileIndices(assets);

      for (const index of tileIndices) {
        const bgKey = `background_${index}`;
        const thumbKey = `tile_${index}`;
        const bgAsset = assets[bgKey];
        const thumbAsset = assets[thumbKey];

        if (!bgAsset || !thumbAsset || !('url' in bgAsset) || !('url' in thumbAsset)) {
          continue;
        }
        contentIds.push(`${HDC_CAROUSEL}_${index}_${nativeAdUnit.ad.id}`);
      }

      return contentIds;
    }
  }

  if (renderingCode === HDC_WRAPPER) {
    const nativeAdUnit = adUnits.find((adUnit) => adUnit.rendering_code === HDC_WRAPPER);
    if (nativeAdUnit) {
      return [`${HDC_WRAPPER}_1_${nativeAdUnit.ad.id}`];
    }
  }

  return [];
}

function getContainerId({ rendering_code }: HdcAdUnit) {
  return rendering_code;
}

function initContainer(
  containerMap: Record<string, Container>,
  containerChildrenIdMap: Record<string, string[]>,
  adUnits: HdcAdUnit[]
) {
  adUnits.forEach((adUnit) => {
    // Container only created once per content
    const { ad, rendering_code, code } = adUnit;

    if (rendering_code === HDC_WRAPPER_VIDEO) return;

    const containerId = getContainerId(adUnit);
    const contentIds = getContentIds(adUnits, rendering_code);
    if (!containerMap[containerId]) {
      const tags = [code || '', rendering_code || ''].filter(Boolean);
      containerMap[containerId] = {
        id: containerId,
        title: ad.assets.brand_text?.text || '',
        description: '',
        childType: ContainerChildType.content,
        children: contentIds,
        type: ContainerType.regular,
        slug: `${HDC_CONTAINER_PREFIX}${ad.id}`,
        tags,
      };

      // Add additional metadata for carousel rendering
      if (ad.assets.brand_logo && 'url' in ad.assets.brand_logo) {
        containerMap[containerId].logo = ad.assets.brand_logo.url || '';
      }
      containerChildrenIdMap[containerId] = contentIds;
    }
  });
}

/**
 * Merge ad units by content id, generate containers, contents, and children map
 * @param adUnits Array of HdcAdUnit
 * @returns containers, contents, containerChildrenIdMap
 */
export function convertHdcAdsToContainersAndContents(adUnits: HdcAdUnit[]): ConvertResult {
  const contentMap: Record<string, Video> = {};
  const containerMap: Record<string, Container> = {};
  const containerChildrenIdMap: Record<string, string[]> = {};
  const rowPlacementMap: Record<string, number> = {};
  initContainer(containerMap, containerChildrenIdMap, adUnits);

  adUnits.forEach((adUnit) => {
    const { ad, rendering_code, row_placement } = adUnit;
    const containerId = getContainerId(adUnit);
    const defaultRowPlacement = defaultRowPlacementMap[rendering_code];
    if (containerId in rowPlacementMap) {
      rowPlacementMap[containerId] = Math.min(rowPlacementMap[containerId], row_placement ?? defaultRowPlacement ?? 0);
    } else {
      rowPlacementMap[containerId] = row_placement ?? defaultRowPlacement;
    }

    if (rendering_code.startsWith(HDC_SPOTLIGHT)) {
      fillSpotlightFields(contentMap, ad);
    } else if (rendering_code.startsWith(HDC_CAROUSEL)) {
      fillCarouselFields(contentMap, ad);
    } else if (rendering_code === HDC_WRAPPER) {
      fillWrapperFields(contentMap, ad);
    }
  });

  return {
    containers: Object.values(containerMap),
    contents: Object.values(contentMap),
    containerChildrenIdMap,
    rowPlacementMap,
  };
}

export function convertVideoCreativeMap(adUnits: HdcAdUnit[]): Record<string, HdcAdVideoCreative> {
  const map: Record<string, HdcAdVideoCreative> = {};
  adUnits.forEach((adUnit) => {
    const { ad, trackers } = adUnit;
    const containerId = getContainerId(adUnit);
    if (map[containerId] || !ad.assets.video) return;

    let streamurl = '';
    let duration = 0;
    const videoAssets = ad.assets.video;
    if (Array.isArray(videoAssets) && videoAssets[0]) {
      const video = videoAssets[0];
      duration = video.duration || 0;
      streamurl = video.url || video.value || '';
    }

    // for now, we don't enable tracking events for video creative
    // but we still need to keep the structure for future use
    const trackingevents = Object.keys(trackers)
      .filter((k) => k.startsWith('q'))
      ?.reduce((acc, k) => {
        acc[k.replace('q', 'tracking_')] = trackers[k] ?? [];
        return acc;
      }, {} as Record<string, string[]>);
    const id = String(ad.id);

    map[containerId] = {
      type: 'video',
      id,
      ad_id: id,
      impTracking: [],
      error: '',
      media: {
        duration,
        streamurl,
        trackingevents,
      },
    };
  });
  return map;
}

export function convertNativeCreativeMap(adUnits: HdcAdUnit[]): Record<string, HdcAdNativeCreative> {
  const map: Record<string, HdcAdNativeCreative> = {};
  adUnits.forEach((adUnit) => {
    const { ad, trackers } = adUnit;
    const containerId = getContainerId(adUnit);
    if (map[containerId]) return;

    const impTracking = trackers.imp ?? [];
    map[containerId] = {
      type: 'native',
      id: String(ad.id),
      ad_id: String(ad.id),
      ...(ad.assets.color?.text && { color: ad.assets.color.text }),
      ...(ad.assets.title?.text && { title: ad.assets.title.text }),
      ...(ad.assets.brand_name?.text && { brand_name: ad.assets.brand_name.text }),
      ...(ad.assets.body?.text && { body: ad.assets.body.text }),
      ...(ad.assets.call_to_action?.text && { cta: ad.assets.call_to_action.text }),
      ...(ad.assets.logo_url?.url && { logo: ad.assets.logo_url.url }),
      ...(ad.assets.poster_image?.url && { tile_img: ad.assets.poster_image.url }),
      ...(ad.assets.main_image?.url && { main_image: ad.assets.main_image.url }),
      ...(ad.assets.footer_img?.url && { footer_img: ad.assets.footer_img.url }),
      impTracking,
    };
  });

  return map;
}

export function trackHdcAdError(message: Record<string, string>) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.HDC_AD,
    message_map: message,
  });
}

export function getOsVersion(state: StoreState): string {
  return state.ottSystem?.deviceFirmware || state.ui?.userAgent?.os?.version || state.ottSystem?.deviceModel || 'unknown'; // Default fallback
}
