import { WEB_SET_CAPTION_SETTINGS } from 'common/constants/action-types';
import { DEFAULT_CAPTION_LANGUAGE } from 'common/constants/constants';
import type { WebCaptionSettingAction, WebCaptionSettingsState } from 'common/types/captionSettings';
import {
  BASIC_COLORS,
  WEB_CAPTION_BACKGROUND_OPACITY,
  WEB_BACKGROUND_OPTIONS,
  WEB_CAPTION_BACKGROUND_COLOR,
  WEB_FONTS,
  WEB_FONT_SHADOW_STYLINGS,
  WEB_FONT_SIZE_OPTIONS,
} from 'web/constants/captionSettings';

/**
 * This reducer carries two jobs in its model (similar to ott caption settings)
 * 1. Hold the settings for the user
 * 2. Map to the UI of the custom captions page
 */
export const initialState = {
  defaultCaptions: {
    language: DEFAULT_CAPTION_LANGUAGE,
    enabled: false,
  },
  isMobile: false,
  background: {
    toggle: WEB_BACKGROUND_OPTIONS.on,
    backgroundColor: {
      activeRGBValue: WEB_CAPTION_BACKGROUND_COLOR,
      isSemitransparent: true,
      opacity: WEB_CAPTION_BACKGROUND_OPACITY,
    },
  },
  font: {
    size: WEB_FONT_SIZE_OPTIONS.medium,
    family: WEB_FONTS.block,
    fontColor: {
      activeRGBValue: BASIC_COLORS[0].value,
      isSemitransparent: false,
    },
  },
  styling: {
    stylingType: WEB_FONT_SHADOW_STYLINGS.none,
    stylingColor: {
      activeRGBValue: BASIC_COLORS[1].value,
    },
  },
  window: {
    windowColor: {
      activeRGBValue: '',
      isSemitransparent: false,
    },
  },
} as unknown as WebCaptionSettingsState;

// note that this reducer looks odd in that we are passing an entire captionSettings object
// this made the most sense given we have to save the captionSettings to local storage first with complete object
export default function webCaptionSettingsReducer(state: WebCaptionSettingsState = initialState, action: WebCaptionSettingAction): WebCaptionSettingsState {
  switch (action.type) {
    case WEB_SET_CAPTION_SETTINGS: {
      return {
        ...state,
        ...action.captionSettings,
      };
    }
    default:
      return state;
  }
}
