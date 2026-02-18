import { useCallback } from 'react';

import { activityTracker } from './ActivityTracker';
import type { ActivityType } from './ActivityTracker';

const HighConversionForPreviewWatchDuration = 30;
const HighConversionCloseToAutoplayOffset = 10;

export function useActivityTracker() {
  const recordActivity = useCallback((type: ActivityType, contentId: string) => {
    activityTracker.track(type, contentId);
  }, []);

  const userWatchedPreviewVideoActivity = useCallback((contentId: string, position: number) => {
    if (position >= HighConversionForPreviewWatchDuration) {
      activityTracker.track('watched30SecondsPreviewVideo', contentId);
    }
  }, []);

  const visitedDetailsPage = useCallback((contentId: string) => {
    activityTracker.track('visitedDetailsPage', contentId);
  }, []);

  const startedPlayback = useCallback((contentId: string) => {
    activityTracker.track('startPlayback', contentId);
  }, []);

  const trackPositionCloseToAutoplay = useCallback((contentId: string, position: number, creditsTime: number) => {
    const isCloseToAutoplayTime = (position >= creditsTime - HighConversionCloseToAutoplayOffset && position < creditsTime);
    if (isCloseToAutoplayTime) {
      activityTracker.track('closeToAutoplay', contentId);
    }
  }, []);

  const startAutoplay = useCallback((contentId: string) => {
    activityTracker.track('startAutoplay', contentId);
  }, []);

  return {
    recordActivity,
    userWatchedPreviewVideoActivity,
    visitedDetailsPage,
    startedPlayback,
    trackPositionCloseToAutoplay,
    startAutoplay,
  };
}
