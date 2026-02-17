import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { useEffect, useRef } from 'react';

import { useLocation } from 'common/context/ReactRouterModernContext';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import { usePrevious } from 'common/hooks/usePrevious';
import { usePreviousDistinct } from 'common/hooks/usePreviousDistinct';
import type StoreState from 'common/types/storeState';

const isLeftNavExpandedSelector = ({ ottUI }: StoreState) => !!ottUI?.leftNav?.isExpanded;
const isEPGTopNavActiveSelector = ({ ottUI }: StoreState) => !!ottUI?.epg?.topNav?.isActive;
const focusedContentIdSelector = ({ ottUI }: StoreState) => ottUI?.epg?.focusedContentId;

export const useTrackLivePlayerExit = ({
  streamUrl,
  videoPlayer,
  id,
  title,
}: {
  streamUrl: string,
  videoPlayer: PlayerDisplayMode,
  id: string,
  title: string,
}) => {
  const isLeftNavExpanded = useAppSelector(isLeftNavExpandedSelector);
  const isEPGTopNavActive = useAppSelector(isEPGTopNavActiveSelector);
  const focusedContentId = useAppSelector(focusedContentIdSelector);
  const currentPathname = useLocation().pathname;
  const previousPathname = usePreviousDistinct(currentPathname);

  const sourceOfExitRef = useRef('UNKNOWN');
  const eventRef = useRef({
    streamUrl,
    videoPlayer,
    id,
    title,
    currentPathname,
    previousPathname,
    sourceOfExit: sourceOfExitRef.current,
  });
  const previousUrl = usePrevious(streamUrl);
  const previousFocusedContentId = usePrevious(focusedContentId);

  useEffect(() => {
    if (isLeftNavExpanded) {
      sourceOfExitRef.current = 'LEFT_NAV_SWITCH';
    } else if (isEPGTopNavActive) {
      sourceOfExitRef.current = 'EPG_TOP_NAV_SWITCH';
    } else if (focusedContentId !== previousFocusedContentId && currentPathname === '/') {
      sourceOfExitRef.current = 'HOME_TILE_SWITCH';
    } else if (focusedContentId !== previousFocusedContentId) {
      sourceOfExitRef.current = 'CHANNEL_SWITCH';
    }

    eventRef.current = {
      streamUrl,
      videoPlayer,
      id,
      title,
      currentPathname,
      previousPathname,
      sourceOfExit: sourceOfExitRef.current,
    };
  }, [
    streamUrl,
    videoPlayer,
    id,
    title,
    isLeftNavExpanded,
    isEPGTopNavActive,
    previousUrl,
    currentPathname,
    previousPathname,
    focusedContentId,
    previousFocusedContentId,
  ]);

  useEffect(() => () => {
    logger.info(eventRef.current, 'Live Player Exiting');
  }, [streamUrl]);
};
