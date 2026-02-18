import type { DictionaryValues } from 'ts-essentials';

import type { ModalType } from 'common/actions/modal';
import type * as actions from 'common/constants/action-types';
import type * as errTypes from 'common/constants/error-types';
import type { Container } from 'common/types/container';
import type { Video } from 'common/types/video';

export type ContainerUISection = 'nav_list' | 'grid';

export interface AppVersion {
  semver: string,
  clientVersion: string;
  code?: number;
}

export interface EpisodeUI {
  seriesId?: string | null,
  activeSeasonIndex?: number | null,
  activeEpisodeIndex?: number | null,
  seasonTabActive: boolean
}

type InAppMessageButtonAction = 'URI' | 'NONE';

interface InAppMessageButton {
  id: number,
  text: string,
  click_action: InAppMessageButtonAction,
  uri?: string,
}

export interface InAppMessage {
  isToastVisible: boolean,
  showToast: boolean,
  showPrompt: boolean,
  messageContents: null | {
    title: string,
    subTitle: string,
    acceptButton: InAppMessageButton,
    dismissButton: InAppMessageButton,
    imageUrls: string[]
  },
}

// The following is a starting point, created quickly
// from the initial state for the reducer. As we start
// to use these, we should flesh out the definitions,
// especially for things like {}, unknown, making
// properties optional where necessary, and
// adding "| null" if nullable.
export interface FireState {
  showModal: boolean;
  modal?: { type: ModalType, props: any };
  containerUI: {
    containerId: string;
    section: ContainerUISection;
  };
  // top level component can block transitions during appReset
  appResetInProgress: boolean;
  // hyb app versions info, include native semver, clientVersion(combine of native and webview versions) etc
  appVersion: Partial<AppVersion>;
  hotDeeplinkInProgress: boolean;
  sdkVersion: string;
  modelCode?: string;
  episodeUI: EpisodeUI;
  isFirstSession: boolean;
  hasShownExitSignUpModal: boolean;
  showSignOutToast?: boolean;
  inAppMessage: InAppMessage;
  shouldSetVideoQualityOnLoad: boolean;
}

export interface UserFacingError extends Error {
  userFacingCode: string;
  errType: DictionaryValues<typeof errTypes>;
}

export type ContentItem = Video | Container;

export function isContainer(item: ContentItem): item is Container {
  return !!(item as Container).childType;
}

export interface SetOTTSelectedSectionAction {
  type: typeof actions.SET_OTT_SELECTED_SECTION;
  section: string;
}

export interface SetModelCodeAction {
  type: typeof actions.SET_MODEL_CODE,
  modelCode: string;
}

export interface SetIsFirstSessionAction {
  type: typeof actions.SET_IS_FIRST_SESSION,
  state: boolean,
}

export interface SetShowSignOutToastAction {
  type: typeof actions.SET_SIGN_OUT_TOAST_STATUS,
  payload: boolean,
}

export interface SetInAppMessageContentAction {
  type: typeof actions.SET_IN_APP_MESSAGE_CONTENT,
  payload: InAppMessage,
}

export interface SetInAppMessageToastVisibleAction {
  type: typeof actions.SET_IN_APP_MESSAGE_TOAST_VISIBLE,
  payload: boolean,
}

export interface DismissInAppMessageContentAction {
  type: typeof actions.DISMISS_IN_APP_MESSAGE_CONTENT
}
export interface SetVideoQualityOnLoadAction {
  type: typeof actions.SET_VIDEO_QUALITY_ON_LOAD,
  payload: boolean,
}
