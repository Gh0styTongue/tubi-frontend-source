/* istanbul ignore file */

import React from 'react';
import type { ComponentClass } from 'react';
import { defineMessages } from 'react-intl';
import type { RouteComponent, RouteProps } from 'react-router';
import { IndexRoute, Route, Redirect } from 'react-router';
import type { Store } from 'redux';
import type { ValueOf } from 'ts-essentials';

import { setTopNavVisibleState } from 'common/actions/ui';
import { LEGAL_TYPES } from 'common/constants/legalAsset';
import { WEB_ROUTES, DEBUG_ROUTES } from 'common/constants/routes';
import {
  loginRequired,
  verifyToken,
  noLoginRequiredWeb,
  noLockedInKidsMode,
  redirectContainer,
  redirectSearch,
  redirectToCorrectVideoPageOnEnter,
  landingRedirect,
  containerOnEnterHandler,
  channelOnEnterHook,
  webLiveNewsOnEnterHook,
  checkMagicLinkStatusHook,
  checkRegistrationLinkStatusHook,
  moviesTVShowsOnEnterHook,
  webMyStuffOnEnterHook,
  webContainersOnEnterHook,
  chainHooksAsync,
  privacyCenterOnEnterHook,
  privacyCenterRedirectHook,
  requireQueryEmailHook,
  redirectKids,
  redirectEspanol,
  onLeaveVideoHook,
  webAppEnterHook,
  redirectIfMajorEventFailsafeActive,
} from 'common/helpers/routing';
import { trimBaseUrl, addLocalePrefix } from 'common/utils/urlManipulation';
import { LOCALE_URL_PREFIXES } from 'i18n/constants';
import App from 'web/containers/App/App';
import { upcomingOnEnterHook } from 'web/features/upcoming/utils/landing';
import { watchScheduleOnEnterHook } from 'web/features/watchSchedule/utils/landing';

const messages = defineMessages({
  support: {
    description: 'support page title',
    defaultMessage: 'Contact Tubi Support',
  },
  stubiosDMCA: {
    description: 'stubiosDMCA page title',
    defaultMessage: 'Report Intellectual Property Infringement',
  },
  accessibilityFeedback: {
    description: 'accessibility feedback form title',
    defaultMessage: 'Accessibility Feedback Process',
  },
  terms: {
    description: 'terms and conditions page title',
    defaultMessage: 'Terms',
  },
  termsUse: {
    description: 'terms of use page title',
    defaultMessage: 'Terms of Use',
  },
  privacy: {
    description: 'privacy page title',
    defaultMessage: 'Privacy',
  },
  yourPrivacyChoices: {
    description: 'your privacy choices page title',
    defaultMessage: 'Your Privacy Choices',
  },
  b2bPrivacy: {
    description: 'your privacy choices page title',
    defaultMessage: 'Tubi Business to Business Privacy Policy',
  },
  cookies: {
    description: 'your privacy choices page title',
    defaultMessage: 'Cookies',
  },
  supportedDevices: {
    description: 'supported devices page title',
    defaultMessage: 'Supported Devices',
  },
});

// TODO: Suspense + React.lazy in React 18+?
function lazy(importPromiseFn: () => Promise<{ default: RouteComponent }>): RouteProps['getComponent'] {
  return (nextState, callback) => importPromiseFn().then(module => callback(null, module.default));
}

const LazyHome = lazy(() => import(
  /* webpackChunkName: "web-home" */
  'web/containers/Home/Home'
));

// The typing of RouteProps does not include the exact property.
// The exact property should be required prior to react-router v6
const ExactRoute = Route as ComponentClass<RouteProps & {
  embedded?: boolean;
  exact?: boolean;
  legalType?: ValueOf<typeof LEGAL_TYPES>;
  pageName?: string;
  noContainerCls?: boolean;
  titleMessageDescriptor?: { description: string; defaultMessage: string; };
}>;

