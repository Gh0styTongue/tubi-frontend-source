import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export function getHlsChunk(useHlsNext: boolean) {
  return (
    FeatureSwitchManager.isEnabled(['Player', 'HlsVersion'])
    || useHlsNext
  )
    // It's important to import files in the dist directly
    // because the package.json of hls.js has a module field which will indicates the webpack to use the esm version
    // and that's not what we want since it would break the code on some old browsers
    ? import(/* webpackChunkName: "hlsJSNext" */ '@adrise/hls.js-next/dist/hls.min.js')
    : import(/* webpackChunkName: "hlsJS" */'@adrise/hls.js/dist/hls.min.js');
}
