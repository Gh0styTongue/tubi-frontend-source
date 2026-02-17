import { setLocalData } from 'client/utils/localDataStorage';
import {
  ENTER_YOU_MAY_ALSO_LIKE_ROW,
  LEAVE_YOU_MAY_ALSO_LIKE_ROW,
  OTT_SET_DISPLAY_DATA,
  PAUSE_BG_ROTATION,
  RESET_DISCOVERY_ROW_STATE,
  RESET_OTT_CONTAINER_INDEX_MAP,
  SET_ACTIVE_DISCOVERY_ROW_CONTAINER,
  SET_DEEPLINK_TYPE,
  SET_DEEPLINK_BACK_OVERRIDE,
  SET_DISCOVERY_ROW_PILL_ACTIVE,
  SET_EPG_ACTIVE_CONTENT,
  SET_FEATURES_EDUCATED,
  SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT,
  SET_LIVE_CHANNEL,
  SET_OTT_AUTOPLAY_ENABLED,
  SET_OTT_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_INPUT_MODE,
  SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_VIDEO_PREVIEW,
  SHOW_AGE_GATE_COMPONENT,
  SHOW_KIDS_MODE_ELIGIBILITY_MODAL,
  SET_BROWSE_WHILE_WATCHING_CACHE_KEY,
} from 'common/constants/action-types';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  BACK_FROM_CONTAINER_TO_HOME,
  BACK_FROM_DETAIL_TO_HOME,
  BACK_FROM_LIVE_PLAYBACK_TO_HOME,
  BACK_FROM_PLAYBACK_TO_DETAIL,
  BACK_FROM_TUBI_TO_ENTRANCE,
  DISABLE_FROM_TUBI_TO_ENTRANCE,
  LD_DEFAULT_AUTOPLAY_VIDEO_PREVIEW,
  LD_DEFAULT_AUTOSTART_VIDEO_PREVIEW,
  LD_DEFAULT_PROMPT_AUTOSTART_VIDEO_PREVIEW,
  LD_DEFAULT_VIDEO_PREVIEW,
  LD_FEATURE_EDUCATED,
} from 'common/constants/constants';
import type { ContainerUISection } from 'common/types/fire';
import type { LiveChannelState, OTTInputMode } from 'common/types/ottUI';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { isLinearContainer } from 'common/utils/containerTools';
import { DeeplinkType } from 'common/utils/deeplinkType';

const actions = {
  PAUSE_BG_ROTATION,
  SHOW_AGE_GATE_COMPONENT,
  OTT_SET_DISPLAY_DATA,
  RESET_OTT_CONTAINER_INDEX_MAP,
  SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT,
  SET_LIVE_CHANNEL,
  SHOW_KIDS_MODE_ELIGIBILITY_MODAL,
  SET_OTT_INPUT_MODE,
  SET_OTT_VIDEO_PREVIEW,
  SET_OTT_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_AUTOPLAY_ENABLED,
  SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW,
  SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW,
  SET_EPG_ACTIVE_CONTENT,
  SET_ACTIVE_DISCOVERY_ROW_CONTAINER,
  SET_DISCOVERY_ROW_PILL_ACTIVE,
  RESET_DISCOVERY_ROW_STATE,
  ENTER_YOU_MAY_ALSO_LIKE_ROW,
  LEAVE_YOU_MAY_ALSO_LIKE_ROW,
  SET_DEEPLINK_TYPE,
  SET_DEEPLINK_BACK_OVERRIDE,
  SET_FEATURES_EDUCATED,
  SET_BROWSE_WHILE_WATCHING_CACHE_KEY,
};

export interface PauseBgRotationAction {
  type: typeof actions.PAUSE_BG_ROTATION;
  pauseRotation: boolean;
}

export interface ShowAgeGateComponentAction {
  type: typeof actions.SHOW_AGE_GATE_COMPONENT;
  isVisible: boolean;
}

export interface SetDisplayDataAction {
  type: typeof actions.OTT_SET_DISPLAY_DATA;
  section: ContainerUISection;
  containerId: string;
  gridIndex: number;
  contentMode?: CONTENT_MODE_VALUE;
}

export interface ResetContainerIndexMapAction {
  type: typeof actions.RESET_OTT_CONTAINER_INDEX_MAP;
  contentMode?: CONTENT_MODE_VALUE;
}

export type SetDisplayDataParams = Pick<SetDisplayDataAction, Exclude<keyof SetDisplayDataAction, 'type'>>;
export function setDisplayData(params: SetDisplayDataParams): SetDisplayDataAction {
  return {
    type: actions.OTT_SET_DISPLAY_DATA,
    ...params,
  };
}

export interface SetIfBgImageMatchActiveContent {
  type: typeof actions.SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT;
  ifBgImageMatchActiveContent: boolean;
}

export interface SetLiveChannelAction extends Partial<LiveChannelState> {
  type: typeof actions.SET_LIVE_CHANNEL;
}

