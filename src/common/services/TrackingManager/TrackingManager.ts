import type { AppEvent, EventTypes } from '@tubitv/analytics/lib/events';
import type { InputDeviceType } from '@tubitv/analytics/lib/genericEvents';
import { PlaybackSourceType } from '@tubitv/analytics/lib/genericEvents';
import { PlayerDisplayMode, VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import debounce from 'lodash/debounce';

import { getLocalData, removeLocalData, setLocalData } from 'client/utils/localDataStorage';
import { TRACK_NAVIGATE_WITHIN_PAGE_WAIT_TIME } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import type {
  TrackingState,
  ComponentParams,
  SendNavigateWithinPageParams,
  SendNavigateWithinPageOptions,
  NavigateToPageParams,
  NavigationStartPosition,
  TrackNavigateWithinEventParams,
  TrackCarouselTriggerParams,
  TrackStartLiveVideoEventParams,
  TrackPlayProgressEventParams,
  TrackLivePlayProgressEventParams,
  TrackTrailerPlayProgressEventParams,
  StartVideoParams,
  StartPreviewParams,
  TrackPreviewProgressEventParams,
  FinishPreviewParams } from 'common/services/TrackingManager/type';
import type {
  AdParamType,
  LiveStartAdParamType,
  LiveFinishAdParamType } from 'common/utils/analytics';
import {
  buildFinishAdEventPayload,
  buildLiveStartAdEventPayload,
  buildLiveFinishAdEventPayload,
  buildLivePlayProgressObject,
  buildNavigateToPageEventObject,
  buildNavigateWithinEventObject,
  buildPlayProgressObject,
  buildPreviewPlayProgressEvent,
  buildStartAdEventPayload,
  buildStartLiveVideoObject,
  buildStartVideoObject,
  getComponentObjectFromURL,
  getPageObjectFromPageType,
} from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { isPictureInPictureEnabled } from 'common/utils/pictureInPicture';
import { trackEvent } from 'common/utils/track';

const initialNavigationStartPosition: NavigationStartPosition = {
  startMatrixX: -1,
  startMatrixY: -1,
  startContainerId: '',
  startContentId: '',
  currentWindowLocation: '',
  meansOfNavigation: null,
};

class TrackingManager {
  constructor(initialState: Partial<TrackingState> = {}) {
    this.state = {
      ...this.state,
      ...initialState,
    };
  }

  private state: TrackingState = {
    // initial state to empty objects for when STORE_CONTAINER is not called beforehand (e.g. server-side load)
    isReadyToSendAnalyticsEvent: false,
    eventsQueue: [],
    // current page url
    trackingURI: '',
    trackingHistoryStack: [],
    originNavigateToPageComponent: null,
    fromAutoplayDeliberate: false,
    inputDevice: undefined,
    navigationStartPosition: initialNavigationStartPosition,
  };

  getState = () => this.state;

  private resetNavigationStartPosition() {
    this.state.navigationStartPosition = initialNavigationStartPosition;
  }

  private setNavigationStartPosition(
    newPosition: Partial<NavigationStartPosition>
  ) {
    this.state.navigationStartPosition = {
      ...this.state.navigationStartPosition,
      ...newPosition,
    };
  }

  /**
   * trackNavigateWithinEvent: send the NavigateWithinPage event with the required params.
   * For more information: https://github.com/adRise/protos/blob/master/analytics/events.proto#L543
   */
  private trackNavigateWithinEvent({
    endMatrixX,
    endMatrixY,
    componentType,
    extraCtx,
    shouldKeepPosition,
    destinationComponentType,
  }: TrackNavigateWithinEventParams) {
    const {
      startMatrixX,
      startMatrixY,
      startContainerId: slug,
      meansOfNavigation,
      startContentId: contentId,
      currentWindowLocation,
    } = this.state.navigationStartPosition;

    if (!contentId && !shouldKeepPosition && !slug) {
      this.resetNavigationStartPosition();
      return;
    }

    const matrix = {
      startX: startMatrixX + 1,
      startY: startMatrixY + 1,
      endX: endMatrixX + 1,
      endY: endMatrixY + 1,
    };

    const navigateWithinEventObj = buildNavigateWithinEventObject({
      pageUrl: currentWindowLocation,
      matrix,
      // We can be sure meansOfNavigation is not null now since we only call this function inside.
      meansOfNavigation: meansOfNavigation!,
      containerSlug: slug || '',
      contentId: contentId || undefined,
      isSeries: contentId ? contentId[0] === '0' : false,
      componentType,
      destinationComponentType,
      extraCtx,
    });

    // Build and send the navigate within page event
    trackEvent(eventTypes.NAVIGATE_WITHIN_PAGE, navigateWithinEventObj);

    // Reset the start container slug before debounce
    this.resetNavigationStartPosition();
  }

  /**
   * debouncedNavigateWithinPageAction: send NAVIGATE_WITHIN_PAGE action after a debounced time with a MAX_WAIT time of 3000ms.
   */
  debouncedNavigateWithinPageAction = debounce(
    this.trackNavigateWithinEvent,
    TRACK_NAVIGATE_WITHIN_PAGE_WAIT_TIME,
    { maxWait: TRACK_NAVIGATE_WITHIN_PAGE_WAIT_TIME }
  );

  sendNavigateWithinPage({
    startX,
    startY,
    endX,
    endY,
    contentId,
    containerId,
    componentType,
    extraCtx,
    shouldKeepPosition,
    meansOfNavigation,
    destinationComponentType,
  }: SendNavigateWithinPageParams, options: SendNavigateWithinPageOptions = { debounce: true }) {
    const { startMatrixX, startMatrixY } = this.state.navigationStartPosition;
    /*
      Set the containerId before the debounce began. We are concerned with moving in the
      X or Y direction, so check if startMatrixX position is -1 or startMatrixY position is -1.
      Set the x, y position of content in grid along with
      start containerId, start contentId, window location and means of navigation.
      Storing the window location and means of navigation here
      because the user can change the page within a 3 second duration.
      So we should know the page location and means of navigation
      before the debounce begins.
    */
    if (startMatrixX === -1 || startMatrixY === -1) {
      this.setNavigationStartPosition({
        startMatrixX: startX,
        startMatrixY: startY,
        startContainerId: containerId,
        startContentId: contentId,
        currentWindowLocation: getCurrentPathname(),
        meansOfNavigation: meansOfNavigation || (__ISOTT__ ? 'BUTTON' : 'CLICK'),
      });
    }

    const payload = {
      endMatrixX: endX,
      endMatrixY: endY,
      componentType,
      destinationComponentType,
      extraCtx,
      shouldKeepPosition,
    };

    if (options.debounce) {
      this.debouncedNavigateWithinPageAction(payload);
    } else {
      this.trackNavigateWithinEvent(payload);
    }
  }

  /**
   * Track carousel events. Send NAVIGATE_WITHIN_PAGE events.
   * @param startX: The start position of left most item in the carousel page.
   * @param endX: The end position where the user navigating to.
   * @param contentId: The contentId of the left most item in the carousel page.
   * @param slug: Container slug.
   * @param componentType: Type of component.
   */
  trackCarouselTrigger({
    startX,
    endX,
    contentId,
    slug,
    componentType,
    meansOfNavigation,
  }: TrackCarouselTriggerParams, options?: SendNavigateWithinPageOptions) {
    this.sendNavigateWithinPage({
      startX,
      startY: 0,
      endX,
      endY: 0,
      contentId,
      containerId: slug,
      componentType,
      meansOfNavigation,
    }, options);
  }

  /**
   * Create a component which will be used to track last component clicked/pressed before a page transition
   * Eg.: for NAVIGATE_TO_PAGE events, we need to keep track of user's last click/press before the page transition happens.
   */
  createNavigateToPageComponent(params: ComponentParams) {
    const startX = 'startX' in params ? params.startX : 0;
    const startY = 'startY' in params ? params.startY : 0;
    const endX = 'endX' in params && params.endX ? params.endX : undefined;
    const endY = 'endY' in params && params.endY ? params.endY : undefined;
    const containerSlug = 'containerSlug' in params ? params.containerSlug : undefined;
    const contentId = 'contentId' in params ? params.contentId : undefined;
    const actorName = 'actorName' in params ? params.actorName : undefined;
    /* istanbul ignore next */
    const genreName = 'genreName' in params ? params.genreName : undefined;
    const extraCtx = 'extraCtx' in params ? params.extraCtx : undefined;
    this.state.originNavigateToPageComponent = getComponentObjectFromURL({
      pageUrl: 'pageUrl' in params ? params.pageUrl : getCurrentPathname(),
      matrix: {
        startX: startX + 1,
        startY: startY + 1,
        endX,
        endY,
      },
      containerSlug,
      contentId,
      isSeries: contentId ? contentId[0] === '0' : false,
      actorName,
      genreName,
      extraCtx,
      componentType: params.componentType,
    });
  }

  /**
   * trackNavigateToPage: NAVIGATE_TO_PAGE event according to analytics redesign v2
   * User has clicked/tapped,to navigate to a different URI.
   * https://github.com/adRise/protos/blob/master/analytics/events.proto#L430
   * currentPageUrl: The current page URL
   * nextPageUrl: Next page URL
   * component: Explicitly pass a component. Otherwise it is going to get from originNavigateToPageComponent
   * in the redux "tracking" reducer.
   */
  trackNavigateToPageEvent({
    currentPageUrl,
    nextPageUrl,
    component,
    extraCtx,
  }: NavigateToPageParams, cb?: (obj: ReturnType<typeof buildNavigateToPageEventObject>) => void) {
    const { originNavigateToPageComponent, inputDevice } = this.state;
    const analyticsComponent = originNavigateToPageComponent || component;
    const navigateToPageObj = buildNavigateToPageEventObject({
      currentPageUrl,
      nextPageUrl,
      analyticsComponent,
      inputDeviceType: inputDevice,
      extraCtx,
    });

    // Return undefined if no navigate to page object exists
    if (!navigateToPageObj) return;

    // Build and send the navigate withn page event
    trackEvent(eventTypes.NAVIGATE_TO_PAGE, navigateToPageObj);

    cb?.(navigateToPageObj);

    // reset input device
    // Reset the start container slug before debounce
    this.state.inputDevice = undefined;
    this.state.originNavigateToPageComponent = undefined;
  }

  setTrackingInputDevice(inputDevice: InputDeviceType) {
    this.state.inputDevice = inputDevice;
  }

  storeCurrentUrl(url: string) {
    if (url === this.state.trackingURI) return;
    this.state.trackingURI = url;
  }

  storeTrackingHistoryStack(trackingHistoryStack: string[]) {
    this.state.trackingHistoryStack = trackingHistoryStack;
  }

  /**
   * push event to queue and send later
   */
  addEventToQueue(eventName: EventTypes, eventValue: AppEvent) {
    const { isReadyToSendAnalyticsEvent } = this.state;
    if (isReadyToSendAnalyticsEvent) {
      trackEvent(eventName, eventValue);
    } else {
      this.state.eventsQueue.push([eventName, eventValue]);
    }
  }

  /**
   * send active event and send all other events in the queue
   */
  onAppInactive() {
    trackEvent(eventTypes.APP_INACTIVE, {});
  }

  /**
   * send active event and send all other events in the queue when app it's ready
   * For non-GDPR country, it will be triggered in componentDidMount in App.tsx
   * For GDPR country, it will be triggered when we get user consents.
   */
  onReadyToSendAnalyticsEvent() {
    const resumeActiveEvent = getLocalData('resumeActiveEvent');
    if (!resumeActiveEvent) {
      setLocalData('resumeActiveEvent', 'true');
    }
    trackEvent(eventTypes.APP_ACTIVE, { resume: !!resumeActiveEvent });
    this.state.isReadyToSendAnalyticsEvent = true;
    this.sendQueueEvents();
  }

  sendQueueEvents() {
    this.state.eventsQueue = this.state.eventsQueue.filter((event) => {
      const sent = trackEvent(...event);
      return !sent;
    });
  }

  /**
   * send exit event when user closes app
   */
  onAppExit() {
    removeLocalData('resumeActiveEvent');
    trackEvent(eventTypes.APP_EXIT, {});
  }

  /**
   * trackStartVideoEvent: START_VIDEO event
   */
  trackStartVideoEvent({
    inputDevice,
    videoResource,
    hasSubtitles,
    resumePos,
    isAutoplay,
    isFromVideoPreview,
    contentId,
    audioLanguage,
    videoResolution = VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN,
    bitrate,
  }: StartVideoParams) {
    const { fromAutoplayDeliberate } = this.state;
    /**
     * Only use fromAutoplayDeliberate if the video is auto played.
     * Otherwise the user played the video from detail page and this is
     * not initiated from the auto play component.
     */
    const fromAutoplayAutomatic = isAutoplay && !fromAutoplayDeliberate;
    const isFromAutoplayDeliberate = isAutoplay && !!fromAutoplayDeliberate;
    let playbackSource = PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE;
    if (fromAutoplayAutomatic) {
      playbackSource = PlaybackSourceType.AUTOPLAY_AUTOMATIC;
    } else if (isFromAutoplayDeliberate) {
      playbackSource = PlaybackSourceType.AUTOPLAY_DELIBERATE;
    } else if (isFromVideoPreview) {
      playbackSource = PlaybackSourceType.VIDEO_PREVIEWS;
    }
    const startVideoPayload = buildStartVideoObject({
      videoId: contentId,
      startPosition: resumePos * 1000, // In milliseconds
      hasSubtitles,
      isFullscreen: __ISOTT__,
      playbackSource,
      videoResource,
      inputDevice,
      audioLanguage,
      videoResolution,
      bitrate,
    });
    trackEvent(eventTypes.START_VIDEO, startVideoPayload);
  }

  trackStartLiveVideoEvent({
    contentId,
    videoPlayer,
    videoResourceType,
    streamUrl,
    hasSubtitles,
    isFullscreen,
    pageType,
    purpleCarpet,
  }: TrackStartLiveVideoEventParams) {
    const startVideoPayload = buildStartLiveVideoObject({
      videoId: contentId,
      hasSubtitles: !!hasSubtitles,
      currentCDN: streamUrl,
      videoPlayer,
      videoResourceType,
      videoResourceUrl: streamUrl,
      isFullscreen,
      pageType,
    });
    trackEvent(eventTypes.START_LIVE_VIDEO, startVideoPayload, purpleCarpet);
  }

  trackPlayProgressEvent({
    contentId,
    viewTime,
    isAutoplay,
    isFromVideoPreview,
    resumePos,
    videoResolution,
  }: TrackPlayProgressEventParams) {
    const { fromAutoplayDeliberate } = this.state;
    /**
     * Only use fromAutoplayDeliberate if the video is auto played.
     * Otherwise the user played the video from detail page and this is
     * not initiated from the auto play component.
     */
    const fromAutoplayAutomatic = isAutoplay && !fromAutoplayDeliberate;
    const isFromAutoplayDeliberate = isAutoplay && !!fromAutoplayDeliberate;
    let playbackSource = PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE;
    if (fromAutoplayAutomatic) {
      playbackSource = PlaybackSourceType.AUTOPLAY_AUTOMATIC;
    } else if (isFromAutoplayDeliberate) {
      playbackSource = PlaybackSourceType.AUTOPLAY_DELIBERATE;
    } else if (isFromVideoPreview) {
      playbackSource = PlaybackSourceType.VIDEO_PREVIEWS;
    }
    const playerDisplayMode = isPictureInPictureEnabled() ? PlayerDisplayMode.PICTURE_IN_PICTURE : PlayerDisplayMode.DEFAULT;
    const playProgressPayload = buildPlayProgressObject({
      videoId: contentId,
      position: resumePos,
      viewTime,
      playbackSource,
      videoResolution,
      playerDisplayMode,
    });
    trackEvent(eventTypes.PLAY_PROGRESS, playProgressPayload);
  }

  trackLivePlayProgressEvent({
    contentId,
    videoPlayer,
    viewTime,
    pageType,
    purpleCarpet,
  }: TrackLivePlayProgressEventParams) {
    const playProgressPayload = buildLivePlayProgressObject({
      videoId: contentId,
      viewTime,
      videoPlayer: isPictureInPictureEnabled() ? PlayerDisplayMode.PICTURE_IN_PICTURE : videoPlayer,
      pageType,
    });
    trackEvent(eventTypes.LIVE_PLAY_PROGRESS, playProgressPayload, purpleCarpet);
  }

  trackTrailerPlayProgressEvent({
    position,
    videoPlayer,
    viewTime,
    contentId,
  }: TrackTrailerPlayProgressEventParams) {
    const positionMilli = Math.round(position * 1000);
    const viewTimeMilli = Math.round(viewTime * 1000);
    trackEvent(eventTypes.PLAY_PROGRESS_TRAILER, {
      video_id: contentId,
      position: positionMilli,
      view_time: viewTimeMilli,
      video_player: videoPlayer,
    });
  }

  startAdEvent(params: AdParamType) {
    const payload = buildStartAdEventPayload(params);
    trackEvent(eventTypes.START_AD_EVENT, payload);
  }

  finishAdEvent(params: AdParamType) {
    const payload = buildFinishAdEventPayload(params);
    trackEvent(eventTypes.FINISH_AD_EVENT, payload);
  }

  startLiveAdEvent(params: LiveStartAdParamType) {
    const payload = buildLiveStartAdEventPayload(params);
    trackEvent(eventTypes.START_AD_EVENT, payload);
  }

  finishLiveAdEvent(params: LiveFinishAdParamType) {
    const payload = buildLiveFinishAdEventPayload(params);
    trackEvent(eventTypes.FINISH_AD_EVENT, payload);
  }

  setAutoplayDeliberate(fromAutoplayDeliberate: boolean) {
    this.state.fromAutoplayDeliberate = fromAutoplayDeliberate;
  }

  trackStartPreviewEvent({
    contentId,
    videoPlayer,
    page,
    slug,
  }: StartPreviewParams) {
    const pageObj = getPageObjectFromPageType(page, contentId, slug);
    trackEvent(eventTypes.START_PREVIEW, {
      video_id: parseInt(contentId, 10),
      video_player: videoPlayer,
      is_fullscreen: false,
      ...pageObj,
    });
  }

  trackPreviewPlayProgressEvent({
    contentId,
    position,
    viewTime,
    videoPlayer,
    page,
    slug,
  }: TrackPreviewProgressEventParams) {
    trackEvent(eventTypes.PREVIEW_PLAY_PROGRESS, buildPreviewPlayProgressEvent(contentId, position, viewTime, videoPlayer, page, slug));
  }

  trackFinishPreviewEvent({
    contentId,
    position,
    page,
    hasCompleted,
    videoPlayer,
    slug,
  }: FinishPreviewParams) {
    const pageObj = getPageObjectFromPageType(page, contentId, slug);
    trackEvent(eventTypes.FINISH_PREVIEW, {
      video_id: parseInt(contentId, 10),
      end_position: Math.round(position * 1000),
      has_completed: hasCompleted,
      video_player: videoPlayer,
      ...pageObj,
    });
  }
}

export default TrackingManager;
