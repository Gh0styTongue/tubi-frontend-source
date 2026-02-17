import Cookie from 'react-cookie';

import systemApi from 'client/systemApi';
import { DEVICE_LANGUAGE } from 'common/constants/constants';

declare global {
  interface Navigator {
    userLanguage?: string;
  }
}

export const getDeviceLanguage = (): string | undefined => {
  if (systemApi.getDeviceLanguage) {
    const lang = systemApi.getDeviceLanguage();
    if (lang) {
      return lang;
    }
  }
  // see if we deliberately stored on local storage as first source of truth
  // otherwise use navigator.language (BCP 47 Code)
  const langtag = Cookie.load(DEVICE_LANGUAGE) || window.navigator.language || window.navigator.userLanguage;
  if (!langtag) {
    // TODO: system api for devices that do not support browser language api
    // https://app.clubhouse.io/tubi/epic/66225/send-device-language-for-spanish-ads

    return;
  }
  // BCP 47 Code starts with a language tag composed of several subtags
  // https://tools.ietf.org/html/bcp47#section-2
  // Some browsers will return 'english' for window.navigator.language, so we will use
  // the first 2 characters
  return langtag.slice(0, 2);
};

const LANGUAGE_TO_CODE_639_2 = {
  English: 'eng',
};

export function doesTheTextTrackMatchLanguage(textTrack: TextTrack, language: string) {
  // it is possible for VTT tracks to have the language/label in all caps;
  // we lower-case everything before doing comparisons

  return (!!textTrack.label && textTrack.label.toLowerCase() === language.toLowerCase())
    || (!!textTrack.language && textTrack.language.toLowerCase() === LANGUAGE_TO_CODE_639_2[language]);
}
