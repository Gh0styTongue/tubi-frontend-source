import { ThumbUpStroke, ThumbDownStroke, ThumbUpFilled, ThumbDownFilled } from '@tubitv/icons';
import { Button, useBreakpointIfAvailable } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { Fragment, memo, useCallback, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { addReactionForSingleTitle, removeReactionForSingleTitle } from 'common/actions/userReactions';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { makeUserReactionStatusSelector } from 'common/selectors/userReactions';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import {
  trackDislikeExplicitInteraction,
  trackUndoDislikeExplicitInteraction,
  trackLikeExplicitInteraction,
  trackUndoLikeExplicitInteraction,
} from 'common/utils/userReactions';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import {
  showDislikeRegistrationPromptToast,
  showLikeRegistrationPromptToast,
} from 'web/features/userReactions/actions';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

import styles from './ContentDetailReactions.scss';

const messages = defineMessages({
  like: {
    description: 'Like (reaction for current content)',
    defaultMessage: 'Like',
  },
  dislike: {
    description: 'Dislike (reaction for current content)',
    defaultMessage: 'Dislike',
  },
  liked: {
    description: 'Indication that content is marked as "liked"',
    defaultMessage: 'Liked',
  },
  disliked: {
    description: 'Indication that content is marked as "disliked"',
    defaultMessage: 'Disliked',
  },
});

interface ContentDetailReactionsProps {
  /**
   * Content id 0-prefixed for series
   */
  contentId: string;
  /**
   * 0-prefixed content id if this is content belonging to a series
   */
  seriesContentId?: string;
  /**
   * Whether the new design is enabled
   */
  isNewDesign?: boolean;
}

const ContentDetailReactions = ({ contentId: videoContentId, seriesContentId, isNewDesign }: ContentDetailReactionsProps) => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);
  const contentId = seriesContentId ?? videoContentId;
  const intl = useIntl();
  const userReactionsStatusSelector = useMemo(makeUserReactionStatusSelector, []);
  const userReaction = useAppSelector((state) => userReactionsStatusSelector(state, contentId));
  const bp = useBreakpointIfAvailable();
  const location = useLocation();
  const currentDate = useCurrentDate();
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);

  const handleLikeButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (isMajorEventFailsafe) {
        showFeatureUnavailableToaster({
          dispatch,
          intl,
          feature: 'rating',
          currentDate,
          majorEventFailsafeMessages,
        });
        return;
      }
      if (isLoggedIn) {
        if (userReaction === 'liked') {
          trackUndoLikeExplicitInteraction(contentId);
          trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.LikeRemoveRating });
          dispatch(removeReactionForSingleTitle(location, contentId, 'like'));
        } else {
          trackLikeExplicitInteraction(contentId);
          trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.Like });
          dispatch(addReactionForSingleTitle(location, contentId, 'like'));
        }
      } else {
        dispatch(showLikeRegistrationPromptToast(location, contentId));
        trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.Like });
      }
    },
    [isMajorEventFailsafe, isLoggedIn, dispatch, intl, currentDate, majorEventFailsafeMessages, userReaction, contentId, location]
  );

  const handleDislikeButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (isMajorEventFailsafe) {
        showFeatureUnavailableToaster({
          dispatch,
          intl,
          feature: 'rating',
          currentDate,
          majorEventFailsafeMessages,
        });
        return;
      }
      if (isLoggedIn) {
        if (userReaction === 'disliked') {
          trackUndoDislikeExplicitInteraction(contentId);
          trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.DislikeRemoveRating });
          dispatch(removeReactionForSingleTitle(location, contentId, 'dislike'));
        } else {
          trackDislikeExplicitInteraction(contentId);
          trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.Dislike });
          dispatch(addReactionForSingleTitle(location, contentId, 'dislike'));
        }
      } else {
        dispatch(showDislikeRegistrationPromptToast(location, contentId));
        trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.Dislike });
      }
    },
    [isMajorEventFailsafe, isLoggedIn, dispatch, intl, currentDate, majorEventFailsafeMessages, userReaction, contentId, location]
  );

  const shouldDisplayContent = !!bp && (!isLoggedIn || !!userReaction || isMajorEventFailsafe || isNewDesign);
  let responsiveMode = bp?.lg ? 'tooltip' : 'text';
  if (isNewDesign) {
    responsiveMode = bp?.xl ? 'text' : 'tooltip';
  }
  const likeText = intl.formatMessage(userReaction === 'liked' ? messages.liked : messages.like);
  const dislikeText = intl.formatMessage(userReaction === 'disliked' ? messages.disliked : messages.dislike);

  return (
    <div className={classnames(styles.contentDetailReactions, { [styles.newDesign]: isNewDesign })}>
      {shouldDisplayContent ? (
        <Fragment>
          <Button
            className={styles.reactionsButton}
            appearance="tertiary"
            iconSize="large"
            icon={userReaction === 'liked' ? ThumbUpFilled : ThumbUpStroke}
            tooltip={responsiveMode === 'tooltip' ? likeText : undefined}
            onClick={handleLikeButtonClick}
            aria-label={likeText}
          >
            {responsiveMode === 'text' ? likeText : null}
          </Button>
          <Button
            className={styles.reactionsButton}
            appearance="tertiary"
            iconSize="large"
            icon={userReaction === 'disliked' ? ThumbDownFilled : ThumbDownStroke}
            tooltip={responsiveMode === 'tooltip' ? dislikeText : undefined}
            onClick={handleDislikeButtonClick}
            aria-label={dislikeText}
          >
            {responsiveMode === 'text' ? dislikeText : null}
          </Button>
        </Fragment>
      ) : null}
    </div>
  );
};

export default memo(ContentDetailReactions);