export function setLiveChannel({ contentId = '', index }: Partial<LiveChannelState>): SetLiveChannelAction {
  return {
    type: actions.SET_LIVE_CHANNEL,
    index,
    contentId,
  };
}

export function resetLiveChannel(): TubiThunkAction<SetLiveChannelAction> {
  return (dispatch, getState) => {
    const {
      ottUI: {
        debouncedGridUI: { gridIndex, activeContainerId },
      },
      container: { containerIdMap },
    } = getState();

    const container = containerIdMap[activeContainerId];
    return dispatch(setLiveChannel({ index: isLinearContainer(container) ? gridIndex : 0 }));
  };
}
/**
 * TubiThunkDispatch this action if you want to show/hide the AgeGate Component
 * @param isVisible
 */
export const showAgeGateComponent = (isVisible: boolean): TubiThunkAction<ShowAgeGateComponentAction> => {
  return (dispatch: TubiThunkDispatch) => {
    return dispatch({
      type: actions.SHOW_AGE_GATE_COMPONENT,
      isVisible,
    });
  };
};

export enum KidsModeEligibilityModalTypes {
  NONE = 'NONE',
  DEFAULT = 'DEFAULT',
  TITLE_UNAVAILABLE = 'TITLE_UNAVAILABLE',
  CANNOT_EXIT = 'CANNOT_EXIT',
}

export interface ShowKidsModeEligibilityModalAction {
  type: typeof actions.SHOW_KIDS_MODE_ELIGIBILITY_MODAL;
  eligibilityModalType: KidsModeEligibilityModalTypes;
}

export const showKidsModeEligibilityModal = (
  eligibilityModalType: KidsModeEligibilityModalTypes
): TubiThunkAction<ShowKidsModeEligibilityModalAction> => {
  return (dispatch: TubiThunkDispatch) => {
    return dispatch({
      type: actions.SHOW_KIDS_MODE_ELIGIBILITY_MODAL,
      eligibilityModalType,
    });
  };
};

export interface SetOTTInputMode {
  type: typeof actions.SET_OTT_INPUT_MODE;
  inputMode: OTTInputMode;
}

export const setOTTInputMode = (inputMode: OTTInputMode) => {
  return {
    type: actions.SET_OTT_INPUT_MODE,
    inputMode,
  };
};

export interface SetOTTVideoPreview {
  type: typeof actions.SET_OTT_VIDEO_PREVIEW;
  enable: boolean;
}

export const setOTTVideoPreview = (enable: boolean) => {
  setLocalData(LD_DEFAULT_VIDEO_PREVIEW, enable.toString());
  return {
    type: actions.SET_OTT_VIDEO_PREVIEW,
    enable,
  };
};

export interface SetOTTAutostartVideoPreview {
  type: typeof actions.SET_OTT_AUTOSTART_VIDEO_PREVIEW;
  enable: boolean;
}

export const setOTTAutostartVideoPreview = (enable: boolean) => {
  setLocalData(LD_DEFAULT_AUTOSTART_VIDEO_PREVIEW, enable.toString());
  return {
    type: actions.SET_OTT_AUTOSTART_VIDEO_PREVIEW,
    enable,
  };
};

export interface SetOTTAutoplayVideo {
  type: typeof actions.SET_OTT_AUTOPLAY_ENABLED;
  enable: boolean;
}

export const setOTTAutoplayVideoPreview = (enable: boolean) => {
  setLocalData(LD_DEFAULT_AUTOPLAY_VIDEO_PREVIEW, enable.toString());
  return {
    type: actions.SET_OTT_AUTOPLAY_ENABLED,
    enable,
  };
};

export interface SetOTTPromptAutostartVideoPreview {
  type: typeof actions.SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW;
  hasPrompted: boolean;
}

export const setOTTPromptAutostartVideoPreview = (hasPrompted: boolean) => {
  setLocalData(LD_DEFAULT_PROMPT_AUTOSTART_VIDEO_PREVIEW, hasPrompted.toString());
  return {
    type: actions.SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW,
    hasPrompted,
  };
};

export interface SetOTTExpiredAutostartVideoPreview {
  type: typeof actions.SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW;
  hasExpired: boolean;
}

export const setOTTExpiredAutostartVideoPreview = (hasExpired: boolean) => {
  return {
    type: actions.SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW,
    hasExpired,
  };
};

export interface SetOTTNavigatingViaAutostartVideoPreview {
  type: typeof actions.SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW;
  isAutostarting: boolean;
}

export const setOTTNavigatingViaAutostartVideoPreview = (isAutostarting: boolean) => {
  return {
    type: actions.SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW,
    isAutostarting,
  };
};

interface SetEPGActiveContentPayload {
  id?: string;
  focusedId?: string;
  containerId?: string;
  focusedContainerId?: string;
  focusedContentIndex?: number;
  programIndex?: number;
}

