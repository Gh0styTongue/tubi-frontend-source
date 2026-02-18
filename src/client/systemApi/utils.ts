import type { TextToSpeechOptions } from 'client/systemApi/types';
import { getBridge } from 'client/utils/clientTools';
import isAndroidTVNativePackageWithTTSApi from 'common/selectors/atvTTS';
import type StoreState from 'common/types/storeState';

import systemApi from './index';

// note that hybrid apps do not count as having an "exit function", though they do have an "exit API"
// This fn purely tests if there is a defined `exitFunc` on systemApi for the current platform.
// Use `hasExitApi()` instead if you want to check if the current platform supports programmatic exit.
export const hasExitFunction = (): boolean => !!systemApi.exit;

// Hybrid apps above a certain build version can also exit programmatically.
export const hasExitApi = (): boolean => hasExitFunction() || __IS_HYB_APP__;

/**
 * If platform supports programmatic exit, returns a function that can be used to do so.
 * NOTE we use a IIFE here to make sure we don't create new exit function every time
 *
 * @requires hasExitApi() === true
 * @return {Function} A function to cause the app to exit.
 */
export const getExitFunction = (() => {
  const hybridAppExitFunction = (state: StoreState): void => {
    /* istanbul ignore next */
    const bridge = getBridge({ debug: !__PRODUCTION__ || __IS_ALPHA_ENV__ });
    if (isAndroidTVNativePackageWithTTSApi(state)) {
      // On Android TV, any text currently in the middle of being spoken will continue
      // after the app closes. This is not what we want, so we disable TTS to stop any
      // synthesized speech currently in progress.
      bridge.callHandler('ttsEnable', { tts_enabled: false });
    }
    bridge.callHandler('exitAppToDeviceHome');
  };

  const defaultExitFunction = (): void => {};

  return (): (state: StoreState) => void => {
    if (systemApi.exit) return systemApi.exit;
    if (__IS_HYB_APP__) return hybridAppExitFunction;
    return defaultExitFunction;
  };
})();

export function splitSpeechSynthesisUtteranceContent(text: string, limit: number = 32767): string[] {
  // From the Speech API Spec: There may be a maximum length of the text, it may be limited to 32,767 characters.
  // https://wicg.github.io/speech-api/#utterance-attributes
  // So we need to split it into chunks of content <= 32,767 chars (or the supplied limit).
  let remaining = text;
  const chunks: string[] = [];
  while (remaining.length > limit) {
    let thisChunk = remaining.substring(0, limit);
    // Try a few different strategies to find the best place to break on, to create the most natural sounding speech.
    // We will use the first (best) one that applies.
    const possibleIndexes: number[] = [
      // Try to find the last period prior to the limit. This should be the end of a sentence, so the best place to stop.
      thisChunk.lastIndexOf('.') + 1,
      // If not, try to find the last space before the limit to at least break at the end of a word
      thisChunk.lastIndexOf(' '),
    ];
    const indexToBreakOn = possibleIndexes.find((index) => index > 0) ?? -1;
    if (indexToBreakOn > 0 && indexToBreakOn < limit) {
      thisChunk = thisChunk.substring(0, indexToBreakOn);
    }
    chunks.push(thisChunk.trim());
    remaining = remaining.substring(thisChunk.length);
  }
  chunks.push(remaining.trim());
  return chunks;
}

export function speakWithSpeechSynthesis(text: string, options?: TextToSpeechOptions) {
  const { speechSynthesis, SpeechSynthesisUtterance } = window;
  if (!__CLIENT__ || !speechSynthesis || !SpeechSynthesisUtterance) return;
  speechSynthesis.cancel();

  // From on-device testing on Samsung Four in the SF QA area, the maximum length of a string for a single
  // utterance appears to be 2,000 characters. Anything more than that, and nothing gets read aloud.
  // So we will split at around 1,500 characters just to be safe.
  // This is mainly needed for long contents like the Privacy Policy and Terms of Service.
  const splitContent = splitSpeechSynthesisUtteranceContent(text, 1500);
  splitContent.forEach((textChunk, idx) => {
    const speechSynthesisUtterance = new SpeechSynthesisUtterance(textChunk);
    // set onEnd callback for the last chunk
    if (idx === splitContent.length - 1 && options?.onEnd) {
      speechSynthesisUtterance.addEventListener('end', options.onEnd);
    }
    speechSynthesis.speak(speechSynthesisUtterance);
  });
}

/**
 * Check whether app is background
 * @returns {boolean}
 */
export function isAppHidden() {
  return systemApi.isAppHidden();
}

export function onVisibilityChange(callback: (isAppVisible: boolean) => void): () => void {
  systemApi.addListener('visibilitychange', callback);
  return () => systemApi.removeListener('visibilitychange', callback);
}

export function isNewTivoOSVersion() {
  return typeof window !== 'undefined' && !window.tivo;
}
