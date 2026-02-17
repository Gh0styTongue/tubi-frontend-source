import type { Player, ErrorEventData, AdError, AdErrorEventData } from '@adrise/player';
import { ActionLevel, ErrorType, PLAYER_ERROR_DETAILS, PLAYER_EVENTS, PlayerName, State } from '@adrise/player';
import { now, timeDiffInMinutes, timeDiffInSeconds } from '@adrise/utils/lib/time';
import { getArrayLastItem } from '@adrise/utils/lib/tools';
import { PlaybackSourceType } from '@tubitv/analytics/lib/genericEvents';
import pick from 'lodash/pick';

import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import type { FeedbackIssueTypeKey } from 'ott/features/playback/components/FeedbackModal/FeedbackModal';

import { BasePlayerManager } from './BasePlayerManager';
import { isDomExceptionAbortAdError, isDomExceptionAbortError } from '../error/predictor';
import { isEmptyBufferedRange } from '../predicates/isEmptyBufferedRange';
import { isPackagePlayer } from '../predicates/isPackagePlayer';
import { getVODPageSession, getVODPageSessionEventEmitter, setCause, setDoubts, VODPageSessionEvents } from '../session/VODPageSession';
import type { VODExitCauseType, VODStage } from '../session/VODPageSession';
import { START_STEP, VODPlaybackSession } from '../session/VODPlaybackSession';

interface Indication {
  type: VODExitCauseType,
  error?: ErrorEventData,
  message?: FeedbackIssueTypeKey;
  timestamp: number;
}

const unrecoverableErrorTypeMap: {
  [key in ErrorType]?: VODExitCauseType;
} = {
  [ErrorType.SETUP_ERROR]: 'SETUP_CRASH',
  [ErrorType.DRM_ERROR]: 'DRM_CRASH',
  [ErrorType.KEY_SYSTEM_ERROR]: 'DRM_CRASH',
};

const criticalErrorMessageMap: {
  [key: string]: VODExitCauseType;
} = {
  [PLAYER_ERROR_DETAILS.MANIFEST_LOAD_ERROR]: 'MANIFEST_ERROR',
};

const AD_AND_AFTER_AD_STAGES: VODStage[] = ['PREROLL', 'MIDROLL', 'AFTER_MIDROLL', 'AFTER_PREROLL'];
const AD_AND_BEFORE_AD_STAGES: VODStage[] = ['BEFORE_PREROLL', 'BEFORE_MIDROLL', 'PREROLL', 'MIDROLL'];

const BUFFER_NUDGE_GAP = 0.1;

export class VODAttributionManager extends BasePlayerManager<Player> {

  private indications: Indication[] = [];

  private fragLoadErrorInfo: {
    error?: ErrorEventData;
    timestamp?: number;
    amount: number;
  } = { amount: 0 };

  constructor({
    player,
  }: {
      player: Player,
    }) {
    super({ player });
    this.manageEventListener();
  }

  destroy = () => {
    this.manageEventListener(true);
    super.destroy();
  };

  private addIndication(event: Pick<Indication, 'type' | 'error' | 'message'>) {
    const indication = {
      ...event,
      timestamp: now(),
    };
    this.indications.push(indication);
    if (this.indications.length > 3) {
      this.indications.shift();
    }
  }

  private manageEventListener(remove = false) {
    const key = remove ? 'off' : 'on';
    const { player } = this;

    const emitter = getVODPageSessionEventEmitter();
    const vodPageSessionFn = emitter[key].bind(emitter);

    vodPageSessionFn(VODPageSessionEvents.ended, this.onVODPageSessionEnd);
    vodPageSessionFn(VODPageSessionEvents.resumeBeginningAfterAd, this.onResumeBeginningAfterAd);

    /* istanbul ignore if */
    if (!player) return;

    const playerFn = player[key].bind(player);
    playerFn(PLAYER_EVENTS.error, this.errorHandler);
    playerFn(PLAYER_EVENTS.adError, this.adErrorHandler);
    playerFn(PLAYER_EVENTS.adStall, this.adStallHandler);
    player[key](PLAYER_EVENTS.error, this.errorHandler);
    player[key](PLAYER_EVENTS.adStall, this.adStallHandler);
    player[key](PLAYER_EVENTS.seekActionTimeout, this.seekTimeoutHandler);
  }

  private conclude({ type, error, message }: Pick<Indication, 'type' | 'error' | 'message'>) {
    setCause({
      type,
      error: error && pick(error, ['type', 'code', 'message', 'details', 'fatal', 'reason', 'errorSource']),
      message,
    });
  }

