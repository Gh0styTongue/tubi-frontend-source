import type { Captions } from '@adrise/player';
import { isWebCaptionSettingsState } from '@adrise/player';
import isEqual from 'lodash/isEqual';
import { createStore, useStore } from 'zustand';

import { trackCaptionSettings } from 'client/features/playback/track/client-log/trackCaptionSettings';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { CC_OFF, DEFAULT_CAPTION_LANGUAGE, WEB_CAPTION_SETTINGS } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import type {
  BasicSetting,
  BasicSettingKey,
  FontSize,
  Toggle,
  WebCaptionSettingsState,
} from 'common/types/captionSettings';
import { getStoredCaptionsLanguage as getStoredCaptionsLanguageUtil } from 'common/utils/captionTools';
import {
  BASIC_COLORS,
  WEB_CAPTION_BACKGROUND_OPACITY,
  WEB_BACKGROUND_OPTIONS,
  WEB_CAPTION_BACKGROUND_COLOR,
  WEB_FONTS,
  WEB_FONT_SHADOW_STYLINGS,
  WEB_FONT_SIZE_OPTIONS,
  WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY,
  WEB_MOBILE_FONT_SIZE_OPTIONS,
} from 'web/constants/captionSettings';

type CaptionsState = {
  captionsList: Captions[];
  captionsIndex: number;
  captionSettings: WebCaptionSettingsState;
};

type CaptionsActions = {
  setCaptionsList: (captionsList: Captions[]) => void;
  setCaptionsIndex: (captionsIndex: number) => void;
  reset: () => void;
  // Web caption settings actions
  saveWebCustomCaptions: (captionSettings: Partial<WebCaptionSettingsState>) => void;
  toggleWebCaptions: (params: { language?: string; enabled: boolean }) => void;
  setBasicCaptionSetting: (params: {
    setting: BasicSetting;
    attributeKey: BasicSettingKey;
    attributeValue: Toggle | FontSize;
  }) => Promise<WebCaptionSettingsState>;
  loadWebCustomCaptions: (captionSettingsString: string, isMobile: boolean) => void;
  // Utility
  getStoredCaptionsLanguage: () => string;
};

type WebCaptionsStore = CaptionsState & CaptionsActions;
type CaptionsStore = WebCaptionsStore;

export const getWebInitialState = (): WebCaptionSettingsState => ({
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
});

const getInitialCaptionSettings = (): WebCaptionSettingsState => {
  // For Web, load from local storage synchronously on initialization
  // This ensures both VOD and Live playback have the correct settings from the start
  // Previously, VOD loaded settings when the player was created, but Live didn't,
  // causing styling differences and settings resetting on reload
  const captionSettingsString = getLocalData(WEB_CAPTION_SETTINGS);
  if (captionSettingsString) {
    try {
      const captionSettings = JSON.parse(captionSettingsString);
      // Ensure we convert defaultCaptions from legacy string value into new object structure
      if (typeof captionSettings.defaultCaptions === 'string') {
        const enabled = captionSettings.defaultCaptions.toLowerCase() !== CC_OFF;
        captionSettings.defaultCaptions = {
          enabled,
          language: enabled ? captionSettings.defaultCaptions : DEFAULT_CAPTION_LANGUAGE,
        };
      }
      if (isWebCaptionSettingsState(captionSettings)) {
        return captionSettings;
      }
    } catch (error) {
      logger.error({ error }, `Failed to parse captionSettingsString ${captionSettingsString} during store initialization`);
    }
  }

  return getWebInitialState();
};

const initialState: CaptionsState = {
  captionsList: [],
  captionsIndex: 0,
  captionSettings: getInitialCaptionSettings(),
};

