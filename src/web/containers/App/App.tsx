import classNames from 'classnames';
import type { Query } from 'history';
import hoistNonReactStatics from 'hoist-non-react-statics';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import React, { Component, Suspense } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import type { WrappedComponentProps } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { RouteComponentProps } from 'react-router';

import { getCookie, removeCookie, setCookie, updateDeviceIdCookieExpires } from 'client/utils/localDataStorage';
import { getData, setData } from 'client/utils/sessionDataStorage';
import { loadHistory } from 'common/actions/history';
import { loadQueue } from 'common/actions/queue';
import { loadReminder } from 'common/actions/reminder';
import { addNotification, notifyFromQueryParam, setTouchDevice, setViewportType } from 'common/actions/ui';
import { loadUserSettings } from 'common/actions/userSettings';
import {
  BROADCAST_CHANNEL_NAMES,
  BROADCAST_CHANNEL_EVENTS,
  COOKIE_MAINTENANCE_NOTIFICATION,
  CUSTOM_EVENT_NAME,
  CUSTOM_EVENT_TYPES,
  ENABLE_MAINTENANCE_NOTIFICATION,
  SHOULD_FETCH_DATA_ON_SERVER,
} from 'common/constants/constants';
import { FIRST_LOAD_PAGE_IS_CATEGORIES_ON_WEB } from 'common/constants/cookies';
import * as eventTypes from 'common/constants/event-types';
import { withReactRouterModernContextAdapter } from 'common/context/ReactRouterModernContext';
import WebAllCategories from 'common/experiments/config/webAllCategories';
import WebAnalyticsAnonymousToken from 'common/experiments/config/webAnalyticsAnonymousToken';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isAgeGateRequiredSelector, isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { ONETRUST_SDK_INITED_EVENT_NAME } from 'common/features/gdpr/onetrust/onetrust';
import { sendQueuedAnalyticsEventWhenConsentReady } from 'common/features/gdpr/onetrust/utils';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import ThemeProvider from 'common/features/theme/ThemeProvider';
import logger from 'common/helpers/logging';
import LazyComponentWrapper from 'common/HOCs/LazyComponentWrapper';
import withExperiment from 'common/HOCs/withExperiment';
import { isPlaybackEnabledSelector, appDownloadBannerSelector } from 'common/selectors/ui';
import { isMovieAndTVShowNavEnabledSelector } from 'common/selectors/webTopNav';
import type { FetchDataParams } from 'common/types/container';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Notification, ViewportType } from 'common/types/ui';
import { tryTwice } from 'common/utils/actionThunk';
import type { ReferredCtx } from 'common/utils/analytics';
import { buildReferredEventObject } from 'common/utils/analytics';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { isTouchDevice } from 'common/utils/platform';
import { alwaysResolve } from 'common/utils/promise';
import { setDeviceIdForTokenRequests } from 'common/utils/token';
import { getReferredExtraCtxFromDocument, getReferredExtraCtxFromQuery, trackEvent } from 'common/utils/track';
import { getViewportType } from 'common/utils/viewport';
import { getAppMetaData } from 'src/web/constants/appMetadata';
import RefreshTopNav from 'web/components/TopNav/TopNav';
import TubiNotifications from 'web/components/TubiNotifications/TubiNotifications';
import type { WebRefreshStatus } from 'web/context/webRefreshContext';
import { defaultWebRefreshStatus, WebRefreshProvider } from 'web/context/webRefreshContext';
import { getDeepLinkAction } from 'web/features/deepLinkActions/utils';
import InitialConsentModal from 'web/features/gdpr/components/InitialConsentModal/InitialConsentModal';
import OnetrustScript from 'web/features/gdpr/components/OnetrustScript/OnetrustScript';
import { pausePlaybackWhenInitialConsentShow } from 'web/features/gdpr/utils';
import PurpleCarpetBanner from 'web/features/purpleCarpet/components/PurpleCarpetBanner/PurpleCarpetBanner';
import {
  purpleCarpetBannerSelector,
  PurpleCarpeBannerPosition,
} from 'web/features/purpleCarpet/components/PurpleCarpetBanner/purpleCarpetBannerSelector';
import reportWebVitals from 'web/utils/reportWebVitals';
import type { FirstSeen } from 'web/utils/webFirstSession';
import { initIsWebFirstSession } from 'web/utils/webFirstSession';

