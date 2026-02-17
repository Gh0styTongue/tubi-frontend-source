/* eslint "@typescript-eslint/no-floating-promises": "error" */ // TODO: we should enable this for the entire repo
import { nextTick } from '@adrise/utils/lib/async';
import { parseQueryString } from '@adrise/utils/lib/queryString';
import { isExpectedType } from '@adrise/utils/lib/tools';
import { ActionStatus } from '@tubitv/analytics/lib/pageLoad';
import type { History, Location } from 'history';
import type { ComponentType } from 'react';
import type { MatchCallback, PlainRoute, RouteConfig } from 'react-router';
import { match } from 'react-router';

import { checkTransferUser } from 'client/setup/tasks/transferUser';
import { updatePage } from 'client/snapshot';
import {
  getExperimentGroupTagValue,
  markStart,
  markEnd,
  measureAndReport,
  reportRequestTimings,
} from 'client/utils/performance';
import { goToTizenDeeplinkPage } from 'client/utils/tizen';
import { clearContainerContext } from 'common/actions/container';
import { setContentMode } from 'common/actions/contentMode';
import {
  setServiceUnavailable,
  setNotFound,
  runTransitionCompleteCbs,
  setEspanolMode,
  setShowToastForContentNotFound,
} from 'common/actions/ui';
import { HOT_DEEPLINK_FINISHED, RESET_OTT_CONTAINER_INDEX_MAP, SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import { CONTENT_MODES, IS_PERFORMANCE_COLLECTING_ON, BACK_FROM_PLAYBACK_TO_DETAIL, BACK_FROM_DETAIL_TO_HOME } from 'common/constants/constants';
import { LIVE_AND_VOD_CONTENT_MIXED_UP, ROUTING_BLOCKED } from 'common/constants/error-types';
import * as errorTypes from 'common/constants/error-types';
import * as eventTypes from 'common/constants/event-types';
import { PAGE_TRANSITION_METRIC } from 'common/constants/performance-metrics';
import { OTT_ROUTES, OTT_LIVE_PLAYER_ROUTE_PREFIX, WEB_ROUTES } from 'common/constants/routes';
import { CUSTOM_TAGS } from 'common/constants/tracking-tags';
import OttFireTVContentNotFound from 'common/experiments/config/ottFireTVContentNotFound';
import { FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE } from 'common/experiments/config/ottFireTVSingleScreenOnboarding';
import ExperimentManager from 'common/experiments/ExperimentManager';
import { setLastNavigateFromAndContainerSlug } from 'common/features/playback/utils/adOrigin';
import { isPurpleCarpetContentSelector } from 'common/features/purpleCarpet/selector';
import fetchAllData from 'common/helpers/fetchAllData';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { containerSelector } from 'common/selectors/container';
import { currentContentModeSelector, isHomeOrContentModePage as getIsHomeOrContentModePage } from 'common/selectors/contentMode';
import { isDeepLinkedSelector } from 'common/selectors/deepLink';
import { isWebEpgEnabledSelector } from 'common/selectors/epg';
import { ottFireTVContentNotFoundSelector } from 'common/selectors/experiments/ottFireTVContentNotFound';
import { ottFireTVSingleScreenOnboardingSelector } from 'common/selectors/experiments/ottFireTVSingleScreenOnboarding';
import { shouldShowPersonalizationPromptSelector } from 'common/selectors/experiments/webPersonalizationPrompt';
import trackingManager from 'common/services/TrackingManager';
import type { TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { buildPageLoadEventObject } from 'common/utils/analytics';
import { redirectURLFromComingSoonPlaybackDeepLink, checkIfDeepLinkToUnavailableContent, checkIfErrorShouldRedirectTo404, fixMixedUpContentIdUrl } from 'common/utils/errorCapture';
import { handleExperimentOverride } from 'common/utils/experiment';
import { isAndroidNativePlayer } from 'common/utils/hybAppUtils';
import { tryJSONParse } from 'common/utils/jsonTools';
import hardRedirect from 'common/utils/redirect';
import { isMajorEventFailsafeActive } from 'common/utils/remoteConfig';
import { getPageNameForTracking } from 'common/utils/routePath';
import { shouldTrackNavigateToPage, shouldTrackPageLoad, trackLogging } from 'common/utils/track';
import { makeFullUrl, getURIPiece } from 'common/utils/urlManipulation';
import { isRouteMayNavigateFromEspanolMode, isWebHomeRelatedPages, isDetailsPageUrl, isWebDetailsPageUrl } from 'common/utils/urlPredicates';
import { isComingSoonContent } from 'ott/features/playback/utils/isComingSoonContent';

import { showOTTErrorModal, showOTTNotFoundModal } from './routing-modals';

/*
 * We keep track of the last location we've been and hook up two listeners to the history object so we can automatically
 * fetch the data needed for a component before we actually transition to it. This is to mimic the behavior that the boilerplate
 * that was here had.
 */
let lastMatchedLocBefore: string;
let lastMatchedLocAfter: string;
let currentURI: string = '';

function isHomePage(location: string) {
  return !!location.match(/^\/\??/);
}
function isDetailsPage(pathname: string) {
  return isDetailsPageUrl(pathname) || isWebDetailsPageUrl(pathname);
}

// Only used for testing
export function resetState() {
  lastMatchedLocBefore = '';
  lastMatchedLocAfter = '';
  currentURI = '';
}

const storeLocation = (location: Location | Window['location']) => {
  const { trackingURI, trackingHistoryStack = [] } = trackingManager.getState();
  const action = 'action' in location ? location.action : 'REPLACE';
  trackingManager.storeCurrentUrl(location.pathname);
  switch (action) {
    case 'PUSH':
      trackingManager.storeTrackingHistoryStack([trackingURI, ...trackingHistoryStack]);
      break;
    case 'POP':
      trackingManager.storeTrackingHistoryStack(trackingHistoryStack.slice(1));
      break;
    default:
      break;
  }
};

export const listenBefore = async ({
  continueTransition,
  location,
  routes,
  store,
  history,
  runTasksAfterRedirection,
}: {
  continueTransition: (...args: any[]) => void | Promise<void>;
  location: Location;
  routes: PlainRoute[];
  store: TubiStore;
  history: History;
  runTasksAfterRedirection?: boolean;
}): Promise<void> => {
  storeLocation(location);
  const loc = location.pathname + location.search + location.hash;
  const nextURI = location.pathname + location.search;
  if (IS_PERFORMANCE_COLLECTING_ON) {
    markStart(`${PAGE_TRANSITION_METRIC}_${getPageNameForTracking(location.pathname)}`);
  }
  // Immediately dispatch all the pending
  // actions for NavigateWithinPage event on page transition
  trackingManager.debouncedNavigateWithinPageAction.flush();

  handleExperimentOverride(parseQueryString(location.search), store.dispatch);

  const state = store.getState();
  const isOTTFireTVSingleScreenOnboardingEnabled = ottFireTVSingleScreenOnboardingSelector(state) === FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE.ONE_SCREEN;
  // track navigation
  if (shouldTrackNavigateToPage(currentURI, nextURI, { isOTTFireTVSingleScreenOnboardingEnabled })) {
    const query = state.search.key;
    const currentId = isDetailsPage(currentURI) ? getURIPiece(currentURI, 1) : undefined;
    const nextId = isDetailsPage(nextURI) ? getURIPiece(nextURI, 1) : undefined;
    const isLinearDetails = (!!nextId && isPurpleCarpetContentSelector(state, nextId)) || (!!currentId && isPurpleCarpetContentSelector(state, currentId));
    const {
      video: { byId },
    } = state;
    const extraCtx = {
      query,
      isWebEpgEnabled: isWebEpgEnabledSelector(state),
      isUpcoming:
        isComingSoonContent(currentId && byId[currentId]?.availability_starts) ||
        isComingSoonContent(nextId && byId[nextId]?.availability_starts),
      isLinearDetails,
      isOnboardingCategoryPage: __WEBPLATFORM__ && shouldShowPersonalizationPromptSelector(state),
    };

    trackingManager.trackNavigateToPageEvent(
      { currentPageUrl: currentURI, nextPageUrl: nextURI, extraCtx },
      setLastNavigateFromAndContainerSlug
    );
  }

  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    await checkTransferUser(store);
  }

  if (lastMatchedLocBefore === loc) {
    await continueTransition();
    return;
  }

  const [err, redirectLocation, nextState] = await new Promise<Parameters<MatchCallback>>((resolve) => {
    match({ routes, location: loc, history }, (...args) => {
      resolve(args);
    });
  });

  if (err) {
    if (err.message === ROUTING_BLOCKED) {
      return; // return without continuing to intentionally block routing transition
    }
    // there was no match for this route, redirect to 404
    logger.error({ err, location: loc }, 'Error matching no routes in history.listenBefore.');
    if (__ISOTT__) {
      showOTTNotFoundModal(store, loc, history);
    } else {
      const {
        ui: { userLanguageLocale },
      } = store.getState();
      hardRedirect(makeFullUrl(`/static/404_${userLanguageLocale}.html`));
    }
    return;
  }

  /* istanbul ignore next */
  if (nextState) {
    const { pathname, query = {} } = nextState.location;
    const contentMode = currentContentModeSelector(store.getState(), { pathname });
    // do not change contentMode if live news player page is opened
    const isLiveNewsPlayerPage = pathname.startsWith(OTT_LIVE_PLAYER_ROUTE_PREFIX);
    const isHomeOrContentModePage = getIsHomeOrContentModePage(pathname);
    const isOnHomeRelatedPage = isWebHomeRelatedPages(pathname);
    const state = store.getState();

    if (__ISOTT__) {
      if (isHomeOrContentModePage && !isLiveNewsPlayerPage) {
        store.dispatch(setContentMode({ contentMode }));
        const {
          ottUI: { contentMode: contentModeState },
        } = state;
        if (
          contentModeState.previous !== contentMode
          && contentMode !== CONTENT_MODES.myStuff
          // ensure we don't reset when coming back home from the player
          && contentMode !== CONTENT_MODES.browseWhileWatching
          && contentModeState.previous !== CONTENT_MODES.browseWhileWatching
        ) {
          store.dispatch(actionWrapper(RESET_OTT_CONTAINER_INDEX_MAP));
        }
      }

      const {
        ui: { isEspanolModeEnabled: prevPageEspanolMode },
      } = store.getState();
      const defaultEspanolMode = isRouteMayNavigateFromEspanolMode(pathname) ? prevPageEspanolMode : false;
      const { espanol_mode = defaultEspanolMode } = query;
      const espanolMode = tryJSONParse(espanol_mode, false) || contentMode === CONTENT_MODES.espanol;
      // update the espanol mode status
      store.dispatch(setEspanolMode(espanolMode));
    } else if (isOnHomeRelatedPage) {
      store.dispatch(setContentMode({ contentMode }));
    }

    type ContainerComponent = ComponentType & {
      reserveContainerContext?: boolean
    };
    const containerComponent: ContainerComponent | undefined =
      nextState.components[nextState.components.length - 1];

    if (!containerComponent?.reserveContainerContext) {
      store.dispatch(clearContainerContext());
    }

    try {
      await fetchAllData({
        components: nextState.components,
        deferred: false,
        dispatch: store.dispatch,
        experimentManager: ExperimentManager(store),
        getState: store.getState,
        location,
        params: nextState.params,
      });

      lastMatchedLocBefore = loc;
      if (__ISOTT__ && !isHomeOrContentModePage && !isLiveNewsPlayerPage) {
        store.dispatch(
          setContentMode({
            contentMode,
            notHomeOrContentModePage: true,
          })
        );
      } else if (!isWebHomeRelatedPages) {
        store.dispatch(setContentMode({ contentMode }));
      }
      const redirectURLForComingSoon = redirectURLFromComingSoonPlaybackDeepLink(loc, store.getState());
      if (redirectURLForComingSoon) {
        // for coming soon deeplink flow, we should go straight to video detail. make sure to update deeplinkBackOverride
        store.dispatch(actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_PLAYBACK_TO_DETAIL]: false } }));
        tubiHistory.replace(redirectURLForComingSoon);
      } else if (checkIfDeepLinkToUnavailableContent(loc, store.getState())) {
        OttFireTVContentNotFound(store).logExposure();
        const shouldRedirectToHome = ottFireTVContentNotFoundSelector(store.getState());
        if (shouldRedirectToHome) {
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'exp_redirect_home',
            message: {
              reason: 'fetch data response success',
              location: loc,

            },
          });
          tubiHistory.replace(OTT_ROUTES.home);
          store.dispatch(setShowToastForContentNotFound(true));
        } else {
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'exp_redirect_notfound',
            message: {
              reason: 'fetch data response success',
              location: loc,
            },
          });
          tubiHistory.replace(OTT_ROUTES.notFound);
          store.dispatch(setNotFound(true));
          store.dispatch(
            actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
              data: {
                [BACK_FROM_PLAYBACK_TO_DETAIL]: false,
                [BACK_FROM_DETAIL_TO_HOME]: false,
              },
            })
          );
        }
      }
      await continueTransition();
      return;
    } catch (fetchError) {
      const errorType = fetchError.errType || '';
      // we would like to redirect the mixup content to right player page
      if (LIVE_AND_VOD_CONTENT_MIXED_UP.includes(errorType)) {
        tubiHistory.replace(fixMixedUpContentIdUrl(loc, errorType, store));
        await continueTransition();
        return;
      }
      logger.error(
        fetchError,
        `Error${errorType ? ` - ${errorType}` : ''} while fetching all data in history.listenBefore`
      );
      const isDeepLinked = isDeepLinkedSelector(store.getState());

      if (__ISOTT__) {
        if (
          !lastMatchedLocBefore ||
          // Specific handling for PS4 issue due to the way deeplinks are fetched via JS when dealing with an invalid content ID.
          // Without this, the "Not Found" dialog is not shown correctly.
          (__OTTPLATFORM__ === 'PS4' && isHomePage(lastMatchedLocBefore)) ||
          // Handling for Samsung deeplinks when coppa fails
          (__OTTPLATFORM__ === 'TIZEN' && isDeepLinked)
        ) {
          // no content is showing to the user
          if (checkIfErrorShouldRedirectTo404(errorType)) {
            OttFireTVContentNotFound(store).logExposure();
            const shouldRedirectToHome = ottFireTVContentNotFoundSelector(store.getState());
            if (shouldRedirectToHome) {
              trackLogging({
                type: 'CLIENT:INFO',
                level: 'info',
                subtype: 'exp_redirect_home',
                message: {
                  reason: 'fetch data response fail',
                  location: loc,
                },
              });
              tubiHistory.replace(OTT_ROUTES.home);
              store.dispatch(setShowToastForContentNotFound(true));
            // @ TODO CBENGTSON update this file upon graduation /Users/cbengtson/Development/Main/www/src/client/systemApi/msdk.ts
            } else {
              trackLogging({
                type: 'CLIENT:INFO',
                level: 'info',
                subtype: 'exp_redirect_notfound',
                message: {
                  reason: 'fetch data response fail',
                  location: loc,
                },
              });
              // direct to the not found page
              tubiHistory.replace(OTT_ROUTES.notFound);
              store.dispatch(setNotFound(true));
            }

          } else {
            // some key data is missing, show the service not available page (500 page),
            // stay with the current url so it can refresh when the service is back
            store.dispatch(setServiceUnavailable(true));
          }
          store.dispatch(actionWrapper(HOT_DEEPLINK_FINISHED));
          await continueTransition();
          return;
        }
        // user is viewing some page in the app, just show the error model
        showOTTErrorModal({
          store,
          history,
          location: loc,
          errorCode: fetchError.userFacingCode,
          error: fetchError,
        });
        store.dispatch(actionWrapper(HOT_DEEPLINK_FINISHED));
        // dont call `continueTransition` here because we want to block the
        // transition and just show the error modal instead
      } else {
        if (checkIfErrorShouldRedirectTo404(errorType)) {
          const {
            ui: { userLanguageLocale },
          } = store.getState();
          hardRedirect(makeFullUrl(`/static/404_${userLanguageLocale}.html`));
          return;
        }
      }
    }
    return;
  }
  if (redirectLocation) {
    // keep history action's origin method
    let updateLocation = history.push;
    if (isExpectedType<Location>(location, ['state', 'action'])) {
      updateLocation = {
        POP: history.replace, // we need to use replace or push to handle pop action, otherwise the replace in onEnter hook won't work
        PUSH: history.push,
        REPLACE: history.replace,
      }[location.action];
    }
    updateLocation(redirectLocation);
    // When we call `listenBefore` manually (in client/index.ts), updateLocation won't trigger history listeners
    // as `setupTransitionHooks` is part of `runTasksAfterFetchData`, and it's not called yet.
    // In other cases, we don't need to call callback manually.
    if (runTasksAfterRedirection) {
      await continueTransition();
      return;
    }
    return;
  }

  // there was no match for this route, show 404
  logger.error({ location: loc }, 'Error matching no routes in history.listenBefore.');
  if (__ISOTT__) {
    showOTTNotFoundModal(store, loc, history);
  } else {
    const {
      ui: { userLanguageLocale },
    } = store.getState();
    hardRedirect(makeFullUrl(`/static/404_${userLanguageLocale}.html`));
  }
};

