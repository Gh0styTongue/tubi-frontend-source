import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';

export interface LiveState {
  activeContentId: string;
  loading: boolean;
  countdownForFullscreen: number;
  videoPlayer: PlayerDisplayMode;
  containerId: string;
  containerIndex: number;
  contentIndex: number;
  programIndex: number;
  channelGuideLoaded: boolean;
  consoleVisible: boolean;
  playerReady: false;
  captions: unknown[];
}

export const initialState: LiveState = {
  activeContentId: '',
  loading: true,
  countdownForFullscreen: 0,
  videoPlayer: PlayerDisplayMode.BANNER,
  containerIndex: -1,
  containerId: '',
  contentIndex: 0,
  programIndex: 0,
  channelGuideLoaded: false,
  consoleVisible: true,
  playerReady: false,
  captions: [],
};

export default function liveReducer(state: LiveState = initialState, action?: AnyAction) {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case actions.SET_LIVE_ACTIVE_CONTENT:
      const { contentId, containerId, contentIndex, programIndex } = action.payload;

      return {
        ...state,
        activeContentId: contentId,
        containerId: containerId ?? state.containerId,
        contentIndex: contentIndex ?? state.contentIndex,
        programIndex: programIndex ?? state.programIndex,
      };
    case actions.SET_LIVE_LOADING:
      return {
        ...state,
        loading: action.loading,
      };
    case actions.SET_LIVE_COUNTDOWN_FOR_FULLSCREEN:
      return {
        ...state,
        countdownForFullscreen: action.time,
      };
    case actions.SET_LIVE_VIDEO_PLAYER:
      return {
        ...state,
        videoPlayer: action.videoPlayer,
      };
    case actions.SET_LIVE_CONTAINER_INDEX:
      return {
        ...state,
        containerIndex: action.index,
      };
    case actions.SET_CHANNEL_GUIDE_LOADED:
      return {
        ...state,
        channelGuideLoaded: action.channelGuideLoaded,
      };
    case actions.RESET_CONTENT_MODE:
      return {
        ...state,
        channelGuideLoaded: false,
      };
    case actions.SET_LIVE_CONSOLE_VISIBLE:
      return {
        ...state,
        consoleVisible: action.consoleVisible,
      };
    case actions.SET_LIVE_PLAYER_READY_STATE:
      return {
        ...state,
        playerReady: action.playerReadyState,
      };
    default:
      return state;
  }
}
