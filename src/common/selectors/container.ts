import { isEmptyObject } from '@adrise/utils/lib/size';
import { createStructuredSelector, createSelector } from 'reselect';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  MY_LIKES_CONTAINER_ID,
  ONBOARDING_PREFERENCES_CONTAINER_ID,
  FREEZED_EMPTY_ARRAY,
  FEATURED_CONTAINER_ID,
  HISTORY_CONTAINER_ID,
  CONTAINER_TYPES,
  SCREENSAVER_CONTAINER_ID,
  CONTENT_MODES,
  RECOMMENDED_LINEAR_CONTAINER_ID,
  QUEUE_CONTAINER_ID,
  PURPLE_CARPET_CONTAINER_ID,
  BANNER_CONTAINER_ID,
  WATCH_IN_FULL_HD_CONTAINER_ID,
} from 'common/constants/constants';
import type { WebPrimaryRoutes } from 'common/constants/routes';
import { WEB_ROUTES, WEB_PRIMARY_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isUserNotCoppaCompliantSelector } from 'common/features/coppa/selectors/coppa';
import { shouldShowPurpleCarpetOnHomeScreenSelector, shouldShowPurpleCarpetSelector } from 'common/features/purpleCarpet/selectors/shouldShowPurpleCarpetSelector';
import { contentModeForMenuListSelector, currentContentModeSelector, isHomeOrContentModePageSelector, isMyStuffPageActiveSelector } from 'common/selectors/contentMode';
import { shouldShowFullHDBadgeSelector } from 'common/selectors/experiments/ottFireTVGate1080pResolutionSelectors';
import { webFeaturedRowExperimentSelector } from 'common/selectors/experiments/webFeaturedRow';
import { isEspanolModeEnabledSelector, isKidsModeSelector } from 'common/selectors/ui';
import type { ContainerState, Container } from 'common/types/container';
import type { ContentModeContainerState } from 'common/types/contentMode';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getFirstValidContainer } from 'common/utils/reducerTool';
import { getContainerUrl, getUrlByVideo } from 'common/utils/urlConstruction';
import { getURIPiece } from 'common/utils/urlManipulation';
import type { Breadcrumb } from 'web/components/Breadcrumbs/types';
import { topNavMessages } from 'web/components/TopNav/topNavMessages';
import { routeToNavMessages } from 'web/constants/nav';

export interface ContainerSelectorProps {
  forceCurrentMode?: CONTENT_MODE_VALUE;
}

export const containerSelector = createSelector(
  ({ container }: StoreState) => container,
  ({ contentMode }: StoreState) => contentMode,
  currentContentModeSelector,
  (_: StoreState, props: ContainerSelectorProps | undefined = undefined) => props?.forceCurrentMode,
  (container, contentMode, currentContentMode, forceCurrentMode): ContainerState | ContentModeContainerState => {
    const currentMode = forceCurrentMode || currentContentMode;
    return currentMode === CONTENT_MODES.all ? container : contentMode[currentMode];
  },
);
export const containersListSelector = createSelector(
  containerSelector,
  container => container.containersList,
);
export const containerIdMapSelector = createSelector(
  containerSelector,
  container => container.containerIdMap,
);
export const personalizationIdSelector = createSelector(
  containerSelector,
  container => container.personalizationId,
);
export const containerLoadIdMapSelector = createSelector(
  containerSelector,
  container => container.containerLoadIdMap,
);

const byIdSelector = ({ video }: StoreState) => video.byId;

export const sponExpSelector = (state: StoreState) => state.container.sponsorship?.sponExp;

export const containerChildrenIdMapSelector = createSelector(
  containerSelector,
  container => container.containerChildrenIdMap,
);

export const onboardingContainerTitleIDsSelector = createSelector(
  containerChildrenIdMapSelector,
  (childIds) => childIds[ONBOARDING_PREFERENCES_CONTAINER_ID] || FREEZED_EMPTY_ARRAY,
);