/* istanbul ignore next */
export const listenAfter = async ({
  store,
  routes,
  location,
  history,
}: {
  store: TubiStore;
  routes: RouteConfig;
  location: Location;
  history: History;
}) => {
  const { dispatch, getState } = store;
  const {
    search: { key: query },
  } = getState();

  // send request duration to datadog
  reportRequestTimings();

  if (IS_PERFORMANCE_COLLECTING_ON) {
    const { trackingURI = '' } = trackingManager.getState();
    const referer = getPageNameForTracking(trackingURI);
    let tags;
    if (referer) {
      tags = {
        [CUSTOM_TAGS.REFERER]: referer,
      };
    }
    const experiments: Parameters<typeof getExperimentGroupTagValue>[0] = [];
    const experimentsUserIsIn = experiments.filter((exp) => exp.isInExperiment());
    const experimentTagValue = getExperimentGroupTagValue(experimentsUserIsIn);
    if (experimentTagValue) {
      tags = {
        ...tags,
        [CUSTOM_TAGS.EXPERIMENT_GROUP]: experimentTagValue,
      };
    }
    const markerLabel = `${PAGE_TRANSITION_METRIC}_${getPageNameForTracking(location.pathname)}`;
    markEnd(markerLabel);
    measureAndReport(markerLabel, tags);
  }

  // update currentURI
  currentURI = location.pathname + location.search;
  trackingManager.storeCurrentUrl(currentURI);
  dispatch(actionWrapper(HOT_DEEPLINK_FINISHED));

  const loc = location.pathname + location.search + location.hash;

  const isRetrying = location.state && location.state.retry;
  // if the key data request failed and user press "try again" button, we need fetch data again and do not return here
  if (lastMatchedLocAfter === loc && !isRetrying) {
    return;
  }

  const [err, , nextState] = await new Promise<Parameters<MatchCallback>>((resolve) => {
    match({ routes, location: loc }, (...args) => resolve(args));
  });

  if (err) {
    logger.error(err, 'Error while matching route (change handler)');
  } else if (nextState) {
    // do not send page_load event for native player
    if (!isAndroidNativePlayer(loc)) {
      const {
        video: { byId },
      } = getState();
      const id = isDetailsPage(location.pathname) ? getURIPiece(location.pathname, 1) : undefined;
      const content = id && byId[id];
      let extraCtx: Record<string, unknown> = {
        query,
        isUpcoming: isComingSoonContent(content && content?.availability_starts),
        isOnboardingCategoryPage: __WEBPLATFORM__ && shouldShowPersonalizationPromptSelector(store.getState()),
      };

      if (isDetailsPage(location.pathname) && id && isPurpleCarpetContentSelector(getState(), id)) {
        extraCtx = {
          ...extraCtx,
          isLinearDetails: true,
        };
      }

      const { personalizationId } = containerSelector(store.getState(), { pathname: location.pathname });
      const homePageRoutes = __ISOTT__
        ? [OTT_ROUTES.home, OTT_ROUTES.movieMode, OTT_ROUTES.tvMode, OTT_ROUTES.espanolMode]
        : [WEB_ROUTES.home, WEB_ROUTES.movies, WEB_ROUTES.tvShows, WEB_ROUTES.espanol];
      const isHomePage = (__ISOTT__ && location.pathname === '') || homePageRoutes.some(route => location.pathname.startsWith(route));
      if (location.pathname === WEB_ROUTES.live) {
        extraCtx = {
          ...extraCtx,
          isWebEpgEnabled: isWebEpgEnabledSelector(store.getState()),
        };
      } else if (isHomePage) {
        extraCtx = {
          ...extraCtx,
          personalizationId,
        };
      }

      const isOTTFireTVSingleScreenOnboardingEnabled = ottFireTVSingleScreenOnboardingSelector(store.getState()) === FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE.ONE_SCREEN;

      if (shouldTrackPageLoad(currentURI, { isOTTFireTVSingleScreenOnboardingEnabled })) {
        // if active event is not yet emitted, push the event to the queue and send after active event
        trackingManager.addEventToQueue(
          eventTypes.PAGE_LOAD,
          buildPageLoadEventObject(location.pathname + location.search, ActionStatus.SUCCESS, extraCtx),
        );
      }
      updatePage();
    }

    lastMatchedLocAfter = loc;
    // run FDD asynchronously to avoid server rendering mismatch (#2350)
    await new Promise<void>((resolve) => nextTick(resolve));
    try {
      await fetchAllData({
        components: nextState.components,
        deferred: true,
        dispatch: store.dispatch,
        experimentManager: ExperimentManager(store),
        getState: store.getState,
        location,
        params: nextState.params,
      });
      return dispatch(runTransitionCompleteCbs());
    } catch (ex) {
      if (__ISOTT__) {
        // we block some endpoints when failsafe is active, so we don't need to show the error modal
        /* istanbul ignore else */
        if (!(isMajorEventFailsafeActive() && ex.errType === errorTypes.LOAD_CONTENT_FAIL)) {
          showOTTErrorModal({ store, history, location: loc, errorCode: ex.userFacingCode, error: ex });
        }
      }
      logger.error(ex, 'Error while fetching all data in history.listen');
    }
  } else {
    logger.warn({ location: loc }, 'Location did not match any routes (listen)');
  }
};

/**
 * Handles all routing concerns for the client side. This includes hooking up redux-simple-router and react-router
 * together, as well as hook into the history object to enable automatic data fetching before/after transitions
 *
 * @param store the redux store
 */
export const setupHistory = (store: TubiStore) => {
  const { dispatch, getState } = store;

  if (__ISOTT__) {
    const {
      ottSystem: { tizenDeeplinkPage },
      ui: { notFound },
    } = getState();

    // handle 404 error
    if (notFound) {
      logger.error({ url: location.href }, 'URL does not match any route on the client-side.');
      dispatch(setNotFound(false));
      tubiHistory.replace(OTT_ROUTES.notFound);
    }

    // handle deeplink for tizen app
    if (tizenDeeplinkPage) {
      goToTizenDeeplinkPage({
        deeplinkPage: tizenDeeplinkPage,
        dispatch,
      });
    }
  }

  return tubiHistory;
};
