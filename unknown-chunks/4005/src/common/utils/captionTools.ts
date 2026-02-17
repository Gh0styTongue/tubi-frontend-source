import type { OTTCaptionsStyle, Platform, SettingsForNativePlayer, WebCaptionsStyle, Subtitle, Captions } from '@adrise/player';
import type { Language } from '@tubitv/analytics/lib/playerEvent';
import isNumber from 'lodash/isNumber';
import pickBy from 'lodash/pickBy';
import type { IntlShape } from 'react-intl';

import { setLocalData, getLocalData } from 'client/utils/localDataStorage';
import { getStoredCaptionsLanguage } from 'common/actions/webCaptionSettings';
import { LD_CUSTOM_CAPTIONS_SETTINGS, LD_DEFAULT_AUDIO_TRACKS, LD_DEFAULT_CAPTIONS_LANG, LD_DEFAULT_CAPTIONS_ENABLED, DEFAULT_CAPTION_LANGUAGE, CC_OFF } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import type { ColorSetting, OTTCaptionSettingsState, WebCaptionSettingsState, FontVariant, CaptionSubOption } from 'common/types/captionSettings';
import type StoreState from 'common/types/storeState';
import { findIndex } from 'common/utils/collection';
import {
  EDGE_COLOR,
  OPTIONS,
  SUB_OPTION_VALUE,
} from 'ott/constants/captionSettings';

export const removeFalsyValues = (obj: Record<string, unknown>) => pickBy(obj, val => !!val);

// create a function to get specific attribute from option data
const getAttributeFactory = (attributeName: string, byId: Partial<OTTCaptionSettingsState>) => {
  return (optionId: string | number) => {
    const { subOptions, subOptionIndex } = byId[optionId];
    return subOptions[subOptionIndex][attributeName];
  };
};

export function isCaptionEnabled(settings: StoreState['captionSettings']) {
  return settings.defaultCaptions.enabled;
}

export function computeCaptionStyle(getOptionById: OTTCaptionSettingsState['byId']): OTTCaptionsStyle {
  const byId = getOptionById;
  const getValueOf = getAttributeFactory('value', byId);

  const backgroundColor = getValueOf(OPTIONS.BACKGROUND_COLOR);
  const windowColor = getValueOf(OPTIONS.WINDOW_COLOR);
  const fontVariant = (getValueOf(OPTIONS.FONT) === SUB_OPTION_VALUE.FONT_SMALL_CAPS ? 'small-caps' : SUB_OPTION_VALUE.FONT_VARIANT_NORMAL) as FontVariant;

  // [doc] refer to https://tubitv.atlassian.net/wiki/spaces/EC/pages/613777651/AndroidTV+app+native+webview+bridges
  const captionStyle = {
    type: 'ott' as Platform.ott,
    font: {
      backgroundColor: `rgba(${backgroundColor}, ${getValueOf(OPTIONS.BACKGROUND_OPACITY)})`,
      color: `rgb(${getValueOf(OPTIONS.COLOR)})`,
      fontSize: getValueOf(OPTIONS.SIZE),
      fontFamily: getValueOf(OPTIONS.FONT),
      fontVariant,
      opacity: getValueOf(OPTIONS.OPACITY),
      textShadow: getValueOf(OPTIONS.EDGE),
    },
    window: {
      backgroundColor: `rgba(${windowColor}, ${getValueOf(OPTIONS.WINDOW_OPACITY)})`,
    },
  };

  return captionStyle;
}

// turn {backgroundColor: #fff, color: #000} => "background-color:#fff;color:#000"
export function convertStyleObjectToString(styles: { [x: string]: unknown; }): string {
  const uppercasePattern = /([A-Z])/g;
  return Object.keys(styles).map((key) => {
    const stylePropValue = styles[key];
    const stylePropName = key.replace(uppercasePattern, '-$1').toLowerCase();
    return `${stylePropName}:${stylePropValue}`;
  }).join(';');
}

export const findSubOptionIndex = (options: Pick<CaptionSubOption, 'value'>[], searchingValue: CaptionSubOption['value']): number =>
  findIndex(options, ({ value }: { value: unknown }) => value === searchingValue);