export const containerContextSelector = createSelector(
  containerSelector,
  (container) => container.containerContext,
);

export const loadingContainerSelector = createSelector(
  containersListSelector,
  containerLoadIdMapSelector,
  (list, loadMap) => list.filter(id => loadMap[id]?.loading)
);

/**
 * Select the containerMenuList for the current content mode.
 *
 * @remarks
 * Note that the OTT app always uses "all" content mode for its container menu!
 * So this should only be used on web.
 */
export const containerMenuListSelector = createSelector(
  containerSelector,
  container => container.containerMenuList,
);

/**
 * get array of non-empty containers
 * @notice You must be very careful on writing selector like this
 *  - `loadMoreItems` will change container.containerChildrenIdMap, but we only care about whether an container is empty in this selector
 *  - `filter` will return a new array even there is no-empty container
 */
export const nonEmptyContainerListSelector = createSelector(
  containersListSelector,
  containerChildrenIdMapSelector,
  (list, childrenMap) => {
    const nonEmptyList = list.filter(id => childrenMap[id] && childrenMap[id].length > 0);

    if (list.length === nonEmptyList.length) return list;
    return nonEmptyList;
  }
);

/**
 * select container list to shown in Home page
 * only loaded non-empty and loading containers will be selected
 * NOTE featured container is no included in this list
 */
export const homeContainerSelector = createSelector(
  containersListSelector,
  nonEmptyContainerListSelector,
  loadingContainerSelector,
  containerIdMapSelector,
  containerChildrenIdMapSelector,
  webFeaturedRowExperimentSelector,
  shouldShowPurpleCarpetOnHomeScreenSelector,
  (list, loaded, loading, hash, childrenMap, includeFeatured, isPurpleCarpetRowShown) => {
    const showContainers = [...loaded, ...loading];
    return list
      .filter(id =>
        showContainers.indexOf(id) !== -1
        && (id !== FEATURED_CONTAINER_ID || includeFeatured || isPurpleCarpetRowShown)
        && (id !== PURPLE_CARPET_CONTAINER_ID && id !== BANNER_CONTAINER_ID)
        && hash[id])
      .map(id => ({
        id,
        title: hash[id].title,
        slug: hash[id].slug,
        childType: hash[id].childType,
        contents: childrenMap[id],
        type: hash[id].type,
        logo: hash[id].logo,
      }));
  }
);

export const webMyStuffContainerSelector = createSelector(
  containerSelector,
  ({ containerIdMap: hash, containerChildrenIdMap: childrenMap }) => {
    return [HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID]
      .filter((id) => hash[id])
      .map((id) => ({
        id,
        title: hash[id].title,
        slug: hash[id].slug,
        childType: hash[id].childType,
        contents: childrenMap[id] || [],
        type: hash[id].type,
        logo: hash[id].logo,
      }));
  }
);

/**
 * Select containers for the container menu. Currently only used on web, as of
 * 15 Nov 2022.
 */
export const containerMenuSelector = createSelector(
  (state: StoreState, { pathname }: { pathname: string }) =>
    containerSelector(state, {
      forceCurrentMode: contentModeForMenuListSelector(state, { pathname }),
      pathname,
    }),
  ({ containerMenuList, containerIdMap, containerChildrenIdMap }): Container[] => {
    // If an new user login, the continueWatching and myList are empty, the containerMenuList would not include these two containers
    // even after user add container to myList. So we can manually add these containers to menu as we did in ott selectContainerIds
    // src/common/selectors/leftNav.ts, instead of reloading containerMenuList from API
    const personalContainerIds = [HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID];
    const containerMenuListWithPersonalContainers = Array.from(new Set(containerMenuList.concat(personalContainerIds)));
    return containerMenuListWithPersonalContainers
      .filter(
        (id) => id in containerIdMap && (!personalContainerIds.includes(id) || containerChildrenIdMap[id]?.length > 0)
      )
      .map((id) => containerIdMap[id]);
  }
);

