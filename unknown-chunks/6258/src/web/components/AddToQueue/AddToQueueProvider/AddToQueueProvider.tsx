import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { ReactNode, FunctionComponent, ReactElement } from 'react';
import { useCallback, useMemo, memo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { connect } from 'react-redux';

import * as queueActions from 'common/actions/queue';
import { addNotification } from 'common/actions/ui';
import { SPORTS_EVENT_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { DIALOG } from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { loginCallback } from 'common/features/authentication/actions/auth';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { ContentType } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

const messages = defineMessages({
  youNeedToSignIn: {
    description: 'notification title text',
    defaultMessage: 'You need to sign in!',
  },
  pleaseSignInToAddToYourQueue: {
    description: 'notification description text',
    defaultMessage: 'Please sign in to add to My List.',
  },
  signIn: {
    description: 'notification button text',
    defaultMessage: 'Sign In',
  },
  close: {
    description: 'notification button text',
    defaultMessage: 'Close',
  },
});

export interface OwnProps {
  belongSeries?: number | string;
  id: string;
}

export interface ChildrenProps {
  dispatchQueueAction: () => void;
  isInQueue: boolean;
}

interface StateProps {
  content: Video;
  contentId: string;
  isInQueueProgress: boolean;
  isLoggedIn: boolean;
  itemId: string | null;
}
export interface AddToQueueProviderProps extends OwnProps, StateProps {
  children: (props: ChildrenProps) => ReactNode;
  dispatch: TubiThunkDispatch;
}

const AddToQueueProvider: FunctionComponent<AddToQueueProviderProps> = (props) => {
  const { children, content, contentId, dispatch, id, isInQueueProgress, isLoggedIn, itemId } = props;

  const intl = useIntl();
  const location = useLocation();
  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);

  let contentType: ContentType = content.type === VIDEO_CONTENT_TYPE ? 'movie' : 'series';
  // override `contentType = 'series'` if `contentId (parsed Id, appended 0 if it's series) !== id (real Id from response)`
  if (contentId !== id) {
    contentType = 'series';
  }
  if (content.type === SPORTS_EVENT_CONTENT_TYPE) {
    contentType = 'sports_event';
  }

  // if video is an episode, we will add the containing series to queue
  const addToQueue = () => {
    const dispatchAddToQueue = () => {
      if (!isInQueueProgress) {
        dispatch(queueActions.add(contentId, contentType));
      }
    };

    if (!isLoggedIn) {
      dispatch(
        addNotification(
          {
            title: intl.formatMessage(messages.youNeedToSignIn),
            description: intl.formatMessage(messages.pleaseSignInToAddToYourQueue),
            status: 'info',
            autoDismiss: false,
            buttons: [
              {
                title: intl.formatMessage(messages.signIn),
                primary: true,
                action: () => {
                  dispatch(loginCallback(dispatchAddToQueue));
                  tubiHistory.push(`${WEB_ROUTES.signIn}?redirect=${encodeURIComponent(window.location.pathname)}`);
                },
              },
              {
                title: intl.formatMessage(messages.close),
              },
            ],
          },
          `atq-${contentId}`,
        ),
      );
      trackEvent(DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.SIGNIN_REQUIRED, undefined, DialogAction.SHOW));
    } else {
      dispatchAddToQueue();
    }
    trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.AddToMyList });
  };

  const removeFromQueue = () => {
    if (!isInQueueProgress && itemId) {
      dispatch(queueActions.remove(itemId, contentId, location));
    }
    trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.RemoveFromMyList });
  };

  const dispatchQueueAction = useCallback(
    () => {
      if (isMajorEventFailsafe) {
        showFeatureUnavailableToaster({
          dispatch,
          intl,
          feature: 'myList',
          currentDate,
          majorEventFailsafeMessages,
        });
        return;
      }
      if (!itemId) {
        addToQueue();
      } else {
        removeFromQueue();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemId, isMajorEventFailsafe, currentDate, majorEventFailsafeMessages],
  );

  const contents = useMemo(
    () => children({ dispatchQueueAction, isInQueue: !!itemId }) as ReactElement<AddToQueueProviderProps>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, itemId],
  );

  return contents;
};

const mapStateToProps = (state: StoreState, ownProps: OwnProps): StateProps => {
  const { auth, queue, video } = state;
  const { belongSeries, id } = ownProps;

  // queue actions will need `0${belongSeries}` for series, otherwise directly use `${id}`.
  const contentId = belongSeries ? `0${belongSeries}` : id;
  const content = video.byId[contentId] || {};

  return {
    content,
    contentId,
    isInQueueProgress: !!queue.inProgress[contentId],
    isLoggedIn: !!auth.user,
    itemId: queue.contentIdMap[contentId]?.id || null,
  };
};

export const AddToQueueProviderComponent = connect(mapStateToProps)(AddToQueueProvider);

export default memo(AddToQueueProviderComponent);
