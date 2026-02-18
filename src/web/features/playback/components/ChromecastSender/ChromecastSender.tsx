/* eslint-disable ssr-friendly/no-dom-globals-in-react-cc-render */
/**
 * Web App.tsx lazy load the chromecast sender to ensure this file would not be run under server-side
 */
/// <reference types="@types/chromecast-caf-sender" />
import type { AudioTrackInfo } from '@adrise/player';
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { isCastConnected } from 'client/utils/clientTools';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { setChromecastAutoplayVisible } from 'common/actions/ui';
import { loadVideoById } from 'common/actions/video';
import * as actions from 'common/constants/action-types';
import { AUDIO_SELECT_EXPIRE_TIME, WEB_AUDIO_TRACK_SELECT } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { isInGDPRCountryWithKidsSelector } from 'common/features/gdpr/selectors/gdpr';
import { getCaptionIndexSelector } from 'common/selectors/chromecast';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { buildAudioTrackToggleEventObject } from 'common/utils/analytics';
import { getLanguageCodeFromAudioTrack, audioLabelMapping, isDescriptionTrack } from 'common/utils/audioTracks';
import { sendChromecastCustomMessage } from 'common/utils/chromecast';
import { trackEvent } from 'common/utils/track';
import conf from 'src/config';
import type { ChromecastMediaInfoCustomData } from 'web/features/playback/actions/chromecast';
import { castVideo } from 'web/features/playback/actions/chromecast';
import type { AutoPlayProps } from 'web/features/playback/components/AutoPlay/AutoPlay';
import AutoPlay from 'web/features/playback/components/AutoPlay/AutoPlay';
import ChromecastController from 'web/features/playback/components/ChromecastController/ChromecastController';
import type { WebSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { ChromecastCustomMessageType } from 'web/features/playback/constants/chromecast';

import styles from './ChromecastSender.scss';
import { getCaptionsHelper } from '../WebLivePlayerOverlay/WebLivePlayerOverlay';

const { isStagingOrAlpha } = conf;

const DEBUG = !!__DEVELOPMENT__ || isStagingOrAlpha;

type StateProps = ReturnType<typeof mapStateToProps>;

export interface ChromecastSenderProps extends StateProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}
/**
 * This is a wrapper for our chromecast sender application
 * Child components should not be concerned with with chromecast framework
 * Define methods that interact with cast framework here, and pass to child display components
 */
class ChromecastSender extends Component<ChromecastSenderProps> {
  castSession?: cast.framework.CastSession;

  playerController?: cast.framework.RemotePlayerController;

  castContext?: cast.framework.CastContext;

  checkCastAvailabilityTimeout: null | ReturnType<typeof setTimeout> = null;

  liveTrackId?: number; // Available track Id in live stream

  playerControllerHandlers?: {
    [name in cast.framework.RemotePlayerEventType]?:
      ((args: { value: string }) => void) | ((args: { value: chrome.cast.media.MediaInfo }) => void);
  };

  audioTracks: AudioTrackInfo[] = [];

  state = {
    activeAudioTrackLabel: getLocalData(WEB_AUDIO_TRACK_SELECT) || audioLabelMapping.EN.main,
  };

  componentDidMount() {
    // if we can't resolve castAvailable after 60 seconds, stop trying
    setTimeout(() => {
      if (!window.castApiAvailable) window.castApiAvailable = false;
    }, 60 * 1000);
    this.checkCastAvailabilityTimeout = setTimeout(this.checkCastAvailability, 100);
  }

  componentDidUpdate({ contentId: previousContentId }: ChromecastSenderProps) {
    const { contentId: newContentId, dispatch } = this.props;
    if (previousContentId === newContentId) return;
    dispatch(loadVideoById(newContentId));
    this.initPlayerController();
  }

  componentWillUnmount() {
    clearTimeout(this.checkCastAvailabilityTimeout as ReturnType<typeof setTimeout>);
    this.castSession?.getMediaSession()?.removeUpdateListener(this.updateAdStatus);
    this.removePlayerController();
    this.removeCastSession();
    this.removeCastContext();
  }

