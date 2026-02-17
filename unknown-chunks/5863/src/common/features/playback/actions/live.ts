import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import * as actions from 'common/constants/action-types';

export interface SetLiveActiveContentPayload {
  contentId: string;
  containerId?: string,
  contentIndex?: number,
  programIndex?: number;
}
export const setLiveActiveContent = ({ contentId, containerId, contentIndex, programIndex }: SetLiveActiveContentPayload) => ({
  payload: {
    contentId,
    containerId,
    contentIndex,
    programIndex,
  },
  type: actions.SET_LIVE_ACTIVE_CONTENT,
});

export const setLiveLoading = (loading: boolean) => ({ loading, type: actions.SET_LIVE_LOADING });

export const setCountdownForFullscreen = (time: number) => ({ time, type: actions.SET_LIVE_COUNTDOWN_FOR_FULLSCREEN });

export const setLiveVideoPlayer = (videoPlayer: PlayerDisplayMode) => ({ videoPlayer, type: actions.SET_LIVE_VIDEO_PLAYER });

export const setLiveConsoleVisible = (consoleVisible: boolean) => ({ consoleVisible, type: actions.SET_LIVE_CONSOLE_VISIBLE });

export const setLivePlayerReadyState = (playerReadyState: boolean) => ({ playerReadyState, type: actions.SET_LIVE_PLAYER_READY_STATE });
