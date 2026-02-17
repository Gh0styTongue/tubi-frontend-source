import { getQueryStringFromUrl, parseQueryString } from '@adrise/utils/lib/queryString';
import type {
  ExitType,
  FinishAdEventType,
  LiveFinishAdEventType,
  LiveStartAdEventType,
  Reason,
  StartAdEventType,
  AdType,
} from '@tubitv/analytics/lib/adEvent';
import type { Manipulation, AccountEventType, ActionStatus, UserType } from '@tubitv/analytics/lib/authEvent';
import type { AutoPlayAction, AutoPlayEventType } from '@tubitv/analytics/lib/autoplayTypes';
import type { AnalyticsConfigProps, ReferredType, VideoOrSeriesIdType, AuthType } from '@tubitv/analytics/lib/baseTypes';
import type {
  ButtonType,
  ChannelGuideComponent,
  ComponentInteractionButtonComponent,
  ComponentInteractionChannelGuideComponent,
  ComponentInteractionEPGComponent,
  ComponentInteractionEventType,
  ComponentInteractionLeftNavComponent,
  ComponentInteractionTopNavComponent,
  ComponentInteractionMiddleNavComponent,
  ComponentInteractionReminderComponent,
  ComponentInteractionCategoryComponent,
  ComponentInteractionNavigationDrawerComponent,
  EPGComponent,
  UserInteraction,
} from '@tubitv/analytics/lib/componentInteraction';
import type {
  ComponentType,
  DestinationLeftSideNavComponent,
  DestinationTopNavComponent, DestinationMiddleNavComponent,
  DestinationEPGComponent,
  DestinationCategoryComponent,
  NavigationDrawerType,
  ContentTile } from '@tubitv/analytics/lib/components';
import {
  ANALYTICS_DESTINATION_COMPONENTS,
  ANALYTICS_COMPONENTS,
  NavSection,
} from '@tubitv/analytics/lib/components';
import type { DialogAction, DialogEventType, DialogType } from '@tubitv/analytics/lib/dialog';
import type { AppEvent } from '@tubitv/analytics/lib/events';
import type { Experiment, ExposureEventType } from '@tubitv/analytics/lib/experiment';
import type {
  ContainerSelectionEvent,
  ExplicitInteraction,
  GenreSelectionEvent,
  ExplicitFeedbackEventType } from '@tubitv/analytics/lib/explicitFeedback';
import type {
  Action,
  BookmarkEventType,
  CastEventType,
  CastType,
  Channel,
  InputDeviceType,
  Operation,
  SearchEventType,
  SocialShareEventType } from '@tubitv/analytics/lib/genericEvents';
import {
  PlaybackSourceType,
  SearchType,
} from '@tubitv/analytics/lib/genericEvents';
import type { NavigateToPageType } from '@tubitv/analytics/lib/navigateToPage';
import type { MeansOfNavigationType, NavigateWithinPageType } from '@tubitv/analytics/lib/navigateWithinPage';
import type {
  ActionStatus as PageLoadActionStatus,
  PageLoadEventType as PageLoadEvent,
} from '@tubitv/analytics/lib/pageLoad';
import type {
  PageType,
  NewsBrowsePage,
  VideoPlayerPage } from '@tubitv/analytics/lib/pages';
import {
  AccountPageType,
  LandingPageName,
  LoginChoiceType,
  OnboardingPageName,
} from '@tubitv/analytics/lib/pages';
import type {
  FullscreenToggleEventType,
  LivePlayProgressEventType,
  PauseState,
  PauseToggleEventType,
  PlayProgressEventType,
  QualityToggleEventType,
  ResumeAfterBreakEventType,
  SeekEventType,
  SeekType,
  StartLiveVideoEventType,
  StartVideoEventType,
  SubtitlesToggleEventType,
  AudioTrackToggleEventType,
  TrailerPlayProgressEventType,
  Language,
  PictureInPictureToggleEventType,
} from '@tubitv/analytics/lib/playerEvent';
import {
  ToggleState,
  ActionStatus as PlayerActionStatus,
  VideoResourceTypeState,
  VideoResolutionType,
  PlayerDisplayMode,
} from '@tubitv/analytics/lib/playerEvent';
import type { ReferredEvent } from '@tubitv/analytics/lib/referredEvent';
import type { ProgressType, RegisterEventType } from '@tubitv/analytics/lib/registerEvent';
import type { RequestForInfoEventType } from '@tubitv/analytics/lib/requestForInfoEvent';
import { RequestForInfoAction, SelectorType } from '@tubitv/analytics/lib/requestForInfoEvent';
import type { Location } from 'history';
import get from 'lodash/get';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import type { ValueOf } from 'ts-essentials';

import { NOT_SPECIFIED } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { ModelNameRegExp } from 'common/constants/model-name-regexp';
import type { PlatformUppercase as PlatformType } from 'common/constants/platforms';
import type { AuthState, AuthErrorLocationState } from 'common/features/authentication/types/auth';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
import type { FireState } from 'common/types/fire';
import {
  ICTSNavOption,
  LeftNavMenuOption,
  LinearLeftNavMenuOption,
  LinearTopNavOption,
  ContentDetailPageNavOption,
  TopNavOption,
} from 'common/types/ottUI';
import type { UIState } from 'common/types/ui';
import type { VideoResource } from 'common/types/video';
import { getAppMode } from 'common/utils/appMode';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getUserLanguageLocale } from 'common/utils/i18n';
import { isMajorEventActive } from 'common/utils/remoteConfig';
import { decodePersonName } from 'common/utils/seo';

import { isSeriesId } from './dataFormatter';
import { getAnalyticsPlatform } from './getAnalyticsPlatform';
import { trackEvent } from './track';
import { getOnboardingStepNumber, ONBOARDING_REGEX } from './urlPredicates';

type Matrix = {
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
};

export type AnalyticsComponentValueType = ValueOf<typeof ANALYTICS_COMPONENTS>;

export type ComponentObjType = {
  pageUrl?: string;
  matrix: Matrix;
  containerSlug?: string;
  contentId?: string;
  isSeries?: boolean;
  actorName?: string;
  genreName?: string;
  componentType: AnalyticsComponentValueType;
  isDestinationComponent?: boolean;
  extraCtx?: PageTypeExtraCtx;
};

export type ReduxState = {
  auth: Partial<AuthState>,
  fire: Partial<FireState>,
  ui: Partial<UIState>,
};

declare global {
  interface Navigator {
    connection: {
      downlink: number,
    };
  }
}

/**
 * Get auth type from redux state
 */
export const getAuthType = (state?: ReduxState): AuthType => {
  if (!state?.auth.user) {
    return 'NOT_AUTHED';
  }
  return get(state, 'auth.user.authType', 'UNKNOWN');
};

/**
 * Return downlink speed from navigator.connection.downlink.
 * If the downlink speed is not a safe integer then return default downlink value.
 */
function getNominalSpeed(): number {
  const defaultNominalSpeed = 0;
  const downlinkSpeed = get(window, 'navigator.connection.downlink', defaultNominalSpeed);
  if (downlinkSpeed > Number.MAX_SAFE_INTEGER || downlinkSpeed < 0) return defaultNominalSpeed;
  return Math.floor(downlinkSpeed);
}

export function getClientConfig() {
  if (__SERVER__) {
    return {};
  }
  const platform: PlatformType = __OTTPLATFORM__ || __WEBPLATFORM__;
  let appHeight = get(window, 'innerHeight', 0);
  let appWidth = get(window, 'innerWidth', 0);
  let screenHeight = get(window, 'screen.height', 0);
  let screenWidth = get(window, 'screen.width', 0);

  /**
   * as issue from https://app.clubhouse.io/tubi/story/58358,
   * scripts can not acquire right window size in AndroidTV & FireTV for unknown reasons.
   *
   * and screen size is equal to window size in these 2 platforms after inspection,
   * overriding window size by device screen size in AndroidTV & FireTV,
   */
  if (__IS_ANDROIDTV_HYB_PLATFORM__ || platform === 'FIRETV_HYB') {
    appHeight = screenHeight;
    appWidth = screenWidth;
  }

  /**
     * for some reason screenWidth on Samsung returns a negative value,
     * and their `systemapi` for getting width and height returns a boolean.
     *
     * so resorting to using innerWidth and innerHeight if screenWidth does not exist or is negative
     */
  if (platform === 'TIZEN') {
    screenHeight = screenHeight && screenHeight >= 0 ? screenHeight : appHeight;
    screenWidth = screenWidth && screenWidth >= 0 ? screenWidth : appWidth;
  }
  return {
    nominal_speed: getNominalSpeed(),
    app_height: appHeight,
    app_width: appWidth,
    device_height: screenHeight,
    device_width: screenWidth,
  };
}

export const buildAnalyticsLocaleObject = (country?: string) => {
  const langLocale = getUserLanguageLocale(country);
  if (!langLocale) {
    return null;
  }
  return {
    locale: {
      identifier: langLocale.replace('-', '_'),
      language: langLocale.substring(0, 2).toUpperCase(),
    },
  };
};

/**
 * Transform tubi state to analytics package configuration
 */
