import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import type { ExplicitInteraction } from '@tubitv/analytics/lib/explicitFeedback';

import * as eventTypes from 'common/constants/event-types';
import type { AnalyticsComponentValueType, PageTypeExtraCtx } from 'common/utils/analytics';
import {
  buildComponentInteractionEvent,
  buildContentExplicitFeedbackEventObject,
} from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

enum ButtonValue {
  LIKE_OR_DISLIKE = 'LIKE_OR_DISLIKE',
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
}

function trackUserConfirmLikeOrDislikeButton(buttonValue: ButtonValue) {
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'CONFIRM',
    component: 'BUTTON',
    buttonType: ButtonType.TEXT,
    buttonValue,
  });
  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
}

export function trackGuestUserConfirmLikeButton() {
  trackUserConfirmLikeOrDislikeButton(ButtonValue.LIKE);
}

export function trackGuestUserConfirmDislikeButton() {
  trackUserConfirmLikeOrDislikeButton(ButtonValue.DISLIKE);
}

/**
 * Track an explicit feedback event for OTT reactions. Note that ML uses this
 * event to personalize the homescreen.
 * @param contentId - series or episode ID
 * @param userInteraction - explicit interaction enum for analytics
 * @param pathname - pathname to use for the source page object
 */
function trackReactionsExplicitFeedback(
  contentId: string,
  userInteraction: ExplicitInteraction,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
  extraCtx?: PageTypeExtraCtx,
) {
  let event = null;
  event = buildContentExplicitFeedbackEventObject(contentId, userInteraction, componentType, pathname, extraCtx);
  trackEvent(eventTypes.EXPLICIT_FEEDBACK_EVENT, event);
}

/**
 * Track "skip" interaction
 * @param contentId - e.g. '0300004985' or '543161'
 * @param componentType - analytics component type if applicable
 * @param pathname - pathname to use for the source page object
 */
export function trackSkipExplicitInteraction(
  contentId: string,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
) {
  trackReactionsExplicitFeedback(contentId, 'SKIP', componentType, pathname);
}

/**
 * Track "like" interaction
 * @param contentId - e.g. '0300004985' or '543161'
 * @param componentType - analytics component type if applicable
 * @param pathname - pathname to use for the source page object
 */
export function trackLikeExplicitInteraction(
  contentId: string,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
  extraCtx?: PageTypeExtraCtx,
) {
  trackReactionsExplicitFeedback(contentId, 'LIKE', componentType, pathname, extraCtx);
}

/**
 * Track "dislike" interaction
 * @param contentId - e.g. '0300004985' or '543161'
 * @param componentType - analytics component type if applicable
 * @param pathname - pathname to use for the source page object
 */
export function trackDislikeExplicitInteraction(
  contentId: string,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
) {
  trackReactionsExplicitFeedback(contentId, 'DISLIKE', componentType, pathname);
}

/**
 * Track "undo like" interaction
 * @param contentId - e.g. '0300004985' or '543161'
 * @param componentType - analytics component type if applicable
 * @param pathname - pathname to use for the source page object
*/
export function trackUndoLikeExplicitInteraction(
  contentId: string,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
) {
  trackReactionsExplicitFeedback(contentId, 'UNDO_LIKE', componentType, pathname);
}

/**
 * Track "undo dislike" interaction
 * @param contentId - e.g. '0300004985' or '543161'
 * @param componentType - analytics component type if applicable
 * @param pathname - pathname to use for the source page object
 */
export function trackUndoDislikeExplicitInteraction(
  contentId: string,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
) {
  trackReactionsExplicitFeedback(contentId, 'UNDO_DISLIKE', componentType, pathname);
}