import styles from './App.scss';

// lazy load modules
/* istanbul ignore next */
const ChromecastSender = React.lazy(
  () =>
    import(
      /* webpackChunkName: 'web-video', webpackPrefetch: true */ 'web/features/playback/components/ChromecastSender/ChromecastSender'
    )
);
const LazyChromecastSender = LazyComponentWrapper(ChromecastSender);

// use preload to make age gate modal ready asap
/* istanbul ignore next */
const AgeGateModal = React.lazy(
  () =>
    import(
      /* webpackChunkName: 'web-signup', webpackPreload: true */ 'web/features/coppa/components/AgeGateModal/AgeGateModal'
    )
);
const LazyAgeGateModal = LazyComponentWrapper(AgeGateModal);

const RemindModal = React.lazy(
  () => import(/* webpackChunkName: 'web-app-lazy' */ 'web/components/RemindModal/RemindModal')
);
const LazyRemindModal = LazyComponentWrapper(RemindModal);

const OneTap = React.lazy(() => import(/* webpackChunkName: 'web-app-lazy' */ 'web/components/OneTap/OneTap'));
const LazyOneTap = LazyComponentWrapper(OneTap);

const FixedBanner = React.lazy(
  () => import(/* webpackChunkName: 'web-app-lazy' */ 'web/features/fixedBanner/components/FixedBanner/FixedBanner')
);
const LazyFixedBanner = LazyComponentWrapper(FixedBanner);

const AppDownloadBanner = React.lazy(
  () => import(/* webpackChunkName: 'web-app-lazy' */ 'web/components/AppDownloadBanner/AppDownloadBanner')
);
const LazyAppDownloadBanner = LazyComponentWrapper(AppDownloadBanner);

/* istanbul ignore next */
const LazyExposureLogOverlay = React.lazy(
  () => import(/* webpackChunkName: "exposure-log-overlay" */ 'common/components/ExposureLogOverlay/ExposureLogOverlay')
);

const messages = defineMessages({
  title: {
    description: 'site down for maintenance notification title',
    defaultMessage: 'Maintenance',
  },
  desc: {
    description: 'site down for maintenance notification description',
    defaultMessage:
      'Tubi will be undergoing maintenance from 2am - 6am PST on Thursday, March 22nd. We apologize for any inconvenience this may cause.',
  },
});

export const shouldRenderTopNav = (pathname: string) => {
  const filterList = ['/webview/content/'];
  return filterList.every((v) => !pathname.startsWith(v));
};

interface StateProps {
  appDownloadBanner: ReturnType<typeof appDownloadBannerSelector>;
  purpleCarpetBanner: ReturnType<typeof purpleCarpetBannerSelector>;
  containerMenuVisible: boolean;
  deviceId: string;
  isKidsModeEnabled: boolean;
  isPlaybackEnabled: boolean;
  pathname: string;
  query: Query;
  isThirdPartySDKLoadable: boolean;
  youboraEnabled: boolean;
  isCoppaEnabled: boolean;
  isGDPREnabled: boolean;
  viewportType: ViewportType;
  isLoggedIn: boolean;
  isMobile: boolean;
  isMovieAndTVShowNavEnabled: boolean;
  isAgeGateRequired: boolean;
  withFixedBanner: boolean;
  firstSeen: FirstSeen;
}

type RouteProps = RouteComponentProps<any, any>;

interface OwnProps extends RouteProps {
  dispatch: TubiThunkDispatch;
}

interface ExperimentProps {
  webAllCategories: ReturnType<typeof WebAllCategories>;
  webAnalyticsAnonymousToken: ReturnType<typeof WebAnalyticsAnonymousToken>;
}

export type Props = OwnProps & StateProps & WrappedComponentProps & ExperimentProps;

class App extends Component<React.PropsWithChildren<Props>> {
  private _broadcastChannel?: BroadcastChannel;

  private webRefreshStatus: WebRefreshStatus = defaultWebRefreshStatus;

  static fetchData = fetchData;

  static fetchDataDeferred = fetchDataDeferred;

  constructor(props: Props) {
    super(props);
    const { isMobile } = props;
    this.webRefreshStatus = { enabled: !isMobile };
    if (__CLIENT__) {
      setDeviceIdForTokenRequests(props.deviceId);
    }
  }

