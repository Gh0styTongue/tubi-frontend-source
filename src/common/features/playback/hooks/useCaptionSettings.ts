import type {
  BasicSetting,
  BasicSettingKey,
  FontSize,
  OTTCaptionSettingsState,
  Toggle,
  WebCaptionSettingsState,
} from 'common/types/captionSettings';
import type { LanguageLocaleType } from 'i18n/constants';

// Conditionally import platform-specific hooks to prevent bundling platform-specific code
// IMPORTANT: __ISOTT__ is replaced by webpack's DefinePlugin at build time, so webpack's
// dead code elimination will remove the unused branch. This ensures:
// - OTT builds only include ott/features/playback/hooks/useCaptionSettings
// - Web builds only include web/features/playback/hooks/useCaptionSettings
// The same pattern is used in common/features/playback/store/captionsStore.ts
let ottHooks: {
  useCaptionSettings: () => OTTCaptionSettingsState;
  useCaptionSettingsActions: () => {
    setDefaultCaptions: (params: { language?: string; enabled: boolean }) => void;
    setDefaultAudioTrack: (audioTracks: string, age?: number) => void;
    setCaptionSettings: (id: string, subOptionIndex: number) => void;
    loadCaptionSettingsFromLocal: (userLanguageLocale: LanguageLocaleType) => void;
    resetCaptionSettings: () => void;
    getStoredCaptionsLanguage: () => string;
  };
} | undefined;

let webHooks: {
  useCaptionSettings: () => WebCaptionSettingsState;
  useCaptionSettingsActions: () => {
    saveWebCustomCaptions: (captionSettings: Partial<WebCaptionSettingsState>) => void;
    toggleWebCaptions: (params: { language?: string; enabled: boolean }) => void;
    setBasicCaptionSetting: (params: {
      setting: BasicSetting;
      attributeKey: BasicSettingKey;
      attributeValue: Toggle | FontSize;
    }) => Promise<WebCaptionSettingsState>;
    loadWebCustomCaptions: (captionSettingsString: string, isMobile: boolean) => void;
    getStoredCaptionsLanguage: () => string;
  };
} | undefined;

if (__ISOTT__) {
  ottHooks = require('ott/features/playback/hooks/useCaptionSettings');
} else {
  webHooks = require('web/features/playback/hooks/useCaptionSettings');
}

/**
 * Hook to access caption settings from the Zustand store.
 * Use this in common code that works on both platforms.
 * Replaces the old useAppSelector(captionSettingsSelector) pattern.
 */
export function useCaptionSettings(): WebCaptionSettingsState | OTTCaptionSettingsState {
  if (__ISOTT__) {
    if (!ottHooks) {
      throw new Error('useCaptionSettings is not available');
    }

    return ottHooks.useCaptionSettings();
  }
  if (!webHooks) {
    throw new Error('useCaptionSettings is not available');
  }

  return webHooks.useCaptionSettings();
}

/**
 * Hook to access caption settings actions from the Zustand store.
 * Use this in common code that works on both platforms.
 *
 * Note: Platform-specific actions will be undefined on the wrong platform.
 * Web actions (saveWebCustomCaptions, toggleWebCaptions, etc.) are only available on Web.
 * OTT actions (setDefaultCaptions, setCaptionSettings, etc.) are only available on OTT.
 */
export function useCaptionSettingsActions() {
  if (__ISOTT__) {
    if (!ottHooks) {
      throw new Error('useCaptionSettingsActions is not available');
    }

    return ottHooks.useCaptionSettingsActions();
  }
  if (!webHooks) {
    throw new Error('useCaptionSettingsActions is not available');
  }

  return webHooks.useCaptionSettingsActions();
}

