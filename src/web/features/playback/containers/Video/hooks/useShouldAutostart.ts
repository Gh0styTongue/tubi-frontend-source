import type { Location } from 'history';

import { AUTO_START_CONTENT } from 'common/constants/constants';
import useAppSelector from 'common/hooks/useAppSelector';
import { isAgeGateModalVisibleSelector } from 'common/selectors/ui';
import { getIsFromAutoplay } from 'web/features/playback/utils/getIsFromAutoplay';
/**
 * we autoStart
 * 1. when this video is coming from autoplay, google-feed or having start=true
 * in location query/state
 * 2. when age gate modal is visible, auto start after user fills data
 */
export const useShouldAutostart = (location: Location) => {
  const isAgeGateModalVisible = useAppSelector(isAgeGateModalVisibleSelector);
  const { query = {}, state: locationState = {} } = location;
  let autoStart = getIsFromAutoplay(query)
    || query.utm_source === 'google-feed'
    || query[AUTO_START_CONTENT] === 'true'
    || locationState[AUTO_START_CONTENT];
  if (isAgeGateModalVisible) {
    autoStart = false;
  }
  return { autoStart };
};