export const showLikedTitlesSelector = createSelector(
  isLoggedInSelector,
  isKidsModeSelector,
  (isLoggedIn, isKidsMode) => isLoggedIn && !isKidsMode
);

export const userModifiableContainerIdsSelector = createSelector(
  showLikedTitlesSelector,
  (showMyLikedTitles) => {
    const ids = [HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID];
    if (showMyLikedTitles) {
      ids.push(MY_LIKES_CONTAINER_ID);
    }
    return ids;
  }
);

const _ottSideMenuDepsSelector = createStructuredSelector({
  containersList: containersListSelector,
  containerIdMap: containerIdMapSelector,
  nonEmptyContainerList: nonEmptyContainerListSelector,
  isLoggedIn: isLoggedInSelector,
  isUserNotCoppaCompliant: isUserNotCoppaCompliantSelector,
  isMyStuffPageActive: isMyStuffPageActiveSelector,
  showMyLikedTitles: showLikedTitlesSelector,
  userModifiableContainerIds: userModifiableContainerIdsSelector,
  shouldShowPurpleCarpet: shouldShowPurpleCarpetSelector,
});

/*
 * Returns the base list of containers that will appear on the home screen.
 * Mind you if you want to use it, maybe you need the new ottSideMenuSelector below
*/
export const ottSideMenuSelector = createSelector(
  _ottSideMenuDepsSelector,
  shouldShowFullHDBadgeSelector,
  ({
    containersList,
    containerIdMap,
    nonEmptyContainerList,
    isLoggedIn,
    isUserNotCoppaCompliant,
    isMyStuffPageActive,
    showMyLikedTitles,
    userModifiableContainerIds,
    shouldShowPurpleCarpet,
  }, shouldShowFullHDBadge) => {
    const listReturn = containersList
      .map((contId: string) => containerIdMap[contId])
      .filter(Boolean)
      .filter(({ id: contId }: Container) => {

        if (contId === HISTORY_CONTAINER_ID) {
          if (isUserNotCoppaCompliant) {
            return false;
          }
          if (!isLoggedIn) {
            return true;
          }
        }

        // Do not show onboarding personalization container
        if (contId === ONBOARDING_PREFERENCES_CONTAINER_ID) {
          return false;
        }

        if (contId === WATCH_IN_FULL_HD_CONTAINER_ID && !shouldShowFullHDBadge) {
          return false;
        }

        if ([PURPLE_CARPET_CONTAINER_ID, BANNER_CONTAINER_ID].includes(contId) && !shouldShowPurpleCarpet) {
          return false;
        }

        const isUserRelated = userModifiableContainerIds.includes(contId);

        const isContainerEmpty = !nonEmptyContainerList.includes(contId);

        if (isMyStuffPageActive) {
          if (contId === MY_LIKES_CONTAINER_ID && (
            !showMyLikedTitles || isContainerEmpty)
          ) {
            return false;
          }

          return isUserRelated;
        }

        // remove empty queue or history
        return !isUserRelated || nonEmptyContainerList.indexOf(contId) >= 0;
      });
    return listReturn;
  }
);

/**
 * returns list of screensaver contents
 */
export const screensaverContentsSelector = createSelector(
  ({ container: { containerChildrenIdMap } }: StoreState) => containerChildrenIdMap,
  byIdSelector,
  (childrenMap, byId) => (childrenMap[SCREENSAVER_CONTAINER_ID] || [])
    .map((id: string) => byId[id])
    .filter(Boolean)
    .slice(0, 9)
);

export const screensaverBgSelector = createSelector(
  screensaverContentsSelector,
  screensaverContents => screensaverContents
    .map((content: Video) => {
      if (content.backgrounds.length) {
        return content.backgrounds[0];
      }
      // default tile image
      return require('../theme/images/TubiTitlesBackground.jpg');
    })
);

