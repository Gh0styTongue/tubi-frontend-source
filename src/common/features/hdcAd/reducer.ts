import { createDescriptors, resetDescriptors } from '@tubitv/refetch';

import {
  LOAD_HDC_AD,
  HDC_AD_PLAYING,
  HDC_AD_STOPPED,
  HDC_AD_PLAY_FINISHED,
  HDC_AD_DISABLE_HOME_LOWER_SECTION_TRANSITION,
  HDC_AD_FIRED_IMPRESSION,
  HDC_AD_RESET_FIRED_IMPRESSION,
  HDC_AD_SET_WRAPPER_VIDEO_PLAYED,
  HDC_AD_SET_FROM_WRAPPER_FULLSCREEN_PLAYBACK,
} from 'common/constants/action-types';

import type {
  HdcAdState,
  HdcAdActionTypes,
  HdcAdPlayFinishedAction,
  HdcAdSuccessAction,
  HdcAdDisableHomeLowerSectionTransitionAction,
  HdcAdFiredImpressionAction,
  HdcAdSetWrapperVideoPlayedAction,
  HdcAdSetFromWrapperFullscreenPlaybackAction,
} from './type';

const initialState: HdcAdState = {
  isAdPlaying: false,
  isAdPlayFinished: false,
  isHdcFiredImpression: {},
  disableHomeLowerSectionTransition: false,
  hasWrapperVideoPlayed: false,
  isFromWrapperFullscreenPlayback: false,
  hdcRefetchState: { ...resetDescriptors() },
  data: null,
  videoCreativeMap: null,
  nativeCreativeMap: null,
};

export default function hdcAdReducer(state: HdcAdState = initialState, action: HdcAdActionTypes): HdcAdState {
  switch (action.type) {
    case HDC_AD_PLAYING:
      return {
        ...state,
        isAdPlaying: true,
      };
    case HDC_AD_STOPPED:
      return {
        ...state,
        isAdPlaying: false,
      };
    case HDC_AD_PLAY_FINISHED:
      return {
        ...state,
        isAdPlaying: false,
        isAdPlayFinished: (action as HdcAdPlayFinishedAction).payload.isAdPlayFinished,
      };
    case HDC_AD_FIRED_IMPRESSION:
      return {
        ...state,
        isHdcFiredImpression: {
          ...state.isHdcFiredImpression,
          ...(action as HdcAdFiredImpressionAction).payload.isHdcFiredImpression,
        },
      };
    case HDC_AD_RESET_FIRED_IMPRESSION:
      return {
        ...state,
        isHdcFiredImpression: {},
      };
    case HDC_AD_SET_WRAPPER_VIDEO_PLAYED:
      return {
        ...state,
        hasWrapperVideoPlayed: (action as HdcAdSetWrapperVideoPlayedAction).payload.hasWrapperVideoPlayed,
      };
    case HDC_AD_SET_FROM_WRAPPER_FULLSCREEN_PLAYBACK:
      return {
        ...state,
        isFromWrapperFullscreenPlayback: (action as HdcAdSetFromWrapperFullscreenPlaybackAction).payload.isFromWrapperFullscreenPlayback,
      };
    case LOAD_HDC_AD.FETCH:
      return {
        ...state,
        hdcRefetchState: { ...createDescriptors(action) },
      };
    case HDC_AD_DISABLE_HOME_LOWER_SECTION_TRANSITION:
      return {
        ...state,
        disableHomeLowerSectionTransition: (action as HdcAdDisableHomeLowerSectionTransitionAction).payload.disabled,
      };
    case LOAD_HDC_AD.SUCCESS:
      return {
        ...state,
        data: (action as HdcAdSuccessAction).payload.data,
        videoCreativeMap: (action as HdcAdSuccessAction).payload.videoCreativeMap,
        nativeCreativeMap: (action as HdcAdSuccessAction).payload.nativeCreativeMap,
        hdcRefetchState: { ...createDescriptors(action, (action as HdcAdSuccessAction).payload.validDuration) },
      };
    case LOAD_HDC_AD.FAILURE:
      return {
        ...state,
        hdcRefetchState: { ...createDescriptors(action) },
      };
    default:
      return state;
  }
}
