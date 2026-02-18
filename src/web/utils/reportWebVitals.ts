import type { MetricType } from 'web-vitals';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { sendGA4Event } from 'common/utils/ga';
import { trackLogging } from 'common/utils/track';
import { matchesRoute } from 'common/utils/urlPredicates';
import type { RouteTemplate } from 'common/utils/urlPredicates';

interface ReportWebVitalsOptions {
  pathname: string;
}

export const shouldReport = (metric: MetricType) => {
  const SAMPLE_RATE = __PRODUCTION__ ? 0.1 : 1;

  if (
    __WEBPLATFORM__ === 'WEB' &&
    !__IS_ALPHA_ENV__ &&
    metric.navigationType === 'reload' &&
    Math.random() < SAMPLE_RATE
  ) {
    return true;
  }
  return false;
};

const ROUTES: RouteTemplate[] = [
  // route without params
  WEB_ROUTES.landing,
  WEB_ROUTES.home,
  WEB_ROUTES.movies,
  WEB_ROUTES.tvShows,
  WEB_ROUTES.live,
  WEB_ROUTES.myStuff,

  // route with params
  WEB_ROUTES.categoryIdTitle,
  WEB_ROUTES.channelId,
  WEB_ROUTES.movieDetail,
  WEB_ROUTES.tvShowDetail,
  WEB_ROUTES.seriesDetail,
  WEB_ROUTES.person,
  WEB_ROUTES.searchKeywords,
  WEB_ROUTES.watchSchedule,
  WEB_ROUTES.liveDetail,
];

export const OTHER_ROUTE = 'other';

// The formula here is to take the first letters of up to the first two words of the route name as ID characters.
// If there is a duplicate, introduce a third digit starting from 1 to differentiate between different route names.
// This ensures that the length of the routeId is limited to within 3 characters, so that the subtype sent to client
// info log does not exceed 32 characters. The longest possible subtype would be like `webVitals@LCP@CI1`, having a
// length of only 17 characters.
export const ROUTE_IDS = {
  [OTHER_ROUTE]: 'OTH',
  [WEB_ROUTES.categoryIdTitle]: 'CI',
  [WEB_ROUTES.channelId]: 'CI1',
  [WEB_ROUTES.home]: 'H',
  [WEB_ROUTES.landing]: 'L',
  [WEB_ROUTES.liveDetail]: 'LD',
  [WEB_ROUTES.live]: 'L1',
  [WEB_ROUTES.movieDetail]: 'MD',
  [WEB_ROUTES.movies]: 'M',
  [WEB_ROUTES.myStuff]: 'MS',
  [WEB_ROUTES.person]: 'P',
  [WEB_ROUTES.searchKeywords]: 'SK',
  [WEB_ROUTES.seriesDetail]: 'SD',
  [WEB_ROUTES.tvShowDetail]: 'TS',
  [WEB_ROUTES.tvShows]: 'TS1',
  [WEB_ROUTES.watchSchedule]: 'WS',
};

export const getRouteId = (pathname: string) => {
  const route = ROUTES.find((route) => matchesRoute(route, pathname)) ?? OTHER_ROUTE;
  return ROUTE_IDS[route];
};

// https://github.com/GoogleChrome/web-vitals?tab=readme-ov-file#send-the-results-to-google-analytics
const reportToGA4 = ({ delta, id, name, value, rating }: MetricType) => {
  sendGA4Event(name, {
    value: delta, // Use `delta` so the value can be summed.
    metric_id: id,
    metric_value: value,
    metric_delta: delta,
    metric_rating: rating,
  });
};

const reportToClientLog = ({ name: metricName, value }: MetricType, { pathname }: ReportWebVitalsOptions) => {
  const routeId = getRouteId(pathname);
  const subtype = [LOG_SUB_TYPE.WEB_VITALS, metricName, routeId].join('@');

  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype,
    message: value,
  });
};

export const genOnMetric = (options: ReportWebVitalsOptions) => (metric: MetricType) => {
  if (shouldReport(metric)) {
    reportToGA4(metric);
    reportToClientLog(metric, options);
  }
};

const reportWebVitals = (options: ReportWebVitalsOptions) => {
  const onMetric = genOnMetric(options);

  import(/* webpackChunkName: "web-vitals" */ 'web-vitals').then(({ onCLS, onINP, onLCP }) => {
    onCLS(onMetric);
    onINP(onMetric);
    onLCP(onMetric);
  });
};

export default reportWebVitals;