export const webCaptionsStore = createStore<CaptionsStore>((set, get) => ({
  ...initialState,
  setCaptionsList: (captionsList) => set({ captionsList }),
  setCaptionsIndex: (captionsIndex) => set({ captionsIndex }),
  reset: () => set({ ...initialState, captionSettings: getInitialCaptionSettings() }),

  // Web caption settings actions
  saveWebCustomCaptions: (captionSettings: Partial<WebCaptionSettingsState>) => {
    const currentCaptionSettings = get().captionSettings;
    const changedOptions: string[] = [];
    // Only check properties that are present in the partial update
    Object.keys(captionSettings).forEach((key) => {
      const newValue = captionSettings[key as keyof typeof captionSettings];
      const currentValue = currentCaptionSettings[key as keyof typeof currentCaptionSettings];
      // Use deep equality for nested objects, shallow equality for primitives
      if (!isEqual(newValue, currentValue)) {
        changedOptions.push(key);
      }
    });

    // Guard: Don't update if nothing changed to prevent infinite loops
    if (changedOptions.length === 0) {
      return;
    }

    trackCaptionSettings({ changedOptions });

    const newSettings = {
      ...currentCaptionSettings,
      ...captionSettings,
    } as WebCaptionSettingsState;

    set({ captionSettings: newSettings });

    // Ensures we don't persist the linear mini player font size by using
    // the locally stored font size state instead
    // Only revert to stored font size if the new font size is a mini player font size
    // Mini player font sizes have fixed px values (14px, 16px, 20px) while regular font sizes use clamp()
    let fontSize = newSettings.font.size;
    if (newSettings.font.size && WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY.some(opt => opt.vw === newSettings.font.size.vw)) {
      const captionSettingsString = getLocalData(WEB_CAPTION_SETTINGS);
      try {
        const defaultCaptionSettings = JSON.parse(captionSettingsString);
        if (isWebCaptionSettingsState(defaultCaptionSettings)) {
          fontSize = defaultCaptionSettings.font.size;
        }
      } catch (error) {
        logger.error({ error }, `Failed to parse local captions ${captionSettingsString}`);
      }
    }
    setLocalData(
      WEB_CAPTION_SETTINGS,
      JSON.stringify({
        ...newSettings,
        font: {
          ...newSettings.font,
          size: fontSize,
        },
      })
    );
  },

  toggleWebCaptions: ({ language, enabled }: { language?: string; enabled: boolean }) => {
    const currentCaptionSettings = get().captionSettings;
    const finalLanguage = language || currentCaptionSettings.defaultCaptions.language;

    // Guard: Don't update if values haven't changed to prevent infinite loops
    if (
      currentCaptionSettings.defaultCaptions.enabled === enabled &&
      currentCaptionSettings.defaultCaptions.language === finalLanguage
    ) {
      return;
    }

    get().saveWebCustomCaptions({
      ...currentCaptionSettings,
      defaultCaptions: {
        language: finalLanguage,
        enabled,
      },
    });
  },

  setBasicCaptionSetting: ({
    setting,
    attributeKey,
    attributeValue,
  }: {
    setting: BasicSetting;
    attributeKey: BasicSettingKey;
    attributeValue: Toggle | FontSize;
  }) => {
    const currentCaptionSettings = get().captionSettings;
    const newCaptionSettings = {
      ...currentCaptionSettings,
      [setting]: {
        ...currentCaptionSettings[setting],
        [attributeKey]: attributeValue,
      },
    } as WebCaptionSettingsState;

    get().saveWebCustomCaptions(newCaptionSettings);
    return Promise.resolve(newCaptionSettings);
  },

  loadWebCustomCaptions: (captionSettingsString: string, isMobile: boolean) => {
    try {
      const captionSettings = JSON.parse(captionSettingsString);

      // Ensure we convert defaultCaptions from legacy string value into new object structure
      if (typeof captionSettings.defaultCaptions === 'string') {
        const enabled = captionSettings.defaultCaptions.toLowerCase() !== CC_OFF;
        captionSettings.defaultCaptions = {
          enabled,
          language: enabled ? captionSettings.defaultCaptions : 'English',
        };
      }

      // backwards compatibility: Reset the default value on the mobile
      if (typeof captionSettings.isMobile === 'undefined' || captionSettings.isMobile !== isMobile) {
        const newCaptionSettings = {
          ...captionSettings,
          isMobile,
          font: {
            ...captionSettings.font,
            size: isMobile ? WEB_MOBILE_FONT_SIZE_OPTIONS.small : WEB_FONT_SIZE_OPTIONS.medium,
          },
        };
        get().saveWebCustomCaptions(newCaptionSettings as WebCaptionSettingsState);
      } else {
        get().saveWebCustomCaptions(captionSettings);
      }
    } catch (error) {
      logger.error({ error }, `Failed to parse captionSettingsString ${captionSettingsString}`);
    }
  },

  // Utility
  getStoredCaptionsLanguage: () => getStoredCaptionsLanguageUtil(),
}));

/**
 * Hook to access the Web captions store with a selector.
 * This allows components to subscribe to only the parts of state they need,
 * minimizing re-renders.
 */
export function useWebCaptionsStore<T>(selector: (state: CaptionsStore) => T): T {
  return useStore(webCaptionsStore, selector);
}

