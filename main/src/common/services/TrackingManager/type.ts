import type {
  ComponentInteractionLeftNavComponent,
  ComponentInteractionTopNavComponent,
} from '@tubitv/analytics/lib/componentInteraction';
import type {
  ANALYTICS_COMPONENTS,
  ANALYTICS_DESTINATION_COMPONENTS,
  ComponentType,
} from '@tubitv/analytics/lib/components';
import type { AppEvent, EventTypes } from '@tubitv/analytics/lib/events';
import type { InputDeviceType } from '@tubitv/analytics/lib/genericEvents';
import type { MeansOfNavigationType } from '@tubitv/analytics/lib/navigateWithinPage';
import type { PageType } from '@tubitv/analytics/lib/pages';
import type {
  Language,
  PlayerDisplayMode,
  VideoResolutionType,
  VideoResourceTypeState,
} from '@tubitv/analytics/lib/playerEvent';
import type { ValueOf } from 'ts-essentials';

import type { VideoResource } from 'common/types/video';
import type { PageTypeExtraCtx } from 'common/utils/analytics';

export interface TrackingState {
  isReadyToSendAnalyticsEvent: boolean;
  eventsQueue: [EventTypes, AppEvent][];
  // current page url
  trackingURI: string;
  // history stack of urls
  trackingHistoryStack: string[];
  fromAutoplayDeliberate?: boolean;
  inputDevice?: InputDeviceType;
  originNavigateToPageComponent: ComponentType | null;
  navigationStartPosition: NavigationStartPosition;
}

export interface NavigationStartPosition {
  startMatrixX: number;
  startMatrixY: number;
  startContainerId?: string;
  meansOfNavigation: MeansOfNavigationType | null;
  startContentId?: string;
  currentWindowLocation: string;
}

export interface TrackNavigateWithinEventParams {
  endMatrixX: number;
  endMatrixY: number;
  componentType: ValueOf<typeof ANALYTICS_COMPONENTS>;
  extraCtx?: Record<string, unknown>;
  shouldKeepPosition?: boolean;
  destinationComponentType?: ValueOf<typeof ANALYTICS_DESTINATION_COMPONENTS>;
}

export interface SendNavigateWithinPageParams {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  contentId?: string;
  containerId?: string;
  componentType: ValueOf<typeof ANALYTICS_COMPONENTS>;
  destinationComponentType?: ValueOf<typeof ANALYTICS_DESTINATION_COMPONENTS>;
  extraCtx?: Record<string, unknown>;
  shouldKeepPosition?: boolean;
  meansOfNavigation?: MeansOfNavigationType;
}

export interface SendNavigateWithinPageOptions {
  debounce?: boolean;
}

export interface TrackCarouselTriggerParams {
  startX: number;
  endX: number;
  contentId?: string;
  slug?: string;
  componentType: ValueOf<typeof ANALYTICS_COMPONENTS>;
  meansOfNavigation?: MeansOfNavigationType;
}

export type ComponentParams =
  | {
      endY?: number;
      endX?: number;
      componentType: ValueOf<typeof ANALYTICS_COMPONENTS>;
    }
  | {
      actorName: string;
      componentType: typeof ANALYTICS_COMPONENTS['castListComponent'];
    }
  | {
      genreName: string;
      componentType: typeof ANALYTICS_COMPONENTS['genreListComponent'];
    }
  | {
      startX: number;
      startY: number;
      containerSlug?: string;
      contentId?: string;
      pageUrl?: string;
      genreName?: never;
      extraCtx?: PageTypeExtraCtx;
      componentType: ValueOf<
        Omit<typeof ANALYTICS_COMPONENTS, 'genreListComponent'>
      >;
    };

export interface NavigateToPageParams {
  currentPageUrl: string;
  nextPageUrl: string;
  component?:
    | ComponentType
    | ComponentInteractionLeftNavComponent
    | ComponentInteractionTopNavComponent;
  extraCtx?: PageTypeExtraCtx;
}

export interface StartVideoParams {
contentId: string;
  resumePos: number;
  isAutoplay: boolean;
  isFromVideoPreview?: boolean;
  videoResource?: VideoResource;
  inputDevice?: InputDeviceType;
  hasSubtitles: boolean;
  audioLanguage?: Language;
  videoResolution?: VideoResolutionType;
  bitrate?: number;
}

export enum VideoPlayerPageType {
  HOME_PAGE = 'home_page',
  MY_STUFF_PAGE = 'for_you_page',
  VIDEO_PAGE = 'video_page',
  CATEGORY_PAGE = 'category_page',
  SERIES_DETAIL_PAGE = 'series_detail_page',
  LINEAR_DETAILS_PAGE = 'linear_details_page',
}

export interface StartPreviewParams {
  contentId: string;
  videoPlayer: PlayerDisplayMode;
  page: VideoPlayerPageType;
  slug: string;
}

export interface TrackPreviewProgressEventParams {
  contentId: string;
  position: number;
  viewTime: number;
  videoPlayer: PlayerDisplayMode;
  page: VideoPlayerPageType;
  slug: string;
}

export interface FinishPreviewParams {
  contentId: string;
  position: number;
  page: VideoPlayerPageType;
  videoPlayer: PlayerDisplayMode;
  hasCompleted: boolean;
  slug: string;
}

export interface TrackStartLiveVideoEventParams {
  contentId: string;
  videoPlayer: PlayerDisplayMode;
  videoResourceType: VideoResourceTypeState;
  hasSubtitles?: boolean;
  streamUrl: string;
  isFullscreen: boolean;
  pageType?: PageType;
  purpleCarpet?: boolean;
}

export interface TrackPlayProgressEventParams {
  contentId: string;
  resumePos: number;
  viewTime: number;
  isAutoplay: boolean;
  isFromVideoPreview?: boolean;
  videoResolution?: VideoResolutionType;
}

export interface TrackLivePlayProgressEventParams {
  contentId: string;
  viewTime: number;
  videoPlayer: PlayerDisplayMode;
  pageType?: PageType;
  purpleCarpet?: boolean;
}

export interface TrackTrailerPlayProgressEventParams {
  contentId: string;
  position: number;
  viewTime: number;
  videoPlayer: PlayerDisplayMode;
}
