import { useCallback } from 'react';

import {
  START_POS_QUERY,
} from 'common/constants/constants';

export const useRemoveStartPositionQueryParam = () => {
  return {
    removeStartPositionQueryParam: useCallback(() => {
      // if we have a stored position as result of custom captions update, we need to clear after player starts
      const startedFromStoredPosition = window.location.search.indexOf(START_POS_QUERY) > -1;
      if (startedFromStoredPosition) {
        window.history.replaceState(null, '', window.location.href.replace(/\?startPos=\d*/, ''));
      }
    }, []),
  };
};