export const screensaverMetadataSelector = createSelector(
  screensaverContentsSelector,
  screensaverContents => screensaverContents
    .map((content: Video) => {
      const { title, tags: genres } = content;
      return {
        title,
        genres,
        url: getUrlByVideo({ video: content }),
      };
    })
);

export const activeContainerIdSelector = createSelector(
  containersListSelector,
  containerChildrenIdMapSelector,
  (containerList, childrenMap) => getFirstValidContainer(containerList, childrenMap)
);

/**
 * Filter non-content out of containers.
 * Channel container holds an extra item at index 0 referencing the channel-id. This selector removes this item
 */
export const containerContentsSelector = createSelector(
  containerIdMapSelector,
  containerChildrenIdMapSelector,
  (_: StoreState, { id }: {id: string}) => id,
  (containerIdMap, containerChildrenIdMap, id) => {
    const containerMeta = containerIdMap[id];
    if (!containerMeta) return FREEZED_EMPTY_ARRAY;

    const { type } = containerMeta;
    const itemIds = containerChildrenIdMap[id];

    // the first element in channel container is the channel id. filter this out
    return type === CONTAINER_TYPES.CHANNEL ? itemIds.slice(1) : itemIds;
  }
);

/**
 * This selector is used with ottUI.debouncedGridUI.
 * On OTT, we have multiple content modes, but right now we only have one
 * debouncedGridUI state to rule them all (store activeContainerId and activeContainerGridContentId).
 * So debouncedGridUI updates need to be based upon the corresponding content mode.
 * This selector returns the last content mode user visited.
 */
export const mostRecentContainerSelector = createSelector(
  isHomeOrContentModePageSelector,
  currentContentModeSelector,
  (state: StoreState) => state.container,
  (state: StoreState) => state.contentMode,
  (state: StoreState) => state.ottUI,
  (isHomeOrContentModePage, activeContentMode, container, contentMode, ottUI) => {
    if (!ottUI?.contentMode) {
      return container;
    }
    const currentMode = isHomeOrContentModePage ? activeContentMode : ottUI.contentMode.previous;
    return currentMode !== 'all' ? contentMode[currentMode] : container;
  }
);

export const isContainersListFullyLoaded = (container: ContainerState | ContentModeContainerState) => {
  return container.nextContainerIndexToLoad === null;
};

/**
 * returns true if container is fully loaded with content
 * @param {object} container reducer
 */
export const isContainerFullyLoaded = (container: ContainerState | ContentModeContainerState) => {
  const { containerLoadIdMap, containersList } = container;
  return isContainersListFullyLoaded(container) && containersList.every(id =>
    id in containerLoadIdMap
  );
};