export const setEPGActiveContent = ({
  id,
  containerId,
  focusedId,
  focusedContainerId,
  focusedContentIndex,
  programIndex,
}: SetEPGActiveContentPayload) => ({
  type: actions.SET_EPG_ACTIVE_CONTENT,
  payload: {
    id,
    focusedId,
    containerId,
    programIndex,
    focusedContainerId,
    focusedContentIndex,
  },
});
export type SetEPGActiveContent = ReturnType<typeof setEPGActiveContent>;

export const resetEPGActiveContent = () =>
  setEPGActiveContent({
    id: '',
    containerId: '',
    programIndex: 0,
    focusedContainerId: '',
  });

export interface SetActiveDiscoveryRowContainerAction {
  type: typeof actions.SET_ACTIVE_DISCOVERY_ROW_CONTAINER;
  payload: { activeContainerId: string };
}

export interface SetDiscoveryRowPillActiveAction {
  type: typeof actions.SET_DISCOVERY_ROW_PILL_ACTIVE;
  payload: { isPillActive: boolean };
}

export interface ResetDiscoveryRowStateAction {
  type: typeof actions.RESET_DISCOVERY_ROW_STATE;
}

export const setActiveDiscoveryRowContainer = (activeContainerId: string) => {
  return {
    type: actions.SET_ACTIVE_DISCOVERY_ROW_CONTAINER,
    payload: { activeContainerId },
  };
};

export const setDiscoveryRowPillActive = (isPillActive: boolean) => {
  return {
    type: actions.SET_DISCOVERY_ROW_PILL_ACTIVE,
    payload: { isPillActive },
  };
};

export const resetDiscoveryRowState = () => {
  return {
    type: actions.RESET_DISCOVERY_ROW_STATE,
  };
};

export interface EnterYouMayAlsoLikeRowAction {
  type: typeof actions.ENTER_YOU_MAY_ALSO_LIKE_ROW;
}

export const enterYouMayAlsoLikeRow = () => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const {
      ottUI: {
        youMayAlsoLike: { isActive },
      },
    } = getState();
    if (!isActive) {
      dispatch({ type: actions.ENTER_YOU_MAY_ALSO_LIKE_ROW });
    }
  };
};

export interface LeaveYouMayAlsoLikeRowAction {
  type: typeof actions.LEAVE_YOU_MAY_ALSO_LIKE_ROW;
}

export const leaveYouMayAlsoLikeRow = () => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const {
      ottUI: {
        youMayAlsoLike: { isActive },
      },
    } = getState();
    if (isActive) {
      dispatch({ type: actions.LEAVE_YOU_MAY_ALSO_LIKE_ROW });
    }
  };
};

export interface SetDeeplinkTypeAction {
  type: typeof actions.SET_DEEPLINK_TYPE;
  payload: DeeplinkType;
}

export const setDeeplinkType = (payload: DeeplinkType) => ({
  type: actions.SET_DEEPLINK_TYPE,
  payload,
});

export interface InitBackOverrideByDeeplinkAction {
  type: typeof actions.SET_DEEPLINK_BACK_OVERRIDE;
  data: {
    [BACK_FROM_TUBI_TO_ENTRANCE]?: boolean;
    [BACK_FROM_DETAIL_TO_HOME]?: boolean;
    [BACK_FROM_LIVE_PLAYBACK_TO_HOME]?: boolean;
    [BACK_FROM_PLAYBACK_TO_DETAIL]?: boolean;
    [BACK_FROM_CONTAINER_TO_HOME]?: boolean;
  };
}

export const initBackOverrideByDeeplink = (
  ottDeeplinkType: DeeplinkType
): TubiThunkAction<InitBackOverrideByDeeplinkAction> => {
  return (dispatch: TubiThunkDispatch) => {
    dispatch(
      actionWrapper(actions.SET_DEEPLINK_BACK_OVERRIDE, {
        data: {
          [BACK_FROM_TUBI_TO_ENTRANCE]: ottDeeplinkType === DeeplinkType.Live && !DISABLE_FROM_TUBI_TO_ENTRANCE,
          [BACK_FROM_DETAIL_TO_HOME]:
            ottDeeplinkType === DeeplinkType.Details || ottDeeplinkType === DeeplinkType.Player,
          [BACK_FROM_LIVE_PLAYBACK_TO_HOME]: ottDeeplinkType === DeeplinkType.Live,
          [BACK_FROM_PLAYBACK_TO_DETAIL]: ottDeeplinkType === DeeplinkType.Player,
          [BACK_FROM_CONTAINER_TO_HOME]: ottDeeplinkType === DeeplinkType.Container,
        },
      })
    );
  };
};

export const setFeaturesEducated = (educated: number) => {
  setLocalData(LD_FEATURE_EDUCATED, educated.toString());
  return {
    type: actions.SET_FEATURES_EDUCATED,
    educated,
  };
};

export const setBrowseWhileWatchingCacheKey = (cacheKey: string) => {
  return {
    type: actions.SET_BROWSE_WHILE_WATCHING_CACHE_KEY,
    payload: cacheKey,
  };
};
