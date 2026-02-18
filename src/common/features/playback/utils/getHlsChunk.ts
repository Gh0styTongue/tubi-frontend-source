import type Hls from '@adrise/hls.js';
import { useCallback } from 'react';

import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { loadScript } from 'common/utils/dom';

export type getHlsChunkType = () => Promise<{ default: typeof Hls }>;

export function useHlsChunk() {
  // const useHlsNext = useAppSelector((state) => playerHlsNormalizationUpgradeSelector(state));
  const getHlsChunk: getHlsChunkType = useCallback(() => {
    const hlsFeatureSwitchVersion = FeatureSwitchManager.get(['Player', 'HlsVersion']) as string;
    if (/^http/.test(hlsFeatureSwitchVersion)) {
      if (window.Hls) {
        return Promise.resolve({ default: window.Hls });
      }
      return loadScript(hlsFeatureSwitchVersion).then(() => {
        return { default: window.Hls };
      });
    }
    return FeatureSwitchManager.isEnabled(['Player', 'HlsVersion'])
      ?
      // It's important to import files in the dist directly
      // because the package.json of hls.js has a module field which will indicates the webpack to use the esm version
      // and that's not what we want since it would break the code on some old browsers
      // the hls.js-next package is the target sdk for upgrade bundle;
      // if it is commented because there is no upgrade plan, if you want to try please update the `@adrise/hls.js-next` in package.json
      // import(/* webpackChunkName: "hlsJSNext" */ '@adrise/hls.js-next/dist/hls.min.js')
      import(/* webpackChunkName: "hlsJSNext" */ '@adrise/hls.js/dist/hls.min.js')
      : import(/* webpackChunkName: "hlsJS" */ '@adrise/hls.js/dist/hls.min.js');
  }, []);
  return {
    getHlsChunk,
  };
}
