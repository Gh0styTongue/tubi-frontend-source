import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

import systemApi from 'client/systemApi';
import type { SystemAPIListeners } from 'client/systemApi/systemApi';
import { syncExpiredContainers } from 'common/actions/container';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useDocumentVisibility from 'common/hooks/useDocumentVisibility';

export const useSyncExpiredContainers = (activeContentMode: CONTENT_MODE_VALUE, debounceMs: number = 3000) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const dispatchSyncExpiredContainers = useMemo(
    () =>
      // GOTCHA: this is debounced because the onHdmiConnected event fires
      // multiple times (approx 1.5s apart), which is a known issue.
      debounce(
        () => {
          dispatch(syncExpiredContainers({ location, setIsLoading: setIsSyncing }))
            .catch(error => logger.error({ error }, 'syncExpiredContainers error - Home'));
        },
        debounceMs,
        {
          leading: true,
          trailing: false,
        }
      ),
    [debounceMs, dispatch, location]
  );

  const isVisible = useDocumentVisibility();
  useEffect(() => {
    if (isVisible && activeContentMode !== CONTENT_MODES.linear) {
      dispatchSyncExpiredContainers();
    }
  }, [isVisible, activeContentMode, dispatchSyncExpiredContainers]);

  useEffect(() => {
    const handleHDMIConnected: SystemAPIListeners['onHdmiConnected'] = ({ hdmi_connection: isConnected }) => {
      if (isConnected) {
        dispatchSyncExpiredContainers();
      }
    };
    systemApi.addListener('onHdmiConnected', handleHDMIConnected);
    return () => {
      systemApi.removeListener('onHdmiConnected', handleHDMIConnected);
    };
  }, [dispatchSyncExpiredContainers]);

  return isSyncing;
};
