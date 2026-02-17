/* istanbul ignore file */
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import type { Listeners } from '@adrise/utils/lib/TypedEventEmitter';

import * as HEVCUtil from 'client/features/playback/detection/hevc';
import { exposeToTubiGlobal } from 'client/global';
import type { Error, FIRETV_MYLIST_ACTION, HybDeviceInfo, IamImpressionEvent, OnEnterDetailPageParameters, OnLeaveDetailPageParameters, TextToSpeechOptions, UpdateCWonDeviceParams } from 'client/systemApi/types';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';

import type { LGDeviceInfoType } from './lgtv';

export interface SystemAPIListeners extends Listeners {
  visibilitychange: (visible: boolean) => void;
  // Avoid Spell Issue
  onHDMIConnected: never;
  onHdmiConnected: (data: { hdmi_connection: boolean }) => void;
}

export type WidevineSecurityLevelResult = 'L1'| 'L2' | 'L3' | 'not_support' | 'detect_error' | 'unknown';

/**
 * list of methods potentially on our system apis.
 */
abstract class BaseSystemApi<L extends SystemAPIListeners = SystemAPIListeners> extends TypedEventEmitter<L> {
  constructor() {
    super();
    if (!__PRODUCTION__ || __IS_ALPHA_ENV__) {
      exposeToTubiGlobal({ systemApi: this });
    }
    this.bindVisibilityEvent();
  }

  /**
   * exit the app using the current system's API
   */
  exit?(): void;

  /**
   * get the app version of a platform
   */
  getNativeAppVersion?(): void;

  /**
   * get the system version or sdk version of a platform
   */
  getSystemVersion?(): string | undefined;

  /**
   * do any pre-app setup for certain platforms (set event listeners, read params off of API etc)
   * this is ALWAYS called in client/index.ts
   * @param dispatch
   * @param getState
   */
  init(_dispatch: TubiThunkDispatch, _getState: () => StoreState): void {}

  /**
   * do any cleanup of custom platform-specific event listeners or whatever.
   * only really called in tests, but good to have regardless.
   */
  dispose(): void {
    this.bindVisibilityEvent(true);
    // clean up all the listeners to the EventEmitter events
    this.removeAllListeners();
  }

  /**
   * some platforms require error logging
   */
  logError?(error: Error): void;

  /**
   * in the init method of some platforms, we will set an advertiserId
   */
  loadAdvertiserId?(): void;

  /**
   * used for accessibility purposes to read text aloud
   * @param text
   */
  textToSpeech?(text: string, options?: TextToSpeechOptions): void;

  /**
   * retrieving advertiser id and send them to rainmaker,
   * it could be different because of platform features.
   */
  getAdvertiserId(): string | undefined { return undefined; }

  getTivoPlatform(): string { return ''; }

  getTivoInfoForPersistedParams() { return {}; }

  /**
   * get advertiser opt out value and send to rainmaker
   */
  getAdvertiserOptOut?(): 0 | 1 | undefined { return undefined; }

  /**
   * get advertiser us privacy to send to rainmaker
   */
  getAdvertiserUSPrivacy?(): string | undefined { return undefined; }

  /**
   * get advertiser vauth to send to rainmaker
   */
  getAdvertiserVauth?(): string | undefined { return undefined; }

  /**
   * get advertiser code to send to rainmaker
   */
  /* istanbul ignore next */
  getAdvertiserCode?(): string | undefined { return undefined; }

  /**
   * retrieving zipcode from system and send them to rainmaker,
   * it could be different because of platform features.
   */
  getZipcode(): string | undefined { return undefined; }

  /**
   * Retrieving ad_attributes from comcast xclass and send it to rainmaker,
   * We should not get this information on other models.
   */
  getAdAttributes(): string | undefined { return undefined; }

  /**
   * retrieving partnerId from comcast and send it to rainmaker,
   * We should not get this information on other models.
   */
  getPartnerId?(): string | undefined { return undefined; }

  /**
   * retrieving mvpd from system and send them to rainmaker,
   * proprietary value unique to TiVO that they require
   */
  getMvpd(): string | undefined { return undefined; }

  /**
   * retrieving language from system and send them to rainmaker,
   * it could be different because of platform features.
   */
  getDeviceLanguage?(): string | void {}

  /**
   * retrieving device info about app launch timestamp
   */
  getDeviceInfo(): HybDeviceInfo | Promise<LGDeviceInfoType> | undefined { return undefined; }

  /**
   * Platforms such as FireTV would include multiple device types, such as TV, stick, cube, etc. This API tells us which type it is.
   */
  getDeviceType(): string | void {}

  /**
   * FireTV and Android TV provide this API to detect HDMI connection
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async getHDMIState(): Promise<boolean | void> {}

  /**
   * function to launch OTT device's app store
   */
  launchStore?(): void;

  /**
   * function to register global voice commands that can be called from any page
   * example: commands that direct user to different pages of our app, like redirect to playback page or search page
   */
  registerVoiceCommands?(dispatch: TubiThunkDispatch, getState?: () => StoreState): void;

  setNativePlayerStatus?(status: boolean): void;

  setMediaResourcePreloadStatus?<T extends boolean>(
    isEnterDetailPage: T,
    params: T extends true ? OnEnterDetailPageParameters : OnLeaveDetailPageParameters,
  ): void;

  updateCWonDevice(_params?: UpdateCWonDeviceParams): void {}

