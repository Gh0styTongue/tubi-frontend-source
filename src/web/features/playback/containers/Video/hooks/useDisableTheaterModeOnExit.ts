import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setTheaterMode } from 'common/actions/ui';

export const useDisableTheaterModeOnExit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      // disable theater mode when we leave player page
      // to make scroll works in TopNav
      dispatch(setTheaterMode(false));
    };
    // intentionally run only once on container mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