export const transformStateToAnalyticsConfig = (
  state: ReduxState,
  extraCtx?: AnalyticsConfigProps,
): AnalyticsConfigProps => {
  const platform: PlatformType = __OTTPLATFORM__ || __WEBPLATFORM__;

  const analyticsPlatform = getAnalyticsPlatform(platform);
  const releaseHash = __RELEASE_HASH__;

  // Add hybrid_version when it is a hybrid app or platforms that have a native app version like Samsung.
  let hybridVersion = {};
  if (platform === 'FIRETV_HYB' || __IS_ANDROIDTV_HYB_PLATFORM__ || platform === 'TIZEN' || platform === 'PS4') {
    hybridVersion = {
      hybrid_version: get(state, 'fire.appVersion.clientVersion', ''),
    };
  }

  const user_agent = get(state, 'ui.userAgent.ua', NOT_SPECIFIED);
  const modelFromUa = (user_agent.match(ModelNameRegExp[analyticsPlatform]) ?? [])[1];

  /**
   * set os_version and model properties to a more detailed value
   * using firmware version, as it is more specific to the ott device firmware
   * which will help in debugging any issues we encounter on ott devices
   */
  const osVersion = get(state, 'ottSystem.deviceFirmware', null) || get(state, 'ui.userAgent.os.version', '0');
  const model = get(state, 'ottSystem.deviceModel', null) || modelFromUa || analyticsPlatform;

  const manufacturer = get(state, 'ottSystem.deviceManufacturer', null) || get(extraCtx, 'brand', analyticsPlatform);
  // this value must be of type string
  // or v2 analytics endpoint will return 400 response
  // with a validation error
  if (!__PRODUCTION__ && manufacturer !== null && typeof manufacturer !== 'string') {
    throw new Error(`manufacturer must be of type string ${manufacturer} provided`);
  }

  const browserName = get(state, 'ui.userAgent.browser.name');
  const browserVersion = get(state, 'ui.userAgent.browser.major') || get(state, 'ui.userAgent.browser.version');

  const appVersion = get(state, 'fire.appVersion.clientVersion', releaseHash);

  const country = get(state, 'ui.twoDigitCountryCode', undefined);

  const appMode = getAppMode(get(state, 'ui'));

  return {
    device_id: get(state, 'auth.deviceId', NOT_SPECIFIED),
    user_agent,
    is_mobile: get(state, 'ui.isMobile', false),
    platform: analyticsPlatform,
    os: get(state, 'ui.userAgent.os.name', NOT_SPECIFIED),
    os_version: osVersion,
    app_version: appVersion,
    browser_name: browserName,
    browser_version: browserVersion,
    app_version_numeric: __APP_VERSION_NUMERIC__,
    manufacturer,
    model,
    user_id: get(state, 'auth.user.userId'),
    auth_type: getAuthType(state),
    app_mode: appMode,
    ...extraCtx,
    ...hybridVersion,
    ...getClientConfig(),
    ...buildAnalyticsLocaleObject(country),
  };
};

export interface ReferredCtx {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  source_device_id?: string | string[];
  source_platform?: string | string[];
  braze_id?: string;
}

export interface PageTypeExtraCtx {
  isUpcoming?: boolean;
  isLinearDetails?: boolean;
  query?: string;
  pageType?: AccountPageType;
  isWebEpgEnabled?: boolean;
  isOnboardingCategoryPage?: boolean;
  personalizationId?: string;
  location?: Location;
  isNewCategoryPage?: boolean;
  contentId?: string;
}

/**
 * Get the event object for series detail page or video detail page needed for the analytics engine
 */
export const contentURIParseFn = (url: string): PageType => {
  // eg1: `/video/465235/rango/rango_unchanined?hello/123` to ['video', '465235']
  // eg2: `/series/1234/testseries` to ['series', '1234']
  const fields = url.substr(1).split('/').slice(0, 2);
  if (fields[0] === 'series') {
    return {
      series_detail_page: {
        series_id: parseInt(fields[1], 10),
      },
    };
  }

  return {
    video_page: {
      video_id: parseInt(fields[1], 10),
    },
  };
};

/**
 * Build the video/series content object if it exists
 * @param contentId
 * @param isSeries
 */
export const buildContentObject = (contentId?: string, isSeries?: boolean) => {
  if (!contentId || isNaN(Number(contentId))) return null;
  if (isSeries) {
    return {
      series_id: parseInt(contentId, 10),
    };
  }
  return {
    video_id: parseInt(contentId, 10),
  };
};

/**
 * ContainerComponent
 * https://github.com/adRise/protos/blob/master/analytics/client.proto#L641
 */
export const createContainerComponent = ({ matrix, containerSlug, contentId,
  isSeries, extraCtx, isDestinationComponent }: ComponentObjType): ComponentType => {
  if (!containerSlug) {
    const genericComponent: Partial<ComponentType> = {
      [ANALYTICS_COMPONENTS.genericComponent]: {
        generic_component_type: 'Unknown Container Component',
      },
    };
    return genericComponent as ComponentType;
  }
  const seriesOrVideo = buildContentObject(contentId, isSeries);
  const contentTile =
    seriesOrVideo && matrix.startX > 0
      ? {
        content_tile: {
          row: extraCtx?.isNewCategoryPage ? matrix.startY : 1,
          col: matrix.startX,
          ...seriesOrVideo,
        },
      }
      : extraCtx?.isNewCategoryPage
        ? {
          utility_tile: {
            id: extraCtx.contentId,
            row: matrix.startY,
            col: matrix.startX,
          },
        }
        : null;
  const containerObj: Partial<ComponentType> = {
    [isDestinationComponent
      ? ANALYTICS_DESTINATION_COMPONENTS.destinationCategoryComponent
      : ANALYTICS_COMPONENTS.containerComponent]: {
      category_slug: containerSlug,
      category_col: matrix.startX,
      category_row: matrix.startY,
      ...contentTile,
    },
  };
  return containerObj as ComponentType;
};

export const createBrowserMenuComponent = ({ containerSlug }: ComponentObjType): ComponentType => {
  return {
    browser_menu_component: {
      category_slug: containerSlug,
    },
  };
};

/**
 * GenreListComponent
 */
export const createGenreListComponent = ({ genreName }: ComponentObjType): ComponentType => {
  const genreListObj: Partial<ComponentType> = {
    [ANALYTICS_COMPONENTS.genreListComponent]: {
      genre_name: genreName!,
    },
  };
  return genreListObj as ComponentType;
};

export const createTopNavComponent = ({ matrix }: ComponentObjType): ComponentType => {
  return {
    top_nav_component: {
      top_nav_section: mapTopNavOptionToAnalyticsSection(matrix.endX),
    },
  };
};

export type MapTopNavOptionToAnalyticsSectionFunc = (option: number | undefined) => NavSection;

export const mapTopNavOptionToAnalyticsSection: MapTopNavOptionToAnalyticsSectionFunc = (option: number | undefined) => {
  switch (option) {
    case TopNavOption.Recommended: return NavSection.HOME;
    case TopNavOption.Movies: return NavSection.MOVIES;
    case TopNavOption.TVShows: return NavSection.SERIES;
    case TopNavOption.Linear: return NavSection.LINEAR;
    case TopNavOption.Sports: return NavSection.SPORTS;
    case TopNavOption.Espanol: return NavSection.ESPANOL;
    case TopNavOption.MyStuff: return NavSection.QUEUE;
    default: return NavSection.HOME;
  }
};

export const mapLinearTopNavOptionToAnalyticsSection: MapTopNavOptionToAnalyticsSectionFunc = (option: number | undefined) => {
  switch (option) {
    case LinearTopNavOption.All: return NavSection.HOME;
    case LinearTopNavOption.News: return NavSection.NEWS;
    case LinearTopNavOption.Sports: return NavSection.SPORTS;
    default: return NavSection.HOME;
  }
};

// see more details: https://docs.google.com/document/d/1eBkPnQ5G_mc7e84TGxHdSab2rL4MK451PKa4R5YWTtQ/edit#
export const mapICTSNavOptionToAnalyticsSection: MapTopNavOptionToAnalyticsSectionFunc = (option: number | undefined) => {
  switch (option) {
    case ICTSNavOption.Movies: return NavSection.MOVIES;
    case ICTSNavOption.TVShows: return NavSection.SERIES;
    case ICTSNavOption.Live: return NavSection.NEWS;
    case ICTSNavOption.Espanol: return NavSection.ESPANOL;
    case ICTSNavOption.KIDS: return NavSection.KIDS;
    default: return NavSection.HOME;
  }
};

export const mapContentDetailPageNavOptionToAnalyticsSection: MapTopNavOptionToAnalyticsSectionFunc = (option: number | undefined) => {
  switch (option) {
    case ContentDetailPageNavOption.ContinueWatching: return NavSection.CONTINUE_WATCHING;
    case ContentDetailPageNavOption.Play: return NavSection.PLAY;
    case ContentDetailPageNavOption.WatchTrailer: return NavSection.WATCH_TRAILER;
    case ContentDetailPageNavOption.Like: return NavSection.LIKE;
    case ContentDetailPageNavOption.Dislike: return NavSection.DISLIKE;
    case ContentDetailPageNavOption.LikeOrDislike: return NavSection.LIKE_OR_DISLIKE;
    case ContentDetailPageNavOption.EpisodesList: return NavSection.EPISODES_LIST;
    case ContentDetailPageNavOption.SignUpToSaveProgress: return NavSection.SIGNUP_TO_SAVE_PROGRESS;
    case ContentDetailPageNavOption.SignIn: return NavSection.SIGNIN;
    case ContentDetailPageNavOption.AddToMyList: return NavSection.ADD_TO_MY_LIST;
    case ContentDetailPageNavOption.RemoveFromMyList: return NavSection.REMOVE_FROM_MY_LIST;
    case ContentDetailPageNavOption.RemoveFromHistory: return NavSection.REMOVE_FROM_HISTORY;
    case ContentDetailPageNavOption.GoToNetwork: return NavSection.GO_TO_NETWORK;
    case ContentDetailPageNavOption.StartFromBeginning: return NavSection.START_FROM_BEGINNING;
    case ContentDetailPageNavOption.Share: return NavSection.SHARE;
    case ContentDetailPageNavOption.ReportProblem: return NavSection.REPORT_PROBLEM;
    case ContentDetailPageNavOption.LikeRemoveRating: return NavSection.LIKE_REMOVE_RATING;
    case ContentDetailPageNavOption.DislikeRemoveRating: return NavSection.DISLIKE_REMOVE_RATING;
    case ContentDetailPageNavOption.SetReminder: return NavSection.SET_REMINDER;
    case ContentDetailPageNavOption.RemoveReminder: return NavSection.REMOVE_REMINDER;
    case ContentDetailPageNavOption.SignInToWatchEarly: return NavSection.SIGNIN_TO_WATCH_EARLY;
    default: return NavSection.UNKNOWN_SECTION;
  }
};

/**
 * LeftSideNavComponent
 */
export const createLeftSideNavComponent = ({ matrix }: ComponentObjType): ComponentType => {
  return {
    left_side_nav_component: {
      left_nav_section: mapLeftNavOptionToAnalyticsSection(matrix.endY),
    },
  };
};