export function getLocalDefaultLanguage(): string {
  return getLocalData(LD_DEFAULT_CAPTIONS_LANG) || DEFAULT_CAPTION_LANGUAGE;
}

export function loadCaptionSettings() {
  function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      logger.error({ error }, `Failed to parse JSON value: ${jsonString}`);
      return defaultValue;
    }
  }

  const captionsSettings = safelyParseJSON<Record<string, any>>(getLocalData(LD_CUSTOM_CAPTIONS_SETTINGS), {});
  const enabled = safelyParseJSON<boolean>(getLocalData(LD_DEFAULT_CAPTIONS_ENABLED), false);

  return {
    captions: {
      language: getLocalDefaultLanguage(),
      enabled,
    },
    audioTracks: getLocalData(LD_DEFAULT_AUDIO_TRACKS) || '',
    captionsSettings,
  };
}

export function updateLocalSettings(defaultCaptions: WebCaptionSettingsState['defaultCaptions'], byId: { [x: string]: { subOptionIndex?: number; }; }) {
  if (defaultCaptions.language) {
    setLocalData(LD_DEFAULT_CAPTIONS_LANG, defaultCaptions.language);
  }
  setLocalData(LD_DEFAULT_CAPTIONS_ENABLED, defaultCaptions.enabled ? 'true' : 'false');

  // save setting options' indexes
  const settings: Record<string, number | undefined> = {};
  Object.keys(byId).forEach((id) => {
    settings[id] = byId[id].subOptionIndex;
  });
  setLocalData(LD_CUSTOM_CAPTIONS_SETTINGS, JSON.stringify(settings));
}

export function updateLocalAudioDescription(defaultAudioDescription: string, age?: number) {
  setLocalData(LD_DEFAULT_AUDIO_TRACKS, defaultAudioDescription || '', age);
}

export function transformSettingsToNativePlayer(settings: OTTCaptionSettingsState): SettingsForNativePlayer {
  const { byId, defaultCaptions } = settings;
  const getValueOf = getAttributeFactory('value', byId);
  const getNativeValueOf = getAttributeFactory('nativeValue', byId);

  // 0 ~ 255 => 00 ~ FF
  const numberToHex = (num: unknown) => {
    const hex = Number(num).toString(16);
    return (hex.length === 1 ? `0${hex}` : hex).toUpperCase();
  };

  // get opacity value and transform: "0" ~ "1" => "00" ~ "FF"
  const getOpacityOf = (optionName: string) => numberToHex(Math.round(getValueOf(optionName) * 255));
  const opacity = getOpacityOf(OPTIONS.OPACITY);
  const backgroundOpacity = getOpacityOf(OPTIONS.BACKGROUND_OPACITY);
  const windowOpacity = getOpacityOf(OPTIONS.WINDOW_OPACITY);

  // get color value and transform: "0, 0, 0" ~ "255, 255, 255" => "000000" ~ "FFFFFF"
  const getColorOf = (optionName: string) => getValueOf(optionName).split(', ').map((color: unknown) => numberToHex(color)).join('');
  const captionColor = getColorOf(OPTIONS.COLOR);
  const backgroundColor = getColorOf(OPTIONS.BACKGROUND_COLOR);
  const windowColor = getColorOf(OPTIONS.WINDOW_COLOR);

  const settingsForNativePlayer = {
    caption_color: `#${opacity}${captionColor}`, // hex string, opacity alpha and color: "#FF000000"
    is_caption_enabled: defaultCaptions.enabled,
    caption_language: defaultCaptions.language,
    font: getNativeValueOf(OPTIONS.FONT),
    font_size: getNativeValueOf(OPTIONS.SIZE),
    caption_background_color: `#${backgroundOpacity}${backgroundColor}`,
    caption_window_color: `#${windowOpacity}${windowColor}`,
    character_edge: getNativeValueOf(OPTIONS.EDGE),
    character_edge_color: `#${opacity}${EDGE_COLOR}`,
  };

  return settingsForNativePlayer;
}

/* Web Related Caption Style Utils */

