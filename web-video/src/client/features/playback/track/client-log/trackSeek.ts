import type { SeekEventType } from '@tubitv/analytics/lib/playerEvent';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { platformSamplerFactory } from './utils/platformSampler';

const seekTrackingSampler = platformSamplerFactory([{
  // sample on all platforms
  platforms: '*',
  // allow 1% of seeks to log
  percentageToAllow: 1,
  // first 2 seeks are allowed to log without sampling
  allowedUnsampledCalls: 2,
}]);

export type WEB_STEP_SEEK_INITIATOR =
  // the user clicks or others presses a button on the screen
  // whether with the mouse or the remote
  'ON_SCREEN_BUTTON' |
  // the user triggers a seek using the keyboard arrow keys
  'KEYBOARD_ARROW' |
  // the user triggers a seek using the keyboard letter keys
  'KEYBOARD_LETTER';

export type WEB_PROGRESS_BAR_SEEK_INITIATOR =
  // user clicks on progress bar
  'PROGRESS_BAR_CLICK' |
  // user clicks on the thumbnail that appears when hovering the progress bar
  'THUMBNAIL_CLICK' |
  // user drags the playhead dot on desktop
  'PLAYHEAD_DRAG_DESKTOP' |
  // user drags the playhead dot on mobile
  'PLAYHEAD_DRAG_MOBILE';

export type OTT_SEEK_INITIATOR =
  // voice command to start over playback from 0
  'VOICE_COMMAND_START_OVER' |
  // voice command to skip forward or back with fixed step size; step size
  // passed as param
  'VOICE_COMMAND_STEP_FIXED' |
  // voice command to skip forward or back an arbitrary amount; step size
  // passed as param
  'VOICE_COMMAND_STEP_ARBITRARY' |
  // player control step seek; step size passed elsewhere
  // TODO: in future we will probably have to differentiate between player
  // control and remote button quick seeks
  'QUICK_SEEK_PLAYER_CONTROL' |
  // end FF or RW via play button on remote or screen
  'END_TRICK_PLAY_VIA_PLAY' |
  // end FF or RW via pause button on remote or screen
  'END_TRICK_PLAY_VIA_PAUSE' |
  // skip intro via any means
  'SKIP_INTRO' |
  // skip recap via any means
  'SKIP_RECAP' |
  // skip early credits via any means
  'SKIP_EARLY_CREDITS' |
  // click on progress bar
  'PLAY_PROGRESS_DRAG' |
  // restarting playback for a title for any reason
  'RESTART_PLAYBACK';

type SEEK_INITIATOR = WEB_STEP_SEEK_INITIATOR | WEB_PROGRESS_BAR_SEEK_INITIATOR | OTT_SEEK_INITIATOR;

interface TrackSeekMessage extends SeekEventType {
  // what UI element, remote, keyboard button, etc. triggered the seek
  seekInitiator: SEEK_INITIATOR
  // how long did the seek take
  seekDuration: number
  // if this seek overlapped another UI-initiated seek, how many other seeks
  // were in progress when it was intiated? that is, suppose seeks take 50ms.
  // at t=0 user initiates a seek. at t=10ms, user initiates another seek.
  // at t=20ms, user initiates a third seek. at t=0, pendingSeekCount is 0;
  // at t=20 it is 1; at t=30 it is 2.
  pendingSeekCount: number
}

/**
 * This tracking log intentionally duplicates much of what is already tracked in the
 * analytics event, adding some additional parameters that are not tracked in the event.
 */
export function trackSeek(message: TrackSeekMessage) {
  const sampledTrackingFn = seekTrackingSampler(() => {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.SEEK,
      message,
    });
  });
  sampledTrackingFn();
}

