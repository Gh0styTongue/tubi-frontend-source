import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { attachRedirectCookie } from 'client/utils/auth';
import { toggleRemindModal } from 'common/actions/ui';
import { loginRedirect, loginCallback } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';

import { trackRemindMeOnClick, trackReminderAction } from './track';
import messages from './useLinearReminderMessages';
import { addLinearReminder, removeLinearReminder } from '../actions/linearReminder';
import { isInProgressSelector, reminderIdSelector } from '../selectors/linearReminder';
import type { AddReminderData, LinearPageType } from '../types/linearReminder';
import { getMapKey } from '../utils/linearReminder';

interface UseLinearReminderOption extends Pick<AddReminderData, 'contentId' | 'startTime'> {
  linearPageType: LinearPageType;
  programId: AddReminderData['scheduleId'];
  programTitle: string;
  redirectPath?: string;
}

const useLinearReminder = ({
  contentId,
  programId,
  startTime,
  programTitle,
  linearPageType,
  redirectPath = getCurrentPathname(),
}: UseLinearReminderOption) => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const { formatMessage } = useIntl();

  const mapKey = getMapKey({ contentId, scheduleId: programId });
  const isInProgress = useAppSelector((state) => isInProgressSelector(state, mapKey));
  const reminderId = useAppSelector((state) => reminderIdSelector(state, mapKey));

  const dispatchAdd = useCallback(() => {
    /* istanbul ignore else */
    if (!isInProgress) {
      trackReminderAction({
        programId,
        redirectPath,
        userInteraction: 'TOGGLE_ON',
      });
      dispatch(
        addLinearReminder({
          contentId,
          scheduleId: programId,
          startTime,
        })
      );
    }
  }, [contentId, dispatch, isInProgress, programId, redirectPath, startTime]);

  const addReminder = useCallback(() => {
    trackRemindMeOnClick({ linearPageType, programId });
    if (isLoggedIn) {
      dispatchAdd();
    } else {
      dispatch(
        toggleRemindModal({
          linearPageType,
          programId,
          isOpen: true,
          showLogin: true,
          modalDescription: formatMessage(messages.modalDesc, { programTitle }),
          onLogin: () => {
            attachRedirectCookie(redirectPath);
            dispatch(loginRedirect(redirectPath));
            dispatch(loginCallback(dispatchAdd));
          },
        })
      );
    }
  }, [
    dispatch,
    dispatchAdd,
    formatMessage,
    isLoggedIn,
    linearPageType,
    programId,
    programTitle,
    redirectPath,
  ]);

  const removeReminder = useCallback(() => {
    /* istanbul ignore else */
    if (!isInProgress && reminderId) {
      trackReminderAction({
        programId,
        redirectPath,
        userInteraction: 'TOGGLE_OFF',
      });
      dispatch(removeLinearReminder({ id: reminderId }));
    }
  }, [dispatch, isInProgress, programId, redirectPath, reminderId]);

  const dispatchReminderAction = useCallback(() => {
    (reminderId ? removeReminder : addReminder)();
  }, [addReminder, reminderId, removeReminder]);

  return {
    dispatchReminderAction,
    hasReminderSet: !!reminderId,
  };
};

export default useLinearReminder;