export const getFontShadowStyle = (settings: WebCaptionSettingsState) => {
  const { stylingType, stylingColor: { activeRGBValue } } = settings.styling;
  switch (stylingType.value) {
    case 'drop':
      return `1px 1px 1px rgb(${activeRGBValue})`;
    case 'raised':
      return `0 -1px 0 #FFF, 0 1px 0 rgb(${activeRGBValue})`;
    case 'depressed':
      return `0 -1px 0 rgb(${activeRGBValue}), 0 1px 0 rgb(255, 255, 255)`;
    case 'uniform':
      return `
        -1px 1px 0 rgb(${activeRGBValue}),
        1px -1px 0 rgb(${activeRGBValue}),
        1px 1px 0 rgb(${activeRGBValue}),
        -1px -1px 0 rgb(${activeRGBValue})`;
    default:
      return undefined;
  }
};

const getOpacityFromColorSetting = (setting: ColorSetting) => {
  return setting.isSemitransparent ? '0.6' : '1';
};

const getWindowStyle = (windowSetting: { windowColor: any; }): WebCaptionsStyle['window'] => {
  const { windowColor } = windowSetting;
  return {
    background: windowColor.activeRGBValue
      ? `rgba(${windowColor.activeRGBValue}, ${getOpacityFromColorSetting(windowColor)})`
      : '',
  };
};

const getFontBackgroundColor = (settings: WebCaptionSettingsState) => {
  const { backgroundColor, toggle } = settings.background;
  if (!toggle.active) return 'none';
  const opacity = isNumber(backgroundColor?.opacity) ? backgroundColor.opacity : getOpacityFromColorSetting(backgroundColor);
  return `rgba(${backgroundColor.activeRGBValue}, ${opacity})`;
};

export const computeWebCaptionStyles = (settings: WebCaptionSettingsState, preview = false): WebCaptionsStyle => {
  const { size, family, fontColor } = settings.font;
  const { variant, type } = family;
  const fontSize = size.vw;
  const previewFontSize = `calc(${fontSize} / 2.8)`;
  const style = {
    type: 'web' as Platform.web,
    font: removeFalsyValues({
      fontSize: preview ? previewFontSize : fontSize,
      fontFamily: type,
      fontVariant: variant,
      color: `rgba(${fontColor.activeRGBValue}, ${getOpacityFromColorSetting(fontColor)})`,
      background: getFontBackgroundColor(settings),
      textShadow: getFontShadowStyle(settings),
    }),
    window: removeFalsyValues(getWindowStyle(settings.window)) as WebCaptionsStyle['window'],
  };
  return style;
};

export const languageCodeMapping: Record<Language, string> = {
  UNKNOWN: 'unknown',
  EN: 'english',
  ES: 'spanish',
  FR: 'french',
  DE: 'german',
  PT: 'portuguese',
  IT: 'italian',
  KO: 'korean',
  JA: 'japanese',
  ZH: 'chinese',
};

export function getLanguageCode(language: string): Language {
  let lang = language;
  if (language.toLowerCase() === CC_OFF) {
    if (__WEBPLATFORM__) {
      lang = getStoredCaptionsLanguage();
    } else {
      lang = getLocalData(LD_DEFAULT_CAPTIONS_LANG);
    }
  }
  for (const [key, value] of Object.entries(languageCodeMapping)) {
    if (typeof lang === 'string' && value.toLowerCase() === lang.toLowerCase()) {
      return key as Language;
    }
  }
  return 'UNKNOWN';
}

export const subtitleLabelMapping = {
  unknown: 'Unknown',
  off: 'Off',
  english: 'English',
  spanish: 'Español',
  french: 'Français',
  german: 'Deutsch',
  portuguese: 'Português',
  italian: 'Italiano',
  korean: '한국인',
  japanese: '日本語',
  chinese: '中文',
};

export function moveElementToFront<T = any>(array: T[], elementMatcher: (value: T, index: number, obj: T[]) => unknown) {
  const index = array.findIndex(elementMatcher);
  if (index > -1) {
    const element = array.splice(index, 1)[0];
    array.unshift(element);
  }
}

