import { mins } from '@adrise/utils/lib/time';

import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { getData as getSessionData, setData as setSessionData } from 'client/utils/sessionDataStorage';
import { LD_FIRST_SESSION_TIMESTAMP } from 'common/constants/constants';

export type FirstSeen = string | undefined;

// Assuming page load time is less than 5 mins
export const FIRST_SESSION_TIMEOUT_IN_MS = mins(5);

const getReliableFirstSeenTime = (firstSeen: FirstSeen): Date => {
  const d = new Date(firstSeen || '');
  return isNaN(d.getTime()) ? new Date() : d;
};

export const initIsWebFirstSession = (firstSeen: FirstSeen) => {
  const isFirstSessionInLocalData = getLocalData(LD_FIRST_SESSION_TIMESTAMP);
  if (isFirstSessionInLocalData) {
    return;
  }

  // initialize the first session flags when the flag value in localStorage doesn't exist.
  const firstSeenTime = getReliableFirstSeenTime(firstSeen);
  const firstSeenISOString = firstSeenTime.toISOString();
  setLocalData(LD_FIRST_SESSION_TIMESTAMP, firstSeenISOString);
  const isWebFirstSession = firstSeenTime.getTime() + FIRST_SESSION_TIMEOUT_IN_MS > new Date().getTime();
  if (isWebFirstSession) {
    setSessionData(LD_FIRST_SESSION_TIMESTAMP, firstSeenISOString);
  }
};

export const getIsWebFirstSession = (firstSeen: FirstSeen) => {
  const isFirstSessionInLocalData = getLocalData(LD_FIRST_SESSION_TIMESTAMP);
  if (!isFirstSessionInLocalData) {
    initIsWebFirstSession(firstSeen);
  }
  const isFirstSessionInSessionData = getSessionData(LD_FIRST_SESSION_TIMESTAMP);
  return !!isFirstSessionInSessionData;
};
