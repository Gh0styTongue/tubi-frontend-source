import flatMap from 'lodash/flatMap';
import type { ValueOf } from 'ts-essentials';

import type { FormattedHomescreenResult } from 'common/actions/container';
import {
  CONTAINER_GROUPINGS,
  CONTAINER_TYPES,
  HOME_DATA_SCOPE,
  REGULAR_CONTAINER_TYPES,
  APPROX_MAX_HEIGHT_FOR_ONE_ROW,
  FIRST_TIME_LOAD_ROW_NUM,
  TOP_10_CONTAINER_IDS,
} from 'common/constants/constants';
import { SKINS_AD_CONTAINER_ID } from 'common/features/skinsAd/constants';
import type { Container } from 'common/types/container';
import type { Video } from 'common/types/video';
import { preloadImages } from 'common/utils/preloadImages';

/**
 * sort alphabetically by title
 */
export const sortByTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);

/**
 * return an object holding the four groupings for the containerMenu
 * @param containers
 */
export function groupContainers(containers: Container[]): Record<string, Container[]> {
  const targetTags: string[] = Object.values(CONTAINER_GROUPINGS);
  const groupings: Record<string, Container[]> = {};
  targetTags.forEach(tag => groupings[tag] = []);

  // loop through the tags on a container
  // if the tag is one of the target tags, then push that container into the corresponding array
  containers.forEach((container) => {
    (container.tags || []).some((tag) => {
      if (targetTags.indexOf(tag) >= 0) {
        groupings[tag].push(container);
        return true;
      }
      return false;
    });
  });

  Object.keys(groupings).forEach(tag => groupings[tag].sort(sortByTitle));
  return groupings;
}

export type ContainerType = ValueOf<typeof CONTAINER_TYPES>;

export const isRegularContainer = (containerType: ContainerType) => REGULAR_CONTAINER_TYPES.indexOf(containerType) !== -1;

/** Filter the videos out of scope and get video detail data we need */
export function getVideosInScope(containerData: FormattedHomescreenResult, scope?: string): Video[] {
  const { list: containerIds, hash: containerDetailHash, contents: contentDetailHash } = containerData;
  const manuallyAdded = containerIds.includes(SKINS_AD_CONTAINER_ID) ? 1 : 0;
  const firstScreenContainerIds = containerIds.slice(0, FIRST_TIME_LOAD_ROW_NUM + manuallyAdded);
  const firstScreenVideoIds = firstScreenContainerIds
    .reduce<string[]>(
      (accumulator, contId) => accumulator.concat(containerDetailHash[contId].children ?? []),
      []
    )
    .map((videoId: string) => {
      // NOTE: for series, the child's id doesn't start with 0, need to be careful about that
      return videoId.startsWith('0') ? videoId.slice(1) : videoId;
    });

  // Include ids of videos referenced by other "videos", which are actually
  // linear channels with a schedule of other videos that play on the channel.
  firstScreenVideoIds.push(
    ...firstScreenVideoIds.flatMap(
      id => (contentDetailHash[id]?.schedules ?? []).map(schedule => schedule.program_id)
    ),
  );

  // remove video data which is not in the scope
  const allChildren = Object.keys(contentDetailHash).map(contentId => contentDetailHash[contentId]);

  if (scope === HOME_DATA_SCOPE.firstScreen) {
    return allChildren.filter(({ id }) => firstScreenVideoIds.includes(id));
  }
  if (scope === HOME_DATA_SCOPE.loadRest) {
    return allChildren.filter(({ id }) => !firstScreenVideoIds.includes(id));
  }

  return allChildren;
}

export function isLinearContainer(container?: Container) {
  return container?.type === CONTAINER_TYPES.LINEAR;
}

export function isChannelContainer(container?: Container) {
  return container?.type === CONTAINER_TYPES.CHANNEL;
}

export function isSponsoredContainer(container?: Container): boolean {
  return !!container?.sponsorship;
}

function getSponsorshipImagesForContainer({ sponsorship }: Container): string[] {
  if (!sponsorship) return [];
  const { image_urls: { brand_background, brand_color, tile_background, brand_logo, brand_graphic } } = sponsorship;
  const sharedImageUrls = [tile_background, brand_logo, brand_graphic];
  return __IS_SLOW_PLATFORM__
    ? sharedImageUrls.concat(brand_color) // 1px wide gradient image
    : sharedImageUrls.concat(brand_background);
}

export function preloadSponsorshipImages(containers: Container[]) {
  const imageUrls = flatMap(containers, getSponsorshipImagesForContainer);
  if (imageUrls.length) {
    preloadImages(imageUrls);
  }
}

export const getLinearContentIds = (containers: any) => {
  const linearContentIds: string[] = [];
  Object.keys(containers).forEach(id => {
    const container = containers[id];
    if (isLinearContainer(container)) {
      const { children = [] } = container;
      linearContentIds.push(...children);
    }
  });
  return linearContentIds;
};

export function getViewportHeight() {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}

/**
 * get rootMargin of IntersectionObserver in lazyLoad component according to isMobile
 * @param {boolean} isMobile
 * @return {number} Preload 1/2 screen or one row for mobile, one screen (or two rows) for desktop.
 */
export function getLazyLoadRootMargin(isMobile: boolean) {
  const viewportHeight = __CLIENT__ ? getViewportHeight() : 0;
  return isMobile
    ? (viewportHeight / 2) || APPROX_MAX_HEIGHT_FOR_ONE_ROW // Preload 1/2 screen or one row for mobile.
    : viewportHeight || (APPROX_MAX_HEIGHT_FOR_ONE_ROW * 2); // Preload one screen (or two rows) for desktop.
}

export interface DisplayCountOption {
  containerType: ContainerType;
  childType: string;
  containerId: string;
  enableLargerPoster?: boolean;
}
export const getContainerDisplayCount = ({ containerType, containerId, childType, enableLargerPoster }: DisplayCountOption) => {
  const isLinearContainer = containerType === CONTAINER_TYPES.LINEAR;
  const isLandscapeContainer = childType === 'featured' || childType === 'episode' || childType === 'container';
  const isTop10Container = TOP_10_CONTAINER_IDS.includes(containerId);
  if (isLinearContainer) {
    return 5;
  }
  if (isLandscapeContainer || isTop10Container) {
    return enableLargerPoster ? 4 : 5;
  }
  return enableLargerPoster ? 7 : 9;
};

export const getContentById = (byId: Record<string, Video>, id: string): Video | undefined =>
  // GOTCHA: When the content associated with the id is a series (not
  // an episode of a series), the key will have a leading zero in byId. We
  // don't know at this point, though, whether the content is a series or not,
  // so we need to check both.
  byId[id] ?? byId[`0${id}`];