type SubtitleLang = keyof typeof subtitleLabelMapping;

type SubtitleLangCaseInsensitive = SubtitleLang | Capitalize<SubtitleLang>;

export const isValidSubtitleLang = (lang: string): lang is SubtitleLangCaseInsensitive => {
  return lang.toLowerCase() in subtitleLabelMapping;
};

export const internationalizeSubtitleLabels = (captions: Subtitle[], intl: IntlShape): Subtitle[] => {
  const currentLocale = intl.locale;
  const currentLanguageCode = currentLocale.split('-')[0]; // ISO code, e.g., 'en'
  const currentLanguage = languageCodeMapping[currentLanguageCode?.toUpperCase()] || languageCodeMapping.EN; // Full string, e.g., 'english'

  const captionsCopy = captions.slice();

  // Move current language to the front
  moveElementToFront(captionsCopy, (caption) =>
    caption.lang?.toLowerCase() === currentLanguage
  );

  // Move 'off' option to the front
  moveElementToFront(captionsCopy, (caption) => caption.lang?.toLowerCase() === CC_OFF);

  // Internationalize the sorted captions
  return captionsCopy.reduce((acc: Subtitle[], caption) => {
    if (caption.lang && isValidSubtitleLang(caption.lang)) {
      caption.label = getInternationalizedLanguage(caption.lang);
      acc.push(caption);
    }
    return acc;
  }, []);
};

export const getInternationalizedLanguage = (language: SubtitleLangCaseInsensitive): string => {
  return subtitleLabelMapping[language.toLowerCase()];
};

function convertIso639_2ToIso639_1(code: string): Language {
  const mapping: { [key: string]: Language } = {
    eng: 'EN',
    spa: 'ES',
    fra: 'FR',
    fre: 'FR',
    deu: 'DE',
    ger: 'DE',
    por: 'PT',
    ita: 'IT',
    kor: 'KO',
    jpn: 'JA',
    zho: 'ZH',
    chi: 'ZH',
  };

  return mapping[code.toLowerCase()] || code.toUpperCase();
}

export const getCaptionFromTextTrack = (textTrack: TextTrack): Captions => {
  const languageCode = convertIso639_2ToIso639_1(textTrack.language);
  const lang = languageCodeMapping[languageCode] || languageCodeMapping.UNKNOWN;
  const label = subtitleLabelMapping[lang];

  return {
    id: label,
    label,
    lang,
  };
};

export const RFC5646_LANGUAGE_TAGS = {
  english: 'en-US',
  spanish: 'es-MX',
  french: 'fr-CA',
  german: 'de-DE',
  portuguese: 'pt-PT',
  italian: 'it-IT',
  korean: 'ko-KR',
  japanese: 'ja-JP',
  chinese: 'zh-CN',
};

export const getRFC5646LanguageTag = (caption: Captions): typeof RFC5646_LANGUAGE_TAGS[(keyof typeof RFC5646_LANGUAGE_TAGS)] => {
  const lang = caption.lang?.toLowerCase() || 'english';
  return RFC5646_LANGUAGE_TAGS[lang] || RFC5646_LANGUAGE_TAGS.english;
};

export const getCaptionStyles = (captionSettings: WebCaptionSettingsState | OTTCaptionSettingsState) :
OTTCaptionsStyle | WebCaptionsStyle => {
  if (__ISOTT__) {
    const ottCaptionsSettings = captionSettings as OTTCaptionSettingsState;
    return computeCaptionStyle(ottCaptionsSettings.byId) as OTTCaptionsStyle;
  }
  return computeWebCaptionStyles(captionSettings as WebCaptionSettingsState) as unknown as WebCaptionsStyle;
};

function areTextTracksEqual(track1: TextTrack, track2: TextTrack): boolean {
  return track1.id === track2.id &&
         track1.kind === track2.kind &&
         track1.label === track2.label &&
         track1.language === track2.language;
}

export function areTextTrackArraysEqual(array1: TextTrack[], array2: TextTrack[]): boolean {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (!areTextTracksEqual(array1[i], array2[i])) {
      return false;
    }
  }

  return true;
}
