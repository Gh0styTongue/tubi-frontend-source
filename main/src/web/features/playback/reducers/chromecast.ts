import {
  SET_CAST_API_AVAILABILITY,
  SET_CAST_RECEIVER_STATE,
  SET_CAST_CONTENT_ID,
  SET_CAST_DEVICE_INFO,
  SET_CAST_IS_MUTE,
  SET_CAST_POSITION,
  SET_CAST_PLAYER_STATE,
  SET_CAST_VOLUME_LEVEL,
  SET_CAST_CAPTIONS_INDEX,
  SET_CAST_AD_STATUS,
  CAST_VIDEO_LOADING,
  CAST_VIDEO_LOAD_SUCCESS,
  CAST_VIDEO_LOAD_ERROR,
  QUEUE_CAST_VIDEO,
} from 'common/constants/action-types';

import type { ChromecastState } from '../types/chromecast';

const actions = {
  SET_CAST_API_AVAILABILITY,
  SET_CAST_RECEIVER_STATE,
  SET_CAST_CONTENT_ID,
  SET_CAST_DEVICE_INFO,
  SET_CAST_IS_MUTE,
  SET_CAST_POSITION,
  SET_CAST_PLAYER_STATE,
  SET_CAST_VOLUME_LEVEL,
  SET_CAST_CAPTIONS_INDEX,
  SET_CAST_AD_STATUS,
  CAST_VIDEO_LOADING,
  CAST_VIDEO_LOAD_SUCCESS,
  CAST_VIDEO_LOAD_ERROR,
  QUEUE_CAST_VIDEO,
};

// note we use some strings here as this is set during server render and cast SDK is not yet available
export const initialState: ChromecastState = {
  castApiAvailable: false,
  castReceiverState: 'NO_DEVICES_AVAILABLE',
  castPlayerState: 'IDLE',
  contentId: '',
  isAd: false,
  isMuted: false,
  captionsIndex: -1,
  // volume is 0 to 1
  volumeLevel: 1,
  deviceName: '',
  position: 0,
  castVideoLoading: false,
  castVideoLoaded: false,
  castVideoLoadError: undefined,
  nextCastVideoArgs: null,
};

interface SetCastApiAvailabilityAction extends Pick<ChromecastState, 'castApiAvailable'> {
  type: typeof actions.SET_CAST_API_AVAILABILITY;
}

interface SetCastReceiverStateAction {
  type: typeof actions.SET_CAST_RECEIVER_STATE;
  castState: ChromecastState['castReceiverState'];
}

interface SetCastContentIdAction extends Pick<ChromecastState, 'contentId'> {
  type: typeof actions.SET_CAST_CONTENT_ID;
}

interface SetCastDeviceInfoAction extends Partial<ChromecastState> {
  type: typeof actions.SET_CAST_DEVICE_INFO;
}

interface SetCastIsMuteAction extends Pick<ChromecastState, 'isMuted'> {
  type: typeof actions.SET_CAST_IS_MUTE;
}

interface SetCastPositionAction {
  type: typeof actions.SET_CAST_POSITION;
  value: ChromecastState['position'];
}

interface SetCastPlayerStateAction {
  type: typeof actions.SET_CAST_PLAYER_STATE;
  playerState: ChromecastState['castPlayerState'];
}

interface SetCastVolumeLevelAction extends Pick<ChromecastState, 'volumeLevel'> {
  type: typeof actions.SET_CAST_VOLUME_LEVEL;
}

interface SetCastCaptionsIndexAction extends Pick<ChromecastState, 'captionsIndex'> {
  type: typeof actions.SET_CAST_CAPTIONS_INDEX;
}

interface SetCastAdStatusAction extends Pick<ChromecastState, 'isAd'> {
  type: typeof actions.SET_CAST_AD_STATUS;
}

interface CastVideoLoadingAction extends Pick<ChromecastState, 'contentId'> {
  type: typeof actions.CAST_VIDEO_LOADING;
}

interface CastVideoLoadSuccessAction {
  type: typeof actions.CAST_VIDEO_LOAD_SUCCESS;
}

interface CastVideoLoadErrorAction {
  type: typeof actions.CAST_VIDEO_LOAD_ERROR;
  error: ChromecastState['castVideoLoadError'];
}

interface QueueCastVideoAction extends Pick<ChromecastState, 'nextCastVideoArgs'> {
  type: typeof actions.QUEUE_CAST_VIDEO;
}

export type ChromecastAction =
  | SetCastApiAvailabilityAction
  | SetCastReceiverStateAction
  | SetCastContentIdAction
  | SetCastAdStatusAction
  | SetCastCaptionsIndexAction
  | SetCastApiAvailabilityAction
  | SetCastDeviceInfoAction
  | SetCastIsMuteAction
  | SetCastPlayerStateAction
  | SetCastPositionAction
  | SetCastReceiverStateAction
  | SetCastVolumeLevelAction
  | CastVideoLoadErrorAction
  | CastVideoLoadSuccessAction
  | QueueCastVideoAction
  | CastVideoLoadingAction;

export default function reducer(
  state: ChromecastState = initialState,
  action: ChromecastAction = {} as ChromecastAction
): ChromecastState {
  const { type, ...others } = action;
  switch (type) {
    case actions.SET_CAST_API_AVAILABILITY:
      return { ...state, castApiAvailable: (action as SetCastApiAvailabilityAction).castApiAvailable };
    case actions.SET_CAST_RECEIVER_STATE:
      return { ...state, castReceiverState: (action as SetCastReceiverStateAction).castState };
    case actions.SET_CAST_CONTENT_ID:
      return { ...state, contentId: (action as SetCastContentIdAction).contentId };
    case actions.SET_CAST_DEVICE_INFO:
      // others here can include isMuted, volumeLevel, and deviceName
      return {
        ...state,
        ...others,
      };
    case actions.SET_CAST_IS_MUTE:
      return { ...state, isMuted: (action as SetCastIsMuteAction).isMuted };
    case actions.SET_CAST_POSITION:
      return { ...state, position: (action as SetCastPositionAction).value, isAd: false };
    case actions.SET_CAST_PLAYER_STATE:
      return { ...state, castPlayerState: (action as SetCastPlayerStateAction).playerState };
    case actions.SET_CAST_VOLUME_LEVEL:
      return { ...state, volumeLevel: (action as SetCastVolumeLevelAction).volumeLevel };
    case actions.SET_CAST_CAPTIONS_INDEX:
      return { ...state, captionsIndex: (action as SetCastCaptionsIndexAction).captionsIndex };
    case actions.SET_CAST_AD_STATUS:
      return { ...state, isAd: (action as SetCastAdStatusAction).isAd };
    case actions.CAST_VIDEO_LOADING:
      return {
        ...state,
        contentId: (action as CastVideoLoadingAction).contentId,
        castVideoLoading: true,
        castVideoLoadError: null,
        isAd: false,
      } as unknown as ChromecastState;
    case actions.CAST_VIDEO_LOAD_SUCCESS:
      return {
        ...state,
        castVideoLoading: false,
        castVideoLoaded: true,
      };
    case actions.CAST_VIDEO_LOAD_ERROR:
      return {
        ...state,
        castVideoLoading: false,
        castVideoLoaded: false,
        castVideoLoadError: (action as CastVideoLoadErrorAction).error,
      };
    case actions.QUEUE_CAST_VIDEO:
      return {
        ...state,
        nextCastVideoArgs: (action as QueueCastVideoAction).nextCastVideoArgs,
      };
    default:
      return state;
  }
}