export const breadcrumbSelector = createSelector(
  containerIdMapSelector,
  containerContextSelector,
  ({ video: { byId }, epg: { byId: byEpgId } }: StoreState, { contentId }: { contentId: string }) => byId[contentId]?.title ?? byEpgId[contentId]?.title,
  ({ search }: StoreState) => search.key,
  (_: StoreState, { pathname }: { pathname: string }) => pathname || '',
  isKidsModeSelector,
  isEspanolModeEnabledSelector,
  (containerIdMap, containerContext, contentDetailsTitle, searchKey, pathname, isKidsModeEnabled, isEspanolModeEnabled) => {
    const containerContexts = containerContext.split(':');
    const breadcrumbs: Breadcrumb[] = [];

    if (pathname === WEB_ROUTES.home) {
      if (isKidsModeEnabled) {
        breadcrumbs.push({ crumb: topNavMessages.tubiKids });
      } else if (isEspanolModeEnabled) {
        breadcrumbs.push({ crumb: topNavMessages.espanol });
      }
      return breadcrumbs;
    }

    if ((WEB_PRIMARY_ROUTES).includes(pathname as WebPrimaryRoutes)) {
      // When it's one of the primary level page. Like /movies, /live, etc.
      const crumb = routeToNavMessages[pathname];
      crumb && breadcrumbs.push({ crumb });
      return breadcrumbs;
    }

    const getContainerCrumbs = (isContainerPage = false) => {
      containerContexts.forEach((context, index) => {
        const containerInformation = containerIdMap[context];

        if (!containerInformation?.title) return;

        if (!isContainerPage || containerContexts.length !== (index + 1)) {
          const containerLink = getContainerUrl(context, { type: containerInformation.type });
          breadcrumbs.push({ crumb: containerInformation.title, to: containerLink });
        } else {
          breadcrumbs.push({ crumb: containerInformation.title });
        }
      });
    };

    const firstPath = `/${getURIPiece(pathname, 0)}`;
    switch (firstPath) {
      case WEB_ROUTES.search:
        const searchCrumb = 'search';
        breadcrumbs.push({ crumb: searchCrumb, to: WEB_ROUTES.search });
        if (searchKey) {
          breadcrumbs.push({ crumb: searchKey });
        }
        break;
      case WEB_ROUTES.container:
        getContainerCrumbs(true);
        break;
      case WEB_ROUTES.movies:
      case WEB_ROUTES.tvShows:
      case WEB_ROUTES.series:
        getContainerCrumbs();
        contentDetailsTitle && breadcrumbs.push({ crumb: contentDetailsTitle });
        break;
      case getURIPiece(WEB_ROUTES.person, 0, true):
      case getURIPiece(WEB_ROUTES.watchSchedule, 0, true):
        breadcrumbs.length = 0;
        break;
      case WEB_ROUTES.live:
        breadcrumbs.push({ crumb: routeToNavMessages[WEB_ROUTES.live], to: WEB_ROUTES.live });
        contentDetailsTitle && breadcrumbs.push({ crumb: contentDetailsTitle });
        break;
      default:
        const secondPath = getURIPiece(pathname, 1);
        if (secondPath) {
          breadcrumbs.push({ crumb: secondPath.replace(/-/g, ' ') });
        }
        break;
    }
    return breadcrumbs;
  }
);

export const recommendedLinearContainerIdSelector = (state: StoreState) => state.container.containerChildrenIdMap[RECOMMENDED_LINEAR_CONTAINER_ID] || FREEZED_EMPTY_ARRAY;

export const historyAndMylistContainersSelector = createSelector(
  (state: StoreState, { pathname }: { pathname: string }) => containerSelector(state, { forceCurrentMode: contentModeForMenuListSelector(state, { pathname }), pathname }),
  byIdSelector,
  (containerMap, byId) => {
    return [HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID]
      .map((contId) => {
        const { containerIdMap, containerChildrenIdMap } = containerMap;
        let container = containerIdMap[contId];
        const containerChildren = containerChildrenIdMap[contId];
        if (!containerChildren?.length) return;
        // use the first child's poster as the container's thumbnail
        if (container) {
          const containerFistChildId: string = containerChildren[0];
          if (byId[containerFistChildId]) {
            container = { ...container, thumbnail: byId[containerFistChildId].posterarts[0] };
          }
        }
        return { ...container };
      })
      .filter((cont) => Boolean(cont) && !isEmptyObject(cont!) && cont!.thumbnail) as Container[];
  }
);

export const popularItemsSplitterSelector = createSelector(
  (_: StoreState, popularItems: Container[]) => popularItems,
  (popularItems) => {
    const popularItemsWithoutHistoryMyList: Container[] = [];
    const historyMyListItems: Container[] = [];
    popularItems.forEach((item) => {
      if ([HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID].includes(item.id)) {
        historyMyListItems.push(item);
      } else {
        popularItemsWithoutHistoryMyList.push(item);
      }
    });
    return {
      popularItemsWithoutHistoryMyList,
      historyMyListItems,
    };
  }
);
