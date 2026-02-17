import type { FormattedHomescreenResult } from 'common/actions/container';
import type { Ads } from 'common/features/skinsAd/type';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { Container, Sponsorship, ContainerType } from 'common/types/container';
import { ContainerChildType } from 'common/types/container';
import type { Video } from 'common/types/video';

import { getMockSponsorship, insertSkinsAdToHomeScreen, mockPurpleCarpetDataForHomescreen } from './tensorMockData';

export type RawContainer = {
  title: string;
  type: ContainerType;
  tags?: string[];
  description: string;
  id: string;
  thumbnail: string;
  children?: string[];
  cursor: number | null;
  slug: string;
  author?: unknown;
  background: string;
  logo?: string;
  external_url?: string;
  sponsorship?: Sponsorship | null;
  valid_duration: number | null;
};

export function addMockSponsorshipDataIfApplicable(container: Container, index: number | null) {
  const brandSpotlightMockKey = 'BrandSpotlightMockData';

  const isMockDisabled =
    FeatureSwitchManager.isDefault(brandSpotlightMockKey) || FeatureSwitchManager.isDisabled(brandSpotlightMockKey);
  if (!isMockDisabled) {
    const brandSpotlightMockContainerId = FeatureSwitchManager.get(brandSpotlightMockKey);
    const isIndex = typeof brandSpotlightMockContainerId === 'number';
    const containerHasNoExistingSponsorshipData = !container.sponsorship;
    const matchesContainerId = !isIndex && container.id === brandSpotlightMockContainerId;
    const matchesIndex = isIndex && index === brandSpotlightMockContainerId;
    if (containerHasNoExistingSponsorshipData && (matchesContainerId || matchesIndex)) {
      container.sponsorship = getMockSponsorship();
    }
  }
}

export const parseContainer = (
  item: RawContainer,
  index: number | null = null
): { container: Container; subContainersHash: Record<string, Container> } => {
  const {
    title,
    type,
    tags,
    description,
    id,
    thumbnail,
    children = [],
    cursor,
    slug,
    author,
    background,
    logo,
    external_url: externalUrl,
    sponsorship,
    valid_duration,
  } = item;
  const containersHash: Record<string, Container> = {};

  // to keep container structure similar to content pattern, keep array of `backgrounds` even though it is usually just a single image
  const backgrounds = ([] as string[]).concat(background);
  const container: Container = {
    id,
    title,
    tags,
    children,
    description,
    type,
    thumbnail,
    cursor,
    slug,
    author,
    backgrounds,
    logo,
    externalUrl,
    sponsorship,
    childType: ContainerChildType.content,
    valid_duration,
  };

  addMockSponsorshipDataIfApplicable(container, index);

  return {
    container,
    subContainersHash: containersHash,
  };
};

/**
 * Formulate tensor homescreen response to client format
 */
export function formatContainerData(body: {
  groupCursor?: number;
  group_cursor?: number;
  valid_duration: number;
  contents: Record<string, Video>;
  containers: RawContainer[];
  browser_list: RawContainer[];
  personalization_id: string;
  ads?: Ads[];
  is_failsafe?: boolean;
}): FormattedHomescreenResult {
  mockPurpleCarpetDataForHomescreen(body);
  insertSkinsAdToHomeScreen(body);

  const contents = body.contents;
  const containerHash: Record<string, Container> = {};
  const containerList: string[] = [];
  const containerMenuHash: Record<string, Container> = {};
  const containerMenuList: string[] = [];

  if (body.browser_list) {
    body.browser_list.forEach((item, index) => {
      const containerId = item.id;
      const { container } = parseContainer(item, index);
      containerMenuList.push(containerId);
      containerMenuHash[containerId] = container;
    });
  }
  body.containers.forEach((item, index) => {
    const containerId = item.id;
    const { container } = parseContainer(item, index);
    containerList.push(containerId);
    containerHash[containerId] = container;
  });
  return {
    list: containerList,
    hash: containerHash,
    contents,
    // group_cursor is returned in the tensor response
    next: body.groupCursor || body.group_cursor || null,
    validDuration: body.valid_duration,
    containerMenuList,
    containerMenuHash,
    personalizationId: body.personalization_id,
    ads: body.ads,
    isFailsafe: body.is_failsafe,
  };
}