  /**
   * mobile is detected and dispatched to reflect it on state
   */
  componentDidMount() {
    const {
      dispatch,
      intl,
      isPlaybackEnabled,
      isThirdPartySDKLoadable,
      query: { notify },
      youboraEnabled,
      isMovieAndTVShowNavEnabled,
      webAllCategories,
      webAnalyticsAnonymousToken,
      firstSeen,
      isGDPREnabled,
      pathname,
    } = this.props;

    // update deviceId cookie expires
    updateDeviceIdCookieExpires();

    webAnalyticsAnonymousToken.logExposure();

    /* istanbul ignore else */
    if (getCookie(FIRST_LOAD_PAGE_IS_CATEGORIES_ON_WEB) === 'true') {
      webAllCategories.logExposure();
      removeCookie(FIRST_LOAD_PAGE_IS_CATEGORIES_ON_WEB);
    }

    if (isGDPREnabled) {
      /* istanbul ignore next */
      // SDK has not inited
      if (typeof window.OneTrust?.OnConsentChanged !== 'undefined') {
        this.onConsentChanges();
      } else {
        addEventListener(document, ONETRUST_SDK_INITED_EVENT_NAME, this.onConsentChanges);
      }
    }

    addEventListener(window, CUSTOM_EVENT_NAME, this.handleCustomEvent);
    addEventListener(window, 'resize', this.debouncedHandleResize);
    this.setupBroadcastChannel();

    // check whether is touch device
    dispatch(setTouchDevice(isTouchDevice()));

    const viewportType = getViewportType(isMovieAndTVShowNavEnabled);
    dispatch(setViewportType(viewportType));

    // if we have a query param for notify then dispatch and add a notification
    if (notify) dispatch(notifyFromQueryParam(notify as string));

    // TEMP OREGON MAINTENANCE NOTIFICATION CODE
    if (ENABLE_MAINTENANCE_NOTIFICATION && !getCookie(COOKIE_MAINTENANCE_NOTIFICATION)) {
      setCookie(COOKIE_MAINTENANCE_NOTIFICATION, 'true');
      const notification: Notification = {
        status: 'info',
        title: intl.formatMessage(messages.title),
        description: intl.formatMessage(messages.desc),
        autoDismiss: false,
      };
      dispatch(addNotification(notification, 'Maintenance'));
    }
    // END TEMP OREGON CODE

    // Trigger active event for web
    sendQueuedAnalyticsEventWhenConsentReady(isGDPREnabled);

    // Trigger referred event
    this._sendReferredEvent();

    if (isPlaybackEnabled && isThirdPartySDKLoadable) {
      if (youboraEnabled) {
        import(
          /* webpackChunkName: "youbora-monitoring", webpackPrefetch: true */ 'client/features/playback/monitor/monitoring'
        );
      }
    }

    initIsWebFirstSession(firstSeen);

    if (__WEBPLATFORM__ === 'WEB') {
      reportWebVitals({ pathname });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const {
      query: { notify: prevNotify },
    } = prevProps;
    const {
      dispatch,
      query: { notify },
    } = this.props;
    if (notify && notify !== prevNotify) {
      dispatch(notifyFromQueryParam(notify as string));
    }
  }

  componentWillUnmount() {
    removeEventListener(document, ONETRUST_SDK_INITED_EVENT_NAME, this.onConsentChanges);
    removeEventListener(window, CUSTOM_EVENT_NAME, this.handleCustomEvent);
    removeEventListener(window, 'resize', this.debouncedHandleResize);
    this.teardownBroadcastChannel();
  }

  onConsentChanges = () => {
    window.OneTrust.OnConsentChanged(() => {
      pausePlaybackWhenInitialConsentShow(this.props.dispatch);
    });
  };

  /**
   * Build and send the referred event based on the page
   */
  _sendReferredEvent = () => {
    const { location, query, pathname } = this.props;
    const SEO_REFERRED_KEY = 'seo-referred';

    const sendReferredEvent = (referredCtx: ReferredCtx) => {
      trackEvent(eventTypes.REFERRED, buildReferredEventObject(pathname, referredCtx, eventTypes.REFERRAL_V2));
    };

    const queryReferredCtx = getReferredExtraCtxFromQuery(query);
    if (queryReferredCtx) {
      // handle referral event with deep link action
      if (getDeepLinkAction(location)) {
        const referredCtx = {
          ...(queryReferredCtx as object),
          source_platform: 'WEB',
        } as ReferredCtx;
        return trackEvent(eventTypes.REFERRED, buildReferredEventObject(pathname, referredCtx, eventTypes.DEEPLINK_V2));
      }
      return sendReferredEvent(queryReferredCtx as ReferredCtx);
    }

    if (getData(SEO_REFERRED_KEY)) {
      return;
    }

    const documentReferredCtx = getReferredExtraCtxFromDocument(query);
    if (documentReferredCtx) {
      sendReferredEvent(documentReferredCtx as ReferredCtx);
      setData(SEO_REFERRED_KEY, '1');
    }
  };

  handleCustomEvent = ({ detail }: CustomEvent) => {
    if (detail.type === CUSTOM_EVENT_TYPES.USER_NOT_FOUND) {
      return window.location.reload();
    }
  };

  setupBroadcastChannel = () => {
    const listener = (event: MessageEvent) => {
      const { isLoggedIn } = this.props;
      const { isTrusted, data } = event;

      // Check if the event is trusted to prevent malicious scripts from sending fake events
      // https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
      if (!isTrusted) {
        return;
      }

      if (data.type === BROADCAST_CHANNEL_EVENTS.LOGIN_STATUS_CHANGE && data.isLoggedIn !== isLoggedIn) {
        window.location.reload();
      }
    };

    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    // eslint-disable-next-line compat/compat
    this._broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAMES.WEB);

    // If multiple tabs are open and one of them triggers a change in login status, it could cause
    // other tabs to dispatch additional LOGIN_STATUS_CHANGE messages, leading to unnecessary message
    // handling. Although this has no side effects, throttling has been added to handle only the
    // first message from the active tab for performance considerations.
    this._broadcastChannel.onmessage = throttle(listener, 1000);
  };

