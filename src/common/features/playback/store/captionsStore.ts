import type { Captions } from '@adrise/player';
import type { StoreApi } from 'zustand';

import type { OTTCaptionSettingsState, WebCaptionSettingsState } from 'common/types/captionSettings';

// Minimal interface for player caption list state used by common hooks
// Both platform stores must implement this interface
// Note: Stores also include platform-specific caption settings and utility methods
type PlayerCaptionListStore = {
  captionsList: Captions[];
  captionsIndex: number;
  setCaptionsList: (captionsList: Captions[]) => void;
  setCaptionsIndex: (captionsIndex: number) => void;
  reset: () => void;
  // Additional properties used in common code
  captionSettings: WebCaptionSettingsState | OTTCaptionSettingsState;
  getStoredCaptionsLanguage: () => string;
};

// Conditionally import stores based on platform to prevent bundling platform-specific code
// IMPORTANT: __ISOTT__ is replaced by webpack's DefinePlugin at build time, so webpack's
// dead code elimination will remove the unused branch. This ensures:
// - OTT builds only include ott/features/playback/store/ottCaptionsStore
// - Web builds only include web/features/playback/store/webCaptionsStore
// Use captionsStore in common code that needs direct store access (e.g., selectors, subscription hooks)
// For platform-specific code, use ottCaptionsStore or webCaptionsStore directly
// For React components, prefer using useCaptionSettings/useCaptionSettingsActions hooks

let captionsStore: StoreApi<PlayerCaptionListStore>;
let useCaptionsStore: <T>(selector: (state: PlayerCaptionListStore) => T) => T;

if (__ISOTT__) {
  const ottStore = require('ott/features/playback/store/ottCaptionsStore');
  captionsStore = ottStore.ottCaptionsStore as StoreApi<PlayerCaptionListStore>;
  useCaptionsStore = ottStore.useOttCaptionsStore as <T>(selector: (state: PlayerCaptionListStore) => T) => T;
} else {
  const webStore = require('web/features/playback/store/webCaptionsStore');
  captionsStore = webStore.webCaptionsStore as StoreApi<PlayerCaptionListStore>;
  useCaptionsStore = webStore.useWebCaptionsStore as <T>(selector: (state: PlayerCaptionListStore) => T) => T;
}

export { captionsStore, useCaptionsStore };

// Re-export initial state functions for convenience
export function getOTTInitialState(): OTTCaptionSettingsState {
  if (__ISOTT__) {
    const ottStore = require('ott/features/playback/store/ottCaptionsStore');
    return ottStore.getOTTInitialState();
  }
  throw new Error('getOTTInitialState is not available on Web platform');
}

export function getWebInitialState(): WebCaptionSettingsState {
  if (!__ISOTT__) {
    const webStore = require('web/features/playback/store/webCaptionsStore');
    return webStore.getWebInitialState();
  }
  throw new Error('getWebInitialState is not available on OTT platform');
}
