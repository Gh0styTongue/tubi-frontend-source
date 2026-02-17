import {
  INTRO_ANIMATION_END_TS,
  INTRO_ANIMATION_START_TS,
  INTRO_DOC_DOWNLOAD_TIME,
  INTRO_DOC_TIME_ORIGIN,
  INTRO_DOC_TTFB,
  INTRO_VIDEO_LOAD_DURATION,
} from 'client/introLib/constants';
import type { IntroDocLoadMetrics } from 'client/introLib/types';

export const getPerformanceEntries = (entriesType: string) => {
  // eslint-disable-next-line compat/compat
  const entries = performance?.getEntriesByType?.(entriesType);
  if (entries && typeof performance.getEntriesByType(entriesType)[0] === 'object') {
    return performance.getEntriesByType(entriesType);
  }
};

function trackPageLoadMetrics() {
  const performanceEntries = getPerformanceEntries('navigation');
  let metricsCollected;

  if (performanceEntries && performanceEntries[0]) {
    metricsCollected = performanceEntries[0];
  } else if (performance.timing) {
    metricsCollected = performance.timing;
  }

  if (sessionStorage && typeof metricsCollected !== 'undefined') {
    const { requestStart, responseStart, responseEnd } = metricsCollected as IntroDocLoadMetrics;
    sessionStorage.setItem(INTRO_DOC_DOWNLOAD_TIME, String(Math.round(responseEnd - responseStart)));
    sessionStorage.setItem(INTRO_DOC_TTFB, String(Math.round(responseStart - requestStart)));
    sessionStorage.setItem(INTRO_DOC_TIME_ORIGIN, String(performance.timeOrigin));
  }
}

export function trackResourceLoadMetrics() {
  const resources = getPerformanceEntries('resource') as PerformanceResourceTiming[];
  if (typeof resources !== 'undefined' && resources.length > 0) {
    const videoResource = resources.filter(({ initiatorType }) => initiatorType === 'video')[0];
    if (sessionStorage && videoResource && videoResource.duration) {
      sessionStorage.setItem(INTRO_VIDEO_LOAD_DURATION, String(Math.round(videoResource.duration)));
    }
  }
}

export function trackMetricsOnIntroEnded() {
  /* istanbul ignore next: ignore optional chaining */
  sessionStorage?.setItem(INTRO_ANIMATION_END_TS, String(Date.now()));
  trackPageLoadMetrics();
  trackResourceLoadMetrics();
}

export function trackIntroStart() {
  /* istanbul ignore next: ignore optional chaining */
  sessionStorage?.setItem(INTRO_ANIMATION_START_TS, String(Date.now()));
}