  addMouseCursorChangeEventListener(): void {}

  removeMouseCursorChangeEventListener(): void {}

  async support4KDisplay?(): Promise<boolean>;

  /* istanbul ignore next */
  support4KDecode(): Promise<boolean> {
    return Promise.resolve(false);
  }

  support4K(): Promise<boolean> {
    // We'll provide 4K stream once the device support 4K decoding, even 4K display is not supported, because 4K streams provide better video quality
    return this.support4KDecode();
  }

  getHEVCWhiteList(): string[] {
    return [];
  }

  getHEVCBlackList(): string[] {
    return [];
  }

  getSpecialResolution(): VIDEO_RESOURCE_RESOLUTION | null {
    return null;
  }

  /* istanbul ignore next */
  supportHEVC(): Promise<boolean> {
    const whiteList = this.getHEVCWhiteList();
    for (const item of whiteList) {
      if (window.navigator.userAgent.includes(item)) {
        return Promise.resolve(true);
      }
    }
    const blackList = this.getHEVCBlackList();
    for (const item of blackList) {
      if (window.navigator.userAgent.includes(item)) {
        return Promise.resolve(false);
      }
    }
    return Promise.resolve(HEVCUtil.supportHEVC());
  }

  // eslint-disable-next-line require-await
  async isHDMIConnected(): Promise<boolean> {
    return true;
  }

  isAppHidden(): boolean {
    const doc = document as (HTMLDocument & { webkitHidden?: boolean });
    return !!(doc.hidden || doc.webkitHidden);
  }

  reportWebViewReady(): void {}

  protected bindVisibilityEvent(remove = false) {
    /* istanbul ignore next */
    if (__SERVER__ && (!__TESTING__ || __IS_E2E_TEST__) || typeof document === 'undefined') return;
    document[remove ? 'removeEventListener' : 'addEventListener']('visibilitychange', this.triggerVisibilityChangeEvent);
  }

  protected triggerVisibilityChangeEvent = () => {
    // https://www.typescriptlang.org/play?#code/KYDwDg9gTgLgBASwHY2FAZgQwMbDgZQE8BnVAWwEEAFASQBkFTgk1i4BvAKDh7gG0A1sEIAuOKSjIA5nAA+4wmQBGEADYBdMQAoAdHsxQpxMZiSE+6gJRwAvAD44pwgG5uvAG6MEShKoQxCbAALUylgbU9ib1VwuBU1YFNrezh3CAQAE1cAX05OdABXJGwYBAgkOFRSAB46OFBUJAy2IiZKWgYmFihiABo4AFF6kEbmuCFCCHQ4OjstYHdmGDEB-r0dAyMxKgNMMmBUHtq+AfU7ay5eOGxy0jhVbd39w+JjgHJI719-QJCkMLeZ1s-BgUAKwHUriuNyQd1UAEZHlA9gdWNVWuRqPRGI1WHwPl4fH4AsFQsBAQ4bCCwRCcnlsKpMMQ2BRasNRi0SJiOjjmKxgRjgO1sV1WA5Lo4tBAlAArMR0C5uHgwuFIlEvd6fIk-Un-clAql8UHgyFK663eAItXPNGC4WdXE9fFa74kv4Ag3Uk1QuC5bJAA
    this.emit(
      'visibilitychange',
      // @ts-expect-error: type shouldn't be boolean
      !this.isAppHidden()
    );
  };

  /**
   * This goes back to chrome 37; fallback is in case UA doesn't
   * implement. May reportedly be incorrect as anti-fingerprinting measure
   * in some user agents.
   */
  getHardwareConcurrency(): number {
    // eslint-disable-next-line compat/compat
    return window?.navigator?.hardwareConcurrency ?? 0;
  }

  /**
   * Not supported in Firefox, Safari, possibly others. Thus, the fallback.
   */
  getDeviceMemory(): number {
    // @ts-expect-error: deviceMemory doesn't exist on navigator
    // eslint-disable-next-line compat/compat
    return window?.navigator?.deviceMemory ?? 0;
  }

  /**
   * Not supported in Firefox, Safari, possibly others. Thus, the fallback.
   * Deprecated but still available in Chrome.
   */
  getJsHeapSizeLimit(): number {
    // @ts-expect-error: memory does not exist on performance
    // eslint-disable-next-line compat/compat
    return window?.performance?.memory?.jsHeapSizeLimit ?? 0;
  }

  /**
   * Get the number of touch points. Useful for recognizing if we're on a
   * mobile device that is spoofing a desktop user agent
   */
  getMaxTouchPoints(): number {
    // eslint-disable-next-line compat/compat
    return window?.navigator?.maxTouchPoints ?? -1;
  }

  onSignIn(): void {}

  onSignOut(): void {}

  notifyKidsModeChangeEvent(_enabled: boolean): void {}

  notifyIamEvent(_data: IamImpressionEvent): void {}

  syncMyListOnDevice(): void {}

  updateMyListTitleOnDevice(_myListAction: FIRETV_MYLIST_ACTION, _contentId: string): void {}

  // getWidevineSecurityLevel?(): WidevineSecurityLevelResult { return 'unknown'; }
  getWidevineSecurityLevel?(): Promise<WidevineSecurityLevelResult> { return Promise.resolve('unknown'); }

  setDefaultCaptionStyleFromSystemSetting?(): void {}
}

export default BaseSystemApi;