  teardownBroadcastChannel = () => {
    if (this._broadcastChannel) {
      this._broadcastChannel.close();
    }
  };

  handleResize = () => {
    const { isMovieAndTVShowNavEnabled } = this.props;
    const newViewportType = getViewportType(isMovieAndTVShowNavEnabled);
    if (newViewportType !== this.props.viewportType) {
      this.props.dispatch(setViewportType(newViewportType));
    }
  };

  debouncedHandleResize = debounce(this.handleResize, 50);

  render() {
    const {
      appDownloadBanner,
      purpleCarpetBanner,
      pathname,
      children,
      containerMenuVisible,
      intl,
      isKidsModeEnabled,
      withFixedBanner,
      isMobile,
    } = this.props;
    // fb instream script needs an ID to reference, #app will always be available
    // will need to change this css logic once we have age gate logic in place
    const className = classNames(styles.app, {
      [styles.noScroll]: containerMenuVisible,
      [styles.withFixedBanner]: withFixedBanner,
      'new-typography': !isMobile,
    });
    const { position: purpleCarpetBannerPosition, height: bannerHeight, type: bannerType } = purpleCarpetBanner;

    const appContentClassName = classNames(styles.appContent, {
      [styles.withAppDownloadBanner]: appDownloadBanner.isShown,
      [styles.withPurpleCarpetTopBanner]: purpleCarpetBannerPosition === PurpleCarpeBannerPosition.TOP,
    });

    const topNav = <RefreshTopNav pathname={pathname} />;

    const showExposureLogOverlay =
      !(__PRODUCTION__ && !__IS_ALPHA_ENV__) && !(__SERVER__ && SHOULD_FETCH_DATA_ON_SERVER);

    const isCrawlingEnabled = __WEBPLATFORM__ === 'WEB' && __PRODUCTION__ && !__IS_ALPHA_ENV__;

    const app = (
      <ThemeProvider>
        <div id="app" className={className}>
          <OnetrustScript />
          <WebRefreshProvider value={this.webRefreshStatus}>
            <Helmet {...getAppMetaData({ intl, isKidsModeEnabled, isCrawlingEnabled })} />
            <TubiNotifications />
            <LazyChromecastSender />
            <LazyAgeGateModal />
            <LazyRemindModal />
            <div
              className={appContentClassName}
              style={{
                paddingBottom:
                  purpleCarpetBannerPosition === PurpleCarpeBannerPosition.BOTTOM && bannerHeight
                    ? `${bannerHeight}px`
                    : undefined,
              }}
            >
              {shouldRenderTopNav(pathname) ? topNav : null}
              {children}
            </div>
            {purpleCarpetBannerPosition !== PurpleCarpeBannerPosition.NONE ? (
              <PurpleCarpetBanner position={purpleCarpetBannerPosition} type={bannerType} />
            ) : null}
            {purpleCarpetBannerPosition !== PurpleCarpeBannerPosition.TOP && appDownloadBanner.isAvailable ? (
              <LazyAppDownloadBanner isShown={appDownloadBanner.isShown} />
            ) : null}
            {purpleCarpetBannerPosition !== PurpleCarpeBannerPosition.BOTTOM ? <LazyFixedBanner /> : null}
            <LazyOneTap />
            {showExposureLogOverlay ? (
              <Suspense fallback={null}>
                <LazyExposureLogOverlay />
              </Suspense>
            ) : null}
            <InitialConsentModal />
          </WebRefreshProvider>
        </div>
      </ThemeProvider>
    );

    // react-helmet-async requires HelmetProvider for client-side rendering
    if (__CLIENT__) {
      return <HelmetProvider>{app}</HelmetProvider>;
    }
    return app;
  }
}