export const mapLeftNavOptionToAnalyticsSection = (option?: LeftNavMenuOption | null): NavSection => {
  switch (option) {
    case LeftNavMenuOption.Home: return NavSection.HOME;
    case LeftNavMenuOption.MovieMode: return NavSection.MOVIES;
    case LeftNavMenuOption.TVMode: return NavSection.SERIES;
    case LeftNavMenuOption.Account: return NavSection.ACCOUNT;
    case LeftNavMenuOption.Search: return NavSection.SEARCH;
    case LeftNavMenuOption.Categories: return NavSection.CATEGORIES;
    case LeftNavMenuOption.Channels: return NavSection.CHANNEL;
    case LeftNavMenuOption.Settings: return NavSection.SETTINGS;
    case LeftNavMenuOption.Exit: return NavSection.EXIT;
    case LeftNavMenuOption.Kids: return NavSection.KIDS;
    case LeftNavMenuOption.MyStuff: return NavSection.QUEUE;
    case LeftNavMenuOption.EspanolMode: return NavSection.ESPANOL;
    case LeftNavMenuOption.LiveTV: return NavSection.LINEAR;
    default: return NavSection.UNKNOWN_SECTION;
  }
};

export const mapLeftNavComponentType = (option?: LeftNavMenuOption | null): ComponentType => {
  switch (option) {
    case LeftNavMenuOption.Search: return ANALYTICS_COMPONENTS.searchResultComponent;
    default: return ANALYTICS_COMPONENTS.containerComponent;
  }
};

export const mapPlayerLeftNavOptionToAnalyticsSection = (option: LinearLeftNavMenuOption | null): NavSection => {
  switch (option) {
    case LinearLeftNavMenuOption.SUBTITLES: return NavSection.SUBTITLES;
    case LinearLeftNavMenuOption.BACK: return NavSection.BACK;
    default: return NavSection.UNKNOWN_SECTION;
  }
};

export const mapEPGContainerOptionToAnalyticsSection = (option: string): NavSection => {
  switch (option) {
    case 'favorite_linear_channels': return NavSection.FAVORITES;
    case 'featured_channels': return NavSection.FEATURED;
    case 'recently_added_channels': return NavSection.RECENTLY_ADDED;
    case 'national_news': return NavSection.NATIONAL_NEWS;
    case 'sports_on_tubi': return NavSection.SPORTS;
    case 'business_news': return NavSection.BUSINESS_NEWS;
    case 'global_news': return NavSection.GLOBAL_NEWS;
    case 'weather': return NavSection.WEATHER;
    case 'culture_and_entertainment': return NavSection.CULTURE_AND_ENTERTAINMENT_NEWS;
    case 'entertainment': return NavSection.ENTERTAINMENT;
    case 'local_news': return NavSection.LOCAL_NEWS;
    case 'espanol': return NavSection.ESPANOL;
    case 'recommended_linear_channels': return NavSection.RECOMMENDED;
    default: return NavSection.UNKNOWN_SECTION;
  }
};

/**
 * EpisodeVideoListComponent, AutoPlayComponent, SearchResultComponent
 * https://github.com/adRise/protos/blob/master/analytics/client.proto#L466
 */
const createComponent = ({ matrix, contentId, isSeries, componentType }: ComponentObjType): ComponentType => {
  const seriesOrVideo = buildContentObject(contentId, isSeries);
  const { startX, startY } = matrix;
  const contentTile: Partial<ComponentType> = {
    [componentType]: {
      content_tile: {
        row: startY,
        col: startX,
        ...seriesOrVideo as VideoOrSeriesIdType,
      },
    },
  };
  return contentTile as ComponentType;
};

export const createMiddleNavComponent = ({ matrix, componentType }: ComponentObjType): ComponentType => {
  return {
    [componentType]: {
      middle_nav_section: mapContentDetailPageNavOptionToAnalyticsSection(matrix.endY),
    },
  };
};

export const createChannelGuideComponent = ({ matrix, contentId, isSeries, componentType }: ComponentObjType): ComponentType => {
  const seriesOrVideo = buildContentObject(contentId, isSeries);
  const { startX, startY } = matrix;
  const contentTile: Partial<ComponentType> = {
    [componentType]: {
      content_tile: {
        row: startY,
        col: startX,
        ...seriesOrVideo as VideoOrSeriesIdType,
      },
      category_row: startX,
      category_col: startY,
    },
  };
  return contentTile as ComponentType;
};

export const createEPGComponent = ({ matrix, contentId, isSeries, componentType, containerSlug }: ComponentObjType): ComponentType => {
  const channel = buildContentObject(contentId, isSeries);
  const { startX, startY } = matrix;
  const contentTile: Partial<ComponentType> = {
    [componentType]: {
      category_slug: containerSlug,
      content_tile: {
        row: startY,
        col: startX,
        ...channel as VideoOrSeriesIdType,
      },
    },
  };
  return contentTile as ComponentType;
};

/**
 * CastListComponent
 */
export const createCastListComponent = ({ actorName }: ComponentObjType): ComponentType => {
  const castListObj: Partial<ComponentType> = {
    [ANALYTICS_COMPONENTS.castListComponent]: {
      actor_name: actorName!,
    },
  };
  return castListObj as ComponentType;
};

/**
 * MyStuffComponent
 */
export const createMyStuffComponent = ({ matrix, contentId, isSeries, containerSlug }: ComponentObjType): ComponentType => {
  const seriesOrVideo = buildContentObject(contentId, isSeries);
  const { startX, startY } = matrix;
  return {
    [ANALYTICS_COMPONENTS.myStuffComponent]: {
      category_slug: containerSlug,
      content_tile: {
        row: startY,
        col: startX,
        ...seriesOrVideo as VideoOrSeriesIdType,
      },
    },
  };
};

/**
 * RelatedComponent
 */
export const createRelatedComponent = ({ matrix, contentId, isSeries, componentType, containerSlug }: ComponentObjType): ComponentType => {
  const seriesOrVideo = buildContentObject(contentId, isSeries);
  const { startX, startY } = matrix;
  const contentTile: Partial<ComponentType> = {
    [componentType]: {
      category_slug: containerSlug,
      content_tile: {
        row: startY,
        col: startX,
        ...seriesOrVideo as VideoOrSeriesIdType,
      },
    },
  };
  return contentTile as ComponentType;
};

type ComponentCbType = Record<string,
  ({ pageUrl, matrix, containerSlug, contentId, isSeries }: ComponentObjType) => ComponentType>;

type UrlOperations = {
  test: RegExp,
  cb: (url: string, extraCtx?: PageTypeExtraCtx, extraParams?: Record<string, unknown>) => PageType;
  componentCb?: ComponentCbType;
};

const commonComponentCbs: ComponentCbType = {
  [ANALYTICS_COMPONENTS.navigationDrawerComponent]: ({ containerSlug }: ComponentObjType): ComponentType => {
    const navigationComponent: Partial<ComponentType> = {
      [ANALYTICS_COMPONENTS.navigationDrawerComponent]: {
        category_slug: containerSlug || '',
        category_row: 0, // 0 means we cannot provide this value
      },
    };
    return navigationComponent as ComponentType;
  },
  [ANALYTICS_COMPONENTS.genericComponent]: (): ComponentType => {
    const genericComponent: Partial<ComponentType> = {
      [ANALYTICS_COMPONENTS.genericComponent]: {
        generic_component_type: 'UNKNOWN',
      },
    };
    return genericComponent as ComponentType;
  },
  [ANALYTICS_COMPONENTS.topNavComponent]: createTopNavComponent,
};

/**
 * Get the AccountPageType from page URL
 * @param url Page URL
 */
function getAccountPageType(url: string): AccountPageType {
  switch (true) {
    case /parental/.test(url):
      return AccountPageType.PARENTAL;
    case /notifications/.test(url):
      return AccountPageType.NOTIFICATION;
    case /history/.test(url):
      return AccountPageType.HISTORY;
    case /privacy/.test(url):
      return AccountPageType.PRIVACY_PREFERENCES;
    default:
      return AccountPageType.ACCOUNT;
  }
}

const PERSON_PAGE_REGEX = /^\/person\/([^/]+)\/([^/|^?]+)/;

/*
 * This is the URI mapping for the web app. The OTT mapping is defined in
 * URI_MAP_OTT.
 */