  /**
   * check for cast availability until this is resolved. `window.castApiAvailable` is set in client/index.ts, `window.__onGCastApiAvailable`
   * window.castApiAvailable could be false (i.e. Safari) or undefined but later defined as in case of chrome, hence we use hasOwnProperty
   */
  checkCastAvailability = () => {
    const castApiAvailableWasSet = window.hasOwnProperty('castApiAvailable');
    if (!castApiAvailableWasSet || window.castApiAvailable && !(window.cast && window.cast.framework)) {
      this.checkCastAvailabilityTimeout = setTimeout(this.checkCastAvailability, 100);
      return;
    }

    // the value has been set on window, so we dont run the timeout anymore. if its true, we initialize the cast listeners
    if (window.castApiAvailable) {
      // set cast API available (only true in Chrome)
      this.props.dispatch(actionWrapper(actions.SET_CAST_API_AVAILABILITY, { castApiAvailable: true }));
      this.onCastApiAvailable();
    }
  };

  convertMediaTrackToAudioTrackInfo = (track: chrome.cast.media.Track & { roles?: string[] }): AudioTrackInfo => {
    const audioTrack: AudioTrackInfo = {
      id: track.trackId,
      language: track.language,
      role: track.roles?.[0] === 'description' ? 'description' : 'main',
      active: false,
      label: track.name,
    };
    audioTrack.active = this.state.activeAudioTrackLabel === audioTrack.label;
    return audioTrack;
  };

  processTracks = (tracks: chrome.cast.media.Track[]) => {
    this.audioTracks = tracks
      .filter((track) => track.type === chrome.cast.media.TrackType.AUDIO)
      .map((track) => this.convertMediaTrackToAudioTrackInfo(track as chrome.cast.media.Track & { roles: string[] }));
  };

  getAudioTracks = () => {
    return this.audioTracks;
  };

  getCurrentAudioTrack = () => {
    return this.audioTracks.find(track => track.label === this.state.activeAudioTrackLabel);
  };

  setAudioTrack = (idx: number): Promise<AudioTrackInfo> => {
    const { contentId, isLoggedIn } = this.props;
    const currentMediaSession = this.castSession?.getMediaSession();
    if (!currentMediaSession) {
      throw new Error('there is no media session during setting captions');
    }
    const selectedTrack = this.audioTracks[idx];
    if (!selectedTrack) {
      throw new Error('No selected track found');
    }

    const code = getLanguageCodeFromAudioTrack(selectedTrack);
    const descriptionsEnabled = isDescriptionTrack(selectedTrack);
    const audioTrackEvent = buildAudioTrackToggleEventObject(
      contentId,
      code,
      descriptionsEnabled,
    );
    trackEvent(eventTypes.AUDIO_SELECTION, audioTrackEvent);
    setLocalData(WEB_AUDIO_TRACK_SELECT, selectedTrack.label, !isLoggedIn ? AUDIO_SELECT_EXPIRE_TIME : undefined);
    const activeTrackIds = [typeof selectedTrack.id === 'string' ? parseInt(selectedTrack.id, 10) : selectedTrack.id];
    const tracksInfoRequest = new chrome.cast.media.EditTracksInfoRequest(activeTrackIds);

    return new Promise((resolve, reject) => {
      const onEditTracksSuccess = () => {
        this.setState({ activeAudioTrackLabel: selectedTrack.label });
        resolve(selectedTrack);
      };
      const onEditTracksError = (error: chrome.cast.Error) => {
        this.log('edit tracks error', error);
        reject(error);
      };
      currentMediaSession.editTracksInfo(tracksInfoRequest, onEditTracksSuccess, onEditTracksError);
    });
  };

