import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { attachRedirectCookie } from 'client/utils/auth';
import { requestPushPermission } from 'client/utils/thirdParty/braze';
import { add, remove } from 'common/actions/reminder';
import { toggleRemindModal } from 'common/actions/ui';
import { SERIES_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { loginRedirect, loginCallback } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { ContentType } from 'common/types/queue';
import type { StoreState } from 'common/types/storeState';
import type { VideoType } from 'common/types/video';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

interface UseReminderOptions {
  contentId?: string;
  contentType?: VideoType;
  contentTitle?: string;
}

const useReminder = (options: UseReminderOptions) => {
  const { contentId, contentType, contentTitle } = options;

  const intl = useIntl();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const reminder = useSelector((state: StoreState) => state.reminder.contentIdMap[contentId!]);
  const inProgress = useSelector((state: StoreState) => state.reminder.inProgress[contentId!]);
  const isLoggedIn = useSelector(isLoggedInSelector);
  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const isMajorEventFailsafe = useSelector(isMajorEventFailsafeActiveSelector);
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);

  const dispatchAdd = useCallback(() => {
    if (!inProgress) {
      let type: ContentType = contentType === SERIES_CONTENT_TYPE ? 'series' : 'movie';
      if (contentType === SPORTS_EVENT_CONTENT_TYPE) {
        type = 'sports_event';
      }
      dispatch(add(contentId!, type));
    }
  }, [dispatch, contentId, contentType, inProgress]);

  const addToReminder = useCallback(() => {
    if (isLoggedIn) {
      dispatchAdd();
      requestPushPermission();
    } else {
      dispatch(
        toggleRemindModal({
          contentTitle,
          isOpen: true,
          onLogin: () => {
            const pathname = getCurrentPathname();
            attachRedirectCookie(pathname);
            dispatch(loginRedirect(pathname));
            dispatch(loginCallback(dispatchAdd));
          },
        })
      );
    }
  }, [contentTitle, dispatch, dispatchAdd, isLoggedIn]);

  const removeFromReminder = useCallback(() => {
    if (!inProgress && reminder) {
      dispatch(remove(reminder.id, contentId!, location));
    }
  }, [dispatch, reminder, contentId, inProgress, location]);

  const dispatchReminderAction = useCallback(() => {
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'reminder',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }
    if (!reminder) {
      addToReminder();
      trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.SetReminder });
    } else {
      removeFromReminder();
      trackContentDetailNavComponentInteractionEvent({
        componentSectionIndex: ContentDetailPageNavOption.RemoveReminder,
      });
    }
  }, [isMajorEventFailsafe, reminder, dispatch, intl, currentDate, majorEventFailsafeMessages, addToReminder, removeFromReminder]);

  if (!contentId || !contentType || !contentTitle) {
    return {};
  }

  return {
    dispatchReminderAction,
    hasReminderSet: !!reminder,
  };
};

export default useReminder;
