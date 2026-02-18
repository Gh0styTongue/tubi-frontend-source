import type { LocationDescriptor } from 'history';
import type { ValueOf } from 'ts-essentials';

import { OTT_DEEPLINK_ROUTE } from 'common/features/ottDeeplink/constants';

import { ACCESSIBILITY_ARTICLE_ID } from './accessibility';

const CORPORATE_HOST = 'https://corporate.tubitv.com';

export const WEB_ROUTES = {
  home: '/',
  landing: '/welcome',
  deprecatedHome: '/home',
  search: '/search',
  searchKeywords: '/search/:keywords',
  account: '/account',
  accountHistory: '/account/history',
  parentalControl: '/account/parental',
  accountNotification: '/account/notifications',
  accountPrivacyCenter: '/account/privacy-center',
  guest: '/guest',
  guestPrivacyCenter: '/guest/privacy-center',
  privacyCenter: '/privacy-center',
  tvShows: '/tv-shows',
  series: '/series',
  movies: '/movies',
  live: '/live', // initially just live news, but later may include other live channels
  myStuff: '/my-stuff',
  // internally these are containers, externally to users they are categories
  container: '/category',
  // internally these are 'channel', externally to users they are 'networks' because 'channel' would be confusing with the Live content
  channel: '/networks',
  channelId: '/networks/:id',
  legacyChannelId: '/channels/:id', // redirects to /networks/:id
  // "/:name" can be updated to "(/:name)" once Person API is ready
  person: '/person/:id/:name',
  movieDetail: '/movies/:id(/:title)',
  tvShowDetail: '/tv-shows/:id(/:title)',
  seriesDetail: '/series/:id(/:title)',
  seriesSeasonDetail: '/series/:id/:title/season-:season',
  liveDetail: '/live/:id(/:title)',
  watchSchedule: '/watch-schedule/:title',
  upcoming: '/upcoming/:title',
  categoryIdTitle: '/category/:id(/:title)',
  collection: '/collection/:id(/:title)',
  embedIdTitle: '/embed/:id(/:title)',
  sweepstakes: '/sweepstakes',
  disasterMode: '/disaster-mode',

  /* auth routes */
  signIn: '/login',
  logout: '/logout',
  activate: '/activate',
  register: '/signup',
  newPassword: '/password',
  forgotPassword: '/forgot',
  reset: '/reset',
  resetToken: '/reset/:token',
  signInWithMagicLink: '/signin-with-magic-link',
  magicLinkStatus: '/magic-link/:status',
  magicLinkFromEmail: '/user/magic-link/:uid',
  registrationLinkStatus: '/registration-link/:status',
  enterPassword: '/enter-password',

  /* static routes */
  support: '/static/support',
  supportedBrowsers: '/static/supported-browsers',
  devices: '/static/devices',
  terms: '/static/terms',
  termsEmbedded: '/termsEmbedded.html',
  privacy: '/static/privacy',
  privacyEmbedded: '/privacyEmbedded.html',
  yourPrivacyChoices: '/privacy/your-privacy-choices',
  b2bprivacy: '/static/b2bprivacy',
  cookies: '/static/cookies',
  helpCenter: '/help-center',
  helpCenterArticle: '/help-center/:category/articles/:articleId',
  helpCenterSearch: '/help-center/search',
  customCaptions: '/preference/captions',
  accessibilityHelpCenter: `/help-center/Accessibility/articles/${ACCESSIBILITY_ARTICLE_ID}`,
  notFound: '/notfound',
  ageUnavailable: '/age-unavailable',
  categories: '/categories',
  emailConfirmation: '/email-confirmation',
  stubiosDMCA: '/legal-report/stubios',
  accessibilityFeedback: '/accessibility/feedback',
  // TODO: This is a workaround approach and will be removed after replacing the link with the next one on email templates.
  emailConfirmationTemporaryLink: '/oz/auth/confirm_email/:token',
  emailConfirmationLink: '/confirm-email/:token',

  /* dev */
  featureSwitch: '/dev/featureSwitch',
  iconTest: '/dev/iconTest',

  /* redirect routes */
  searchActivateRedirect: '/search/activate',
  signupEmailRedirect: '/signup/email',
  registerRedirect: '/register',
  rokuRedirect: '/roku',
  termsRedirect: '/terms(.html)',
  privacyRedirect: '/privacy(.html)',
  privacyDoNotSellRedirect: '/privacy/donotsell',
  helpRedirect: '/help(.html)',
  staticHelpSupportRedirect: '/static/help/support',
  supportRedirect: '/support',
  devicesRedirect: '/devices(.html)',
  universalRedirect: '/universal/*',
  kids: '/kids',
  espanol: '/espanol',
  authError: '/auth-error',
  failsafeFallback: '/failsafe-fallback',
} as const;

