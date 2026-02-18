import type { AudioTrackInfo } from '@adrise/player';
import type { Language } from '@tubitv/analytics/lib/playerEvent';
import { isLanguage } from '@tubitv/analytics/lib/playerEvent';
import { defineMessages } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { LD_DEFAULT_AUDIO_TRACKS, WEB_AUDIO_TRACK_SELECT } from 'common/constants/constants';
import { getLocalData } from 'common/utils/localDataStorage';
import type { LanguageLocaleType } from 'i18n/constants';

type AudioLanguagesInEnglish = 'English' | 'Spanish' | 'French' | 'German' | 'Portuguese' | 'Italian' | 'Icelandic' | 'Korean' | 'Japanese' | 'Chinese';

export const AUDIO_LANGUAGE_CODE_MAP: Record<AudioLanguagesInEnglish, Language> = {
  English: 'EN',
  Spanish: 'ES',
  French: 'FR',
  German: 'DE',
  Portuguese: 'PT',
  Italian: 'IT',
  Icelandic: 'IS',
  Korean: 'KO',
  Japanese: 'JA',
  Chinese: 'ZH',
};

export function isAudioLanguageCodeKey(key?: string): key is keyof typeof AUDIO_LANGUAGE_CODE_MAP {
  return Object.keys(AUDIO_LANGUAGE_CODE_MAP).includes(key ?? '');
}

type AudioLabel = {
  main: string;
  description: string;
};

export const audioTrackHeaderMessages = defineMessages({
  captionsHeader: {
    description: 'audio descriptions modal caption header',
    defaultMessage: 'Subtitles',
  },
  audioHeader: {
    description: 'audio descriptions modal audio header',
    defaultMessage: 'Audio',
  },
});

export const audioLabelMapping: Record<Language, AudioLabel> = {
  UNKNOWN: {
    main: 'Unknown',
    description: 'Unknown - Audio Description',
  },
  EN: {
    main: 'English',
    description: 'English - Audio Description',
  },
  ES: {
    main: 'Español',
    description: 'Español - Audio Description',
  },
  FR: {
    main: 'Français',
    description: 'Français - Audio Description',
  },
  DE: {
    main: 'Deutsch',
    description: 'Deutsch - Audio Description',
  },
  PT: {
    main: 'Português',
    description: 'Português - Audio Description',
  },
  IS: {
    main: 'Íslenska',
    description: 'Íslenska - Audio Description',
  },
  IT: {
    main: 'Italiano',
    description: 'Italiano - Audio Description',
  },
  KO: {
    main: '한국인',
    description: '한국인 - Audio Description',
  },
  JA: {
    main: '日本語',
    description: '日本語 - Audio Description',
  },
  ZH: {
    main: '中文',
    description: '中文 - Audio Description',
  },
};

export const getLanguageCodeFromAudioTrack = (audioTrack: AudioTrackInfo): Language => {
  const { language } = audioTrack;
  const lang = language?.toUpperCase();
  if (lang && isLanguage(lang)) {
    return lang;
  }

  return 'UNKNOWN';
};

const isMainTrack = (audioTrack: AudioTrackInfo) => {
  return audioTrack.role?.toLowerCase().includes('main') || false;
};

export const isDescriptionTrack = (audioTrack: AudioTrackInfo) => {
  return audioTrack.role?.toLowerCase().includes('description') || false;
};

export const getA11yAudioTrackLabel = (audioTrack: AudioTrackInfo) => {
  const isDescription = isDescriptionTrack(audioTrack);
  const code = getLanguageCodeFromAudioTrack(audioTrack);
  const messages = audioLabelMapping[code];
  return isDescription ? messages.description : messages.main;
};

/**
 * Returns a label to language code mapping i.e.
 * {
 *  'Unknown': 'UNKNOWN',
 *  'English': 'EN',
 *  'Spanish - Audio Description': 'ES',
 * }
 */
export const createLabelToLangCodeMapping = (): Record<string, Language> => {
  const labelToLangCodeMapping: Record<string, Language> = {};

  for (const [languageCode, audioLabels] of Object.entries(audioLabelMapping)) {
    const { main, description } = audioLabels;
    labelToLangCodeMapping[main] = languageCode as Language;
    labelToLangCodeMapping[description] = languageCode as Language;
  }

  return labelToLangCodeMapping;
};

export const getLocalAudioTrackData = (): string => {
  const localStorageKey = __ISOTT__ ? LD_DEFAULT_AUDIO_TRACKS : WEB_AUDIO_TRACK_SELECT;
  const defaultAudioTrack: string = getLocalData(localStorageKey);
  return defaultAudioTrack;
};

export const getDefaultAudioTrackInfo = (): Pick<AudioTrackInfo, 'language' | 'role'> | undefined => {
  const defaultAudioTrack = getLocalAudioTrackData();
  if (!defaultAudioTrack) return;
  const mapping = createLabelToLangCodeMapping();
  const language = (mapping[defaultAudioTrack] || mapping.Unknown).toLowerCase();
  const role = defaultAudioTrack.toLowerCase().includes('description') ? 'description' : 'main';
  return {
    language,
    role,
  };
};

export const isMainEnglishTrack = (audioTrack: AudioTrackInfo): boolean => {
  const lang = getLanguageCodeFromAudioTrack(audioTrack);
  return lang === 'EN' && isMainTrack(audioTrack);
};

const isValidAudioTrack = (audioTrack: AudioTrackInfo): boolean => {
  const label = getA11yAudioTrackLabel(audioTrack);
  return label !== audioLabelMapping.UNKNOWN.main && label !== audioLabelMapping.UNKNOWN.description;
};

export const internationalizeAudioLabels = (audioTracks: AudioTrackInfo[], intl: IntlShape): AudioTrackInfo[] => {
  const currentLocale = intl.locale;
  const currentLanguageCode = currentLocale.split('-')[0]; // ISO code, e.g., 'en'

  // See Shortcut #708155 for language priority
  const languagePriority = {
    en: 1,
    es: 2,
    fr: 3,

    // Current language has highest priority
    [currentLanguageCode]: 0,
  };
  const getLanguagePriority = (a: AudioTrackInfo) => a.language && a.language in languagePriority ? languagePriority[a.language] : 10;

  return audioTracks
    .filter(isValidAudioTrack)
    .sort((a, b) => {
      const byLanguage = getLanguagePriority(a) - getLanguagePriority(b);
      const byRole = a.role === 'main' && b.role !== 'main' ? -1 : b.role === 'main' && a.role !== 'main' ? 1 : 0;

      return byLanguage || byRole;
    });
};

export const getAudioTrackLabelFromLocale = (currentLocale: LanguageLocaleType): string => {
  const languageCode = currentLocale.split('-')[0] || 'UNKNOWN'; // ISO code, e.g., 'en'
  const audioLabel: AudioLabel = audioLabelMapping[languageCode.toUpperCase() as keyof typeof audioLabelMapping];
  return audioLabel.main;
};
