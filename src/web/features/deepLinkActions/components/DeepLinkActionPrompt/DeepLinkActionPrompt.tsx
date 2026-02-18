import type { Location } from 'history';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { REMOVE_NOTIFICATION } from 'common/constants/action-types';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { useQueueAndReminderQuery } from 'common/hooks/useQueue/useQueueAndReminderQuery';
import { useAddToQueue, useRemoveFromQueue } from 'common/hooks/useQueue/useQueueMutations';
import { usePatchTitleReaction } from 'common/hooks/useUserReaction/useUserReactionMutations';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import type { ContentType } from 'common/types/queue';
import { actionWrapper } from 'common/utils/action';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { removeLeadingZero } from 'common/utils/removeLeadingZero';

import {
  DEEPLINK_ACTIONS,
  getDeepLinkAction,
  getDeepLinkContentId,
  handleDeepLinkAction,
  PROMPT_ID,
} from '../../utils';

export interface Props {
  contentId?: string;
  contentType?: ContentType;
  location: Location;
  title?: string;
}

const DeepLinkActionPrompt: FC<Props> = ({
  contentId = '',
  contentType,
  location,
  title = '',
}) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const { mutate: patchReaction } = usePatchTitleReaction();
  const { mutate: addToQueueMutation } = useAddToQueue();
  const { mutate: removeFromQueueMutation } = useRemoveFromQueue();
  const { data: queueAndReminderData } = useQueueAndReminderQuery();

  const action = getDeepLinkAction(location);
  const videosById = useAppSelector((state) => state.video.byId);
  let currentContentId = contentId || getDeepLinkContentId(location) as string;

  let content = videosById[currentContentId];
  if (!content) {
    // add leading zero to check for series content
    currentContentId = convertSeriesIdToContentId(currentContentId);
    content = videosById[currentContentId];
  }
  const currentTitle = title || content?.title;
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const historyLoaded = useAppSelector(state => state.history.loaded);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);
  const currentDate = useCurrentDate();

  let dataLoaded = true;
  switch (action) {
    case DEEPLINK_ACTIONS.REMOVE_FROM_MY_LIST:
      dataLoaded = !isLoggedIn || Boolean(queueAndReminderData);
      break;
    case DEEPLINK_ACTIONS.REMOVE_FROM_CONTINUE_WATCHING:
      dataLoaded = historyLoaded;
      break;
    default:
      break;
  }

  const [didShowPrompt, setDidShowPrompt] = useState(false);

  // check for action and show the prompt
  useEffect(() => {
    const hasData = Boolean(action && currentContentId && currentTitle && dataLoaded && content);
    if (hasData && !didShowPrompt) {

      handleDeepLinkAction({
        location,
        action: action as string,
        contentId: currentContentId,
        contentType,
        dispatch,
        intl,
        isLoggedIn,
        queueItems: queueAndReminderData?.queueItems || {},
        title: currentTitle,
        isMajorEventFailsafe,
        majorEventFailsafeMessages,
        currentDate,
        patchReaction: (reactionAction: 'like' | 'dislike') => {
          patchReaction({
            contentId: removeLeadingZero(currentContentId),
            action: reactionAction,
            location,
            video: content,
          });
        },
        addToQueue: (params) => {
          addToQueueMutation(params);
        },
        removeFromQueue: (params) => {
          removeFromQueueMutation(params);
        },
      });
      setDidShowPrompt(true);
    }
  }, [action, addToQueueMutation, content, contentType, currentContentId, currentDate, currentTitle, dataLoaded, didShowPrompt, dispatch, intl, isLoggedIn, isMajorEventFailsafe, location, majorEventFailsafeMessages, patchReaction, queueAndReminderData, removeFromQueueMutation]);

  // remove notification when unmounting the component
  const notifications = useAppSelector(state => state.ui.notifications);
  useEffect(() => {
    return () => {
      const activeNotification = notifications.find(notif => notif.id === PROMPT_ID);
      if (activeNotification) {
        dispatch(actionWrapper(REMOVE_NOTIFICATION, { id: PROMPT_ID }));
      }
    };
  }, [dispatch, notifications]);

  return null;
};

export default DeepLinkActionPrompt;
