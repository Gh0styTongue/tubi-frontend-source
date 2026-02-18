import { RECOMMENDED_LINEAR_CONTAINER_ID } from 'common/constants/constants';
import type { buildNavigateToPageEventObject } from 'common/utils/analytics';

let lastNavigateFrom: AdOrigin;
let lastContainerSlug: string | undefined;

export enum AdOrigin {
  deeplink = 'deeplink',
  ap_auto = 'ap_auto',
  ap_select = 'ap_select',
  container = 'container',
  ymal = 'ymal',
  search = 'search',
  epg = 'epg',
  unknown = 'unknown',
}

export const setLastNavigateFromAndContainerSlug = (navigateToPageObj: ReturnType<typeof buildNavigateToPageEventObject>) => {
  if (navigateToPageObj.search_result_component) { // From search page
    lastNavigateFrom = AdOrigin.search;
    lastContainerSlug = undefined;
  } else if (navigateToPageObj.related_component) { // From you may also like
    lastNavigateFrom = AdOrigin.ymal;
    lastContainerSlug = undefined;
  } else if (navigateToPageObj.category_component) { // From content container
    lastNavigateFrom = AdOrigin.container;
    lastContainerSlug = navigateToPageObj.category_component.category_slug;
  } else if (navigateToPageObj.category_page) { // From category page (OTT)
    lastNavigateFrom = AdOrigin.container;
    lastContainerSlug = navigateToPageObj.category_page.category_slug;
  } else if (navigateToPageObj.mystuff_component) { // From my stuff page (OTT)
    lastNavigateFrom = AdOrigin.container;
    lastContainerSlug = navigateToPageObj.mystuff_component.category_slug;
  } else if (navigateToPageObj.navigation_drawer_component) { // From live page
    lastNavigateFrom = AdOrigin.container;
    lastContainerSlug = navigateToPageObj.navigation_drawer_component.category_slug;
  }
};

export const getAdOrigin = ({
  isDeeplink,
  isFromAutoplay,
  isAutomaticAutoplay,
}: {
    isDeeplink?: boolean,
    isFromAutoplay?: boolean,
    isAutomaticAutoplay?: boolean,
  }): { origin: AdOrigin, containerId?: string } => {
  if (isFromAutoplay) {
    return isAutomaticAutoplay ? { origin: AdOrigin.ap_auto } : { origin: AdOrigin.ap_select };
  }

  if (isDeeplink) {
    return { origin: AdOrigin.deeplink };
  }

  // It might be called during server rendering on the Web
  if (__SERVER__) {
    return { origin: AdOrigin.unknown };
  }

  const origin = lastNavigateFrom;
  const containerId = lastContainerSlug;

  // The container id is /live on web. It should be treated as from epg.
  if (containerId === '/live') {
    return { origin: AdOrigin.epg };
  }
  // The live content would start loading without any page navigation due to preloading
  // So we need to deduce the container id from the current location
  if (origin === AdOrigin.container && !containerId && typeof window !== 'undefined') {
    // Channel switch in epg page would not trigger any page navigation
    // We will treat them all as egp container with Gaia team's agreement
    if (window.location.pathname.match(/\/ott\/live/)) {
      return { origin: AdOrigin.epg };
    }

    // There is only one way for linear content playback on the home page
    // which is recommend linear container
    if (window.location.pathname === '/') {
      return { origin, containerId: RECOMMENDED_LINEAR_CONTAINER_ID };
    }
  }

  return { origin, containerId };
};
