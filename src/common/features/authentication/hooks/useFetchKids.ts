import React from 'react';

import { getKidAccounts } from 'common/features/authentication/api/kidAccount';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';

// Custom hook to fetch kid accounts; ignores late results after stopFetching flips
export default function useFetchKids(stopFetching: boolean | undefined): Kid[] {
  const dispatch = useAppDispatch();
  const [kids, setKids] = React.useState<Kid[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    if (stopFetching) return;

    (async () => {
      try {
        const result = await dispatch(getKidAccounts());
        if (!cancelled) setKids(result);
      } catch {
        // intentionally ignore errors here
      }
    })();

    return () => { cancelled = true; };
  }, [dispatch, stopFetching]);

  return kids;
}
