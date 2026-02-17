import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setTheaterMode } from 'common/actions/ui';
import PlayerWebTheaterMode, { PLAYER_WEB_THEATER_MODE_VALUE } from 'common/experiments/config/playerWebTheaterMode';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isMobileDeviceSelector } from 'common/selectors/ui';

export const useInitializeTheaterMode = () => {
  const dispatch = useDispatch();
  const playerWebTheaterMode = useExperiment(PlayerWebTheaterMode);
  const isMobile = useAppSelector(isMobileDeviceSelector);

  useEffect(() => {
    // reset theater mode when we enter player page
    if ([
      PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_DEFAULT_WITH_ICON,
      PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_DEFAULT_WITHOUT_ICON,
    ].includes(playerWebTheaterMode.getValue()) && !isMobile) {
      dispatch(setTheaterMode(true));
    } else {
      dispatch(setTheaterMode(false));
    }
    return () => {
      // disable theater mode when we leave player page
      // to make scroll works in TopNav
      dispatch(setTheaterMode(false));
    };
    // intentionally run only once on container mount
    // on assumption that we already have experiment value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