  private errorHandler = (error: ErrorEventData) => {
    const unrecoverableCrash = unrecoverableErrorTypeMap[error.type];
    if (error.fatal && unrecoverableCrash) {
      this.addIndication({
        type: unrecoverableCrash,
        error,
      });
      return;
    }
    const criticalIssue = criticalErrorMessageMap[error.message!];
    if (error.fatal && criticalIssue) {
      this.addIndication({
        type: criticalIssue,
        error,
      });
      return;
    }
    if (error.message === PLAYER_ERROR_DETAILS.FRAG_LOAD_ERROR) {
      this.fragLoadErrorInfo.error = error;
      this.fragLoadErrorInfo.timestamp = now();
      this.fragLoadErrorInfo.amount++;
      return;
    }
    if (isDomExceptionAbortError(error)) {
      this.addIndication({
        type: 'PLAY_INTERRUPT',
        error,
      });
      // return;
    }
  };

  private adErrorHandler = (error: AdError, _data: AdErrorEventData) => {
    if (!isDomExceptionAbortAdError(error)) {
      return;
    }
    this.addIndication({
      type: 'AD_PLAY_INTERRUPT',
    });
  };

  private adStallHandler = () => {
    this.addIndication({ type: 'AD_STALL' });
  };

  private onResumeBeginningAfterAd = () => {
    this.addIndication({ type: 'RESUME_BEGINNING_AFTER_AD' });
  };

  private seekTimeoutHandler = () => {
    this.addIndication({ type: 'SEEK_TIMEOUT' });
  };

  private checkErrorPlayerState = () => {
    const { player } = this;
    /* istanbul ignore next */
    if (player && isPackagePlayer(player)) {
      const videoElement = player.getVideoElement();
      // This is the first case we should handle
      // We will add more in the future
      /* istanbul ignore if */
      if (player.getState() === State.playing && videoElement && videoElement.paused) {
        this.addIndication({
          type: 'PLAYER_STATE_MISMATCH',
        });
      }
    }
  };

  private checkPlayerFeedback = () => {
    const { lastFeedback } = getVODPageSession();
    if (lastFeedback) {
      this.addIndication({
        type: 'FEEDBACK',
        message: lastFeedback,
      });
    }
  };

