import type { UserInteraction } from '@tubitv/analytics/lib/componentInteraction';
import { ANALYTICS_COMPONENTS, ANALYTICS_DESTINATION_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { MeansOfNavigationType } from '@tubitv/analytics/lib/navigateWithinPage';

import { COMPONENT_INTERACTION_EVENT, NAVIGATE_WITHIN_PAGE } from 'common/constants/event-types';
import type { PageTypeExtraCtx } from 'common/utils/analytics';
import {
  buildComponentInteractionEvent,
  buildNavigateWithinEventObject,
  mapContentDetailPageNavOptionToAnalyticsSection,
} from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

export interface TrackContentDetailNavNavigateWithinPageEventParams {
  destinationComponentSectionIndex?: number;
  meansOfNavigation: MeansOfNavigationType;
  componentSectionIndex?: number;
  navComponentSectionIndex?: number;
  overrideHorizontalLocation?: number;
  overrideVerticalLocation?: number;
  extraCtx?: PageTypeExtraCtx;
}

export interface trackContentDetailNavComponentInteractionEventParams {
  component?: 'MIDDLE_NAV';
  userInteraction?: UserInteraction;
  componentSectionIndex?: number;
  extraCtx?: PageTypeExtraCtx;
}

export const trackContentDetailNavNavigateWithinPageEvent = ({
  meansOfNavigation = 'SCROLL',
  navComponentSectionIndex,
  destinationComponentSectionIndex,
  overrideHorizontalLocation,
  overrideVerticalLocation,
  extraCtx,
}: TrackContentDetailNavNavigateWithinPageEventParams) => {
  const matrix = {
    startX: 1,
    startY: 1,
    endX: 1,
    endY: 1,
  };
  const navigateWithinEventObj = buildNavigateWithinEventObject({
    pageUrl: getCurrentPathname(),
    matrix,
    meansOfNavigation,
    containerSlug: '',
    componentType: ANALYTICS_COMPONENTS.middleNavComponent,
    destinationComponentType: ANALYTICS_DESTINATION_COMPONENTS.destinationMiddleNavComponent,
    destinationComponentSectionIndex,
    navComponentSectionIndex,
    navComponentType: ANALYTICS_COMPONENTS.middleNavComponent,
    overrideHorizontalLocation,
    overrideVerticalLocation,
    mapMiddleNavOptionToAnalyticsSectionFunc: mapContentDetailPageNavOptionToAnalyticsSection,
    extraCtx,
  });

  trackEvent(NAVIGATE_WITHIN_PAGE, navigateWithinEventObj);
};

export const trackContentDetailNavComponentInteractionEvent = ({
  component = 'MIDDLE_NAV',
  userInteraction = 'CONFIRM',
  componentSectionIndex,
  extraCtx,
}: trackContentDetailNavComponentInteractionEventParams) => {
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction,
    component,
    section: mapContentDetailPageNavOptionToAnalyticsSection(componentSectionIndex),
    extraCtx,
  });
  trackEvent(COMPONENT_INTERACTION_EVENT, event);
};
