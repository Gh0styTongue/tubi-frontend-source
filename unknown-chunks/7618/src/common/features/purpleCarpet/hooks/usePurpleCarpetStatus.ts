import { useCallback, useEffect } from 'react';

import { SET_PURPLE_CARPET_STATUS } from 'common/constants/action-types';
import * as actions from 'common/constants/action-types';
import {
  hasBannerSelector,
  mainGameSelector,
  purpleCarpetContentsSelector,
  purpleCarpetContentStatusSelector,
} from 'common/features/purpleCarpet/selector';
import { PurpleCarpetStatus } from 'common/features/purpleCarpet/type';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { actionWrapper } from 'common/utils/action';

import { getPurpleCarpetStatusFromMainGame } from '../util';

export const usePurpleCarpetStatus = (currentId?: string) => {
  const contents = useAppSelector(purpleCarpetContentsSelector);
  const dispatch = useAppDispatch();
  const currentStatus = useAppSelector((state) => state.purpleCarpet.status);
  const mainGameId = useAppSelector(mainGameSelector) || '';
  const mainGameStatus = useAppSelector(state => purpleCarpetContentStatusSelector(state, { id: mainGameId }));
  const hasBanner = useAppSelector((state) => hasBannerSelector(state, { id: currentId || mainGameId }));
  const hasContents = !!contents.length;

  const getPurpleCarpetStatus = useCallback(
    () => getPurpleCarpetStatusFromMainGame({ hasContents, hasBanner, mainGameStatus }),
    [hasBanner, hasContents, mainGameStatus]
  );

  useEffect(() => {
    const newStatus = getPurpleCarpetStatus();
    if (newStatus !== currentStatus) {
      dispatch(actionWrapper(SET_PURPLE_CARPET_STATUS, { status: newStatus }));
      /**
       * When the status changes during app session, the grid should be reset.
       * This would prevent a bug where the focus would still be on the purple carpet
       * container even though the fox_live_events container is no longer active.
       */
      if (newStatus === PurpleCarpetStatus.NotAvailable) {
        dispatch(actionWrapper(actions.RESET_UI_CONTAINER_INDEX_MAP));
        dispatch(actionWrapper(actions.RESET_OTT_CONTAINER_INDEX_MAP));
      }
    }
  }, [currentStatus, dispatch, getPurpleCarpetStatus]);
};
