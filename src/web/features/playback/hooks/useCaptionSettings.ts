import { useShallow } from 'zustand/react/shallow';

import type {
  BasicSetting,
  BasicSettingKey,
  FontSize,
  Toggle,
  WebCaptionSettingsState,
} from 'common/types/captionSettings';
import { useWebCaptionsStore } from 'web/features/playback/store/webCaptionsStore';

// Store type definitions based on the actual store structure
type WebCaptionsStore = {
  captionSettings: WebCaptionSettingsState;
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

/**
 * Hook to access Web caption settings from the Zustand store.
 * Use this in Web-specific code.
 */
export function useWebCaptionSettings(): WebCaptionSettingsState {
  return useWebCaptionsStore((state: WebCaptionsStore) => state.captionSettings);
}

/**
 * Hook to access Web caption settings actions from the Zustand store.
 * Use this in Web-specific code.
 */
export function useWebCaptionSettingsActions() {
  return useWebCaptionsStore(
    useShallow((state: WebCaptionsStore) => ({
      saveWebCustomCaptions: state.saveWebCustomCaptions,
      toggleWebCaptions: state.toggleWebCaptions,
      setBasicCaptionSetting: state.setBasicCaptionSetting,
      loadWebCustomCaptions: state.loadWebCustomCaptions,
      getStoredCaptionsLanguage: state.getStoredCaptionsLanguage,
    }))
  );
}

/**
 * Hook to access caption settings from the Zustand store.
 * Use this in common code that works on both platforms.
 * For platform-specific code, use useWebCaptionSettings instead.
 */
export function useCaptionSettings(): WebCaptionSettingsState {
  return useWebCaptionSettings();
}

/**
 * Hook to access caption settings actions from the Zustand store.
 * Use this in common code that works on both platforms.
 * For platform-specific code, use useWebCaptionSettingsActions instead.
 */
export function useCaptionSettingsActions() {
  return useWebCaptionSettingsActions();
}