export default (store: Store) => {
  const requireLogin = loginRequired.bind(null, store);
  const containerOnEnter = containerOnEnterHandler.bind(null, store);
  const landingEnterRedirect = landingRedirect.bind(null, store);
  const verifyTokenHook = verifyToken.bind(null, store);
  const embedOnEnter = redirectToCorrectVideoPageOnEnter.bind(null, store);
  const appOnEnter = webAppEnterHook.bind(null, store);
  const channelOnEnter = channelOnEnterHook.bind(null, store);
  const webLiveNewsOnEnter = webLiveNewsOnEnterHook.bind(null, store);
  const checkMagicLinkStatus = checkMagicLinkStatusHook.bind(null, store);
  const checkRegistrationLinkStatus = checkRegistrationLinkStatusHook.bind(null, store);
  const requireQueryEmailOnEnter = chainHooksAsync(noLoginRequiredWeb, requireQueryEmailHook).bind(null, store);
  const watchScheduleOnEnter = watchScheduleOnEnterHook.bind(null, store);
  const upcomingOnEnter = upcomingOnEnterHook.bind(null, store);
  const moviesTVShowsOnEnter = moviesTVShowsOnEnterHook.bind(null, store);
  const webMyStuffOnEnter = webMyStuffOnEnterHook.bind(null, store);
  const webContainersOnEnter = webContainersOnEnterHook.bind(null, store);
  const signInOrSignUpOnEnter = chainHooksAsync(noLockedInKidsMode, noLoginRequiredWeb).bind(null, store);
  const privacyCenterOnEnter = privacyCenterOnEnterHook.bind(null, store);
  const privacyCenterRedirect = privacyCenterRedirectHook.bind(null, store);
  const onLeaveVideo = onLeaveVideoHook.bind(null, store);
  const searchOnEnter = redirectSearch.bind(null, store);
  const majorEventFailsafeOnEnter = redirectIfMajorEventFailsafeActive.bind(null, store);

  // NOTE in order to enable HMR in development env, we use `component` prop to explicitly load dynamic modules
  // @link https://github.com/gaearon/react-hot-loader/issues/288
  return (
    <Route path={WEB_ROUTES.home} onEnter={appOnEnter} component={App}>
      <IndexRoute getComponent={LazyHome} />

      <Route
        path={addLocalePrefix(WEB_ROUTES.landing)}
        onEnter={landingEnterRedirect}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-landing" */
            'web/containers/LandingPage/LandingPage'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.disasterMode}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-disaster-mode" */
            'web/features/purpleCarpet/containers/DisasterMode/DisasterMode'
          ))
        }
      />

      {LOCALE_URL_PREFIXES.map((locale) => (
        <Route
          key={locale}
          path={`/${locale}`}
          getComponent={LazyHome}
        />
      ))}

      {LOCALE_URL_PREFIXES.map((locale) => (
        // we did 301 redirection on server side, this Redirect is in case of SSR off, fallback to client side redirect
        <Redirect
          key={`/${locale}${WEB_ROUTES.deprecatedHome}`}
          from={`/${locale}${WEB_ROUTES.deprecatedHome}`}
          to={`/${locale}`}
        />
      ))}
      <Redirect from={WEB_ROUTES.deprecatedHome} to={WEB_ROUTES.home} />

      <ExactRoute exact path={WEB_ROUTES.movies} getComponent={LazyHome} onEnter={moviesTVShowsOnEnter} />
      <ExactRoute exact path={WEB_ROUTES.tvShows} getComponent={LazyHome} onEnter={moviesTVShowsOnEnter} />
      <ExactRoute
        exact
        path={WEB_ROUTES.myStuff}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-mystuff" */
            'web/containers/MyStuff/MyStuff'
          ))
        }
        onEnter={webMyStuffOnEnter}
      />
      <ExactRoute
        exact
        path={WEB_ROUTES.categories}
        onEnter={webContainersOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-containers" */
            'web/containers/Containers/Containers'
          ))
        }
      />
      {[WEB_ROUTES.movieDetail, WEB_ROUTES.tvShowDetail].map((route) => (
        <Route
          key={route}
          path={route}
          onLeave={onLeaveVideo}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-video" */
              'web/features/playback/containers/Video/Video'
            ))
          }
        />
      ))}
      {[WEB_ROUTES.seriesDetail, WEB_ROUTES.seriesSeasonDetail].map((route) => (
        <Route
          key={route}
          path={route}
          getComponent={lazy(() => import(
            /* webpackChunkName: "web-video" */
            'web/containers/Series/Series'
          ))
          }
        />
      ))}
      <Route
        path={WEB_ROUTES.live}
        onEnter={webLiveNewsOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-live" */
            'web/containers/LivePage/LivePage'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.liveDetail}
        onEnter={webLiveNewsOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-live" */
            'web/features/playback/containers/LivePlayer/LivePlayer'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.watchSchedule}
        onEnter={watchScheduleOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-watch-schedule" */
            'web/features/watchSchedule/containers/Landing/Landing'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.upcoming}
        onEnter={upcomingOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-upcoming" */
            'web/features/upcoming/containers/Landing/Landing'
          ))
        }
      />

      {/* redirect no params search route "/search?v=:keywords" to "/search/:keywords", otherwise go back to "/home" */}
      <Route path={WEB_ROUTES.search} onEnter={searchOnEnter} />
      {/* redirect "/search/activate" to "/activate", according to https://app.clubhouse.io/tubi/story/91796 */}
      <Redirect from={WEB_ROUTES.searchActivateRedirect} to={WEB_ROUTES.activate} />

      <Route
        path={WEB_ROUTES.searchKeywords}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-search", webpackPrefetch: true */
            'web/containers/Search/Search'
          ))
        }
        onEnter={majorEventFailsafeOnEnter}
      />

      <ExactRoute
        path={WEB_ROUTES.failsafeFallback}
        pageName="FailsafeFallback"
        embedded
        noContainerCls
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-failsafe" */
            'web/containers/StaticPage/StaticPage'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.person}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-person" */
            'web/features/person/containers/Person/Person'
          ))
        }
      />

      {/* change redirect below to 301 when we finally update React Router */}
      <Redirect from={WEB_ROUTES.signupEmailRedirect} to={WEB_ROUTES.register} />
      <Route
        path={WEB_ROUTES.register}
        onEnter={signInOrSignUpOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-signup" */
            'web/features/authentication/containers/SignUp/SignUp'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.account}
        onEnter={requireLogin}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-auth" */
            'web/containers/UserSettings/UserSettings'
          ))
        }
      >
        <IndexRoute
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/Profile/Profile'
            ))
          }
        />
        <Route
          path={trimBaseUrl(WEB_ROUTES.account, WEB_ROUTES.parentalControl)}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/Parental/Parental'
            ))
          }
        />
        <Route
          path={trimBaseUrl(WEB_ROUTES.account, WEB_ROUTES.accountNotification)}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/Notifications/NotificationsContainer'
            ))
          }
        />
        <Route
          path={trimBaseUrl(WEB_ROUTES.account, WEB_ROUTES.accountHistory)}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/History/HistoryContainer'
            ))
          }
        />
        <Route
          path={trimBaseUrl(WEB_ROUTES.account, WEB_ROUTES.accountPrivacyCenter)}
          onEnter={privacyCenterOnEnter}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/PrivacyCenter/PrivacyCenter'
            ))
          }
        />
      </Route>

      <Route
        path={WEB_ROUTES.guest}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-auth" */
            'web/containers/UserSettings/UserSettings'
          ))
        }
      >
        <Route
          path={trimBaseUrl(WEB_ROUTES.guest, WEB_ROUTES.guestPrivacyCenter)}
          onEnter={privacyCenterOnEnter}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-auth" */
              'web/containers/UserSettings/PrivacyCenter/PrivacyCenter'
            ))
          }
        />
      </Route>

      <Route path={WEB_ROUTES.privacyCenter} onEnter={privacyCenterRedirect} />

      <Route
        path={WEB_ROUTES.customCaptions}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-custom-cc" */
            'web/containers/CustomCaptions/CustomCaptions'
          ))
        }
      />

      <Redirect from={WEB_ROUTES.registerRedirect} to={WEB_ROUTES.signIn} />
      <Route
        path={WEB_ROUTES.signIn}
        onEnter={signInOrSignUpOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-login" */
            'web/features/authentication/containers/Login/Login'
          ))
        }
      />
      {['forgot', 'password'].map((pathname) => (
        <Route
          key={pathname}
          path={pathname}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-login" */
              'web/features/authentication/containers/Forgot/Forgot'
            ))
          }
        />
      ))}

      <Redirect from={WEB_ROUTES.rokuRedirect} to={WEB_ROUTES.activate} />
      <Route
        path={WEB_ROUTES.activate}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-activate" */
            'web/features/authentication/containers/Activation/Activation'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.resetToken}
        onEnter={verifyTokenHook}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-token" */
            'web/features/authentication/containers/ResetPassword/ResetPassword'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.magicLinkStatus}
        onEnter={checkMagicLinkStatus}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-magic-link" */
            'web/features/authentication/containers/MagicLink/MagicLink'
          ))}
      />

      <Route
        path={WEB_ROUTES.registrationLinkStatus}
        onEnter={checkRegistrationLinkStatus}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-registration-link" */
            'web/features/authentication/containers/RegistrationLink/RegistrationLink'
          ))}
      />

      <Route
        path={WEB_ROUTES.signInWithMagicLink}
        onEnter={requireQueryEmailOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-sign-in-with-magic-link" */
            'web/features/authentication/containers/SignInWithMagicLink/SignInWithMagicLink'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.magicLinkFromEmail}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-magic-link-from-email" */
            'web/features/authentication/containers/MagicLinkFromEmail/MagicLinkFromEmail'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.enterPassword}
        onEnter={requireQueryEmailOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-sign-in-with-magic-link" */
            'web/features/authentication/containers/EnterPassword/EnterPassword'
          ))
        }
      />

      { /** container pages */}
      <Route path={WEB_ROUTES.container} onEnter={redirectContainer} />
      <Route
        path={WEB_ROUTES.categoryIdTitle}
        onEnter={containerOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-container" */
            'web/containers/Container/Container'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.collection}
        onEnter={containerOnEnter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-container" */
            'web/containers/Container/Container'
          ))
        }
      />
      { /* Change the 'channels' routes to 'networks' routes because 'channel' would be confusing with the Live content */ }
      <Route
        path={WEB_ROUTES.channelId}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-container" */
            'web/containers/Container/Container'
          ))
        }
      />
      { /* Redirect the removed 'channels' routes to the correct container page */ }
      { /* Using a null component because the onEnter hook will always redirect to 'networks/:id' */ }
      <Route
        path={WEB_ROUTES.legacyChannelId}
        onEnter={channelOnEnter}
        component={() => null}
      />

      { /* Redirect removed embed routes to the correct video details URL */ }
      { /* Using a noop component because the onEnter hook will always redirect */ }
      <Route
        path={WEB_ROUTES.embedIdTitle}
        onEnter={embedOnEnter}
        component={() => null}
      />

      <Route
        path={WEB_ROUTES.sweepstakes}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-sweepstakes"*/
            'web/containers/Sweepstakes/Sweepstakes'
          ))
        }
      />

      { /* All Static Pages */}
      <ExactRoute
        path={WEB_ROUTES.termsEmbedded}
        legalType={LEGAL_TYPES.terms}
        embedded
        titleMessageDescriptor={messages.terms}
        onEnter={() => {
          store.dispatch(setTopNavVisibleState(false));
        }}
        onLeave={() => {
          store.dispatch(setTopNavVisibleState(true));
        }}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-terms" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <Redirect from={WEB_ROUTES.termsRedirect} to={WEB_ROUTES.terms} />
      <ExactRoute
        path={WEB_ROUTES.terms}
        legalType={LEGAL_TYPES.terms}
        titleMessageDescriptor={messages.termsUse}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-terms" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />

      <ExactRoute
        path={WEB_ROUTES.privacyEmbedded}
        embedded
        legalType={LEGAL_TYPES.privacy}
        titleMessageDescriptor={messages.privacy}
        onEnter={() => {
          store.dispatch(setTopNavVisibleState(false));
        }}
        onLeave={() => {
          store.dispatch(setTopNavVisibleState(true));
        }}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-privacy" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <Redirect from={WEB_ROUTES.privacyRedirect} to={WEB_ROUTES.privacy} />
      <ExactRoute
        path={WEB_ROUTES.privacy}
        legalType={LEGAL_TYPES.privacy}
        titleMessageDescriptor={messages.privacy}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-privacy" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <Redirect from={WEB_ROUTES.privacyDoNotSellRedirect} to={WEB_ROUTES.yourPrivacyChoices} />
      <ExactRoute
        path={WEB_ROUTES.yourPrivacyChoices}
        legalType={LEGAL_TYPES.yourPrivacyChoices}
        titleMessageDescriptor={messages.yourPrivacyChoices}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-privacy" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <ExactRoute
        path={WEB_ROUTES.b2bprivacy}
        legalType={LEGAL_TYPES.b2bPrivacy}
        titleMessageDescriptor={messages.b2bPrivacy}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-privacy" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <ExactRoute
        path={WEB_ROUTES.cookies}
        legalType={LEGAL_TYPES.cookies}
        titleMessageDescriptor={messages.cookies}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-privacy" */
            'web/containers/LegalDoc/LegalDoc'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.helpCenter}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-help-center" */
            'web/containers/HelpCenter/HelpCenter'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.helpCenterArticle}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-help-center" */
            'web/containers/HelpCenter/HelpCenter'
          ))
        }
      />
      <Route
        path={WEB_ROUTES.helpCenterSearch}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-help-center" */
            'web/containers/HelpCenter/HelpCenter'
          ))
        }
      />
      <Redirect from={WEB_ROUTES.helpRedirect} to={WEB_ROUTES.support} />
      <Redirect from={WEB_ROUTES.staticHelpSupportRedirect} to={WEB_ROUTES.support} />
      <Redirect from={WEB_ROUTES.supportRedirect} to={WEB_ROUTES.support} />
      <ExactRoute
        path={WEB_ROUTES.support}
        pageName="SupportPage"
        titleMessageDescriptor={messages.support}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/containers/StaticPage/StaticPage'
          ))
        }
      />
      <Redirect from={WEB_ROUTES.devicesRedirect} to={WEB_ROUTES.devices} />
      <ExactRoute
        path={WEB_ROUTES.devices}
        titleMessageDescriptor={messages.supportedDevices}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/containers/DevicesPage/DevicesPage'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.supportedBrowsers}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/containers/SupportedBrowsers/SupportedBrowsers'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.emailConfirmation}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/features/emailConfirmation/containers/Landing/Landing'
          ))
        }
      />

      {[WEB_ROUTES.emailConfirmationLink, WEB_ROUTES.emailConfirmationTemporaryLink].map((route) => (
        <Route
          path={route}
          key={route}
          getComponent={
            lazy(() => import(
              /* webpackChunkName: "web-email-confirm-with-token" */
              'web/features/authentication/containers/EmailConfirmWithToken/EmailConfirmWithToken'
            ))
          }
        />
      ))}

      <ExactRoute
        path={WEB_ROUTES.stubiosDMCA}
        pageName="StubiosDMCAPage"
        titleMessageDescriptor={messages.stubiosDMCA}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/containers/StaticPage/StaticPage'
          ))
        }
      />

      <ExactRoute
        path={WEB_ROUTES.accessibilityFeedback}
        pageName="AccessibilityFeedback"
        titleMessageDescriptor={messages.accessibilityFeedback}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-support" */
            'web/containers/StaticPage/StaticPage'
          ))
        }
      />

      <Route
        path={WEB_ROUTES.authError}
        getComponent={
          lazy(() => import(
            /* webpackChunkName: "web-signin" */
            'web/features/authentication/containers/AuthError/AuthError'
          ))
        }
      />

      {/* universal is used on mobile app, redirect it to home for web */}
      <Redirect from={WEB_ROUTES.universalRedirect} to={WEB_ROUTES.home} />
      {/* redirect to home with kids mode or espanol mode when going into these path*/}
      <Route path={WEB_ROUTES.kids} onEnter={redirectKids} />
      <Route path={WEB_ROUTES.espanol} onEnter={redirectEspanol} />

      {
        __TESTING__ ? [
          <Route
            key="debug_test500_1"
            path={DEBUG_ROUTES.test500Streamed}
            component={require('web/containers/Debug/Test500/Test500streamed').default}
          />,
          <Route
            key="debug_test500_2"
            path={DEBUG_ROUTES.test500}
            component={require('web/containers/Debug/Test500/Test500').default}
          />,
        ] : null
      }

      {
        __DEVELOPMENT__ || __STAGING__ || __IS_ALPHA_ENV__ ? (
          <Route
            path={WEB_ROUTES.featureSwitch}
            getComponent={
              lazy(() => import(
                /* webpackChunkName: "web-dev" */
                'web/containers/Dev/FeatureSwitch/FeatureSwitch'
              ))
            }
          />
        ) : null

      }

      {
        __DEVELOPMENT__ || __STAGING__ || __IS_ALPHA_ENV__ ? (
          <Route
            path={WEB_ROUTES.iconTest}
            getComponent={
              lazy(() => import(
                /* webpackChunkName: "web-dev" */
                'ott/containers/Dev/IconTest/IconTest'
              ))
            }
          />
        ) : null
      }
    </Route>
  );
};
