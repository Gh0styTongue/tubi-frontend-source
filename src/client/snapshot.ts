import { presetLastError } from '@adrise/player//lib/utils/tools';
import { getLocalStorageData, removeLocalStorageData, setLocalStorageData } from '@adrise/utils/lib/localStorage';
import { timeDiffInSeconds } from '@adrise/utils/lib/time';

import { onVisibilityChange } from 'client/systemApi/utils';
import { LD_APP_SNAPSHOT } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResourceType, VIDEO_RESOURCE_CODEC, VIDEO_RESOURCE_RESOLUTION, HDCPVersion } from 'common/types/video';
import { getPageObjectFromURL } from 'common/utils/analytics';
import { trackLogging } from 'common/utils/track';

import type { LiveVideoSession } from './features/playback/session/LiveVideoSession';
import { getLiveVideoSession } from './features/playback/session/LiveVideoSession';
import type { PreviewVideoSession } from './features/playback/session/PreviewVideoSession';
import { getPreviewVideoSession } from './features/playback/session/PreviewVideoSession';
import type { VODPageSession } from './features/playback/session/VODPageSession';
import { getVODPageSession } from './features/playback/session/VODPageSession';
import { VODPlaybackSession } from './features/playback/session/VODPlaybackSession';
import type { VODPlaybackInfo } from './features/playback/session/VODPlaybackSession';
import { exposeToTubiGlobal } from './global';

interface Snapshot {
  page: string;
  isHidden: boolean;
  createdTimestamp: number;
  duration: number;
  playbackInfo?: {
    type?: VideoResourceType;
    codec?: VIDEO_RESOURCE_CODEC;
    hdcp?: HDCPVersion;
    maxResolution?: VIDEO_RESOURCE_RESOLUTION;
  };
  VOD?: Pick<VODPageSession, 'stage' | 'isAd' | 'isPaused' | 'lastError' | 'lastAdError'> | Pick<VODPlaybackInfo, 'isBuffering'>;
  live?: Pick<LiveVideoSession, 'stage' | 'lastError'>;
  preview?: Pick<PreviewVideoSession, 'stage' | 'isPaused' | 'isBuffering' | 'lastError'>;
}

const snapshot: Snapshot = {
  page: '',
  isHidden: false,
  createdTimestamp: Date.now(),
  duration: 0,
};

let intervalTimer: number;
let isCreated = false;

export function createSnapshot(): () => void {
  /* istanbul ignore if */
  if (!__SHOULD_ENABLE_CRASH_DETECTION__) {
    clearSnapshot();
    return () => {};
  }
  const previousSnapshotString = getLocalStorageData(LD_APP_SNAPSHOT);
  if (previousSnapshotString) {
    try {
      const previousSnapshot = JSON.parse(previousSnapshotString) as Snapshot;
      if (!previousSnapshot.isHidden) {
        trackLogging({
          type: TRACK_LOGGING.clientInfo,
          subtype: LOG_SUB_TYPE.CRASH,
          message: previousSnapshot,
        });
        // expose the previous snapshot so that we can check this easier on the device
        exposeToTubiGlobal({ crashSnapshot: previousSnapshot });
      }
    } catch (error) {
      // ignore error here
    }
  }
  snapshot.createdTimestamp = Date.now();
  snapshot.duration = 0;
  isCreated = true;
  updatePage();
  window.addEventListener('beforeunload', clearSnapshot);
  const unsubscribeVisibilityChange = onVisibilityChange(updateAppVisibility);
  startPolling();
  return () => {
    window.removeEventListener('beforeunload', clearSnapshot);
    unsubscribeVisibilityChange();
    clearInterval(intervalTimer);
    clearSnapshot();
  };
}

export function clearSnapshot() {
  removeLocalStorageData(LD_APP_SNAPSHOT);
  clearInterval(intervalTimer);
  isCreated = false;
}

export function updatePlayerSnapshot() {
  /* istanbul ignore if */
  if (!__SHOULD_ENABLE_CRASH_DETECTION__) {
    return;
  }
  updateVOD();
  updateLive();
  updatePreview();
  updateSnapShot();
}

function startPolling() {
  intervalTimer = window.setInterval(updatePlayerSnapshot, 10_000);
}

function updateSnapShot() {
  // Disable update on VIZIO to avoid unexpected crash report caused by some abnormal behaviors during power off
  // 1. `beforeunload` event is not triggered
  // 2. `visibilitychange` event is triggered twice
  if (
    !isCreated
    || FeatureSwitchManager.isDisabled(['Player', 'CrashDetection'])
    || (FeatureSwitchManager.isDefault(['Player', 'CrashDetection']) && __OTTPLATFORM__ === 'VIZIO')
  ) return;
  snapshot.duration = timeDiffInSeconds(snapshot.createdTimestamp, Date.now());
  try {
    setLocalStorageData(LD_APP_SNAPSHOT, JSON.stringify(snapshot));
  } catch (error) {
    // eslint-disable-next-line no-console
    /* istanbul ignore next */ console.error(error);
  }
}

function updateAppVisibility(isAppVisible: boolean) {
  snapshot.isHidden = !isAppVisible;
  updateSnapShot();
}

function updateVOD() {
  const { stage, isAd, isPaused, lastAdError, lastError } = getVODPageSession();
  const { isBuffering } = VODPlaybackSession.getVODPlaybackInfo();
  if (stage === 'NONE') {
    delete snapshot.VOD;
    return;
  }

  snapshot.VOD = { stage, isAd, isPaused, isBuffering, lastAdError, lastError: presetLastError(lastError) };
}

function updateLive() {
  const { stage, lastError } = getLiveVideoSession();
  if (stage === 'IDLE') {
    delete snapshot.live;
    return;
  }
  snapshot.live = { stage, lastError };
}

function updatePreview() {
  const { stage, isPaused, isBuffering, lastError } = getPreviewVideoSession();
  if (stage === 'NONE') {
    delete snapshot.preview;
    return;
  }
  snapshot.preview = { stage, isPaused, isBuffering, lastError };
}

export function updatePlaybackInfo(info: Snapshot['playbackInfo'] | undefined) {
  /* istanbul ignore if */
  if (!__SHOULD_ENABLE_CRASH_DETECTION__) {
    return;
  }
  snapshot.playbackInfo = info;
  updateSnapShot();
}

export function updatePage() {
  /* istanbul ignore if */
  if (!__SHOULD_ENABLE_CRASH_DETECTION__) {
    return;
  }
  const pageObject = getPageObjectFromURL(location.pathname + location.search);
  /* istanbul ignore next */
  snapshot.page = (pageObject && Object.keys(pageObject).filter(key => key.endsWith('_page'))[0]) ?? '';
  updateSnapShot();
}
