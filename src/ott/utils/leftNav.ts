import { COMPONENT_INTERACTION_EVENT } from 'common/constants/event-types';
import { OTT_ROUTES } from 'common/constants/routes';
import type { LeftNavMenuOption } from 'common/types/ottUI';
import {
  buildComponentInteractionEvent,
  mapLeftNavOptionToAnalyticsSection,
} from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

/**
 * Analytics
 */
export function trackOpenLeftNav(selectedOption: LeftNavMenuOption | null, extraCtx?: Record<string, unknown>): void {
  if (__SERVER__) return;
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'TOGGLE_ON',
    section: mapLeftNavOptionToAnalyticsSection(selectedOption),
    component: 'LEFT_NAV',
    extraCtx,
  });
  if (event) {
    trackEvent(COMPONENT_INTERACTION_EVENT, event);
  }
}

export function trackCloseLeftNav(selectedOption: LeftNavMenuOption | null, extraCtx?: Record<string, unknown>): void {
  if (__SERVER__) return;
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'TOGGLE_OFF',
    section: mapLeftNavOptionToAnalyticsSection(selectedOption),
    component: 'LEFT_NAV',
    extraCtx,
  });
  if (event) {
    trackEvent(COMPONENT_INTERACTION_EVENT, event);
  }
}

export function trackSelectLeftNav(selectedOption: LeftNavMenuOption | null, extraCtx?: Record<string, unknown>): void {
  if (__SERVER__) return;
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'CONFIRM',
    section: mapLeftNavOptionToAnalyticsSection(selectedOption),
    component: 'LEFT_NAV',
    extraCtx,
  });
  if (event) {
    trackEvent(COMPONENT_INTERACTION_EVENT, event);
  }
}

/**
 * Returns whether the given pathname is for default home grid, or movie mode,
 * or TV mode, news mode, etc. With the top nav feature, all of these pages fall
 * under the "Home" category on the left nav.
 *
 * @param pathname - typically, the current pathname
 */
export const isHomeGridPathname = (pathname: string) =>
  [
    '',
    OTT_ROUTES.home,
    OTT_ROUTES.movieMode,
    OTT_ROUTES.tvMode,
    OTT_ROUTES.liveMode,
    OTT_ROUTES.myStuff,
    OTT_ROUTES.espanolMode,
  ].includes(pathname);
