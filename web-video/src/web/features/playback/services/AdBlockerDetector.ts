import { getDebugLog } from 'common/utils/debug';

declare global {
  interface Window {
    blockAdBlock: any;
  }
}

interface Options {
  debug?: boolean;
}

export default class AdBlockerDetector {
  // `js/ads.js` is in the EasyList
  static AD_BLOCK_BAIT_URL = 'https://mcdn.tubitv.com/js/ads.js';

  private options: Options;

  private log: (...args: any[]) => void;

  constructor(options: Options = {}) {
    this.options = options;
    this.log = options.debug ? getDebugLog('AdBlockerDetector') : () => {};
  }

  /**
   * We utilize two tools to detect more ad blockers which single tool could not.
   * It will return a promise instance with detection flag in the onFulfilled callback.
   * E.x.
   * ```typescript
   *   const detector = new AdBlockerDetector();
   *   detector.check().then((isAdBlockerDetected: boolean) => {
   *     if (isAdBlockerDetected) {
   *       // blabla
   *     }
   *   });
   * ```
   */
  async check(): Promise<boolean> {
    const result = await this.checkOnetime();
    if (result) {
      return result;
    }
    // The brave browser won't enable the AdBlock immediately. So we need to check again later, otherwise, we will misunderstand that there is no AdBlock.
    // @link https://github.com/adRise/www/pull/4827
    await new Promise(resolve => setTimeout(resolve, 10000));
    return this.checkOnetime();
  }

  private checkOnetime(): Promise<boolean> {
    return Promise.all([
      this.checkByBlockAdBlock(),
      this.checkByRequestBait(),
    ]).then((results) => results.some(Boolean));
  }

  /**
   * The first tool is BlockAdBlock, it uses DOM nodes with sensitive class names and properties as bait.
   */
  private checkByBlockAdBlock/* istanbul ignore next */(): Promise<boolean> {
    // Brave browser automatically assigns `window.blockAdBlock` an empty function, so we unset it here
    // @link https://github.com/adRise/www/pull/4821
    if (typeof window.blockAdBlock !== 'undefined' && typeof window.blockAdBlock.setOption !== 'function') {
      window.blockAdBlock = null;
      window.blockAdBlock = undefined;
    }
    // BlockAdBlock need run only in browser env, so put it here rather than the top level of module
    // @link https://github.com/sitexw/BlockAdBlock
    require('blockadblock');

    return new Promise((resolve) => {
      const blockAdBlock = window.blockAdBlock;
      // If the BlockAdBlock script isn't loaded, report as there is an ad blocker
      if (typeof blockAdBlock === 'undefined' || typeof blockAdBlock.setOption !== 'function') {
        this.log('BlockAdBlock script isn\'t loaded, it should be caused by ad blockers');
        resolve(true);
        return;
      }

      blockAdBlock.setOption({
        resetOnEnd: true,
        debug: false,
      });
      blockAdBlock.onDetected(() => resolve(true));
      blockAdBlock.onNotDetected(() => resolve(false));
      blockAdBlock.check();
    });
  }

  /**
   * The Second tool is a request matching EasyList used by popular ad blockers.
   */
  private checkByRequestBait(): Promise<boolean> {
    // `fetch` will only reject on network failure or if anything prevented the request from completing
    // See more in https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    return fetch(AdBlockerDetector.AD_BLOCK_BAIT_URL, { mode: 'no-cors' })
      .then(
        () => false,
        (error) => {
          this.log('Error happens when requesting bait', error);
          return true;
        },
      );
  }
}
