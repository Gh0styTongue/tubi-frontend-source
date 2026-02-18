import { disableSentry } from 'client/utils/thirdParty/sentry';
import type StoreState from 'common/types/storeState';
import { isBetweenStartAndEndTime } from 'common/utils/remoteConfig';

export default function disableSentryDuringFailSafe(store: StoreState) {
  const { major_event_failsafe_start, major_event_failsafe_end } = store.remoteConfig;
  const isInFailSafe = isBetweenStartAndEndTime(major_event_failsafe_start, major_event_failsafe_end);
  if (isInFailSafe) {
    disableSentry();
  }
}
