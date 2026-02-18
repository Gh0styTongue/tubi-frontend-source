import type { KidsModeEligibilityModalTypes } from 'common/actions/ottUI';
import type { CONTENT_MODE_VALUE, LiveContentMode } from 'common/constants/constants';
import type { ContainerUISection } from 'common/types/fire';
import type { DeeplinkType } from 'common/utils/deeplinkType';

export enum OTTInputMode {
  DEFAULT = 'DEFAULT',
  MOUSE = 'MOUSE',
}

// Note: The order of these options is important for NavigateWithinPage event
// Remember to test it when changing the options below
export enum LeftNavMenuOption {
  Account = 1,
  Search = 2,
  Home = 3,
  MovieMode = 4,
  TVMode = 5,
  // To users these are categories, internally they are containers
  Categories = 6,
  Channels = 7,
  Dev = 8,
  Settings = 9,
  Exit = 10,
  Kids = 11,
  MyStuff = 12,
  EspanolMode = 13,
  LiveTV = 14,
}

export enum LinearLeftNavMenuOption {
  SUBTITLES,
  BACK,
  FAVORITES,
  USER_FEEDBACK,
}

export enum TopNavOption {
  Recommended,
  Movies,
  TVShows,
  Linear,
  Sports,
  Espanol,
  MyStuff,
}

export enum ICTSNavOption {
  Movies,
  TVShows,
  Live,
  Espanol,
  KIDS,
}

export enum LinearTopNavOption {
  All,
  News,
  Sports,
}

export enum ContentDetailPageNavOption {
  ContinueWatching = 1,
  Play,
  WatchTrailer,
  Like,
  Dislike,
  LikeOrDislike,
  EpisodesList,
  SignIn,
  SignUpToSaveProgress,
  AddToMyList,
  RemoveFromMyList,
  RemoveFromHistory,
  GoToNetwork,
  StartFromBeginning,
  Share,
  ReportProblem,
  LikeRemoveRating,
  DislikeRemoveRating,
  SetReminder,
  RemoveReminder,
  SignInToWatchEarly,
}

export enum OpenLeftNavFromReason {
  GRID = 'GRID',
  TOP_NAV_ARROW = 'TOP_NAV_ARROW',
  TOP_NAV_BACK_BUTTON = 'TOP_NAV_BACK_BUTTON',
}

export interface GridUIState {
  activeContainerId: string;
  gridIndex: number;
  section: ContainerUISection;
}

export interface ContainerGridUIState {
  activeContainerGridId: string;
  activeNetworkContainerGridId: string;
  activeContainerVideoGridId: string;
  activePreviewVideoId: string;
}

export interface TopDetailsUIState {
  ifBgImageMatchActiveContent: boolean;
  isNavigatingGrid: boolean;
}

export interface LeftNavState {
  isExpanded: boolean;
  selectedOption: LeftNavMenuOption | null;
  openFromReason?: OpenLeftNavFromReason;
}

export interface LiveChannelState {
  index: number;
  contentId: string;
}

export interface OTTUIContentMode {
  /** @deprecated */
  _active: CONTENT_MODE_VALUE;
  previous: CONTENT_MODE_VALUE;
  /** @deprecated */
  _notHomeOrContentModePage: boolean;
}

export interface TopNavState {
  isActive: boolean;
  hoverIndex?: number;
}

export interface DiscoveryRowState {
  activeContainerId: string;
  isPillActive: boolean;
}

export interface YouMayAlsoLikeState {
  isActive: boolean;
}

export interface OttUIState {
  leftNav: LeftNavState;
  containerGrid: ContainerGridUIState;
  debouncedGridUI: GridUIState;
  debugVoiceView: boolean;
  deeplinkType: DeeplinkType;
  contentMode: OTTUIContentMode;
  background: TopDetailsUIState;
  liveChannel: LiveChannelState;
  ageGate: {
    isVisible: boolean;
    eligibilityModalType: KidsModeEligibilityModalTypes;
  };
  inputMode: OTTInputMode;
  epg: {
    activeContentId: string;
    activeContainerId: string;
    focusedContentId: string;
    focusedContainerId: string;
    focusedContentIndex: number;
    focusedProgramIndex: number;
    topNav: {
      isActive: boolean;
      activeContentMode: LiveContentMode;
    };
  };
  discoveryRow: DiscoveryRowState;
  autoplay: {
    enabled: boolean;
  };
  videoPreview: {
    enabled: boolean;
    autostart: boolean;
    hasPrompted: boolean;
    hasExpired: boolean;
    isAutostarting: boolean;
  };
  youMayAlsoLike: YouMayAlsoLikeState;
  intro: {
    ended: boolean;
    disabled: boolean;
    shouldLoadHomescreenAfterRender: boolean;
  };
  featureEducation: {
    educated: number | undefined;
  };
  browseWhileWatchingCacheKey: string;
}

export interface TransitionClassesShape {
  appear?: string;
  appearActive?: string;
  appearDone?: string;
  enter?: string;
  enterActive?: string;
  enterDone?: string;
  exit?: string;
  exitActive?: string;
  exitDone?: string;
}
