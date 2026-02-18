import { useCallback } from 'react';

import {
  START_POS_QUERY,
} from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import useAppSelector from 'common/hooks/useAppSelector';

export const useRemoveStartPositionQueryParam = () => {
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  useOnPlayerCreate(useCallback(() => {
    if (isLoggedIn) return;
    // if we have a stored position as result of custom captions update, we need to clear after player starts
    const startedFromStoredPosition = window.location.search.indexOf(START_POS_QUERY) > -1;
    if (startedFromStoredPosition) {
      window.history.replaceState(null, '', window.location.href.replace(/\?startPos=\d*/, ''));
    }
  }, [isLoggedIn]));
};