export const RawApp = App;

export function fetchDataDeferred({ getState, dispatch, location }: FetchDataParams) {
  const promises = [];
  const state = getState();
  const {
    ui: { isKidsModeEnabled },
  } = state;

  // sync user auth data from server
  if (isLoggedInSelector(state)) {
    promises.push(alwaysResolve(dispatch(loadQueue(location))));
    promises.push(alwaysResolve(dispatch(loadHistory())));
    if (!isKidsModeEnabled) {
      promises.push(alwaysResolve(dispatch(loadReminder())));
    }
  }

  return Promise.all(promises).catch(
    // Error handling is excluded from the test coverage because the current promises are all
    // resolved using alwaysResolve. However, this logic is retained for future resolvable promises.
    /* istanbul ignore next */ (err) => {
      logger.error(err, 'Error while fetching deferred data - App');
      return Promise.reject(err);
    }
  );
}

export function fetchData({ getState, dispatch }: FetchDataParams) {
  if (isLoggedInSelector(getState())) {
    // will try loadUserSettings twice, and will resolve true no matter what (if first attempt fails)
    return tryTwice(loadUserSettings, dispatch, true);
  }
}

export const mapStateToProps = (state: StoreState, { location }: OwnProps) => {
  const {
    auth,
    fixedBanner: { bannerState },
    ui: { containerMenuVisible, isKidsModeEnabled, viewportType, isMobile },
  } = state;

  // isHome is used by TopNav to put an H1 on the grid homepage.
  const { pathname, query } = location;
  const { deviceId = '', firstSeen } = auth;
  const isLoggedIn = !!(auth && auth.user);

  const isCoppaEnabled = isCoppaEnabledSelector(state);
  const isGDPREnabled = isGDPREnabledSelector(state);

  const isAgeGateRequired = isAgeGateRequiredSelector(state);
  const isPlaybackEnabled = isPlaybackEnabledSelector(state);
  const isThirdPartySDKLoadable = isPlaybackEnabled && (!isCoppaEnabled || (isCoppaEnabled && !isAgeGateRequired));

  return {
    deviceId,
    pathname,
    query,
    containerMenuVisible,
    isKidsModeEnabled,
    isPlaybackEnabled,
    isThirdPartySDKLoadable,
    isCoppaEnabled,
    viewportType,
    isLoggedIn,
    isMobile,
    isMovieAndTVShowNavEnabled: isMovieAndTVShowNavEnabledSelector(state),
    withFixedBanner: bannerState !== null,
    appDownloadBanner: appDownloadBannerSelector(state, pathname),
    purpleCarpetBanner: purpleCarpetBannerSelector(state, { pathname }),
    firstSeen,
    isGDPREnabled,
  };
};

const connected = hoistNonReactStatics(connect(mapStateToProps)(injectIntl(App)), App);

export default withReactRouterModernContextAdapter(
  withExperiment(connected, {
    webAllCategories: WebAllCategories,
    webAnalyticsAnonymousToken: WebAnalyticsAnonymousToken,
  })
);
