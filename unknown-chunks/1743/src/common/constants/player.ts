/* istanbul ignore file */
import { ActionTypeInTimeoutPromise } from '@adrise/player';
import { defineMessages } from 'react-intl';
import type { ValueOf } from 'ts-essentials';

/**
 * Internal states of player wrapper
 */
export const PLAYER_STATES = {
  /**
   * The user pressed play, but sufficient data to start playback has not yet loaded.
   * The buffering icon is visible in the display.
   */
  buffering: 'buffering',

  /**
   * Either playback has not started or playback was stopped due to a stop() call or an error.
   * In this state, either the play or the error icon is visible in the display.
   */
  idle: 'idle',

  /**
   * Playback has ended.
   * The replay icon is visible in the display.
   */
  complete: 'complete',

  /**
   * The video is currently paused.
   * The play icon is visible in the display.
   */
  paused: 'paused',

  /**
   * The video is currently playing.
   * No icon is visible in the display.
   */
  playing: 'playing',

  /**
   * Playback was stopped due to an error.
   * In this state the error icon and a message are visible in the display.
   */
  error: 'error',
};

/**
 * Used by player-ui + player pkg
 * @type {forward: string, rewind: string}
 */
export const SEEK_DIRECTIONS = {
  forward: 'seek_forward',
  rewind: 'seek_rewind',
  step: 'seek_step',
} as const;

export type SeekDirections = ValueOf<typeof SEEK_DIRECTIONS> | '';

export const PLAYER_SEEK_INTERVALS = {
  1: 8,
  2: 64,
  3: 512,
} as const;

// 0 means no seek is taking place; other values point to the rate of seek
export type SeekRate = keyof typeof PLAYER_SEEK_INTERVALS | 0;

export const isValidSeekRate = (rate: number): rate is SeekRate => [0, ...Object.keys(PLAYER_SEEK_INTERVALS).map(Number)].includes(rate);

export const PLAYER_SEEK_TIMES_PER_SECOND = 4;
export const PLAYER_STEP_SEEK_INTERVAL = 30;
export const DEFAULT_THUMBNAIL_INTERVAL = 5;

// Interval at which we update user history.
export const PLAYER_UPDATE_HISTORY_INTERVAL = 3 * 60 * 1000;

// We need to send watch history to AMAZON every 60 seconds
export const PLAYER_UPDATE_HISTORY_INTERVAL_FOR_FIRETV_CW = 60 * 1000;

// We need to send linear watch history to AMAZON every 60 seconds
export const LINEAR_CW_MIN_WATCH_TIME = 60 * 1000;

// TransportControls IDs and names
export const TRANSPORT_CONTROLS = {
  skipTrailer: {
    id: 0,
    name: 'skipTrailer',
  },
  previous: {
    id: 1,
    name: 'previous',
  },
  rewind: {
    id: 2,
    name: 'rewind',
  },
  stepRewind: {
    id: 3,
    name: 'stepRewind',
  },
  playPause: {
    id: 4,
    name: 'playPause',
  },
  stepForward: {
    id: 5,
    name: 'stepForward',
  },
  fastForward: {
    id: 6,
    name: 'fastForward',
  },
  next: {
    id: 7,
    name: 'next',
  },
  changeCaptions: {
    id: 8,
    name: 'changeSubtitlesAndAudioTracks',
  },
  feedback: {
    id: 9,
    name: 'feedback',
  },
  videoQuality: {
    id: 10,
    name: 'videoQuality',
  },
};

export const FAIRPLAY_SERVER_CERT_URL = 'https://fp-keyos.licensekeyserver.com/cert/9c6bf173c89372a38ddee01d125ce8a5.der';

