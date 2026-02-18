import { PLAYER_EVENTS } from '@adrise/player';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';

import { OutPortal } from 'common/components/ReversePortal/ReversePortal';
import { setLiveVideoPlayer } from 'common/features/playback/actions/live';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import ThemeProvider from 'common/features/theme/ThemeProvider';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { useWebPlayerPipExperiment } from 'common/selectors/experiments/webPlayerPipSelector';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';

import styles from './FloatingPlayerContainer.scss';

/**
 * This component is used to render the player InPortal provided by the
 * PlayerPortalProvider and the OutPortal for the floating player container
 */
const FloatingPlayerContainer: React.FC = () => {
  const isWebPipFeatureEnabled = useWebPlayerPipExperiment();
  const { playerPortalNode, isFloating, getPortalElement, destroyPlayers } = usePlayerPortal();
  const dispatch = useAppDispatch();

  const className = classNames(styles.container, {
    [styles.hidden]: !isFloating,
  });

  usePlayerEvent(PLAYER_EVENTS.complete, useCallback(() => {
    destroyPlayers();
  }, [destroyPlayers]), { disable: !isFloating });

  useEffect(() => {
    if (isFloating) {
      dispatch(setLiveVideoPlayer(PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE));
    }
  }, [isFloating, dispatch]);

  if (!isWebPipFeatureEnabled) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className={className}>
        {isFloating ? <OutPortal node={playerPortalNode} /> : null}
        {getPortalElement()}
      </div>
    </ThemeProvider>
  );
};

export default FloatingPlayerContainer;
