import { isWebCaptionSettingsState } from '@adrise/player';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { trackCaptionSettings } from 'client/features/playback/track/client-log/trackCaptionSettings';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { WEB_SET_CAPTION_SETTINGS } from 'common/constants/action-types';
import {
  CC_OFF,
  WEB_CAPTION_SETTINGS,
} from 'common/constants/constants';
import logger from 'common/helpers/logging';
import type {
  BasicSetting,
  BasicSettingKey,
  FontSize,
  OTTCaptionSettingsState,
  Toggle,
  WebCaptionSettingAction,
  WebCaptionSettingsState,
} from 'common/types/captionSettings';
import type { StoreState } from 'common/types/storeState';
import {
  WEB_FONT_SIZE_OPTIONS,
  WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY,
  WEB_MOBILE_FONT_SIZE_OPTIONS,
} from 'web/constants/captionSettings';

import type ApiClient from '../helpers/ApiClient';
import type { TubiThunkAction, TubiThunkDispatch } from '../types/reduxThunk';

export function getLocalCaptions(): string {
  return getLocalData(WEB_CAPTION_SETTINGS);
}

export function getStoredCaptionsLanguage(): string {
  const captionSettingsString = getLocalCaptions();
  try {
    const defaultCaptionSettings = JSON.parse(captionSettingsString);
    if (isWebCaptionSettingsState(defaultCaptionSettings)) {
      return defaultCaptionSettings.defaultCaptions.language;
    }
  } catch (error) {
    logger.error({ error }, `Failed to parse local captions ${captionSettingsString} while running getStoredCaptionsLanguage`);
  }
  return '';
}

export function saveWebCustomCaptions(captionSettings: Partial<WebCaptionSettingsState>) {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const { captionSettings: currentCaptionSettings } = getState();
    const changedOptions: string[] = [];
    Object.keys(currentCaptionSettings).forEach((key) => {
      if (captionSettings[key] !== currentCaptionSettings[key]) changedOptions.push(key);
    });

    trackCaptionSettings({ changedOptions });
    dispatch(setCustomCaptionsOnStore(captionSettings));
    // Ensures we don't persist the linear mini player font size by using
    // the locally stored font size state instead
    let fontSize = captionSettings.font?.size;
    if (fontSize && WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY.includes(fontSize)) {
      const captionSettingsString = getLocalCaptions();
      try {
        const defaultCaptionSettings = JSON.parse(captionSettingsString);
        if (isWebCaptionSettingsState(defaultCaptionSettings)) {
          fontSize = defaultCaptionSettings.font.size;
        }
      } catch (error) {
        logger.error({ error }, `Failed to parse local captions ${captionSettingsString}`);
      }
    }
    setLocalData(WEB_CAPTION_SETTINGS, JSON.stringify({
      ...captionSettings,
      font: {
        ...captionSettings.font,
        size: fontSize,
      },
    }));
  };
}

export function loadWebCustomCaptions(captionSettingsString: string): TubiThunkAction {
  return (dispatch, getState) => {
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

      const { ui: { isMobile } } = getState();
      // backwards compatibility: Reset the default value on the mobile
      if (typeof captionSettings.isMobile === 'undefined' || captionSettings.isMobile !== isMobile) {
        return dispatch(resetCustomCaptionsOnStore({ ...captionSettings, isMobile }));
      }
      return dispatch(setCustomCaptionsOnStore(captionSettings));
    } catch (error) {
      logger.error({ error }, `Failed to parse captionSettingsString ${captionSettingsString}`);
    }
  };
}

export function toggleWebCaptions({ language, enabled }: { language?: string, enabled: boolean }): TubiThunkAction {
  return (dispatch, getState) => {
    const { captionSettings } = getState();
    dispatch(saveWebCustomCaptions({
      ...captionSettings as WebCaptionSettingsState,
      defaultCaptions: {
        language: language || captionSettings.defaultCaptions.language,
        enabled,
      },
    }));
  };
}

function setCustomCaptionsOnStore(captionSettings: Partial<WebCaptionSettingsState>): WebCaptionSettingAction {
  return {
    type: WEB_SET_CAPTION_SETTINGS,
    captionSettings,
  };
}

function resetCustomCaptionsOnStore(captionSettings: Partial<WebCaptionSettingsState>): TubiThunkAction {
  return (dispatch) => {
    const newCaptionSettings = {
      ...captionSettings,
      font: {
        ...captionSettings.font,
        size: captionSettings.isMobile ? WEB_MOBILE_FONT_SIZE_OPTIONS.small : WEB_FONT_SIZE_OPTIONS.medium,
      },
    };
    return dispatch(saveWebCustomCaptions(newCaptionSettings as WebCaptionSettingsState));
  };
}

export interface BasicCaptionSettingModification {
  setting: BasicSetting;
  attributeKey: BasicSettingKey;
  attributeValue: Toggle | FontSize;
}

export function setBasicCaptionSetting({ setting, attributeKey, attributeValue }: BasicCaptionSettingModification): TubiThunkAction<ThunkAction<Promise<WebCaptionSettingsState & OTTCaptionSettingsState>, StoreState, ApiClient, AnyAction>> {
  return (dispatch, getState) => {
    const { captionSettings } = getState();
    const newCaptionSettings = {
      ...captionSettings,
      [setting]: {
        ...captionSettings[setting],
        [attributeKey]: attributeValue,
      },
    };
    dispatch(saveWebCustomCaptions(newCaptionSettings as WebCaptionSettingsState));
    return Promise.resolve(newCaptionSettings);
  };
}
