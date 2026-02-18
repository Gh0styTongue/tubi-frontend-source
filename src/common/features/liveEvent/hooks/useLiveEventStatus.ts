/**
 * @file Hook for determining the current status of a live event.
 */

import { useCurrentDate } from 'common/context/CurrentDateContext';

import { getLiveEventContentStatus } from '../utils';
import { useListing } from './useListing';

/**
 * Hook that returns the current status of a live event (NotStarted, Live, or Ended).
 * @param id - Content ID of the live event
 * @returns LiveEventContentStatus or undefined if not found
 */
export const useLiveEventStatus = (id: string) => {
  const { data } = useListing({ ids: [id] });
  const currentDate = useCurrentDate();
  return data[id] ? getLiveEventContentStatus(currentDate, data[id]) : undefined;
};
