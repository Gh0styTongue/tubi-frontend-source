import { mins, secs } from '@adrise/utils/lib/time';
import { useEffect } from 'react';

import { UPDATE_CURRENT_DATE } from 'common/constants/action-types';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { actionWrapper } from 'common/utils/action';

export const useUpdateCurrentDateByMinute = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const offset = 60 - new Date().getSeconds();
    const updateCurrentDateAction = actionWrapper(UPDATE_CURRENT_DATE);

    dispatch(updateCurrentDateAction);

    let timerId = window.setTimeout(() => {
      dispatch(updateCurrentDateAction);
      timerId = window.setInterval(() => {
        dispatch(updateCurrentDateAction);
      }, mins(1));
    }, offset * secs(1));

    return () => {
      clearInterval(timerId);
    };
  }, [dispatch]);
};
