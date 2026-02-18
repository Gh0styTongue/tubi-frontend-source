/**
 * Helper utilities for Creatorverse features
 * Shared between web and OTT platforms
 */

import type { SurfaceContainer } from 'common/types/surfaces';
import type { Video, VideoType } from 'common/types/video';
import { getCreatorAppImages, getImageQueryFromImages } from 'common/utils/imageResolution';
import { getUrl } from 'common/utils/urlConstruction';

const IMAGE_TUPLE_TYPE_INDEX = 3;

/**
 * Build app_images query parameters for creator surfaces
 * Supports filtering by image types for flexible, on-demand image requests
 *
 * @param types - Optional array of image types to include (e.g., ['logo'], ['hero'], ['logo', 'hero'])
 *                If not provided, returns all types (logo + all hero sizes for SSR compatibility)
 * @returns Query params object ready for API request
 *
 * @example
 * ```ts
 * // Request all images (for creator landing pages with SSR)
 * buildCreatorAppImagesQuery()
 * // Returns: { logo: 'w100h100_logo', hero_mobile: 'w422h360_hero', hero_tablet: 'w960h480_hero', hero_desktop: 'w960h540_hero' }
 *
 * // Request logo only (for content detail pages)
 * buildCreatorAppImagesQuery(['logo'])
 * // Returns: { logo: 'w100h100_logo' }
 *
 * // Request logo + all hero images
 * buildCreatorAppImagesQuery(['logo', 'hero'])
 * // Returns: { logo: 'w100h100_logo', hero_mobile: '...', hero_tablet: '...', hero_desktop: '...' }
 * ```
 */
export function buildCreatorAppImagesQuery(types?: string[]): Record<string, string> {
  let images = getCreatorAppImages();

  // Filter by types if specified (e.g., ['logo'] or ['logo', 'hero'])
  if (types !== undefined) {
    if (types.length === 0) {
      return {};
    }
    images = images.filter(img => types.includes(img[IMAGE_TUPLE_TYPE_INDEX]));
  }

  return getImageQueryFromImages(images);
}

/**
 * Container with additional UI metadata
 */
export interface CreatorContainerWithUrl {
  id: string;
  title: string;
  contents: Video[];
  detailsUrl?: string;
}

/**
 * Generate details page URL from container's related_to field
 */
function getContainerDetailsUrl(
  relatedTo: { type: string; value: string }[] | null | undefined
): string | undefined {
  if (!relatedTo || relatedTo.length === 0) {
    return undefined;
  }

  const { type, value } = relatedTo[0];
  const contentType: VideoType = type === 'series' ? 's' : 'v';

  return getUrl({ type: contentType, id: value, title: '' });
}

/**
 * Transform containers from API response
 * Filters out empty containers and adds details page URLs based on related_to field
 */
export function transformContainers(
  containers: SurfaceContainer[],
  contents: Record<string, Video>
): CreatorContainerWithUrl[] {
  return containers
    .map((container): CreatorContainerWithUrl | null => {
      const videos = (container.children || [])
        .map(contentId => contents[contentId])
        .filter((video): video is Video => Boolean(video));

      if (videos.length === 0) return null;

      const detailsUrl = getContainerDetailsUrl(container.related_to);

      return {
        id: container.id,
        title: container.title,
        contents: videos,
        ...(detailsUrl && { detailsUrl }),
      };
    })
    .filter((container): container is CreatorContainerWithUrl => container !== null);
}