  /**
   * attach castContext to class (context available even without a "session")
   * listen for changes to receiver state changes and dispatch action
   * call this.onConnected()
   */
  onCastApiAvailable = () => {
    const { dispatch } = this.props;
    const { cast } = window;

    // define playerController event handlers
    const {
      CURRENT_TIME_CHANGED,
      PLAYER_STATE_CHANGED,
      VOLUME_LEVEL_CHANGED,
      IS_MUTED_CHANGED,
      MEDIA_INFO_CHANGED } = window.cast.framework.RemotePlayerEventType;
    this.playerControllerHandlers = {
      [CURRENT_TIME_CHANGED]: ({ value }: { value: string }) => {
        if (this.props.isAd) return;
        this.props.dispatch(actionWrapper(actions.SET_CAST_POSITION, { value: parseInt(value, 10) }));
        this.checkShouldShowAutoPlay(parseInt(value, 10));
      },
      [PLAYER_STATE_CHANGED]: ({ value: playerState }: { value: string }) => {
        if (playerState) this.props.dispatch(actionWrapper(actions.SET_CAST_PLAYER_STATE, { playerState }));
      },
      [VOLUME_LEVEL_CHANGED]: ({ value }: { value: string }) => {
        this.props.dispatch(actionWrapper(actions.SET_CAST_VOLUME_LEVEL, { volumeLevel: value }));
      },
      [IS_MUTED_CHANGED]: ({ value: newMuteValue }: { value: string }) => {
        this.props.dispatch(actionWrapper(actions.SET_CAST_IS_MUTE, { isMuted: !!newMuteValue }));
      },
      [MEDIA_INFO_CHANGED]: ({ value }: { value: chrome.cast.media.MediaInfo }) => {
        if (!value) return;

        if (value.tracks) {
          // Process the audio tracks in the case of multiple audio
          this.processTracks(value.tracks);
        }

        if (!value.customData) return;
        const customData = value.customData as ChromecastMediaInfoCustomData;

        const { contentId: receiverContentId } = customData.content || {};
        if (this.props.contentId !== receiverContentId) {
          // note- we handle this update in componentWillReceiveProps
          this.log(`New content ID is casting: ${receiverContentId}`);
          this.props.dispatch(actionWrapper(actions.SET_CAST_CONTENT_ID, { contentId: receiverContentId }));
        }
      },
    };

    this.castContext = cast.framework.CastContext.getInstance();

    const castState = this.castContext.getCastState();
    dispatch(actionWrapper(actions.SET_CAST_RECEIVER_STATE, { castState }));
    if (castState === cast.framework.CastState.CONNECTED) this.onConnected();

    this.castContext.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, this.onCastStateChanged);
  };

  onCastStateChanged = ({ castState: castReceiverState }: cast.framework.CastStateEventData) => {
    const { dispatch } = this.props;
    dispatch(actionWrapper(actions.SET_CAST_RECEIVER_STATE, { castState: castReceiverState }));
    if (castReceiverState === cast.framework.CastState.CONNECTED) {
      this.onConnected();
    } else if (castReceiverState === cast.framework.CastState.NOT_CONNECTED) {
      this.onDisconnected();
    }
  };

  removeCastContext() {
    this.castContext?.removeEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, this.onCastStateChanged);
    delete this.castContext;
  }

  checkShouldShowAutoPlay = (position: number) => {
    const { autoPlayShowTime, dispatch, chromecastAutoplayVisible } = this.props;
    if (!position || !autoPlayShowTime) {
      return;
    }
    if (position >= autoPlayShowTime && !chromecastAutoplayVisible) {
      dispatch(setChromecastAutoplayVisible(true));
    }
  };

  onAutoplayContentLoaded([content] : Video[], timeLeft: number) {
    sendChromecastCustomMessage({
      type: ChromecastCustomMessageType.AUTOPLAY_SHOW,
      data: {
        video: content,
        timeLeft,
      },
    });
  }

  onAutoplayPause() {
    sendChromecastCustomMessage({
      type: ChromecastCustomMessageType.AUTOPLAY_PAUSE,
    });
  }

  onAutoplayResume() {
    sendChromecastCustomMessage({
      type: ChromecastCustomMessageType.AUTOPLAY_RESUME,
    });
  }

  autoplay: AutoPlayProps['onAutoplay'] = ({ contentId, isFromAutoplayAutomatic, isFromAutoplayDeliberate, isLive }) => {
    const { dispatch } = this.props;

    dispatch(castVideo(
      contentId,
      {
        isFromAutoplayAutomatic,
        isFromAutoplayDeliberate,
        isLive,
        resumeFromCurrentPosition: false,
      },
    ));
    sendChromecastCustomMessage({
      type: ChromecastCustomMessageType.AUTOPLAY_START,
    });
  };

  initPlayerController = () => {
    this.log('initPlayerController', this.playerController);
    const { dispatch, isLive } = this.props;
    const { cast } = window;

    const currentMedia = this.castSession?.getMediaSession();
    if (!currentMedia) return this.log('Cannot find current media', currentMedia);

    // attach adStatus listener
    this.log('detaching and reattaching ad listener');
    currentMedia.removeUpdateListener(this.updateAdStatus);
    currentMedia.addUpdateListener(this.updateAdStatus);

    this.removePlayerController();
    const player = new cast.framework.RemotePlayer();
    const playerController = new cast.framework.RemotePlayerController(player);
    this.playerController = playerController;
    this.log('new playerController', player, this.playerController);
    const { playerState: castPlayerState } = player;
    if (castPlayerState) dispatch(actionWrapper(actions.SET_CAST_PLAYER_STATE, { playerState: castPlayerState }));

    // attach cast event handlers https://developers.google.com/cast/docs/reference/chrome/cast.framework#.RemotePlayerEventType
    // currentTime, playerState, volumeLevel, isMuted, plus MEDIA_INFO for when new content is loaded
    this.log('attaching event handlers onto playerController');
    const { playerControllerHandlers } = this;
    if (playerControllerHandlers) {
      (Object.keys(playerControllerHandlers) as cast.framework.RemotePlayerEventType[]).forEach((eventName) => {
        const listener = playerControllerHandlers[eventName];
        if (!listener) return;
        playerController.addEventListener(eventName, listener);
      });
    }
    if (isLive) {
      const contentId = (currentMedia.customData as ChromecastMediaInfoCustomData)?.content?.contentId;
      if (contentId && this.props.contentId !== contentId) {
        this.props.dispatch(actionWrapper(actions.SET_CAST_CONTENT_ID, { contentId }));
      }

      this.log('tracks', currentMedia.media.tracks);
      if (currentMedia.media.tracks) {
        this.liveTrackId = currentMedia.media.tracks.find(track => {
          return track.type === 'TEXT';
        })?.trackId;
      }
    }
  };

  removePlayerController() {
    const { playerController, playerControllerHandlers } = this;
    if (playerController) {
      this.log('removing event handlers off playerController');
      if (playerControllerHandlers) {
        (Object.keys(playerControllerHandlers) as cast.framework.RemotePlayerEventType[]).forEach((eventName) => {
          const listener = playerControllerHandlers[eventName];
          if (!listener) return;
          playerController.removeEventListener(eventName, listener);
        });
      }
      delete this.playerController;
    }
  }

  /**
   * Receiver app sends a message from MediaManager class, attaching `isPlayingAd` bool
   */
  updateAdStatus = () => {
    const { isAd, dispatch, isLive } = this.props;
    if (isLive) return;
    const mediaSession = this.castSession?.getMediaSession() || { customData: undefined };
    const { isPlayingAd } = mediaSession.customData as { isPlayingAd?: boolean } || { isPlayingAd: undefined };
    if (typeof isPlayingAd === 'undefined') return;
    this.log('updateAdStatus. isPlayingAd:', isPlayingAd);
    if (isPlayingAd !== isAd) dispatch(actionWrapper(actions.SET_CAST_AD_STATUS, { isAd: isPlayingAd }));
  };

  getAutoPlayStatus = () => {
    const { isFromAutoplay } = this.props;
    const { fromAutoplayDeliberate } = trackingManager.getState();
    const isFromAutoplayDeliberate = !!(isFromAutoplay && fromAutoplayDeliberate);
    const isFromAutoplayAutomatic = !!(isFromAutoplay && !fromAutoplayDeliberate);
    return {
      isFromAutoplayDeliberate,
      isFromAutoplayAutomatic,
    };
  };

  // once connected, we can get the "cast session" https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession
  onConnected = () => {
    this.log('On connected');

    const { currentPageContentId, dispatch, isVideoPage, isLive } = this.props;
    const { isFromAutoplayAutomatic, isFromAutoplayDeliberate } = this.getAutoPlayStatus();

    if (!this.castContext) {
      throw new Error('there is no cast context when connected');
    }

    const castSession = this.castContext.getCurrentSession();

    if (!castSession) {
      throw new Error('there is no cast session when connected');
    }

    this.castSession = castSession;

    // updating chromecast redux state with device information
    const {
      friendlyName,
      volume: { muted: isMuted, level: volumeLevel },
    } = this.castSession.getCastDevice();
    dispatch(actionWrapper(actions.SET_CAST_DEVICE_INFO, {
      deviceName: friendlyName,
      isMuted,
      volumeLevel,
    }));
    this.castSession.addEventListener(cast.framework.SessionEventType.MEDIA_SESSION, this.onMediaSession);

    // determine if we are joining an existing session to exit early
    const currentMediaSession = this.castSession.getMediaSession();
    if (currentMediaSession) return this.joinMediaSession(currentMediaSession);

    // no session found, new session, checking if we are on the video page
    if (isVideoPage) {
      this.log('Video page detected, cast contentId:', currentPageContentId);

      dispatch(castVideo(
        currentPageContentId,
        {
          isFromAutoplayAutomatic,
          isFromAutoplayDeliberate,
          isLive,
          resumeFromCurrentPosition: true,
        },
      ));
    }
  };

  onMediaSession = (e: cast.framework.MediaSessionEventData) => {
    const { media } = (e || {}).mediaSession;
    // media.contentId is `url`(https://github.com/adRise/www/blob/9feb804a3d0ed6e9eaa0de626d8dbfeff29d6ecf/src/common/actions/chromecast.js#L46),
    // which is empty if it's DRM content, so we need to also check customData.content.contentId
    if (media && !media.contentId && !(media.customData as ChromecastMediaInfoCustomData)?.content?.contentId) {
      return this.log('Media session has no contentId, ignore media_session event', e);
    }
    this.initPlayerController();
  };

  removeCastSession() {
    this.castSession?.removeEventListener(cast.framework.SessionEventType.MEDIA_SESSION, this.onMediaSession);
    delete this.castSession;
  }

  // session is https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media
  joinMediaSession = (session: chrome.cast.media.Media) => {
    this.log('joining session', session);
    this.props.dispatch(actionWrapper(actions.SET_CAST_POSITION, { value: session.getEstimatedTime() }));
    this.initPlayerController();
  };

  onDisconnected = () => {
    this.log('on disconnected');
    this.removePlayerController();
    this.removeCastSession();
  };

  /**
   * targetPosition in seconds
   */
  seek: WebSeekFn = ({ toPosition }) => {
    this.log('seek to', toPosition);
    const currentMediaSession = this.castSession?.getMediaSession();
    if (!currentMediaSession) {
      throw new Error('there is no media session during seeking');
    }
    const seekReq = new window.chrome.cast.media.SeekRequest();
    seekReq.currentTime = toPosition;
    currentMediaSession.seek(seekReq, () => {
      this.log('Seeked to ', toPosition);
    }, (error: chrome.cast.Error) => this.log('Error seeking to ', toPosition, error));
    return Promise.resolve();
  };

  /**
   * volume is a number between 1 and 100
   */
  updateVolume = (volume: number) => {
    this.log('UPDATE VOLUME', volume / 100);
    const currentMediaSession = this.castSession?.getMediaSession();
    if (!currentMediaSession) {
      throw new Error('there is no media session during updating volume');
    }
    const volumeLevel = volume / 100; // must be between 0 and 1
    const castVolume = new window.chrome.cast.Volume(volumeLevel);
    const volumeReq = new window.chrome.cast.media.VolumeRequest(castVolume);
    currentMediaSession.setVolume(
      volumeReq,
      () => {
        this.props.dispatch(actionWrapper(actions.SET_CAST_VOLUME_LEVEL, { volumeLevel }));
      },
      this.log
    );
  };

  toggleVolumeMute = () => {
    if (!this.playerController) return;
    this.playerController.muteOrUnmute();
  };

  /**
   * if trackId is not defined, we will pass an empty array to editTracksInfo, disabling captions
   * https://developers.google.com/cast/docs/chrome_sender_advanced
   */
  setCaptions = (trackId: number) => {
    const { dispatch, isLive } = this.props;

    const activeTracks = [];
    if (trackId > 0) {
      if (isLive && this.liveTrackId) {
        activeTracks.push(this.liveTrackId);
      } else {
        activeTracks.push(trackId);
      }
    }

    const currentMediaSession = this.castSession?.getMediaSession();
    if (!currentMediaSession) {
      throw new Error('there is no media session during setting captions');
    }

    const textTrackStyle = new window.chrome.cast.media.TextTrackStyle();
    textTrackStyle.foregroundColor = '#FFFFFFFF';
    textTrackStyle.backgroundColor = '#00000099';
    textTrackStyle.fontScale = 0.8;
    const editTracksInfoReq = new window.chrome.cast.media.EditTracksInfoRequest(activeTracks, textTrackStyle);
    const onEditTracksSuccess = () => dispatch(actionWrapper(actions.SET_CAST_CAPTIONS_INDEX, { captionsIndex: trackId }));
    const onEditTracksError = (error: chrome.cast.Error) => this.log('edit tracks error', error);
    currentMediaSession.editTracksInfo(editTracksInfoReq, onEditTracksSuccess, onEditTracksError);
  };

  togglePlayPause = () => {
    if (!this.playerController) return;
    this.playerController.playOrPause();
  };

  log = (...args: any[]) => {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.log('## chromecast sender-', ...args);
  };

  render() {
    const {
      castReceiverState,
      castApiAvailable,
      castPlayerState,
      deviceName,
      seriesTitle,
      videoTitle,
      position,
      duration,
      isMuted,
      volumeLevel,
      isAd,
      captionsIndex,
      captionsList,
      castVideoLoading,
      castVideoLoadError,
      captionsAvailable,
      contentId,
      isSeries,
      isFromAutoplay,
      chromecastAutoplayVisible,
      isLive,
      captionSettings,
      intl,
      isAutoPlayCounterEnabled,
    } = this.props;

    // The cast API available could guarantee this would not be called on the client side
    // eslint-disable-next-line tubitv/no-client-folder-code-in-react-cc-render
    if (!(castApiAvailable && isCastConnected(castReceiverState))) return null;

    const videoPaused = castPlayerState === window.chrome.cast.media.PlayerState.PAUSED;
    const populatedCaptionsList = isLive ? getCaptionsHelper(captionsList, intl) : captionsList;
    return (
      <React.Fragment>
        {chromecastAutoplayVisible
        && <div className={styles.chromeCastAutoPlayWrapper}>
          <AutoPlay
            id={contentId}
            isEpisode={isSeries}
            videoPaused={videoPaused}
            isFromAutoplay={isFromAutoplay}
            onAutoplay={this.autoplay}
            onPause={this.onAutoplayPause}
            onResume={this.onAutoplayResume}
            onAutoplayContentLoaded={this.onAutoplayContentLoaded}
            contentLimit={1}
            isCounterEnabled={isAutoPlayCounterEnabled}
          />
        </div>}
        <ChromecastController
          deviceName={deviceName}
          castPlayerState={castPlayerState}
          seriesTitle={seriesTitle}
          videoTitle={videoTitle}
          position={position}
          duration={duration}
          seek={this.seek}
          updateVolume={this.updateVolume}
          toggleVolumeMute={this.toggleVolumeMute}
          togglePlayPause={this.togglePlayPause}
          setCaptions={this.setCaptions}
          captionsIndex={captionsIndex}
          captionsList={populatedCaptionsList}
          getAudioTracks={this.getAudioTracks}
          getCurrentAudioTrack={this.getCurrentAudioTrack}
          setAudioTrack={this.setAudioTrack}
          isMuted={isMuted}
          volumeLevel={volumeLevel}
          isAd={isAd}
          castVideoLoading={castVideoLoading}
          castVideoLoadError={castVideoLoadError}
          captionsAvailable={captionsAvailable}
          isLive={isLive}
          captionSettings={captionSettings}
        />
      </React.Fragment>
    );
  }
}

