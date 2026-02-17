import { useCallback, useState } from 'react';

import { AUTO_START_CONTENT } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { isAgeGateModalVisibleSelector, isMobileDeviceSelector } from 'common/selectors/ui';
import { useDetectAutoplayCapability } from 'web/features/playback/components/VideoDetail/hooks/useDetectAutoplayCapability';
import { getIsFromAutoplay } from 'web/features/playback/utils/getIsFromAutoplay';

export interface UseManageAutostartProps {
  playerReady: boolean;
}

export const useManageAutostart = ({
  playerReady,
}: UseManageAutostartProps) => {
  const location = useLocation();
  const playerReadyRef = useLatest(playerReady);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const isAgeGateModalVisible = useAppSelector(isAgeGateModalVisibleSelector);

  // Detect if we can autoplay the video element
  const { canAutoplay } = useDetectAutoplayCapability();

  // If we meet the playback error, we will ban the auto start. For other situations, let's follow the instruction from the props.
  // always allow autoStart for OTT but only only it on web when browser allows it.
  const [allowAutostart, setAllowAutostart] = useState(true);
  const blockAutoStart = useCallback(() => setAllowAutostart(false), []);

  // Should we attempt to play the video programmatically?
  const getAutoStart = useCallback(() => {
    if (isMobile) return false;
    if (isAgeGateModalVisible) return false;
    if (!canAutoplay) return false;
    if (!allowAutostart) return false;

    // For GDPR country, if initial consent modal shows
    // We need to disable auto start
    /* istanbul ignore next */
    if (__CLIENT__ && window.__IS_GDPR_ENABLED__ && !window.OneTrust.IsAlertBoxClosed?.()) return false;

    // Check if the location allows autostart
    const { query = {}, state: locationState = {} } = location;
    const doesLocationAllowAutostart = !!(getIsFromAutoplay(query)
    || query.utm_source === 'google-feed'
    || query[AUTO_START_CONTENT] === 'true'
    || locationState[AUTO_START_CONTENT]);

    // When the player is already ready and we've gotten here, we
    // can try to start-- unless the location does not allow this
    // TODO: why is this an OR condition? Why do we always allow autostart
    // when the player is ready? Why not always autostart, at this point?
    return playerReadyRef.current || doesLocationAllowAutostart;
  }, [isMobile, playerReadyRef, canAutoplay, allowAutostart, isAgeGateModalVisible, location]);

  return {
    blockAutoStart,
    getAutoStart,
  };
};