const URI_MAP: UrlOperations[] = [
  {
    test: /^\/video|series\/[^/]+/,
    cb: contentURIParseFn,
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.relatedComponent]: createRelatedComponent,
      [ANALYTICS_COMPONENTS.episodeVideoListComponent]: createComponent,
      [ANALYTICS_COMPONENTS.castListComponent]: createCastListComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
      [ANALYTICS_COMPONENTS.middleNavComponent]: createMiddleNavComponent,
    },
  },
  {
    test: /^\/preference\/captions/,
    cb: () => {
      return {
        static_page: {
          name: 'custom_captions',
        },
      };
    },
  },
  {
    test: /^\/category|networks\/[^/]+/,
    cb: (url, extraCtx) => {
      // containerUrl: /category/whats_on_tubi_trailers
      // subContainerUrl: /category/international/s/korean_dramas
      const fields = url.substr(1).split('/');
      if (url.indexOf('/s/') > 0) {
        const parentSlug = fields[1];
        const subContainerSlug = fields[3];
        return {
          sub_category_page: {
            category_slug: parentSlug,
            sub_category_slug: subContainerSlug,
          },
        };
      }
      if (extraCtx?.isOnboardingCategoryPage) {
        return {
          onboarding_page: {
            name: OnboardingPageName.TITLE_PERSONALIZATION,
          },
        };
      }
      const containerId = fields[1];
      return {
        category_page: {
          category_slug: containerId,
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
    },
  },
  {
    test: /^\/embedded\/[^/]+/,
    cb: (url) => {
      const fields = url.substr(1).split('/');
      return {
        video_page: {
          video_id: parseInt(fields[2], 10),
        },
      };
    },
  },
  {
    test: /^\/$/,
    cb: (url, extraCtx) => {
      return {
        home_page: {
          ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
    },
  },
  {
    test: /^\/account/,
    cb: (url) => {
      return {
        account_page: {
          account_page_type: getAccountPageType(url),
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/search\/[^/]+/,
    cb: (url) => {
      const fields = url.substr(1).split('/');
      return {
        search_page: {
          query: decodeURIComponent(fields[1]),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.searchResultComponent]: createComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
    },
  },
  {
    test: /^\/activate/,
    cb: (url) => {
      const queryParams = parseQueryString(getQueryStringFromUrl(url));
      return {
        auth_page: {
          /**
           * this is temporary to use as a proxy/placeholder event for qr code experiment
           * once we graduate experiment, will flesh out a new analytics param for qr code auth action
           */
          auth_action: queryParams.option === 'qr' ? 'MOBILE_ACTIVATION' : 'ACTIVATION',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/(login|enter-password)/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.EMAIL_OR_FACEBOOK,
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/signup/,
    cb: () => {
      return {
        register_page: {
          auth_method: LoginChoiceType.EMAIL,
          register_action: 'UNKNOWN_ACTION',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/magic-link\/success/,
    cb: () => {
      return {
        static_page: {
          name: 'verification_success',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^(\/magic-link\/fail|\/registration-link\/expired)/,
    cb: () => {
      return {
        static_page: {
          name: 'registration_link_expired',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^(\/magic-link\/error|\/registration-link\/failed)/,
    cb: () => {
      return {
        static_page: {
          name: 'registration_error',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/signin-with-magic-link/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.LINK,
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/forgot/,
    cb: () => {
      return {
        forget_page: {},
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/categories$/,
    cb: () => {
      return {
        category_list_page: {},
      };
    },
  },
  {
    test: /^\/my-stuff$/,
    cb: () => {
      return {
        for_you_page: {},
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.myStuffComponent]: createMyStuffComponent,
      [ANALYTICS_COMPONENTS.topNavComponent]: createTopNavComponent,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
    },
  },
  {
    test: /^\/movies$/,
    cb: (url, extraCtx) => {
      return {
        movie_browse_page: {
          ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
    },
  },
  {
    test: /^\/tv-shows$/,
    cb: (url, extraCtx) => {
      return {
        series_browse_page: {
          ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
    },
  },
  {
    test: /^\/tv-shows|movies/,
    cb: (url, extraCtx) => {
      const videoId = url.split('/')[2]; // '/movies/305419/asylum' ~> '305419'
      if (extraCtx?.isLinearDetails) {
        return {
          linear_details_page: {
            video_id: parseInt(videoId, 10),
          },
        };
      }

      return {
        video_page: {
          video_id: parseInt(videoId, 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.relatedComponent]: createRelatedComponent,
      [ANALYTICS_COMPONENTS.autoplayComponent]: createComponent,
      [ANALYTICS_COMPONENTS.episodeVideoListComponent]: createComponent,
      [ANALYTICS_COMPONENTS.castListComponent]: createCastListComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
      [ANALYTICS_COMPONENTS.middleNavComponent]: createMiddleNavComponent,
    },
  },
  {
    test: /^\/live($|\?)/,
    cb: () => {
      return {
        linear_browse_page: {},
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.genreListComponent]: createGenreListComponent,
      [ANALYTICS_COMPONENTS.epgComponent]: createEPGComponent,
    },
  },
  {
    test: /^\/live/,
    cb: (url) => {
      const videoId = url.split('/')[2]; // /live/556174/nbc-news-now
      return {
        video_player_page: {
          video_id: parseInt(videoId, 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.channelGuideComponent]: createChannelGuideComponent,
    },
  },
  {
    test: /^\/welcome$/,
    cb: () => {
      return {
        landing_page: {},
      };
    },
  },
  {
    test: /^\/watch-schedule\/[^/]+/,
    cb: () => {
      return {
        landing_page: {
          name: LandingPageName.LINEAR_SERIES,
        },
      };
    },
  },
  {
    test: /^\/superbowl(\/?)($|\?)/,
    cb: () => ({ landing_page: { name: LandingPageName.SUPERBOWL } }),
  },
  {
    test: /^\/how-to-watch-the-super-bowl(\/?)($|\?)/,
    cb: () => ({ landing_page: { name: LandingPageName.HOW_TO_WATCH_SB } }),
  },
  {
    test: /^\/upcoming\/[^/]+/,
    cb: (url) => {
      // eg: `/upcoming/big-mood` to ['upcoming', 'big-mood']
      const fields = url.substr(1).split('/');
      return {
        landing_page: {
          name: fields[1],
        },
      };
    },
  },
  {
    test: /^\/sweepstakes$/,
    cb: () => {
      return {
        landing_page: {
          name: LandingPageName.SWEEPSTAKES,
        },
      };
    },
  },
  {
    test: /^\/watch/,
    cb: (url) => {
      const videoId = url.split('/')[2]; // '/watch/469844/s01_e03_the_bachelor -
      // Return video player page on web
      return {
        video_player_page: {
          video_id: parseInt(videoId, 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.autoplayComponent]: createComponent,
    },
  },
  {
    test: /^\/help-center/,
    cb: () => {
      return {
        static_page: {
          name: 'help-center',
        },
      };
    },
  },
  {
    test: /^\/static\/privacy/,
    cb: () => {
      return {
        static_page: {
          name: 'privacy_policy',
        },
      };
    },
  },
  {
    test: /^\/static\/terms/,
    cb: () => {
      return {
        static_page: {
          name: 'terms_of_use',
        },
      };
    },
  },
  {
    test: /^\/static\/support/,
    cb: () => {
      return {
        static_page: {
          name: 'contact_support',
        },
      };
    },
  },
  {
    test: /^\/privacy\/your-privacy-choices/,
    cb: () => {
      return {
        static_page: {
          name: 'privacy_choices',
        },
      };
    },
  },
  {
    test: PERSON_PAGE_REGEX,
    cb: (url) => {
      const [, id, name] = PERSON_PAGE_REGEX.exec(url)!;
      const actorName = decodePersonName(`person-${name}`, false);

      return {
        person_page: {
          person_id: id,
          actor_name: actorName,
        },
      };
    },
  },
  {
    test: /^\/email-confirmation/,
    cb: () => {
      return {
        static_page: {
          name: 'vppa_optin',
        },
      };
    },
  },
  {
    test: /^\/auth-error/,
    cb: (url) => {
      const queryParams = parseQueryString(getQueryStringFromUrl(url));
      let prefix;
      switch (queryParams.type as AuthErrorLocationState['type']) {
        case 'signUp':
          prefix = 'sign_up_error';
          break;
        case 'signIn':
          prefix = 'sign_in_error';
          break;
        case 'activate':
        case 'magicLink':
        default:
          prefix = 'something_went_wrong';
          break;
      }
      const code = isMajorEventActive() ? '2' : '1';
      return {
        static_page: {
          name: `${prefix}_${code}`,
        },
      };
    },
  },
];

const URI_MAP_OTT: UrlOperations[] = [
  // home page
  {
    test: /^\/($|\?\w+)/,
    cb: (url, extraCtx) => {
      return {
        home_page: {
          ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
      [ANALYTICS_COMPONENTS.topNavComponent]: createTopNavComponent,
    },
  },
  {
    test: /^\/my-stuff/,
    cb: () => {
      return {
        for_you_page: {},
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
      [ANALYTICS_COMPONENTS.myStuffComponent]: createMyStuffComponent,
    },
  },
  {
    test: /^\/landing\/?($|\?\w+)/,
    cb: () => ({ landing_page: {} }),
  },
  {
    test: /^\/major-event-onboarding(\/?)($|\?)/,
    cb: () => ({ landing_page: { name: LandingPageName.EVENT_ONBOARDING } }),
  },
  {
    test: /^\/onboarding\/video/,
    cb: () => ({ onboarding_page: { name: OnboardingPageName.VIDEO } }),
  },
  {
    test: ONBOARDING_REGEX,
    cb: (url) => {
      const step = getOnboardingStepNumber(url);
      return { onboarding_page: { page_sequence: Number(step) } };
    },
  },
  // OTT Onboarding Title Personalization Thank You Page
  {
    test: /^\/personalization-title-thank-you/,
    cb: () => {
      return { onboarding_page: { name: OnboardingPageName.TITLE_PERSONALIZATION_THANK_YOU } };
    },
  },
  // OTT Onboarding Title Personalization Page
  {
    test: /^\/personalization-title/,
    cb: () => {
      return { onboarding_page: { name: OnboardingPageName.TITLE_PERSONALIZATION } };
    },
  },
  // OTT Account Selection Page
  {
    test: /^\/choose-accounts/,
    cb: () => {
      return { onboarding_page: { name: OnboardingPageName.PROFILE_SELECTION } };
    },
  },
  // The following is for series/video detail page
  {
    test: /^\/(video|series)\/[^/]+/,
    cb: (url, extraCtx) => {
      // eg1: `/video/465235/rango/rango_unchanined?hello/123` to ['video', '465235', 'rango', 'rango_unchanined?hello/123']
      // eg2: `/series/1234/testseries` to ['series', '1234', 'testseries']
      const fields = url.substr(1).split('/');
      if (extraCtx?.isUpcoming) {
        return {
          upcoming_content_page: {
            video_id: parseInt(fields[1], 10),
          },
        };
      }

      if (extraCtx?.isLinearDetails) {
        return {
          linear_details_page: {
            video_id: parseInt(fields[1], 10),
          },
        };
      }

      if (fields[0] === 'series') {
        return {
          series_detail_page: {
            series_id: parseInt(fields[1], 10),
          },
        };
      }

      return {
        video_page: {
          video_id: parseInt(fields[1], 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.episodeVideoListComponent]: createComponent,
      [ANALYTICS_COMPONENTS.relatedComponent]: createRelatedComponent,
      [ANALYTICS_COMPONENTS.middleNavComponent]: createMiddleNavComponent,
    },
  },
  // The following is for episodes page
  {
    test: /^\/ott\/(video|series)\/[^/]+/,
    cb: (url) => {
      // eg1: `/video/465235/rango/rango_unchanined?hello/123` to ['video', '465235', 'rango', 'rango_unchanined?hello/123']
      // eg2: `/series/1234/testseries` to ['series', '1234', 'testseries']
      const fields = url.substr(1).split('/');
      return {
        episode_video_list_page: {
          series_id: parseInt(fields[2], 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.episodeVideoListComponent]: createComponent,
    },
  },
  // OTT activation page
  {
    test: /^\/activate/,
    cb: (url) => {
      const queryParams = parseQueryString(getQueryStringFromUrl(url));
      return {
        auth_page: {
          auth_action: queryParams.option === 'pair' ? 'MOBILE_ACTIVATION' : 'ACTIVATION',
        },
      };
    },
  },
  // OTT Age Gate Page
  {
    test: /^\/age-gate/,
    cb: () => {
      return {
        age_gate_page: {},
      };
    },
  },
  {
    test: /^\/gender-gate/,
    cb: () => {
      return {
        gender_selection_page: {},
      };
    },
  },
  {
    test: /^\/email-signin/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.EMAIL,
        },
      };
    },
  },
  {
    test: /^\/signin-with-magic-link/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.LINK,
        },
      };
    },
  },
  {
    test: /^\/enter-email/,
    cb: () => {
      return {
        register_page: {
          auth_method: 'EMAIL',
        },
      };
    },
  },
  {
    test: /^\/legal\?idx=(0|1|2)/,
    cb: (url) => {
      let name = 'privacy';
      if (url.indexOf('1') > -1) name = 'terms';
      if (url.indexOf('2') > -1) name = 'donot_sell_myinfo';
      return {
        static_page: {
          name,
        },
      };
    },
  },
  // OTT Password confirmation account
  {
    test: /^\/parental-password/,
    cb: () => {
      return {
        auth_page: {
          auth_action: 'PASSWORD_CONFIRMATION',
        },
      };
    },
  },
  // OTT Web Player Page
  {
    test: /^\/ott\/player\/[^/]+/,
    cb: (url) => {
      // /ott/player/333000
      const fields = url.substr(1).split('/');
      return {
        video_player_page: {
          video_id: parseInt(fields[2], 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.autoplayComponent]: createComponent,
      // browse while watching containers
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
    },
  },
  // OTT Live Player Page
  {
    test: /^\/ott\/live\/[^/]+/,
    cb: (url) => {
      // /ott/live/333000
      const fields = url.substr(1).split('/');
      return {
        video_player_page: {
          video_id: parseInt(fields[2], 10),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.channelGuideComponent]: createChannelGuideComponent,
      [ANALYTICS_COMPONENTS.epgComponent]: createEPGComponent,
    },
  },
  // OTT Native (Android) Player Page
  {
    test: /^\/ott\/androidplayer\/[^/]+/,
    cb: (url) => {
      // /ott/androidplayer/333000/10
      const fields = url.substr(1).split('/');
      return {
        video_player_page: {
          video_id: parseInt(fields[2], 10),
        },
      };
    },
  },
  // OTT AD Player Page
  {
    test: /^\/ad\/player\/[^/]+/,
    cb: (url) => {
      // /ad/player/333000
      const fields = url.substr(1).split('/');
      return {
        video_player_page: {
          video_id: parseInt(fields[2], 10),
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  // OTT Search page
  {
    test: /^\/search/,
    cb: (url, extraCtx) => {
      return {
        search_page: {
          query: extraCtx?.query || '',
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.searchResultComponent]: createComponent,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
    },
  },
  // OTT settings page
  {
    test: /^\/settings/,
    cb: (url, extraCtx) => {
      // Use account page for account settings page
      return {
        account_page: {
          // Use ACCOUNT PageType when in settings page for OTT
          account_page_type: extraCtx?.pageType || AccountPageType.ACCOUNT,
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/containers\/regular/,
    cb: () => {
      return {
        category_list_page: {},
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
      [ANALYTICS_COMPONENTS.browserMenuComponent]: createBrowserMenuComponent,
    },
  },
  {
    test: /^\/containers\/channel/,
    cb: () => {
      return {
        channel_list_page: {},
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
    },
  },
  {
    test: /^\/container\/(regular|channel)\/[^/]+/,
    cb: (url) => {
      // /container/regular/action
      const fields = url.substr(1).split('/');
      return {
        category_page: {
          category_slug: fields[2],
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.relatedComponent]: createRelatedComponent,
    },
  },
  {
    test: /^\/mode\/(movie|tv|live|espanol)/,
    cb: (url, extraCtx) => {
      if (url.includes('tv')) {
        return {
          series_browse_page: {
            ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
          },
        };
      }
      if (url.includes('live')) {
        return {
          linear_browse_page: {},
        };
      }
      if (url.includes('espanol')) {
        return {
          latino_browse_page: {
            ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
          },
        };
      }
      return {
        movie_browse_page: {
          ...(extraCtx?.personalizationId ? { personalization_id: extraCtx.personalizationId } : {}),
        },
      };
    },
    componentCb: {
      ...commonComponentCbs,
      [ANALYTICS_COMPONENTS.leftSideNavComponent]: createLeftSideNavComponent,
      [ANALYTICS_COMPONENTS.containerComponent]: createContainerComponent,
      [ANALYTICS_COMPONENTS.topNavComponent]: createTopNavComponent,
      [ANALYTICS_COMPONENTS.epgComponent]: createEPGComponent,
    },
  },
  {
    test: /^\/ott\/notfound/,
    cb: () => {
      return {
        static_page: {
          name: 'not_found',
        },
      };
    },
    componentCb: commonComponentCbs,
  },
  {
    test: /^\/signin-with-amazon/,
    cb: () => {
      return {
        static_page: {
          name: 'amazon_login_request',
        },
      };
    },
  },
  {
    test: /^\/amazon-sso/,
    cb: () => {
      return {
        static_page: {
          name: 'amazon_sso',
        },
      };
    },
  },
  {
    test: /^\/signin-with-/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.LINK,
        },
      };
    },
  },
  {
    test: /^\/signin/,
    cb: () => {
      return {
        login_page: {
          choice: LoginChoiceType.UNKNOWN,
        },
      };
    },
  },
  {
    test: /^\/consent\/initial/,
    cb: () => {
      return {
        your_privacy_page: {},
      };
    },
  },
  {
    test: /^\/consent\/continue-watching/,
    cb: () => {
      return {
        onboarding_page: { name: OnboardingPageName.CONTINUE_WATCHING_CONSENT },
      };
    },
  },
  {
    test: /^\/privacy-preferences/,
    cb: () => {
      return {
        privacy_preferences_page: {},
      };
    },
  },
  {
    test: /^\/auth-error/,
    cb: (url) => {
      const queryParams = parseQueryString(getQueryStringFromUrl(url));
      let prefix;
      switch (queryParams.type) {
        case 'signUp':
          prefix = 'sign_up_error';
          break;
        case 'signIn':
          prefix = 'sign_in_error';
          break;
        case 'activate':
        case 'magicLink':
        default:
          prefix = 'something_went_wrong';
          break;
      }
      const code = isMajorEventActive() ? '2' : '1';
      return {
        static_page: {
          name: `${prefix}_${code}`,
        },
      };
    },
  },
];
/**
 * convert url to page object required by track event
 * see https://tubitv.atlassian.net/wiki/display/EC/URI+Scheme
 */
export const getPageObjectFromURL = (
  url: string,
  extraCtx?: PageTypeExtraCtx,
): PageType | null => {
  const TRACK_URI_MAP = __ISOTT__ ? URI_MAP_OTT : URI_MAP;
  for (const val of TRACK_URI_MAP) {
    if (val.test.test(url)) {
      const cb = val.cb;
      return extraCtx ? cb(url, extraCtx) : cb(url); // only OTT search page needs the extraCtx right now
    }
  }
  return null;
};

export const getPageObjectFromPageType = (pageType: VideoPlayerPageType, videoId: string, categorySlug: string) => {
  switch (pageType) {
    case VideoPlayerPageType.SERIES_DETAIL_PAGE:
      return { [pageType]: { series_id: videoId } };
    case VideoPlayerPageType.VIDEO_PAGE:
      return { [pageType]: { video_id: videoId } };
    case VideoPlayerPageType.CATEGORY_PAGE:
      return { [pageType]: { category_slug: categorySlug } };
    case VideoPlayerPageType.LINEAR_DETAILS_PAGE:
      return { [pageType]: { video_id: videoId } };
    default:
      return { [pageType]: {} };
  }
};
/**
 * Get the component object from pageUrl
 * https://github.com/adRise/protos/blob/master/analytics/client.proto#L410
 */
export const getComponentObjectFromURL = ({
  pageUrl,
  matrix,
  containerSlug,
  contentId,
  isSeries,
  actorName,
  genreName,
  componentType,
  isDestinationComponent,
  extraCtx,
}: ComponentObjType): ComponentType | null => {
  const TRACK_URI_MAP = __ISOTT__ ? URI_MAP_OTT : URI_MAP;

  for (const val of TRACK_URI_MAP) {
    if (pageUrl && val.test.test(pageUrl)) {
      const cb = val.componentCb ? val.componentCb[componentType] : null;
      if (cb) {
        return cb({
          matrix,
          containerSlug,
          contentId,
          isSeries,
          actorName,
          genreName,
          componentType,
          isDestinationComponent,
          extraCtx,
        });
      }
    }
  }
  return null;
};

/**
 * Build the referred event object which is of type ReferredEvent
 * https://tubitv.atlassian.net/wiki/spaces/EC/pages/26017814/Referrals
 */
export const buildReferredEventObject = (
  referredTrackingURI: string,
  referredExtraCtx: ReferredCtx,
  trackValue: ReferredType,
  extraCtx?: PageTypeExtraCtx,
): ReferredEvent | null => {
  const pageObj: PageType | null = getPageObjectFromURL(referredTrackingURI, extraCtx);
  if (!pageObj) return null;

  return {
    referred_type: trackValue,
    ...mapValues(referredExtraCtx, String), // coerce values to strings since other types aren't accepted
    ...pageObj,
  };
};

/**
 * Build component interaction event
 */
interface BaseComponentInteractionEventArgumentsType {
  pathname: string;
  userInteraction: UserInteraction;
  extraCtx?: PageTypeExtraCtx;
}

interface NavComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component?: 'LEFT_NAV' | 'TOP_NAV' | 'MIDDLE_NAV';
  section: NavSection;
}
interface ChannelGuideComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'CHANNELS_GUIDE';
  section: ChannelGuideComponent;
}
interface ReminderComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'REMINDER';
  section: number;
}

interface EPGComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'EPG';
  section: EPGComponent;
}

interface ButtonComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'BUTTON';
  buttonValue: string;
  buttonType: ButtonType;
}

interface TileComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'TILE';
}

interface CategoryComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'CATEGORY';
  section: {
    category_slug: string;
    category_row?: number;
    category_col?: number;
    content_tile?: ContentTile;
  }
}

interface BrowserMenuInteractionEventComponentArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'BROWSER_MENU';
  section: {
    category_slug: string;
  }
}

interface NavigationDrawerComponentInteractionEventArgumentsType extends BaseComponentInteractionEventArgumentsType {
  component: 'NAVIGATION_DRAWER';
  section: NavigationDrawerType;
}

type ComponentInteractionEventArgumentsType =
  | NavComponentInteractionEventArgumentsType
  | ChannelGuideComponentInteractionEventArgumentsType
  | ReminderComponentInteractionEventArgumentsType
  | EPGComponentInteractionEventArgumentsType
  | ButtonComponentInteractionEventArgumentsType
  | CategoryComponentInteractionEventArgumentsType
  | NavigationDrawerComponentInteractionEventArgumentsType
  | BrowserMenuInteractionEventComponentArgumentsType
  | TileComponentInteractionEventArgumentsType;

type ComponentInteractionNavComponent =
  ComponentInteractionTopNavComponent |
  ComponentInteractionMiddleNavComponent |
  ComponentInteractionLeftNavComponent;

function getContentInteractionComponent(args: ComponentInteractionEventArgumentsType) {
  switch (args.component) {
    case 'TOP_NAV':
      return {
        top_nav_component: {
          top_nav_section: args.section,
        },
      } as ComponentInteractionTopNavComponent;
    case 'NAVIGATION_DRAWER':
      return {
        navigation_drawer_component: args.section,
      } as ComponentInteractionNavigationDrawerComponent;
    case 'MIDDLE_NAV':
      return {
        middle_nav_component: {
          middle_nav_section: args.section,
        },
      } as ComponentInteractionMiddleNavComponent;
    case 'CHANNELS_GUIDE':
      return {
        channel_guide_component: args.section,
      } as ComponentInteractionChannelGuideComponent;
    case 'REMINDER':
      return {
        reminder_component: {
          video_id: args.section,
        },
      } as ComponentInteractionReminderComponent;
    case 'EPG':
      return {
        epg_component: args.section,
      } as ComponentInteractionEPGComponent;
    case 'BUTTON':
      const component: ComponentInteractionButtonComponent = {
        button_component: {
          button_type: args.buttonType,
          button_value: args.buttonValue,
        },
      };
      return component;
    case 'TILE':
      return {
        tile_component: {},
      };
    case 'CATEGORY':
      return {
        category_component: args.section,
      } as ComponentInteractionCategoryComponent;
    case 'LEFT_NAV':
    default:
      return {
        left_side_nav_component: {
          left_nav_section: args.section,
        },
      } as ComponentInteractionLeftNavComponent;
  }
}

export const buildComponentInteractionEvent = (args: ComponentInteractionEventArgumentsType): ComponentInteractionEventType | null => {
  const { pathname, extraCtx, userInteraction } = args;
  const pageObj = getPageObjectFromURL(pathname, extraCtx);
  // don't track if left nav section is unknown, because the analytics server will reject it.
  if (!pageObj
    || ((args.component === 'LEFT_NAV' || args.component === 'TOP_NAV' || args.component === 'MIDDLE_NAV')
      && args.section === NavSection.UNKNOWN_SECTION)) {
    return null;
  }

  const contentInteractionComponent = getContentInteractionComponent(args);

  return {
    ...pageObj,
    ...contentInteractionComponent,
    user_interaction: userInteraction,
  };
};

/**
 * Build SearchEvent object
 */
export const buildSearchEventObject = (
  query: string,
  inputDevice: InputDeviceType,
): SearchEventType => {
  return {
    query,
    search_type: __OTTPLATFORM__ ? SearchType.PAGE : SearchType.BAR,
    input_device: inputDevice,
  };
};

export interface NavigateWithinPageParams {
  pageUrl: string;
  matrix: Matrix;
  meansOfNavigation: MeansOfNavigationType;
  containerSlug: string;
  contentId?: string;
  isSeries?: boolean;
  componentType?: AnalyticsComponentValueType;
  extraCtx?: PageTypeExtraCtx;
  destinationComponentType?: ValueOf<typeof ANALYTICS_DESTINATION_COMPONENTS>;
  destinationComponentSectionIndex?: number;
  navComponentSectionIndex?: number;
  navComponentType?: AnalyticsComponentValueType;
  overrideHorizontalLocation?: number;
  overrideVerticalLocation?: number;
  mapTopNavOptionToAnalyticsSectionFunc?: MapTopNavOptionToAnalyticsSectionFunc,
  mapMiddleNavOptionToAnalyticsSectionFunc?: MapTopNavOptionToAnalyticsSectionFunc,
}

/**
 * Build navigation within page object.
 * https://github.com/adRise/protos/blob/master/analytics/events.proto#L509
 * @param pageUrl
 * @param matrix
 * @param meansOfNavigation
 * @param containerSlug
 * @param contentId
 * @param isSeries
 * @param componentType
 * @param extraCtx
 */
export const buildNavigateWithinEventObject = ({
  pageUrl,
  matrix,
  meansOfNavigation,
  containerSlug,
  contentId,
  isSeries,
  componentType,
  extraCtx,
  destinationComponentType,
  destinationComponentSectionIndex,
  navComponentSectionIndex,
  navComponentType,
  overrideHorizontalLocation,
  overrideVerticalLocation,
  /* istanbul ignore next */
  mapMiddleNavOptionToAnalyticsSectionFunc,
  mapTopNavOptionToAnalyticsSectionFunc = mapTopNavOptionToAnalyticsSection,
}: NavigateWithinPageParams): NavigateWithinPageType | null => {
  const pageObj: PageType | null = getPageObjectFromURL(pageUrl, extraCtx);

  let componentObj: ComponentType | null = null;
  if (componentType) {
    componentObj = getComponentObjectFromURL({
      pageUrl,
      matrix,
      containerSlug,
      contentId,
      isSeries,
      componentType,
      extraCtx,
    });
  }

  let navComponent: ComponentInteractionNavComponent | null = null;
  if (navComponentSectionIndex !== undefined) {
    if (navComponentType === 'top_nav_component') {
      navComponent = {
        top_nav_component: {
          top_nav_section: mapTopNavOptionToAnalyticsSectionFunc(navComponentSectionIndex),
        },
      };
    }
    if (navComponentType === 'left_side_nav_component') {
      navComponent = {
        left_side_nav_component: {
          left_nav_section: mapLeftNavOptionToAnalyticsSection(navComponentSectionIndex),
        },
      };
    }
    if (navComponentType === 'middle_nav_component') {
      navComponent = {
        middle_nav_component: {
          middle_nav_section: mapMiddleNavOptionToAnalyticsSectionFunc?.(navComponentSectionIndex) || mapEPGContainerOptionToAnalyticsSection(containerSlug),
        },
      };
    }
  }

  if ((!pageObj || !componentObj) && !navComponentType) return null;

  const {
    endX,
    endY,
  } = matrix;

  let destNavComponent: DestinationLeftSideNavComponent | DestinationTopNavComponent | DestinationMiddleNavComponent | DestinationEPGComponent | DestinationCategoryComponent | null = null;
  if (destinationComponentType === 'dest_top_nav_component') {
    destNavComponent = {
      dest_top_nav_component: {
        top_nav_section: mapTopNavOptionToAnalyticsSectionFunc(destinationComponentSectionIndex),
      },
    };
  }
  if (destinationComponentType === 'dest_left_side_nav_component') {
    destNavComponent = {
      dest_left_side_nav_component: {
        left_nav_section: mapLeftNavOptionToAnalyticsSection(destinationComponentSectionIndex as LeftNavMenuOption),
      },
    };
  }
  if (destinationComponentType === 'dest_middle_nav_component') {
    destNavComponent = {
      dest_middle_nav_component: {
        middle_nav_section: mapMiddleNavOptionToAnalyticsSectionFunc?.(destinationComponentSectionIndex) || mapEPGContainerOptionToAnalyticsSection(containerSlug),
      },
    };
  }
  if (destinationComponentType === 'dest_epg_component') {
    destNavComponent = {
      dest_epg_component: {
        epg_section: mapEPGContainerOptionToAnalyticsSection(containerSlug),
      },
    };
  }

  if (destinationComponentType === 'dest_category_component') {
    destNavComponent = getComponentObjectFromURL({
      pageUrl,
      matrix,
      containerSlug,
      contentId,
      isSeries,
      componentType: ANALYTICS_COMPONENTS.containerComponent, // reuse container component to build destination category component
      extraCtx,
      isDestinationComponent: true,
    });
  }

  const event: NavigateWithinPageType = {
    means_of_navigation: meansOfNavigation,
    vertical_location: overrideVerticalLocation ?? endY,
    horizontal_location: overrideHorizontalLocation ?? endX,
    ...componentObj as ComponentType,
    ...pageObj as PageType,
    ...navComponent,
    ...destNavComponent,
  };

  return event;
};

export interface NavigateToPageParams {
  currentPageUrl: string,
  nextPageUrl: string,
  analyticsComponent: ComponentType,
  inputDeviceType?: InputDeviceType,
  extraCtx?: PageTypeExtraCtx,
}

/**
 * Build the NAVIGATE_TO_PAGE event which will be used as the event body in the request.
 * @param currentPageUrl
 * @param nextPageUrl
 * @param analyticsComponent
 */
export const buildNavigateToPageEventObject = ({
  currentPageUrl,
  nextPageUrl,
  analyticsComponent,
  inputDeviceType,
  extraCtx,
}: NavigateToPageParams): NavigateToPageType | undefined => {
  const currentPageObj: PageType | null = getPageObjectFromURL(currentPageUrl, extraCtx);
  const nextPageObj: PageType | null = getPageObjectFromURL(nextPageUrl, extraCtx);
  /**
   * There should be a current page object and destination page object.
   * If not, return early
   */
  if (!currentPageObj || !nextPageObj) return;

  const pageName = Object.keys(nextPageObj)[0];
  const pageValue = nextPageObj[pageName];
  nextPageObj[`dest_${pageName}`] = pageValue;
  delete nextPageObj[pageName];

  let inputDevice = null;
  if (inputDeviceType) {
    inputDevice = {
      input_device: inputDeviceType,
    };
  }
  const event: Partial<NavigateToPageType> = {
    ...currentPageObj,
    ...nextPageObj,
    ...analyticsComponent,
    ...inputDevice,
  };
  return event as NavigateToPageType;
};

/**
 * Build page_load event object.
 * @param pageUrl
 * @param status
 * @param extraCtx
 */
export const buildPageLoadEventObject = (
  pageUrl: string,
  status: PageLoadActionStatus,
  extraCtx?: Record<string, unknown>,
): PageLoadEvent | null => {
  const pageObj: PageType | null = getPageObjectFromURL(pageUrl, extraCtx);
  if (!pageObj) return null;

  const event: PageLoadEvent = {
    ...pageObj,
    status,
  };

  return event;
};

export interface StartVideoPayload {
  videoId: string;
  startPosition: number;
  currentCDN?: string;
  hasSubtitles: boolean;
  isLiveTV?: boolean;
  isEmbedded?: boolean;
  isFullscreen: boolean;
  playbackSource: PlaybackSourceType;
  videoResource?: VideoResource;
  inputDevice?: InputDeviceType;
  audioLanguage?: Language;
  videoResolution: VideoResolutionType;
  bitrate?: number;
}

/**
 * Build the VIDEO_START event object
 * @param videoId
 * @param startPosition
 * @param currentCDN
 * @param hasSubtitles
 * @param isLiveTV
 * @param isEmbedded
 * @param isFullscreen
 * @param fromAutoplayDeliberate
 * @param fromAutoplayAutomatic
 */
export const buildStartVideoObject = ({
  videoId,
  startPosition,
  currentCDN,
  hasSubtitles = false,
  isLiveTV = false,
  isEmbedded = false,
  isFullscreen = false,
  videoResource,
  inputDevice,
  audioLanguage = 'UNKNOWN',
  playbackSource = PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE,
  videoResolution = VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN,
  bitrate,
}: StartVideoPayload): StartVideoEventType => {
  const {
    type,
    manifest,
    codec,
  } = videoResource || {};
  const event: StartVideoEventType = {
    video_id: parseInt(videoId, 10),
    start_position: startPosition,
    current_cdn: currentCDN,
    has_subtitles: hasSubtitles,
    is_livetv: isLiveTV,
    is_embedded: isEmbedded,
    is_fullscreen: isFullscreen,
    playback_source: playbackSource,
    // https://github.com/adRise/protos/blob/86e3f0f7757865a0b84d7566946d9b06c70513b4/common/constants.proto#L455-L468
    video_resource_type: type ? `VIDEO_RESOURCE_TYPE_${type.toUpperCase()}` : VideoResourceTypeState.VIDEO_RESOURCE_TYPE_UNKNOWN,
    video_resource_url: manifest?.url || '',
    video_codec_type: codec ? `VIDEO_CODEC_${codec}` : codec,
    video_resolution: videoResolution,
    audio_language: audioLanguage,
    bitrate,
  };
  if (inputDevice) {
    event.input_device = inputDevice;
  }
  return event;
};

export const buildStartLiveVideoObject = ({
  videoId,
  currentCDN,
  hasSubtitles,
  videoPlayer,
  videoResourceType,
  videoResourceUrl,
  isFullscreen,
  pageType,
}: {
  videoId: string;
  currentCDN: string;
  hasSubtitles: boolean;
  videoPlayer: PlayerDisplayMode;
  videoResourceType: VideoResourceTypeState;
  videoResourceUrl: string;
  isFullscreen: boolean;
  pageType?: PageType;
}): StartLiveVideoEventType => {
  let pageObj = {};
  if (
    pageType
    && typeof (pageType as NewsBrowsePage).news_browse_page === 'undefined'
    && typeof (pageType as VideoPlayerPage).video_player_page === 'undefined'
  ) {
    pageObj = pageType;
  }
  const event: StartLiveVideoEventType = {
    video_id: parseInt(videoId, 10),
    current_cdn: currentCDN,
    has_subtitles: hasSubtitles,
    video_player: videoPlayer,
    video_resource_type: videoResourceType,
    video_resource_url: videoResourceUrl,
    is_fullscreen: isFullscreen,
    ...pageObj,
  };
  return event;
};

export interface PlayProgressArgType {
  videoId: string;
  position: number;
  viewTime: number;
  videoResolution?: VideoResolutionType;
  playbackSource: PlaybackSourceType;
  playerDisplayMode: PlayerDisplayMode;
}
/**
 * Play Progress event object
 * @param videoId
 * @param position
 * @param viewTime
 * @param isFromAutoplayDeliberate
 * @param isFromAutoplayAutomatic
 */
export const buildPlayProgressObject = ({
  videoId,
  position,
  viewTime,
  videoResolution = VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN,
  playbackSource = PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE,
  playerDisplayMode = PlayerDisplayMode.DEFAULT,
}: PlayProgressArgType): PlayProgressEventType | null => {
  if (viewTime === 0) return null;
  const event: PlayProgressEventType = {
    video_id: parseInt(videoId, 10),
    position: Math.round(position * 1000),
    view_time: viewTime * 1000,
    playback_source: playbackSource,
    video_resolution: videoResolution,
    video_player: playerDisplayMode,
  };
  return event;
};

export const buildLivePlayProgressObject = ({
  videoId,
  viewTime,
  videoPlayer,
  pageType,
}: {
  videoId: string,
  viewTime: number,
  videoPlayer: PlayerDisplayMode,
  pageType?: PageType,
}): LivePlayProgressEventType | null => {
  if (viewTime === 0) return null;
  let pageObj = {};
  if (
    pageType
    && typeof (pageType as NewsBrowsePage).news_browse_page === 'undefined'
    && typeof (pageType as VideoPlayerPage).video_player_page === 'undefined'
  ) {
    pageObj = pageType;
  }
  const event: LivePlayProgressEventType = {
    video_id: parseInt(videoId, 10),
    view_time: viewTime * 1000,
    video_player: videoPlayer,
    ...pageObj,
  };
  return event;
};

/**
 * Trailer Play Progress Event Object
 * @param videoId
 * @param position
 * @param viewTime
 */
export const buildTrailerPlayProgressEvent = (
  videoId: string,
  position: number,
  viewTime: number,
): TrailerPlayProgressEventType => {
  return {
    video_id: parseInt(videoId, 10),
    position,
    view_time: viewTime,
  };
};

/**
 * Preview Play Progress Event Object
 * @param videoId
 * @param position
 * @param viewTime
 */
export const buildPreviewPlayProgressEvent = (
  videoId: string,
  position: number,
  viewTime: number,
  videoPlayer: PlayerDisplayMode,
  page: VideoPlayerPageType,
  slug: string,
): TrailerPlayProgressEventType => {
  const pageObj = getPageObjectFromPageType(page, videoId, slug);
  return {
    video_id: parseInt(videoId, 10),
    position: Math.round(position * 1000),
    view_time: Math.round(viewTime * 1000),
    videoPlayer,
    ...pageObj,
  };
};

/**
 * Build CastEvent payload
 * @param videoId
 * @param position
 * @param castType
 */
export const buildCastEventObject = (
  videoId: string,
  position: number,
  castType: CastType,
): CastEventType => {
  return {
    video_id: parseInt(videoId, 10),
    position: Math.round(position * 1000),
    cast_type: castType,
  };
};

/**
 * Resume After Break Event Payload
 * @param videoId
 * @param position
 */
export const buildResumeAfterBreakEventObject = (
  videoId: string,
  position: number,
): ResumeAfterBreakEventType => {
  return {
    video_id: parseInt(videoId, 10),
    position: Math.round(position * 1000),
    is_proxy_event: false,
  };
};

/**
 * Bookmark Event Object
 * @param contentId
 * @param contentType
 * @param operation
 */
export const buildBookmarkEventObject = (
  location: string,
  contentId: string,
  operation: Operation,
  componentType?: AnalyticsComponentValueType,
  extraCtx?: PageTypeExtraCtx,
): BookmarkEventType => {
  const isSeries = contentId.startsWith('0');
  const pageObj: PageType | null = getPageObjectFromURL(location, extraCtx);
  const componentObj = getComponentObjectFromURL({
    pageUrl: location,
    contentId,
    isSeries,
    matrix: { startX: 0, startY: 0 },
    componentType,
  } as ComponentObjType);
  const event: Partial<BookmarkEventType> = {
    [isSeries ? 'series_id' : 'video_id']: parseInt(contentId, 10),
    op: operation,
    ...pageObj,
    ...componentObj,
  };
  return event as BookmarkEventType;
};

/**
 * Build SocialShareEventObject
 * @param contentId
 * @param isSeries
 * @param channel
 * @param action
 */
export const buildSocialShareEventObject = (
  contentId: string,
  channel: Channel,
  action: Action,
): SocialShareEventType => {
  const isSeries = contentId.startsWith('0');
  const event: Partial<SocialShareEventType> = {
    [isSeries ? 'series_id' : 'video_id']: parseInt(contentId, 10),
    action,
    channel,
  };
  return event as SocialShareEventType;
};

/**
 * SubtitlesToggle event payload
 * @param videoId
 * @param toggleState
 */
export const buildSubtitlesToggleEventObject = (
  videoId: string,
  toggleState: ToggleState,
  language_code: Language = 'UNKNOWN',
): SubtitlesToggleEventType => {
  return {
    video_id: parseInt(videoId, 10),
    toggle_state: toggleState,
    language_code,
  };
};

/**
 * AudioToggleEvent event payload
 * @param videoId
 * @param toggleState
 */
export const buildAudioTrackToggleEventObject = (
  videoId: string,
  code: Language,
  descriptionsEnabled: boolean = false,
): AudioTrackToggleEventType => {
  return {
    video_id: parseInt(videoId, 10),
    language_code: code,
    descriptions_enabled: descriptionsEnabled,
  };
};

/**
 * Build QualityToggleEvent payload
 * @param videoId
 * @param currentQuality
 */
export const buildQualityToggleEventObject = (
  videoId: string,
  bitrate?: number,
  videoResolution: VideoResolutionType = VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN,
  status: PlayerActionStatus = PlayerActionStatus.UNKNOWN_ACTION_STATUS,
): QualityToggleEventType => {
  return {
    video_id: parseInt(videoId, 10),
    toggle_state: ToggleState.ON,
    ...(bitrate && { bitrate }),
    video_resolution: videoResolution,
    status,
  };
};

/**
 * FullscreenToggle Event payload
 * @param videoId
 * @param toggleState
 */
export const buildFullscreenToggleEventObject = (
  videoId: string,
  toggleState: ToggleState,
): FullscreenToggleEventType => {
  return {
    video_id: parseInt(videoId, 10),
    toggle_state: toggleState,
  };
};

/**
 * Build PauseToggleEvent object
 * @param videoId
 * @param pauseState
 */
export const buildPauseToggleEventObject = (
  videoId: string,
  pauseState: PauseState,
  inputDevice?: InputDeviceType,
): PauseToggleEventType => {
  const eventObj: PauseToggleEventType = {
    video_id: parseInt(videoId, 10),
    pause_state: pauseState,
  };
  if (inputDevice) {
    eventObj.input_device = inputDevice;
  }
  return eventObj;
};

export interface SeekEventArgType {
  videoId: string;
  fromPosition: number;
  toPosition: number;
  seekType: SeekType;
  adCountdownVisible?: boolean;
  direction?: number;
  // When dealing with FF or RW, the rate should be 1, 2, or 3 (for the three speeds)
  // When dealing with a skip seek, the rate should be the amount of time skipped
  // e.g. 10 or 30. This can also be derived from toPosition - fromPosition,
  // but the spec asks for this despite the fact that it means the rate column
  // does not have a consistent semantics
  rate?: number;
}
/**
 * SeekEvent object
 */
export const buildSeekEventObject = ({
  videoId,
  fromPosition,
  toPosition,
  seekType,
  adCountdownVisible,
  direction,
  rate,
}: SeekEventArgType): SeekEventType => {
  return {
    video_id: parseInt(videoId, 10),
    from_position: Math.round(fromPosition * 1000),
    to_position: Math.round(toPosition * 1000),
    adCountdownVisible,
    direction,
    ...(rate && { rate }),
    ...(seekType && { seek_type: seekType }), // will omit seekType if source is falsy
  };
};

export type AccountEventPayload = {
  manip: Manipulation;
  current?: AuthType;
  linked?: AuthType;
  userType?: UserType;
  message?: string;
  status: ActionStatus;
};

/**
 * Track Account Events
 * https://github.com/adRise/protos/blob/master/analytics/events.proto#L1086
 */
export const trackAccountEvent = ({
  manip,
  current,
  linked,
  userType,
  message,
  status,
}: AccountEventPayload): void => {
  const accountObj = {
    manip,
    current,
    linked,
    user_type: userType,
    message,
    status,
  };

  // Filter all null/undefined properties. Message if passed will never be empty string.
  const eventPayload: Partial<AccountEventType> = pickBy(accountObj);

  trackEvent(eventTypes.ACCOUNT_EVENT, eventPayload as AppEvent);
};

export type RegisterEventPayload = {
  progress: ProgressType,
  current?: string,
};

/**
 * Track the steps a user makes in registration
 * https://github.com/adRise/protos/blob/master/analytics/events.proto#L1126
 */
export const trackRegisterEvent = (registerEventPayload: RegisterEventPayload): void => {
  const eventPayload: Partial<RegisterEventType> = pickBy(registerEventPayload);
  trackEvent(eventTypes.REGISTER_EVENT, eventPayload as AppEvent);
};

/**
 * Build the dialog object that is needed for analytics redesign
 * @param location
 * @param dialogType
 */
export const buildDialogEvent = (
  location: string,
  dialogType: DialogType,
  dialogSubType?: string,
  dialogAction?: DialogAction,
  extraCtx?: PageTypeExtraCtx & { video_id?: number },
): DialogEventType | null => {
  const pageObj: PageType | null = getPageObjectFromURL(location, extraCtx);
  if (!pageObj) return null;

  const event: DialogEventType = {
    dialog_type: dialogType,
    ...pageObj,
    ...extraCtx,
  };
  if (dialogSubType) {
    event.dialog_sub_type = dialogSubType;
  }
  if (dialogAction) {
    event.dialog_action = dialogAction;
  }
  return event;
};

/**
 * Create body for AutoPlayEvent
 * @param videoId
 * @param autoPlayAction
 */
export const buildAutoPlayEventBody = (
  videoId: string,
  autoPlayAction: AutoPlayAction,
): AutoPlayEventType => {
  return {
    video_id: parseInt(videoId, 10),
    auto_play_action: autoPlayAction,
  };
};

export type TubiAd = {
  id: string,
  title?: string,
  duration: number,
  video: string,
};

export type AdParamType = {
  ad: TubiAd,
  adsCount: number,
  adSequence: number,
  contentId: string,
  startPosition?: number, // should be in seconds
  endPosition?: number, // should be in seconds
  isFullscreen: boolean,
  reason?: Reason,
  adType?: AdType,
};

export type LiveStartAdParamType = {
  ad: Omit<TubiAd, 'duration'>,
  adSequence: number,
  isFullscreen: boolean,
  contentId: string,
  videoPlayer: PlayerDisplayMode,
};

export type LiveFinishAdParamType = {
  ad: TubiAd,
  adSequence: number,
  isFullscreen: boolean,
  contentId: string,
  videoPlayer: PlayerDisplayMode,
  exitType: ExitType,
};

/**
 * Build StartAdEvent object
 */
export const buildStartAdEventPayload = ({
  ad,
  adsCount,
  adSequence,
  contentId,
  startPosition = 0,
  isFullscreen = false,
  adType,
}: AdParamType): StartAdEventType => {
  return {
    ad_started: {
      ad_id: ad.id,
      creative_url: ad.video,
      index: adSequence,
      creative_duration: ad.duration,
      pod_size: adsCount,
      ...(adType !== undefined ? { ad_type: adType } : {}),
    },
    video_id: parseInt(contentId, 10),
    start_position: Math.round(startPosition * 1000),
    is_fullscreen: isFullscreen,
    is_proxy_event: false,
  };
};

/**
 * Build Live StartAdEvent object
 */
export const buildLiveStartAdEventPayload = ({
  ad,
  adSequence,
  isFullscreen,
  contentId,
  videoPlayer,
}: LiveStartAdParamType): LiveStartAdEventType => {
  return {
    start_position: 0,
    ad_started: {
      ad_id: ad.id,
      index: adSequence,
    },
    is_proxy_event: false,
    is_fullscreen: isFullscreen,
    video_id: contentId,
    video_player: videoPlayer,
  };
};

/**
 * Build FinishAdEvent
 */
export const buildFinishAdEventPayload = ({
  ad,
  adsCount,
  adSequence,
  contentId,
  endPosition = 0,
  adType,
}: AdParamType): FinishAdEventType => {
  return {
    ad_finished: {
      ad_id: ad.id,
      creative_url: ad.video,
      index: adSequence,
      creative_duration: ad.duration,
      pod_size: adsCount,
      ...(adType !== undefined ? { ad_type: adType } : {}),
    },
    video_id: parseInt(contentId, 10),
    end_position: Math.round(endPosition * 1000),
    is_proxy_event: false,
  };
};

/**
 * Build Live FinishAdEvent object
 */
export const buildLiveFinishAdEventPayload = ({
  ad,
  adSequence,
  isFullscreen,
  contentId,
  videoPlayer,
  exitType,
}: LiveFinishAdParamType): LiveFinishAdEventType => {
  return {
    end_position: 0,
    ad_finished: {
      ad_id: ad.id,
      reported_duration: Math.floor(ad.duration),
      index: adSequence,
    },
    is_proxy_event: false,
    is_fullscreen: isFullscreen,
    video_id: contentId,
    video_player: videoPlayer,
    exit_type: exitType,
  };
};

/**
 * Build experiment exposure event
 */
export const buildExposureEvent = (experiment: Experiment): ExposureEventType => {
  return {
    experiment,
  };
};

/**
 * Build the Request for info object which is currently used to store
 * birthday for COPPA compliance
 * @param { birthday: string } | { gender: string }
 * birthday value format: YYYY-MM-DD
 */
type RequestForInfoEventParam = { birthday: string } | { gender: string } | { genre: { options: string[], selections: number[] } };

export const buildRequestForInfoEventObject = (payload: RequestForInfoEventParam): RequestForInfoEventType | void => {
  /* istanbul ignore else */
  if ('birthday' in payload) {
    // change ISO format(YYYY-MM-DD) to MM/DD/YYYY for analytics
    const [year, month, day] = payload.birthday.split('-');
    const birth = `${month}/${day}/${year}`;
    return {
      request_for_info_action: RequestForInfoAction.BIRTHDAY,
      prompt: birth,
      string_selector: {
        options: [birth],
        string_selector_type: SelectorType.BIRTHDAY,
        selections: [1],
        sub_type: birth,
      },
    };
  }
  /* istanbul ignore else */
  if ('gender' in payload) {
    const gender = payload.gender;
    return {
      request_for_info_action: RequestForInfoAction.SURVEY,
      prompt: 'gender',
      string_selector: {
        options: [gender],
        string_selector_type: SelectorType.DEMOGRAPHIC,
        selections: [1],
        sub_type: gender,
      },
    };
  }

  /* istanbul ignore else */
  if ('genre' in payload) {
    const { genre: { options, selections } } = payload;
    return {
      request_for_info_action: RequestForInfoAction.ONBOARD,
      prompt: 'genre',
      string_selector: {
        options,
        string_selector_type: SelectorType.GENRE,
        selections,
      },
    };
  }
};

export const buildGenreExplicitFeedbackEventObject = (genre: string, userInteraction: ExplicitInteraction): GenreSelectionEvent => {
  const pageObj: PageType | null = getPageObjectFromURL(getCurrentPathname());
  return {
    genre: {
      genre,
      user_interaction: userInteraction,
    },
    ...pageObj,
  };
};

export const buildContainerExplicitFeedbackEventObject = (container: string, userInteraction: ExplicitInteraction): ContainerSelectionEvent => {
  return {
    container: {
      container_slug: container,
      user_interaction: userInteraction,
    },
  };
};

/**
 * Returns an explicit feedback event for the given content id if it is valid
 * @param contentId - e.g. '0300004985' or '543161'
 * @param userInteraction - Named analytics explicit interaction
 * @param componentType - Generate the component object from this
 * @param pathname - Pathname to generate page object, defaults to
 * `getCurrentPathname()`
 */
export const buildContentExplicitFeedbackEventObject = (
  contentId: string,
  userInteraction: ExplicitInteraction,
  componentType?: AnalyticsComponentValueType,
  pathname?: string,
  extraCtx?: PageTypeExtraCtx,
): ExplicitFeedbackEventType | null => {
  const contentObject = buildContentObject(contentId, isSeriesId(contentId));
  const pageObj: PageType | null = getPageObjectFromURL(pathname ?? getCurrentPathname(), extraCtx);
  if (!contentObject) return null;
  const componentObject = {};
  if (componentType) {
    componentObject[componentType] = {};
  }
  return {
    content: {
      ...contentObject,
      user_interaction: userInteraction,
    },
    ...pageObj,
    ...componentObject,
  };
};

export const buildPictureInPictureToggleEventObject = (
  videoId: string,
  toggleState: ToggleState,
): PictureInPictureToggleEventType => {
  return {
    video_id: parseInt(videoId, 10),
    toggle_state: toggleState,
  };
};

export const getDisplayResolution = (): string|undefined => {
  if (__CLIENT__) {
    const w = window.screen.width * window.devicePixelRatio;
    const h = window.screen.height * window.devicePixelRatio;
    return `${w}x${h}`;
  }
};
