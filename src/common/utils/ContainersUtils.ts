import { PERSONAL_CONTAINER_IDS } from 'common/constants/constants';
import type { CountryCode } from 'common/constants/geoFeatures';
import type { ContainerIdMap } from 'common/types/container';
import { ContainerChildType, ContainerType } from 'common/types/container';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';

export type RouteParams = { type: ContainerType };

export type ProcessNetworkContainerProps = {
  containerIdMap: ContainerIdMap;
  containerIds: string[];
  containerType: ContainerType;
  twoDigitCountryCode?: CountryCode;
  insertAfterContainers?: string[];
};

export const processNetworkContainer = ({ containerIdMap, containerIds, containerType, twoDigitCountryCode, insertAfterContainers = PERSONAL_CONTAINER_IDS }: ProcessNetworkContainerProps) => {
  // This is a temporary hack for the FireTV top nav redesign experiment.
  // We're sure we want to move networks out of the left nav, but aren't sure where it should end up.
  // For now, we're moving it to the categories page. If this is what we decide to do, I'll remove this hack and move this to API.
  // TODO: Move this to API
  if (
    isFeatureAvailableInCountry('channels', twoDigitCountryCode) &&
    !containerIds.includes('networks') &&
    containerIds.length > 0 &&
    containerType === ContainerType.regular
  ) {
    containerIdMap.networks = {
      id: 'networks',
      title: 'Networks',
      tags: [],
      description: 'Watch your favorite networks',
      type: ContainerType.regular,
      slug: 'networks',
      backgrounds: [],
      sponsorship: null,
      childType: ContainerChildType.container,
    };
    // Insert networks after my stuff, recommended, continue watching, or at second position as last resort
    const insertAfter = Math.max(
      ...insertAfterContainers.map(specialId => containerIds.findIndex(id => id === specialId)),
      0
    );
    containerIds.splice(insertAfter + 1, 0, 'networks');
  }
};

const tubiOriginalContainerIds = ['tubi_originals', 'originales_de_tubi'];
/**
 * Checks if a container ID is a Tubi Original container ID.
 * @param id - The container ID to check
 */
export function isTubiOriginalContainerId(id: string): boolean {
  return tubiOriginalContainerIds.includes(id);
}

/** Checks if a container is a Tubi Original container. */
export function isTubiOriginalContainer(container?: { id: string }): boolean {
  return Boolean(container && isTubiOriginalContainerId(container.id));
}