export const OTT_ROUTES = {
  home: '/',
  activate: '/activate',
  containers: '/containers/:type',
  containerDetail: '/container/:type/:containerId(/:title)',
  episodeList: '/ott/series/:id/:title/episodes',
  parentalPassWord: '/parental-password',
  search: '/search',
  settings: '/settings',
  notFound: '/ott/notfound',
  compatibility: '/dev/compatibility',
  playerDemo: '/dev/player-demo',
  featureSwitch: '/dev/featureSwitch',
  nativeLivePlayer: '/dev/nativeLivePlayer',
  iconTest: '/dev/iconTest',
  dev: '/dev',
  series: '/series/:id(/:title)',
  video: '/video/:id(/:title)',
  movieMode: '/mode/movie',
  tvMode: '/mode/tv',
  // @deprecated
  // use `liveMode` instead
  deprecatedNewsMode: '/mode/news',
  liveMode: '/mode/live',
  espanolMode: '/mode/espanol',
  landing: '/landing',
  onboarding: '/onboarding/:step',
  majorEventOnboarding: '/major-event-onboarding',
  player: '/ott/player/:id',
  androidPlayer: '/ott/androidplayer/:id',
  livePlayer: '/ott/live/:id',
  trailer: '/ott/player/:id/trailer/:trailerId',
  adPlayer: '/ad/player/:id',
  ageGate: '/age-gate',
  ageUnavailable: '/age-unavailable',
  genderGate: '/gender-gate',
  myStuff: '/my-stuff',
  personalizationTitle: '/personalization-title',
  personalizationTitleThankYou: '/personalization-title-thank-you',
  universalSignIn: '/signin',
  amazonSSO: '/amazon-sso',
  signInWithAmazon: '/signin-with-amazon',
  signInWithComcast: '/signin-with-comcast',
  signInWithMagicLink: '/signin-with-magic-link',
  signInWithGoogleOneTap: '/signin-with-google-one-tap',
  enterEmail: '/enter-email',
  enterEmailWithEscape: '/enter-email-with-escape',
  legalDocs: '/legal',
  deeplink: '/ott/deeplink',
  chooseAccounts: '/choose-accounts',
  consentInitial: '/consent/initial',
  consentContinueWatching: '/consent/continue-watching',
  privacyPreferences: '/privacy-preferences',
  authError: '/auth-error',
  // Adding a new deeplink route
  // `deeplink: '/ott/deeplink'` will eventually be removed once we migrate LGTV and COMCAST to this route
  ottDeeplink: OTT_DEEPLINK_ROUTE,
  disasterMode: '/disaster-mode',
} as const;

export const OTT_CONSENT_PAGE: string[] = [OTT_ROUTES.consentInitial, OTT_ROUTES.privacyPreferences];
export const OTT_CONSENT_BLACKLIST_ROUTES: string[] = [OTT_ROUTES.deeplink, ...OTT_CONSENT_PAGE];
export const DEBUG_ROUTES = {
  test500Streamed: '/debug/test500streamed',
  test500: '/debug/test500',
} as const;

export const AGE_GATE_ROUTE_WITH_REGISTRATION: LocationDescriptor = {
  pathname: OTT_ROUTES.ageGate,
  state: {
    isRegistration: true,
  },
};

export const OTT_LIVE_PLAYER_ROUTE_PREFIX = '/ott/live';

