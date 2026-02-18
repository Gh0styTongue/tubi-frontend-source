import { getInstance } from 'common/services/TrackingManager';
import type StoreState from 'common/types/storeState';
import { isBetweenStartAndEndTime } from 'common/utils/remoteConfig';

export const setFailSafeToTrackManager = (store: StoreState) => {
  const { major_event_failsafe_start, major_event_failsafe_end } = store.remoteConfig;
  const isInFailSafe = isBetweenStartAndEndTime(major_event_failsafe_start, major_event_failsafe_end);
  getInstance().setFailSafe(isInFailSafe);
};