  private onVODPageSessionEnd = () => {
    const {
      stage, isAdStalled, isAdPauseExplicit, pauseActionLevel, isPauseExplicit,
      isReloadingSrc, isReattachingVideoElement,
      lastError, isInEpisodeRegistrationGate,
      playbackSourceType,
    } = getVODPageSession();
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    this.checkPlayerFeedback();
    const hasIndications = this.indications.length > 0;
    const { player } = this;
    // pre-check before we examine the indications
    this.checkErrorPlayerState();
    const isVideoBuffered = player?.getIsCurrentTimeVideoBuffered();
    const isAudioBuffered = player?.getIsCurrentTimeAudioBuffered();

    // Reverse the indication to treat the latest indication with a higher priority
    const indications = ([] as Indication[]).concat(this.indications).reverse();
    if (hasIndications) {
      setDoubts(indications.map(({ type }) => type));
    }

    // If the user is in the episode registration gate, most likely, that will be the direct reason that drive user away.
    // So we put it at first.
    if (isInEpisodeRegistrationGate) {
      this.conclude({
        type: 'EPISODE_REGISTRATION_GATE',
      });
      return;
    }

    if (hasIndications && (['IDLE', 'EMPTY_PREROLL', 'PREROLL', 'MIDROLL'] as VODStage[]).includes(stage)) {
      const initCrash = indications.find(({ type }) => ['DRM_CRASH', 'SETUP_CRASH', 'MANIFEST_ERROR'].includes(type));
      if (initCrash) {
        this.conclude(initCrash);
        return;
      }
    }

    // Ignore Samsung AVPlay and Sony because their buffered range is always empty.
    const hasNoBuffer = __OTTPLATFORM__ !== 'SONY'
      && !isVideoBuffered
      && !isAudioBuffered
      && player
      && player.getSDKInfo()?.name !== 'AVPlayer'
      && isEmptyBufferedRange(player.getBufferedRange());
    // https://www.notion.so/tubi/LGTV-Exit-Without-Buffer-Before-Preroll-086471505c7e4153b8b3d2e3e9266a29
    if (hasNoBuffer && AD_AND_BEFORE_AD_STAGES.includes(stage)) {
      // There is a risk that the ad player setup failure. So we pick the start timestamp instead of the ad player setup timestamp if possible.
      const base = ['BEFORE_PREROLL', 'PREROLL'].includes(stage)
        ? playbackInfo.startTs
        : playbackInfo.adSetupTs;
      const gap = timeDiffInSeconds(base, now());
      const type = gap > 10
        ? 'AD_NO_BUFFER'
        : gap < 3
          ? 'AD_BLACK_SCREEN_NOTICE'
          : 'AD_LOAD_LONG';
      if (type === 'AD_LOAD_LONG') {
        const { adStartSteps } = playbackInfo;
        const lastAdSteps = getArrayLastItem(adStartSteps) ?? [];
        const lastAdStep = lastAdSteps[lastAdSteps.length - 1];
        switch (lastAdStep) {
          case START_STEP.UNKNOWN:
            this.conclude({
              type: 'AD_SRC_UNSET',
            });
            return;
          case START_STEP.START_LOAD:
            this.conclude({
              type: 'AD_FREEZE_AFTER_SRC_SET',
            });
            return;
          case START_STEP.VIEWED_FIRST_FRAME:
            this.conclude({
              type: 'AD_FREEZE_AFTER_FIRST_FRAME',
            });
            return;
          case START_STEP.PLAY_STARTED:
            this.conclude({
              type: 'AD_FREEZE_AFTER_PLAY',
            });
            return;
          default:
            break;
        }
      }
      this.conclude({ type });
      return;
    }

    if (playbackInfo.isBuffering) {
      const { amount, timestamp, error } = this.fragLoadErrorInfo;
      // We consider the user leaves due to the CDN jitter if we find the user have meet multiple frag load errors and the last one is in three minutes.
      if (amount > 2 && timeDiffInMinutes(timestamp, now()) < 3 && error) {
        this.conclude({
          type: 'CDN_JITTER',
          error,
        });
        return;
      }
    }

    const errorPlayerStateIndication = indications.find(({ type }) => type === 'PLAYER_STATE_MISMATCH');
    if (errorPlayerStateIndication) {
      this.conclude(errorPlayerStateIndication);
      return;
    }

    if (hasIndications && stage === 'READY') {
      const playInterrupt = indications.find(({ type }) => type === 'PLAY_INTERRUPT');
      if (playInterrupt && timeDiffInMinutes(playInterrupt.timestamp, now()) < 2) {
        this.conclude(playInterrupt);
        return;
      }
    }
    if (!isVideoBuffered && isAudioBuffered) {
      const type = AD_AND_AFTER_AD_STAGES.includes(stage)
        ? 'VIDEO_FREEZE_AFTER_AD'
        : 'VIDEO_FREEZE';
      this.conclude({
        type,
      });
      return;
    }

    // We found some freeze happened after ADs,but stage value not update. So I list the `MIDROLL` and `PREROLL`
    if (['IDLE', 'EMPTY_PREROLL', 'MIDROLL', 'PREROLL', 'IN_STREAM'].includes(stage) && player) {
      const videoEl = player.getVideoElement();
      if ((videoEl?.readyState === 1 || videoEl?.readyState === 0)
          && player.isBuffering() === false
          && isVideoBuffered && isAudioBuffered) {
        this.conclude({
          type: 'VIDEO_FREEZE',
        });
        return;
      }

      // Another freeze case, there is buffer gap cannot nudge seek(position:4927.82918, buffer range[4916.01, 4928.03] [4928.18, 4984])
      if (lastError?.details === 'bufferNudgeOnStall') {
        const bufferRange = player?.getBufferedVideoRange();
        const videoEl = player?.getVideoElement();
        if (videoEl && videoEl.readyState === 1 && bufferRange && bufferRange.length > 1) {
          let canMakeConclude = false;
          const position = videoEl.currentTime;
          bufferRange.forEach((item, index) => {
            const nextItem = bufferRange[index + 1];
            if (position < item[1] && nextItem && (nextItem[0] - item[1] > BUFFER_NUDGE_GAP)) {
              canMakeConclude = true;
            }
          });
          if (canMakeConclude) {
            this.conclude({
              type: 'BUFFER_NUDGE_FAILED',
            });
            return;
          }
        }
      }
    }

    if (AD_AND_AFTER_AD_STAGES.includes(stage)) {
      if (isAdStalled) {
        this.conclude({ type: 'AD_STALL' });
        return;
      }
      if (hasIndications) {
        const adInterrupt = indications.find(({ type }) => type === 'AD_PLAY_INTERRUPT');
        if (adInterrupt && timeDiffInMinutes(adInterrupt.timestamp, now()) < 2) {
          this.conclude(adInterrupt);
          return;
        }
      }
      /* istanbul ignore else */
      if (player) {
        if (player.isBuffering()) {
          const type = player.isAd()
            ? 'AD_BUFFERING'
            : 'VIDEO_BUFFERING_AFTER_AD';
          this.conclude({ type });
          return;
        }
        if (player.isPaused()) {
          const type = player.isAd()
            ? isAdPauseExplicit
              ? pauseActionLevel === ActionLevel.VISIBILITY_CHANGE
                ? 'VIS_PAUSE_AD'
                : 'USER_PAUSE_AD'
              : 'AD_PAUSED'
            : isPauseExplicit
              ? pauseActionLevel === ActionLevel.VISIBILITY_CHANGE
                ? 'VIS_PAUSE_VIDEO_AFTER_AD'
                : 'USER_PAUSE_VIDEO_AFTER_AD'
              : 'VIDEO_PAUSED_AFTER_AD';
          this.conclude({ type });
          return;
        }
        const videoElement = player.getVideoElement();
        if (videoElement) {
          if (videoElement.paused) {
            const type = player.isAd()
              ? 'AD_UNKNOWN_PAUSED'
              : 'VIDEO_UNKNOWN_PAUSED_AFTER_AD';
            this.conclude({ type });
            return;
          }
          if (videoElement.readyState < 3) {
            const type = player.isAd()
              ? 'AD_NOT_READY'
              : 'VIDEO_NOT_READY_AFTER_AD';
            this.conclude({ type });
            return;
          }
        }
        if ((stage === 'MIDROLL' || stage === 'PREROLL') && !player.isAd()) {
          this.conclude({ type: 'RESUME_AFTER_AD_FAILURE' });
        }
        // You can put more high priority before this and return;
        return;
      }
    }

    const feedback = indications.find(indication => indication.type === 'FEEDBACK');
    if (feedback) {
      this.conclude(feedback);
      return;
    }

    if (hasNoBuffer) {
      // might be user leave need to check the gap
      if (['IDLE', 'EMPTY_PREROLL', 'READY'].includes(stage)) {
        const gap = timeDiffInSeconds(playbackInfo.startTs, now());
        const type = gap > 10
          ? 'CONTENT_NO_BUFFER'
          : gap < 3
            ? 'QUICK_LEAVE_WITHOUT_BUFFER'
            : 'CONTENT_LOAD_LONG';
        if (type === 'QUICK_LEAVE_WITHOUT_BUFFER') {
          if (playbackSourceType === PlaybackSourceType.AUTOPLAY_FROM_TRAILER) {
            this.conclude({
              type: 'NON_INTERESTED_AUTOSTART_TRAILER',
            });
            return;
          }
          if (playbackSourceType === PlaybackSourceType.VIDEO_PREVIEWS) {
            this.conclude({
              type: 'NON_INTERESTED_AUTOSTART_PREVIEW',
            });
            return;
          }
        }

        this.conclude({ type });
        return;
      }
      if (['EARLY_START', 'AFTER_MIDROLL', 'AFTER_PREROLL'].includes(stage)) {
        // We will not consider the content starts after two time update events. So it's weird that we get no buffer with two time events.
        this.conclude({
          type: 'CONTENT_START_WITHOUT_BUFFER',
        });
        return;
      }
      // Special case, I would suggest to put this at last
      if (stage === 'IN_STREAM') {
        const type = playbackInfo.isSeeking
          ? 'SEEKING_WITHOUT_BUFFER'
          : isReattachingVideoElement
            ? 'REATTACH_CLEAR_BUFFER'
            : isReloadingSrc
              ? 'RELOAD_CLEAR_BUFFER'
              : 'BUFFER_CLEARED';
        if (type !== 'BUFFER_CLEARED') {
          this.conclude({
            type,
          });
          return;
        }
        const position = player.getPrecisePosition();
        const duration = player.getDuration();
        // The buffer cleared near the end of playback is not a problem.
        this.conclude({
          type: position < (duration * 0.95)
            ? 'BUFFER_CLEARED'
            : 'NEAR_END',
        });
        return;
      }
    }

    if (player?.isCompleted()) {
      this.conclude({ type: 'END_OF_STREAM' });
      return;
    }

    if (!hasNoBuffer && (stage === 'IN_STREAM' || stage === 'EARLY_START')) {
      const startTs = playbackInfo.startLoadTs[0];
      if (startTs > 0 && timeDiffInSeconds(startTs, now()) <= 60) {
        this.conclude({ type: 'QUICK_LEAVE_IN_1_MIN' });
      }
    }

    /**
     * Unnote the return if you need to add more logic
     */
  };
}

export function attachVODAttributionManager(player: Player) {
  if (player.playerName !== PlayerName.VOD) return FREEZED_EMPTY_FUNCTION;
  const manager = new VODAttributionManager({ player });
  player.on(PLAYER_EVENTS.remove, manager.destroy);
  return () => {
    player.removeListener(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
}