export const EXTERNAL_LINKS = {
  /* Our apps in their respective app Stores */
  appAndroid: 'https://play.google.com/store/apps/details?id=com.tubitv',
  appIOS: 'https://itunes.apple.com/app/tubi-tv-watch-free-movies/id886445756?mt=8',
  appRoku: 'https://channelstore.roku.com/details/41468/tubi-tv',
  appXboxOne: 'http://support.xbox.com/en-US/xbox-one/apps/tubitv',
  appSamsung: 'http://www.samsung.com/us/appstore/app.do?appId=G15115002089',
  appAmazonFireTV: 'https://www.amazon.com/Tubi-Inc-Free-Movies-TV/dp/B075NTHVJW',
  appMicrosoftBrowser: 'https://www.microsoft.com/store/apps/9N1SV6841F0B?cid=$campaignId', // remember to replace $campaignId
  appMicrosoftNative: 'ms-windows-store://pdp/?productid=9N1SV6841F0B&cid=$campaignId', // remember to replace $campaignId

  /* our Social Media accounts */
  facebookPage: 'https://www.facebook.com/tubitv/',
  vimeoPage: 'https://vimeo.com/tubitv',
  instagramPage: 'https://www.instagram.com/tubi',
  twitterPage: 'https://x.com/Tubi',
  linkedInPage: 'https://www.linkedin.com/company/tubi-tv/',
  googlePlusPage: 'https://plus.google.com/117903155856357609216',
  youtubePage: 'https://www.youtube.com/@Tubi',
  tiktokPage: 'https://www.tiktok.com/@tubi',

  /* corporate site routes */
  about: `${CORPORATE_HOST}`,
  careers: `${CORPORATE_HOST}/company/careers/`,
  contact: `${CORPORATE_HOST}/company/contact-us/`,
  advertising: 'https://www.foxadsolutions.com/vertical/tubi/',
  press: `${CORPORATE_HOST}/press-releases/`,
  news: `${CORPORATE_HOST}/press-releases/tubi-in-the-news/`,

  /* legal links */
  privacyCorrection:
    'https://privacyportal.onetrust.com/webform/8d9cb670-94ff-4659-969d-6b15fd288fcc/94dc2adb-d41e-43bf-ae2b-74e2a17e515d',
  privacySensitive:
    'https://privacyportal.onetrust.com/webform/8d9cb670-94ff-4659-969d-6b15fd288fcc/3a47c358-181f-4361-b18c-f869718c3cc8',
};

export enum PAGE_TYPE {
  OTT_HOME = 'OTT_HOME',
  OTT_PLAYBACK = 'OTT_PLAYBACK',
  OTT_VIDEO_DETAIL = 'OTT_VIDEO_DETAIL',
  OTT_VIDEO_PLAYER = 'OTT_VIDEO_PLAYER',
}

export const OTT_PLAYER_ROUTES = [
  OTT_ROUTES.player,
  OTT_ROUTES.livePlayer,
  OTT_ROUTES.trailer,
  OTT_ROUTES.androidPlayer,
];

export const WEB_PRIMARY_ROUTES = [
  WEB_ROUTES.movies,
  WEB_ROUTES.tvShows,
  WEB_ROUTES.live,
  WEB_ROUTES.myStuff,
];

export type WebPrimaryRoutes = ValueOf<typeof WEB_PRIMARY_ROUTES>;

// To optimize LCP for SEO, the player bundles will not be loaded on the following routes
export const WEB_NON_PLAYER_ROUTES = [WEB_ROUTES.landing, WEB_ROUTES.person];

export const LG_DEEPLINK_PAGES = {
  HOME: 'home',
  SERIES: 'series',
  CONTAINER: 'container',
  LIVE: 'live',
  SEARCH: 'search',
  CONTENT: 'content',
};

export const TRANSITION_PAGE_NAMES = {
  HOME: 'home',
  VIDEO: 'video',
  SERIES: 'series',
  EPISODES_LIST: 'episodesList',
  PLAYBACK: 'playback',
  LIVE_PLAYBACK: 'livePlayback',
  SEARCH: 'search',
  ACTIVATE: 'activate',
  CATEGORIES: 'categories',
  NETWORKS: 'networks',
  ESPANOL: 'espanol',
  MODE_MOVIE: 'movie',
  MODE_TV: 'tv',
  MODE_LIVE: 'live',
  CONTAINER_REGULAR: 'containerRegular',
};

export const LOCALIZED_WEB_ROUTES: string[] = [
  WEB_ROUTES.landing,
  WEB_ROUTES.home,
];