// note- if we refresh the page, on joining the existing cast session, we must load the content at state.chromecast.contentId;
export const mapStateToProps = (state: StoreState, props: Pick<WithRouterProps, 'location'>) => {
  const {
    auth,
    chromecast,
    video: { byId },
    ui: { chromecastAutoplayVisible },
    captionSettings,
    player: {
      captions: { captionsList },
    },
    live: { activeContentId },
  } = state;
  const {
    castReceiverState,
    castApiAvailable,
    contentId,
    deviceName,
    position,
    isMuted,
    castPlayerState,
    isAd,
    volumeLevel,
    castVideoLoading,
    castVideoLoadError,
  } = chromecast;

  const castingContent = byId[contentId] || {};
  const { title: videoTitle, duration: contentDuration, has_subtitle: captionsAvailable, credit_cuepoints: credits = {} } = castingContent;
  // seriesTitle
  let seriesTitle = '';
  let isSeries = false;
  if (castingContent.series_id) {
    seriesTitle = (byId[`0${castingContent.series_id}`] || {}).title;
    isSeries = true;
  }

  // content id
  const pathElements = typeof window === 'undefined' ? [] : window.location.pathname.split('/').filter(Boolean);
  const isVideoPage = ['tv-shows', 'movies', 'video', 'live'].indexOf(pathElements[0]) >= 0;
  const isLive = ['live'].indexOf(pathElements[0]) >= 0;
  let currentPageContentId = '';
  if (isVideoPage) {
    if (isLive) {
      currentPageContentId = activeContentId;
    } else {
      currentPageContentId = pathElements[1];
    }
  }

  // autoplay
  const { autoplay } = props.location.query;

  const autoPlayShowTime = credits.postlude || (contentDuration - 1);

  const captionsIndex = getCaptionIndexSelector(state);
  return {
    isFromAutoplay: !!autoplay,
    castApiAvailable,
    castReceiverState,
    castPlayerState,
    deviceName,
    seriesTitle,
    videoTitle,
    captionsAvailable: !!captionsAvailable,
    position,
    duration: contentDuration,
    isMuted,
    volumeLevel,
    isAd,
    captionsList,
    captionsIndex,
    castVideoLoading,
    castVideoLoadError,
    contentId,
    isVideoPage,
    currentPageContentId,
    isAutoPlayCounterEnabled: !isInGDPRCountryWithKidsSelector(state),
    isSeries,
    autoPlayShowTime,
    chromecastAutoplayVisible,
    isLive,
    captionSettings,
    isLoggedIn: !!(auth && auth.user),
  };
};

const connectedChromecastSender = withRouter(connect(mapStateToProps)(injectIntl(ChromecastSender)));

export const rawChromecastSender = ChromecastSender;

export default connectedChromecastSender;
