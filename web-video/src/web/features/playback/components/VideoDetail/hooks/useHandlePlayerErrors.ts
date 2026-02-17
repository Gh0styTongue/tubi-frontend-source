import type { ErrorEventData } from '@adrise/player';
import { ErrorType } from '@adrise/player';
import { useCallback, useState } from 'react';

import { isAutoStartFailedError } from 'client/features/playback/error/predictor';
import useLatest from 'common/hooks/useLatest';

interface UseHandlePlayerErrorsProps {
  blockAutoStart: () => void;
}

export const useHandlePlayerErrors = ({ blockAutoStart }: UseHandlePlayerErrorsProps) => {
  const blockAutoStartRef = useLatest(blockAutoStart);
  const [playerError, setPlayerError] = useState<ErrorEventData | null>(null);

  return {
    handlePlayerErrors: useCallback((error: ErrorEventData) => {
      if (isAutoStartFailedError(error)) {
        blockAutoStartRef.current();
        return;
      }

      if (error.fatal) {
        if ([ErrorType.SETUP_ERROR, ErrorType.NETWORK_ERROR].includes(error.type as ErrorType)) {
          setPlayerError(error);
        }
      }
    }, [blockAutoStartRef, setPlayerError]),
    playerError,
  };
};