export const TTS_MESSAGES = defineMessages({
  playbackPage: {
    description: 'accessibility voice message indicating the playback page',
    defaultMessage: 'Playback page.',
  },
  playingAds: {
    description: 'accessibility voice message indicating it is playing ads',
    defaultMessage: 'playing ads',
  },
  subtitlesTurnedOff: {
    description: 'accessibility voice message indicating that subtitles is turned off',
    defaultMessage: 'subtitles turned off',
  },
  subtitlesSetTo: {
    description: 'accessibility voice message indicating that subtitles is set to a language',
    defaultMessage: 'subtitles set to {lang}',
  },
  audioDescriptionsModalOpen: {
    description: 'accessibility voice message indicating that the audio tracks menu is open',
    defaultMessage: 'subtitles and audio tracks menu opened',
  },
  audioDescriptionsModalClose: {
    description: 'accessibility voice message indicating that the audio tracks menu is closed',
    defaultMessage: 'subtitles and audio tracks menu closed',
  },
  qualityLevelHover: {
    description: 'accessibility voice message indicating that video quality is hovered on a level',
    defaultMessage: '{level} video quality',
  },
  audioTrackSetTo: {
    description: 'accessibility voice message indicating that the audio is set to a track',
    defaultMessage: 'audio track set to {lang}',
  },
  subtitlesHover: {
    description: 'accessibility voice message indicating that subtitles is hovered on a language',
    defaultMessage: '{lang} subtitles',
  },
  audioTrackHover: {
    description: 'accessibility voice message indicating that the audio is hovered on a track',
    defaultMessage: '{lang} audio track',
  },
  startAd: {
    description: 'accessibility voice message indicating it starts to play ad',
    defaultMessage: 'start to play ad',
  },
  playVideoFrom: {
    description: 'accessibility voice message indicating it is playing the video from somewhere',
    defaultMessage: 'playing video from {position}',
  },
  pausedAt: {
    description: 'accessibility voice message indicating the video is paused at somewhere',
    defaultMessage: 'paused at {position}',
  },
  exitedAt: {
    description: 'accessibility voice message indicating the video is stopped at somewhere',
    defaultMessage: 'stopped at {position}',
  },
  playPauseButton: {
    description: 'accessibility voice message indicating the play/pause button',
    defaultMessage: 'play or pause button',
  },
  forwardTo: {
    description: 'accessibility voice message indicating the video is forwarded to somewhere',
    defaultMessage: 'forward to {position}',
  },
  rewindTo: {
    description: 'accessibility voice message indicating the video is rewinded to somewhere',
    defaultMessage: 'rewind to {position}',
  },
  stepTo: {
    description: 'accessibility voice message indicating the video is steped to somewhere',
    defaultMessage: 'step to {position}',
  },
  fastForward: {
    description: 'accessibility voice message indicating the video starts to fast forward',
    defaultMessage: 'fast forward',
  },
  rewind: {
    description: 'accessibility voice message indicating the video starts to rewind',
    defaultMessage: 'rewind',
  },
  fastForwardAtSpeed: {
    description: 'accessibility voice message indicating the video starts to fast forward at some speed',
    defaultMessage: 'fast forward at {speed} times speed',
  },
  rewindAtSpeed: {
    description: 'accessibility voice message indicating the video starts to rewind at some speed',
    defaultMessage: 'rewind at {speed} times speed',
  },
  stepForward: {
    description: 'accessibility voice message indicating the video step forward for some time',
    defaultMessage: 'step forward {duration} seconds',
  },
  stepRewind: {
    description: 'accessibility voice message indicating the video step rewind for some time',
    defaultMessage: 'step rewind {duration} seconds',
  },
  loading: {
    description: 'accessibility voice message indicating the video is loading',
    defaultMessage: 'Loading video, please wait.',
  },
  position: {
    description: 'accessibility voice message indicating the current position when seeking',
    defaultMessage: 'position {position}',
  },
  feedbackModalOpen: {
    description: 'accessibility voice message indicating that the feedback menu is open',
    defaultMessage: 'feedback menu opened',
  },
  feedbackModalClose: {
    description: 'accessibility voice message indicating that the feedback menu is closed',
    defaultMessage: 'feedback menu closed',
  },
  feedbackIssueHover: {
    description: 'accessibility voice message indicating that feedback issue is hovered on a category',
    defaultMessage: 'feedback issue category {label}',
  },
  feedbackActionHover: {
    description: 'accessibility voice message indicating that one of feedback actions is hovered',
    defaultMessage: 'feedback menu action {label}',
  },
  feedbackSceneSwitchTo: {
    description: 'accessibility voice message indicating that the feedback is set to a scene',
    defaultMessage: 'feedback menu switch to scene {scene}',
  },
});

export const ACTION_PROMISE_TIMEOUT = {
  TIZEN: {
    [ActionTypeInTimeoutPromise.PLAY]: 10,
    [ActionTypeInTimeoutPromise.PAUSE]: 10,
    [ActionTypeInTimeoutPromise.SEEK]: 20,
    [ActionTypeInTimeoutPromise.UPDATE_DRM_KEY]: 10,
  },
};

export const RESUME_TYPE = {
  STOP: 'stop', // resume from continue watching
  PAUSE: 'pause', // resume from pause
};

export type PlayerSource = 'video' | 'live' | 'preview' | 'trailer';

/**
 * Definition from here https://github.com/shaka-project/shaka-player/issues/4013#issuecomment-1110579710
 * View more detailed rule here: https://source.chromium.org/chromium/chromium/src/+/main:components/cdm/renderer/widevine_key_system_info.cc;l=33;drc=8e78783dc1f7007bad46d657c9f332614e240fd8;bpv=0;bpt=1
 */
export const DRM_ROBUSTNESS_RULE = {
  L3: {
    audioRobustness: 'SW_SECURE_CRYPTO',
    videoRobustness: 'SW_SECURE_CRYPTO',
  },
  L2: {
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_CRYPTO',
  },
  L1: {
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_DECODE',
  },
  L1_ALL: {
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_ALL',
  },
  SL150: {
    audioRobustness: '150',
    videoRobustness: '150',
  },
  SL2000: {
    audioRobustness: '2000',
    videoRobustness: '2000',
  },
  SL3000: {
    audioRobustness: '2000',
    videoRobustness: '3000',
  },
};
