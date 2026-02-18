import { PLAYER_LOG_LEVEL } from '@adrise/player';
import { supportsLocalStorage } from '@adrise/utils/lib/localStorage';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import isEmpty from 'lodash/isEmpty';
import omitBy from 'lodash/omitBy';
import pick from 'lodash/pick';
import set from 'lodash/set';
import unset from 'lodash/unset';

import { getCookie, getLocalData, removeCookie, removeLocalData, setCookie, setLocalData } from 'client/utils/localDataStorage';
import { PROGRESSIVE_MODE, FIRETV_FLOAT_CUE_POINT_VALUE } from 'common/constants/experiments';
import platformHash from 'common/constants/platforms';
import { SKINS_AD_FEATURE_SWITCH_KEY } from 'common/features/skinsAd/constants';
import { VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';
import { SUPPORTED_LANGUAGE_LOCALE, SUPPORTED_COUNTRY_NAMES } from 'i18n/constants';

import onResetSelect from './featureSwitchConfig/exposureLogOverlay';
import type { TubiThunkDispatch } from '../types/reduxThunk';

const MAX_AGE = 365 * 24 * 3600; // 1 year
const __IS_PRODUCTION__ = __PRODUCTION__ && !__IS_ALPHA_ENV__;

type FeatureSwitchPrimitiveValue = string | number | boolean;
export type FeatureSwitchValue = FeatureSwitchPrimitiveValue | Record<string, FeatureSwitchPrimitiveValue>;
export enum TargetPlatform {
  OTT = 'OTT',
  WEB = 'WEB',
}
interface FeatureSwitchOptionBase {
  title: string; // text shown in the screen
  value: FeatureSwitchValue; // option value
}
interface FeatureSwitchValueOption extends FeatureSwitchOptionBase {
  onSelect?: never;
}
interface OnSelectParams {
  dispatch: TubiThunkDispatch;
}
interface FeatureSwitchSelectableOption extends FeatureSwitchOptionBase {
  onSelect(params: OnSelectParams): void | Promise<void>;
}
export type FeatureSwitchOptionOnSelect = FeatureSwitchSelectableOption['onSelect'];
export type FeatureSwitchOption = FeatureSwitchValueOption | FeatureSwitchSelectableOption;

export interface FeatureSwitchLeaf {
  // an identity to locate this particular switch
  key: string;
  // text shown in the screen, if not specified, display the `key` property as title
  title: string;
  description?: string; // a brief description on what the feature switch is used for
  // whether to save selected option in cookie, it takes no effect if its parent has cookie setting
  cookie?: boolean;
  // feature switch options
  options: FeatureSwitchOption[];
  targetPlatforms?: TargetPlatform[];
}

export interface FeatureSwitchContainer {
  key: string; // an identity to locate this particular switch
  title: string; // text shown in the screen, if not specified, display the `key` property as title
  description?: string; // a brief description on what the feature switch is used for
  cookie?: boolean; // whether save all children options in cookie
  children: FeatureSwitchLeaf[]; // nested feature switches
}

export type FeatureSwitch = FeatureSwitchContainer | FeatureSwitchLeaf;

type FeatureSwitchConfigItem = FeatureSwitch & {
  targetPlatforms: TargetPlatform[]; // which platform(s) the container should show on
};

type FeatureSwitchSetting = Record<string, string>;
export type FeatureSwitchSettings = Record<string, FeatureSwitchSetting | string>;
export type Path = string | string[];

export const DEFAULT_VALUE = 'default';
export const ENABLE_VALUE = 'enable';
export const DISABLE_VALUE = 'disable';
const S3_BUCKET_MOCK_AD_URL = 'tubi-web-dev-assets.s3.us-west-2.amazonaws.com/public/mock_ads';
const S3_BUCKET_MOCK_AD_HTTPS = `https://${S3_BUCKET_MOCK_AD_URL}`;
const S3_BUCKET_MOCK_AD_HTTP = `http://${S3_BUCKET_MOCK_AD_URL}`;
// Follow this instruction to create new mock ads in S3 bucket 'tubi-web-dev-assets'
// https://www.notion.so/tubi/Replace-Mocky-IO-0818cab621ab48fcb570567a89e34483
export const AD_MOCK_LIST = __IS_PRODUCTION__ ? {} : {
  EmptyAd: `${S3_BUCKET_MOCK_AD_HTTPS}/EmptyAd.json`,
  JsonSingleAd15s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonSingleAd15s.json`,
  JsonSingleAd30sHls: 'https://s3.us-west-2.amazonaws.com/web-static-assets.tubi.tv/mock_ads/JsonSingleAd30sHls.json',
  JsonSingleAd30s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonSingleAd30s.json`,
  JsonVerizon30s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonVerizon30s.json`,
  JsonMultiAd: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAd.json`,
  JsonMultiAdWithErrorField: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdWithErrorField.json`,
  JsonFiveAd: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonFiveAd.json`,
  JsonTwoAd30s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonTwoAd30s.json`,
  JsonMultiAdWithFetchBroken1: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdWithFetchBroken1.json`,
  JsonMultiAdWithFetchBroken2: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdWithFetchBroken2.json`,
  JsonMultiAdWithFetchBroken3: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdWithFetchBroken3.json`,
  BrokenAdPods: `${S3_BUCKET_MOCK_AD_HTTPS}/BrokenAdPods.json`,
  BrokenImpTracking: `${S3_BUCKET_MOCK_AD_HTTPS}/BrokenImpTracking.json`,
  XboxOneProblematicAd: `${S3_BUCKET_MOCK_AD_HTTPS}/XboxOneProblematicAd.json`,
  JsonWithWTA: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonWithWTA.json`,
  JsonSingleAd15sOnHttp: `${S3_BUCKET_MOCK_AD_HTTP}/JsonSingleAd15sOnHttp.json`,
  JsonSingleAdStall15s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonSingleAdStall15s.json`,
  JsonMultiAdStall: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdStall.json`,
  JsonSingleAdDelay15s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonSingleAdDelay15s.json`,
  JsonMultiAdDelay15s: `${S3_BUCKET_MOCK_AD_HTTPS}/JsonMultiAdDelay15s.json`,
  AdResponse500: 'https://httpstat.us/500?sleep=4250',
};

const PAUSE_AD_MOCK_LIST = __IS_PRODUCTION__ ? {} : {
  AdAvailable: `${S3_BUCKET_MOCK_AD_HTTPS}/AdAvailable.json`,
  NoAdAvailable: `${S3_BUCKET_MOCK_AD_HTTPS}/NoAdAvailable.json`,
};

// helper functions to remove verbosity
export const option = (title: string, value: FeatureSwitchValue = title): FeatureSwitchOption => ({ title, value });
export const defaultOption = (title: string = 'Default'): FeatureSwitchOption => option(title, DEFAULT_VALUE);
export const disableOption = (title: string = 'Disable'): FeatureSwitchOption => option(title, DISABLE_VALUE);
export const enableOption = (title: string = 'Enable'): FeatureSwitchOption => option(title, ENABLE_VALUE);

export function generateHDCPOptions() {
  if (__IS_PRODUCTION__) {
    return [];
  }
  const options: FeatureSwitchOption[] = [defaultOption(), option('HDCP disabled, analog output enabled')];
  for (let i = 1; i < 3; i++) {
    ['disabled', 'cgms-a required'].forEach((str) => {
      options.push(option(`HDCP v${i}, analog output ${str}`));
    });
  }
  if (__OTTPLATFORM__ === 'XBOXONE') {
    options.unshift(option('XBOXONE, development mode'));
  }
  return options;
}

export function generateVideoResourceTypeOptions() {
  if (__IS_PRODUCTION__) {
    return [];
  }
  const options: FeatureSwitchOption[] = [defaultOption()];
  let videoResources = Object.keys(platformHash).map((key) => {
    return platformHash[key].videoResourceTypes;
  });

  videoResources = [].concat.apply([], videoResources)
    .filter((val, index, self) => val && self.indexOf(val) === index);

  videoResources.forEach((resource) => {
    options.push(option(resource));
  });
  return options;
}

function generateMockAdsURLOptions() {
  if (__OTTPLATFORM__ === 'SONY') {
    // Only http ads URL are supported on SONY
    // Remember to use HTTP if you want to add new option
    // 1. Make sure the mocky url is HTTP
    // 2. Make sure the ads url in response (mp4) is HTTP
    return [
      option('JSON Single Ad 15s (HTTP)', AD_MOCK_LIST.JsonSingleAd15sOnHttp),
    ];
  }
  return [
    option('JSON Single Ad 15s (OTT)', AD_MOCK_LIST.JsonSingleAd15s),
    option('JSON Single Ad 30s MP4 (OTT)', AD_MOCK_LIST.JsonSingleAd30s),
    option('JSON Single Ad 30s HLS (OTT)', AD_MOCK_LIST.JsonSingleAd30sHls),
    option('JSON Verizon 30s (OTT)', AD_MOCK_LIST.JsonVerizon30s),
    option('JSON Multi Ads (OTT)', AD_MOCK_LIST.JsonMultiAd),
    option('JSON Multi Ads With Error Field (OTT)', AD_MOCK_LIST.JsonMultiAdWithErrorField),
    option('JSON Five Ads (OTT)', AD_MOCK_LIST.JsonFiveAd),
    option('JSON Two Ads 30s (OTT)', AD_MOCK_LIST.JsonTwoAd30s),
    option('JSON Multi Ads (OTT) With Fetch Broken 1', AD_MOCK_LIST.JsonMultiAdWithFetchBroken1),
    option('JSON Multi Ads (OTT) With Fetch Broken 2', AD_MOCK_LIST.JsonMultiAdWithFetchBroken2),
    option('JSON Multi Ads (OTT) With Fetch Broken 3', AD_MOCK_LIST.JsonMultiAdWithFetchBroken3),
    option('Broken Ad Pods', AD_MOCK_LIST.BrokenAdPods),
    option('Broken ImpTracking Ad', AD_MOCK_LIST.BrokenImpTracking),
    option('Xbox One Problematic Ad', AD_MOCK_LIST.XboxOneProblematicAd),
    option('Json Single Ad With WTA', AD_MOCK_LIST.JsonWithWTA),
    option('Json Single Ad 15s with Stall (OTT)', AD_MOCK_LIST.JsonSingleAdStall15s),
    option('Json Multi Ads with Stall (OTT)', AD_MOCK_LIST.JsonMultiAdStall),
    option('Json Single Ad delay 15s', AD_MOCK_LIST.JsonSingleAdDelay15s),
    option('Json Multi Ad delay 15s', AD_MOCK_LIST.JsonMultiAdDelay15s),
    option('Ad Response 500 ', AD_MOCK_LIST.AdResponse500),
    option('Empty Ad Pod', AD_MOCK_LIST.EmptyAd),
  ];
}

export const CUSTOM_TITLE = 'Custom URL - Remote Debugger';

export const streamURLOptions = __IS_PRODUCTION__ ? [] : [
  defaultOption(CUSTOM_TITLE),
  option('Live stream on apollo with ad tags', 'https://apollo.staging-public.tubi.io/live/bloomberg-originals.m3u8?device_id=wenjie_test1&content_id=571664&pub_id=0a2ada522f8db273c200b95eee98d316&platform=WEB&ap.pt=2'),
  option('AVC 4K 30fps 1h mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_avc_4k_30fps_1h.mp4'),
  option('AVC 4K 30fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_avc_4k_30fps_15min.mp4'),
  option('AVC 1080p 60fps 1h mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_avc_1080p_60fps_1h.mp4'),
  option('AVC 1080p 60fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_avc_1080p_60fps_15min.mp4'),
  option('AVC 1080p 50fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_avc_1080p_50fps_15min.mp4'),
  option('HEVC 4K 60fps 1h mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_4k_60fps_1h.mp4'),
  option('HEVC 4K 60fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_4k_60fps_15min.mp4'),
  option('HEVC 4K 50fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_4k_50fps_15min.mp4'),
  option('HEVC 1080p 60fps 1h mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_1080p_60fps_1h.mp4'),
  option('HEVC 1080p 60fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_1080p_60fps_15min.mp4'),
  option('HEVC 1080p 50fps 15min mp4', 'https://d1w8jr179abulj.cloudfront.net/complex_hevc_1080p_50fps_15min.mp4'),
  option('VP9 4K 60fps 1h webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_4k_60fps_1h.webm'),
  option('VP9 4K 60fps 15min webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_4k_60fps_15min.webm'),
  option('VP9 4K 50fps 15min webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_4k_50fps_15min.webm'),
  option('VP9 1080p 60fps 1h webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_1080p_60fps_1h.webm'),
  option('VP9 1080p 60fps 15min webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_1080p_60fps_15min.webm'),
  option('VP9 1080p 50fps 15min webm', 'https://d1w8jr179abulj.cloudfront.net/complex_vp9_1080p_50fps_15min.webm'),
  option(
    '4 Audio Track HLS HTTPS',
    'https://cloudfront.tubi-staging.video/test_content/four_audio_streams/test_multi_chans.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cDovL2Nsb3VkZnJvbnQudHViaS1zdGFnaW5nLnZpZGVvIiwiY291bnRyeSI6IlVTIiwiZGV2aWNlX2lkIjoiZGM3NjlmMzYtY2I2MC00ODYxLThmNDQtNmMxNTM4MzI2NDU1IiwiZXhwIjoxNzEwODY3NjYwLCJwbGF0Zm9ybSI6IldFQiIsInVzZXJfaWQiOjYzODMxNzk2fQ.Fvj2G_HzkjbrlRImG9YtHYe8CG5bAFivskhsYXbKJUk&manifest=true',
  ),
  option(
    '4 Audio Track DASH HTTP',
    'http://cloudfront.tubi-staging.video/test_content/four_audio_streams/test_multi_chans.mpd',
  ),
  option(
    '4 Audio Track DASH HTTPS',
    'https://cloudfront.tubi-staging.video/test_content/four_audio_streams/test_multi_chans.mpd',
  ),
  option(
    'Hlsv6 Single Bitrate HTTPS',
    'https://manifest.production-public.tubi.io/1e20ebc5-5a14-4430-a9f1-ca0af03eac43/cq5u7sddcz.mpd?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LTIyd2MudHViaS52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImJjODc0MjVmLTIxNzMtNDY4OC05Y2ZlLThkYzRiNDRiZGFjZSIsImV4cCI6MTY4MjgzMzIwMCwiZXhwZXJpbWVudCI6eyJuYW1lIjoidGl0YW5femV1c19wYWNrYWdlcl9leHBfMiIsIm5hbWVzcGFjZSI6InRpdGFuX3pldXNfcGFja2FnZXJfZXhwXzIiLCJ0cmVhdG1lbnQiOiJ6ZXVzX3BhY2thZ2VyIn0sInBsYXRmb3JtIjoiV0VCIiwidXNlcl9pZCI6MH0.yy1vL0XGtvcIvcbDdgxCxDjRXnqiFij4Zigwwuy5pH4&manifest=true',
  ),
  option(
    'Multiple Audio Track HLS',
    'https://cloudfront.tubi-staging.video/test_content/ad_test/test.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LnR1Ymktc3RhZ2luZy52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImRjNzY5ZjM2LWNiNjAtNDg2MS04ZjQ0LTZjMTUzODMyNjQ1NSIsImV4cCI6MTY3ODQ3ODUyNSwicGxhdGZvcm0iOiJST0tVIiwidXNlcl9pZCI6NjM4MzE3OTZ9.5VJjQNEkW1LDu1xyHmIcKTULVd6hVsV-DdU0XtNy2xg&manifest=true',
  ),
  option(
    'Multiple Audio Track HLS (4 tracks)',
    'http://cloudfront.tubi-staging.video/test_content/four_audio_streams/test_multi_chans.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cDovL2Nsb3VkZnJvbnQudHViaS1zdGFnaW5nLnZpZGVvIiwiY291bnRyeSI6IlVTIiwiZGV2aWNlX2lkIjoiZGM3NjlmMzYtY2I2MC00ODYxLThmNDQtNmMxNTM4MzI2NDU1IiwiZXhwIjoxNzEwODY3NjYwLCJwbGF0Zm9ybSI6IldFQiIsInVzZXJfaWQiOjYzODMxNzk2fQ.Fvj2G_HzkjbrlRImG9YtHYe8CG5bAFivskhsYXbKJUk&manifest=true',
  ),
  option(
    'HTTP Only Multiple Audio Track HLS',
    'http://cloudfront.tubi-staging.video/test_content/ad_test/test.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cDovL2Nsb3VkZnJvbnQudHViaS1zdGFnaW5nLnZpZGVvIiwiY291bnRyeSI6IlVTIiwiZGV2aWNlX2lkIjoiZGM3NjlmMzYtY2I2MC00ODYxLThmNDQtNmMxNTM4MzI2NDU1IiwiZXhwIjoxNzEwMjkyMjMxLCJwbGF0Zm9ybSI6IldFQiIsInVzZXJfaWQiOjYzODMxNzk2fQ.yELZGjtwd7QQeHjcLOu2tfemzxaRCD9N-gpT89YhmNQ&manifest=true',
  ),
  option(
    'Multiple Audio Track DASH',
    'http://cloudfront.tubi-staging.video/test_content/ad_test/test.mpd',
  ),
  option(
    'HLS VOD HEVC TS AES-128',
    'https://cloudfront.tubi-staging.video/test_content/aes_128_ts_h265/trailer2.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LnR1Ymktc3RhZ2luZy52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImRjNzY5ZjM2LWNiNjAtNDg2MS04ZjQ0LTZjMTUzODMyNjQ1NSIsImV4cCI6MTY3ODQ3ODUyNSwicGxhdGZvcm0iOiJST0tVIiwidXNlcl9pZCI6NjM4MzE3OTZ9.5VJjQNEkW1LDu1xyHmIcKTULVd6hVsV-DdU0XtNy2xg&manifest=true',
  ),
  option(
    'HLS Linear HEVC TS',
    'https://3860af3e8e3fbfdb.mediapackage.us-east-2.amazonaws.com/out/v1/8010648d3afb47379e9f5778ce9879ab/index.m3u8',
  ),
  option(
    'HLS VOD MUL-DRM SAMPLE-AES',
    'https://cloudfront.tubi-staging.video/test_content/multi_drm2/arthur_master.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LnR1Ymktc3RhZ2luZy52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImRjNzY5ZjM2LWNiNjAtNDg2MS04ZjQ0LTZjMTUzODMyNjQ1NSIsImV4cCI6MTY3ODQ3ODUyNSwicGxhdGZvcm0iOiJST0tVIiwidXNlcl9pZCI6NjM4MzE3OTZ9.5VJjQNEkW1LDu1xyHmIcKTULVd6hVsV-DdU0XtNy2xg&manifest=true'
  ),
  option(
    'HLS Linear FMP4 HEVC Widevine',
    'https://3860af3e8e3fbfdb.mediapackage.us-east-2.amazonaws.com/out/v1/ec7fb42b79bc44939ecf90485144dd05/h265_cmaf_test/index.m3u8'
  ),
  option(
    'HLS Linear FMP4 AVC Widevine',
    'https://3860af3e8e3fbfdb.mediapackage.us-east-2.amazonaws.com/out/v1/b7eb522ad5e94ffa9e90110694034905/widevine_test/index.m3u8'
  ),
  option(
    'HLS Linear 4K/1080p H265, 720P H264',
    'https://3860af3e8e3fbfdb.mediapackage.us-east-2.amazonaws.com/out/v1/f2141636cf844b5a9b3f250afff0775f/h265_cmaf_test/index.m3u8'
  ),
  option(
    'HLS VOD 4K H265/H264, 640PH 264',
    'https://cloudfront.tubi-staging.video/test_content/dennis/trailer.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LnR1Ymktc3RhZ2luZy52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImRjNzY5ZjM2LWNiNjAtNDg2MS04ZjQ0LTZjMTUzODMyNjQ1NSIsImV4cCI6MTY3ODQ3ODUyNSwicGxhdGZvcm0iOiJST0tVIiwidXNlcl9pZCI6NjM4MzE3OTZ9.5VJjQNEkW1LDu1xyHmIcKTULVd6hVsV-DdU0XtNy2xg&manifest=true'
  ),
  option(
    'DASH VOD 4K H265/H264, 640PH 264',
    'https://cloudfront.tubi-staging.video/test_content/dennis/trailer_full.mpd'
  ),
  option(
    'DASH VOD Only 4K H265',
    'https://cloudfront.tubi-staging.video/test_content/dennis/trailer_full_h265.mpd '
  ),
  option(
    'DASH VOD 4K H264',
    'https://cloudfront.tubi-staging.video/test_content/dennis/trailer_full_h264_4k.mpd'
  ),
  option(
    'DASH VOD 720P 264',
    'https://cloudfront.tubi-staging.video/test_content/dennis/trailer_full_h264_720p.mpd'
  ),
  option(
    'HLS Linear 4K H265',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_Linear_4K_H265.m3u8`,
  ),
  option(
    'HLS Linear 1080p H265',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_Linear_1080p_H265.m3u8`,
  ),
  option(
    'HLS Linear 720P H264',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_Linear_720P_H264.m3u8`,
  ),
  option(
    'HLS VOD 4K H265',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_VOD_4K_H265.m3u8`,
  ),
  option(
    'HLS VOD 4K H264',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_VOD_4K_H264.m3u8`,
  ),
  option(
    'HLS VOD 640PH 264',
    `${S3_BUCKET_MOCK_AD_HTTPS}/HLS_VOD_640PH_264.m3u8`,
  ),
  option(
    'Multiple channels HLS',
    'https://cloudfront.tubi-staging.video/test_content/prestige/multilang.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9jbG91ZGZyb250LnR1Ymktc3RhZ2luZy52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6ImRjNzY5ZjM2LWNiNjAtNDg2MS04ZjQ0LTZjMTUzODMyNjQ1NSIsImV4cCI6MTY3ODQ3ODUyNSwicGxhdGZvcm0iOiJST0tVIiwidXNlcl9pZCI6NjM4MzE3OTZ9.5VJjQNEkW1LDu1xyHmIcKTULVd6hVsV-DdU0XtNy2xg&manifest=true',
  ),
  option(
    'Big Buck Bunny - adaptive qualities',
    'https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8',
  ),
  option(
    'Fox Sports - Live Replay Enabled',
    'https://live-news-recorder.production-public.tubi.io/manifest/replay/613683',
  ),
  option(
    'ARTE China,ABR',
    'https://test-streams.mux.dev/test_001/stream.m3u8',
  ),
  option(
    'Ad-insertion in event stream',
    'https://test-streams.mux.dev/dai-discontinuity-deltatre/manifest.m3u8',
  ),
  option(
    'hls.js/issues/666',
    'https://test-streams.mux.dev/issue666/playlists/cisq0gim60007xzvi505emlxx.m3u8',
  ),
  option(
    'CNN special report, with CC',
    'https://playertest.longtailvideo.com/adaptive/captions/playlist.m3u8',
  ),
  option(
    'AES encrypted,ABR',
    'https://playertest.longtailvideo.com/adaptive/oceans_aes/oceans_aes.m3u8',
  ),
  option(
    'MP3 VOD demo',
    'https://player.webvideocore.net/CL1olYogIrDWvwqiIKK7eLBkzvO18gwo9ERMzsyXzwt_t-ya8ygf2kQBZww38JJT/8i4vvznv8408.m3u8',
  ),
  option(
    'MPEG Audio Only demo',
    'https://pl.streamingvideoprovider.com/mp3-playlist/playlist.m3u8',
  ),
  option(
    'MP4 VOD demo',
    'https://video-previews-cdn.production-public.tubi.io/videopreview/2a553b8d-293d-45a7-a161-335a2f380a04/2a553b8d-293d-45a7-a161-335a2f380a04-start0-end86_v2.mp4',
  ),
];

function generateAuthRemoteConfig(key: string) {
  return {
    key,
    title: key,
    options: [
      defaultOption(),
      option('undefined', 'undefined'),
      option('true', 'true'),
      option('false', 'false'),
    ],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  };
}

// NOTE we use PRODUCTION compilation variable many times in this manager file
// in order to avoid unnecessary dev purpose code in production env
const FEATURE_SWITCH_CONFIG: FeatureSwitchConfigItem[] = __IS_PRODUCTION__ ? [] : [
  {
    key: 'IntroAnimation',
    title: 'Intro Animation',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT],
    options: [defaultOption(), disableOption()],
  },
  {
    key: 'RTUImprovementTest',
    title: 'RTU Improvement Test',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT],
    options: [
      defaultOption(),
      option('Disable intro 10 min', 'disableIntro10Min'),
      option('Disable intro 10 min and loadhomescreen later', 'disableIntro10MinLoadHomescreenLater'),
    ],
  },
  {
    key: 'MockWatchInFullHDData',
    title: 'Mock Watch In Full HD Data',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT],
    options: [defaultOption(), enableOption()],
  },
  {
    key: 'LanguageLocale',
    title: 'Language Locale',
    description: 'Change the app language. It has no effect on the app\'s behavior. For example, features like the COPPA age-gate will not behave differently.',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [
      defaultOption(),
      ...Object.values(SUPPORTED_LANGUAGE_LOCALE).map((locale) => option(locale, locale)),
    ],
  },
  {
    key: 'Country',
    title: 'Country',
    description: 'Make the app behave as visiting from the selected country. It affects the UI and API responses from tubi backend but not external services. So, it cannot fully replace testing with a specific VPN region.',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [
      defaultOption(),
      ...Object.entries(SUPPORTED_COUNTRY_NAMES).map(([countryCode, countryName]) => option(countryName, countryCode)),
    ],
  },
  {
    key: 'mockPurpleCarpetData',
    title: 'Purple Carpet Mock Data',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [
      defaultOption(),
      option('Mock 2 Weeks Before', '2WeekBeforeGame'),
      option('Mock Day / Before(2 Hours)', '2HoursBeforeGame'),
      option('Mock Day / Before(2 Min)', '2MinBeforeGame'),
      option('Mock Day / During', 'duringGame'),
      option('Mock Day / During(1 Min Before End of Game)', '1MinBeforeEndOfGame'),
      option('Mock Day / After', 'afterGame'),
    ],
  },
  {
    key: 'forceEnablePurpleCarpetData',
    title: 'Force Enable Purple Carpet',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), enableOption(), disableOption()],
  },
  {
    key: 'forceEnableDisasterMode',
    title: 'Force Enable Disaster Mode',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), enableOption(), disableOption()],
  },
  {
    key: SKINS_AD_FEATURE_SWITCH_KEY,
    title: 'Mock Skins Ad',
    cookie: true,
    targetPlatforms: [TargetPlatform.OTT],
    options: [
      defaultOption(),
      option('Mock Moana', 'moana'),
    ],
  },
  {
    key: 'largerPoster',
    title: 'Lager Poster',
    targetPlatforms: [TargetPlatform.OTT],
    options: [defaultOption(), enableOption(), disableOption()],
  },
  {
    key: 'Experiments',
    title: 'Experiments setting',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), disableOption('Disable All Experiments')],
  },
  {
    key: 'ExposureLogOverlay',
    title: 'Exposure Log Overlay',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [
      defaultOption('Hidden'),
      enableOption('Visible (when there are exposures to show)'),
      {
        title: 'Reset Logged Exposures',
        value: 'RESET',
        onSelect: onResetSelect,
      },
    ],
  },
  {
    key: 'DRM',
    title: 'DRM',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'HDCP',
        title: 'HDCP',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: generateHDCPOptions(),
      },
      {
        key: 'Fallback',
        title: 'Fallback',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          disableOption('No Fallback'),
          option('DRM-SD w/o HDCP Fallback', 'drm-sd'),
        ],
      },
      {
        key: 'NativeCompatibility',
        title: 'Native Compatibility',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          enableOption('Support DRM'),
          disableOption('Not Support DRM'),
        ],
      },
      {
        key: 'WidevineSecurityLevel',
        title: 'DRM Security Level',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          option('Highest Widevine Security Level L1 All', 'L1_ALL'),
          option('High Widevine Security Level L1', 'L1'),
          option('High Widevine Security Level L2', 'L2'),
          option('Low Widevine Security Level L3', 'L3'),
          option('Low PlayReady Security Level 150', 'SL150'),
          option('High PlayReady Security Level 2000', 'SL2000'),
          option('High PlayReady Security Level 3000', 'SL3000'),
        ],
      },
    ],
  },
  {
    key: 'Player',
    title: 'Player',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'HlsVersion',
        title: 'Hls.js Version',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          enableOption('Next'),
          disableOption('Legacy'),
        ],
      },
      {
        key: 'DedicatedAdPlayer',
        title: 'Dedicated Ad Player',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          disableOption(),
          enableOption(),
        ],
      },
      {
        key: 'Info',
        title: 'Display Info',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'LogCaption',
        title: 'Log caption for debugging',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'Youbora',
        title: 'Youbora',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'Honeycomb',
        title: 'Honeycomb',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'Performance',
        title: 'Collect Performance Metric',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'VideoResourceType',
        title: 'Video Resource Type',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: generateVideoResourceTypeOptions(),
      },
      {
        key: 'RememberFallback',
        title: 'Remember fallback',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), disableOption('disable')],
      },
      {
        key: 'EnableHlsJS',
        title: 'Enable hls.js (Only work for the package player)',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          enableOption(),
          disableOption(),
        ],
      },
      {
        key: 'EnableReposition',
        title: 'Enable Reposition',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'HEVC',
        title: 'HEVC Video Resource',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'RESOLUTION',
        title: 'Video Resource Resolution',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('4K', VIDEO_RESOURCE_RESOLUTION.RES_4K),
          option('1080P', VIDEO_RESOURCE_RESOLUTION.RES_1080P),
          option('720P', VIDEO_RESOURCE_RESOLUTION.RES_720P),
        ],
      },
      {
        key: 'CrashDetection',
        title: 'Crash Detection',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'USE_WEB_WORKER',
        title: 'Use Hls.js Web Worker',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'PROGRESSIVE_MODE',
        title: 'Hls.js Progressive Mode',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('Disable', PROGRESSIVE_MODE.CONTROL),
          option('Enable when any speed and seeking', PROGRESSIVE_MODE.PROGRESSIVE_ANY_SPEED),
          option('Enable only when not slow speed and seeking', PROGRESSIVE_MODE.PROGRESSIVE_NORMAL_SPEED),
          option('Enable only when fast speed and seeking', PROGRESSIVE_MODE.PROGRESSIVE_FAST_SPEED),
        ],
      },
      {
        key: 'EnableMultipleAudio',
        title: 'Enable Multiple Audio',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'EnableGooglePALInAdRequest',
        title: 'Enable Google PAL In AdRequest',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'AvoidResumeWhileLivePaused',
        title: 'Avoid Resume Play While Live Player Paused',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'PlayerBufferBoost',
        title: 'Override Max Buffer Length',
        description: 'Only affects HLS.js playback; default is 60 sec on most platforms',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          // starting at 90, because 60 is the default
          // increase in increments of 30 going up to a max of 600
          ...Array.from({ length: 18 }).map((_, idx) => {
            const seconds = (idx + 1) * 30 + 60;
            return option(`${seconds}s`, seconds);
          }),
        ],
      },
      {
        key: 'AllowLinearPlaybackInBackground',
        title: 'Allow linear playback in background',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'AdNoBufferRecovery',
        title: 'Ad No Buffer Recovery',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), option('skip'), option('retry')],
      },
      {
        key: 'FloatCuePointMode',
        title: 'Float Cue Point Mode',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('control', FIRETV_FLOAT_CUE_POINT_VALUE.INTEGER_CUE_POINT),
          option('use_textTrack', FIRETV_FLOAT_CUE_POINT_VALUE.FLOAT_CUE_POINT_WITH_TEXT_TRACK),
          option('use_timeudpate', FIRETV_FLOAT_CUE_POINT_VALUE.FLOAT_CUE_POINT_WITH_TIMEUPDATE),
        ],
      },
      {
        key: 'DRMUseConfigInManifestFile',
        title: 'DRM Use Config In Manifest File',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          enableOption(),
        ],
      },
      {
        key: 'PreloadAds',
        title: 'PreloadAds',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('control', 'control'),
          option('preload_per_ad', 'preload_per_ad'),
          option('preload_per_ad_pod', 'preload_per_ad_pod'),
        ],
      },
      {
        key: 'SimulateNoVideoResource',
        title: 'Simulate No Video Resource',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          enableOption(),
        ],
      },
    ],
  },
  {
    key: 'Logging',
    title: 'Logging',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'ClientLog',
        title: 'Client Log',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'PlayerAnalyticsEvent',
        title: 'Player Analytics Event',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'Debug',
        title: 'Debug Log',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), option('Server Log', 'server')],
      },
      {
        key: 'ShowErrorOnPopcornPage',
        title: 'Show Error On Popcorn page',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'Player',
        title: 'Player Log',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          option('Adapter Level', PLAYER_LOG_LEVEL.ADAPTER_LEVEL),
          option('SDK Level', PLAYER_LOG_LEVEL.SDK_LEVEL),
        ],
      },
      {
        key: 'PlayerManager',
        title: 'Player Manager Log',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          enableOption('Enable All'),
          option('Visibility'),
          option('HDMI'),
          option('Offline'),
          option('AudioDescriptionModal'),
        ],
      },
      {
        key: 'PlayerVoiceCommand',
        title: 'Player\'s Voice Command',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          enableOption(),
        ],
      },
    ],
  },
  {
    key: 'LogAnalyticsAndTracking',
    title: 'LogAnalyticsAndTracking',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [
      defaultOption(),
      option('Console log the key event name and data', 'LogToConsole'),
      option('Add key event name query param to the logging report url', 'AddQueryParam'),
    ],
  },
  {
    key: 'Ad',
    title: 'Ad',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'Availability',
        title: 'Availability',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          disableOption('Disable All Ads'),
          option('Disable Preroll', 'noPreroll'),
          option('Disable odd-numbered ads', 'noOdd'),
          option('Disable even-numbered ads', 'noEven'),
          option('Disable Preroll by remove cue point', 'removeCuePoint0'),
        ],
      },
      {
        key: 'MockUrl',
        title: 'Mock Url',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [
          defaultOption(),
          ...generateMockAdsURLOptions(),
        ],
      },
      {
        key: 'AllTheAds',
        title: 'Show ads very often',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'IgnorePlayInterruptErr',
        title: 'Ignore Play Interrupt Error',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'Codec',
        title: 'Ad Codec',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('H264', 'H264'),
          option('H265', 'H265'),
        ],
      },
      {
        key: 'Resolution',
        title: 'Resolution',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('480P', '480P'),
          option('720P', '720P'),
        ],
      },
    ],
  },
  {
    key: 'VOD',
    title: 'VOD',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'MockUrl',
        title: 'Mock Url',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: streamURLOptions,
      },
    ],
  },
  {
    key: 'Preview',
    title: 'Preview',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'MockUrl',
        title: 'Mock Url',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: streamURLOptions,
      },
    ],
  },
  {
    key: 'PauseAds',
    title: 'Pause Ad',
    targetPlatforms: [TargetPlatform.OTT],
    children: [
      {
        key: 'Availability',
        title: 'Availability',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption(), disableOption()],
      },
      {
        key: 'Mock',
        title: 'Use Mock',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          defaultOption(),
          option('Ad available', PAUSE_AD_MOCK_LIST.AdAvailable),
          option('No ad available', PAUSE_AD_MOCK_LIST.NoAdAvailable),
        ],
      },
    ],
  },
  {
    key: 'Suitest',
    title: 'Suitest',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), enableOption()],
  },
  {
    key: 'mockSuitestLogin',
    title: 'Mock Suitest Login',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), disableOption()],
  },
  {
    key: 'LiveNews',
    title: 'Live News',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'CountdownForFullscreen',
        title: 'Countdown For Fullscreen',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), option('30s', 30), option('Disable', 99999)],
      },
      {
        key: 'FadeOutTimeForChannel',
        title: 'Fade Out Time For Channel',
        targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
        options: [defaultOption(), option('30s', 30000)],
      },
    ],
  },
  {
    key: 'VideoPreview',
    title: 'Video Preview',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    options: [defaultOption(), enableOption(), disableOption()],
  },
  {
    key: 'CategoryVideoPreview',
    title: 'Category Video Preview',
    targetPlatforms: [TargetPlatform.OTT],
    options: [defaultOption(), enableOption(), disableOption()],
  },
  {
    key: 'COPPA',
    title: 'COPPA',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    description: 'Disable COPPA v1, it avoids age-gating users who have no age set on their account.',
    cookie: true,
    options: [defaultOption(), disableOption()],
  },
  {
    key: 'COPPAExitKidsMode',
    title: 'COPPA Exit Kids Mode',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    description: 'Disable age-gate when users exit kids mode.',
    cookie: true,
    options: [defaultOption(), disableOption()],
  },
  {
    key: 'ForceLoginWithFlow',
    title: 'Force Login With Flow',
    targetPlatforms: [TargetPlatform.OTT],
    description: 'Force users to use specific flow to login.',
    options: [
      defaultOption('Disabled'),
      option('Activate', 'activate'),
      option('Amazon', 'amazon'),
      option('Google OneTap', 'googleOneTap'),
    ],
  },
  {
    key: 'BrandSpotlightMockData',
    title: 'Brand Spotlight Mock Data',
    targetPlatforms: [TargetPlatform.OTT],
    cookie: true,
    options: [
      defaultOption('Disabled'),
      option('Force "Reality TV" container to be sponsored', 'reality_tv'),
      option('Force the 3rd container from the top to be sponsored', 2),
      option('Force the 5th container from the top to be sponsored', 4),
    ],
  },
  {
    key: 'QaAnalyticsProxy',
    title: 'QA Analytics Proxy',
    targetPlatforms: [TargetPlatform.OTT],
    cookie: true,
    options: [defaultOption(), enableOption()],
  },
  {
    key: 'LandingPage',
    title: 'Landing Page',
    targetPlatforms: [TargetPlatform.OTT],
    cookie: true,
    options: [defaultOption(), disableOption()],
  },
  {
    key: 'MemoryUsageOverlay',
    title: 'Memory Usage Overlay',
    description: 'Show memory usage via all available APIs. After enabling, will be visible after next nav change. Documentation: https://tinyurl.com/tubiMemUsage. Poll interval is configurable; low values may impact performance. Need to refresh page to see changes to poll frequency.',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      {
        key: 'Availability',
        title: 'Availability',
        targetPlatforms: [TargetPlatform.OTT],
        options: [defaultOption(), enableOption()],
      },
      {
        key: 'PollFrequency',
        title: 'Poll Frequency',
        targetPlatforms: [TargetPlatform.OTT],
        options: [
          option('1000'),
          option('2000'),
          defaultOption('5000'),
          option('10000'),
        ],
      },
    ],
  },
  {
    key: 'HorizontalNavigationUpdates',
    title: 'Horizontal Navigation Updates',
    targetPlatforms: [TargetPlatform.OTT],
    description: 'Enable new horizontal navigation UX',
    options: [
      defaultOption(),
      enableOption(),
    ],
  },
  {
    key: 'UpdateTubiAppModal',
    title: 'Update Tubi App Modal',
    targetPlatforms: [TargetPlatform.OTT],
    description: 'Enable update Tubi App Modal check',
    options: [
      defaultOption(),
      enableOption(),
      disableOption(),
    ],
  },
  {
    key: 'FailsafeEndPoint',
    title: 'Switch Failsafe Endpoint',
    description: 'Switch Failsafe Endpoint',
    cookie: true,
    options: [
      defaultOption('-cdn'),
      option('-failsafe-aws-failover-dist'),
      option('-failsafe-aka-failover-dist'),
    ],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'force_failsafe',
    title: 'Force Failsafe Mode',
    description: 'When enabled, the web/ott proxy server will always respond with a 500 response code, forcing the CDN to serve the failsafe version of the app.',
    cookie: true,
    options: [defaultOption(), enableOption(), disableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'DelayedRegistration',
    title: 'Delayed Registration',
    description: 'When enabled, the /user/login and /user/signup endpoints will always return a 503 status with code ACCOUNT_PENDING_PROCESSING.',
    options: [defaultOption(), enableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'BypassRegistrationGate',
    title: 'Bypass Registration Gate',
    description: 'When enabled with Force Major Event, the app will skip the registration gate for Purple Carpet UIs.',
    cookie: true,
    options: [defaultOption(), enableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'ForceMajorEvent',
    title: 'Force Major Event',
    description: 'When enabled, we will ignore the remote config major_event_start and major_event_end times, and the app will always behave like a major event is active.',
    cookie: true,
    options: [defaultOption(), enableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'ForceMajorEventFailsafe',
    title: 'Force Major Event for failsafe',
    description: 'When enabled, we will ignore the remote config major_event_failsafe_start and major_event_failsafe_end times, and the app will always behave like a major event is active.',
    cookie: true,
    options: [defaultOption(), enableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'ForceMajorEventOnboarding',
    title: 'Force Major Event Onboarding',
    description: 'When enabled, we will ignore the remote config major_event_onboarding_start / major_event_onboarding_end times, and the app will always behave like a major event onboarding is active.\nThis is different from "Force Major Event" above. This is for onboarding only.\nThis is a US only feature.',
    cookie: true,
    options: [defaultOption(), enableOption()],
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
  },
  {
    key: 'RemoteConfig',
    title: 'Remote Config',
    description: 'Mock remote config values',
    targetPlatforms: [TargetPlatform.OTT, TargetPlatform.WEB],
    children: [
      'auth_comcast_email_prefill_enabled',
      'auth_google_onetap_enabled',
      'auth_login_with_amazon_enabled',
      'auth_magic_link_enabled',
      'auth_vizio_email_prefill_enabled',
    ].map(generateAuthRemoteConfig),
  },
];

export default class FeatureSwitchManager {
  static COOKIE_NAME = 'FeatureSwitchManager';

  static LOCAL_STORAGE_NAME = 'FeatureSwitchManager';

  static FEATURE_SWITCH_CONFIG = FEATURE_SWITCH_CONFIG;

  static DEFAULT_VALUE = DEFAULT_VALUE;

  static DISABLE_VALUE = DISABLE_VALUE;

  static ENABLE_VALUE = ENABLE_VALUE;

  static instance: FeatureSwitchManager;

  static AD_MOCK_LIST = AD_MOCK_LIST;

  /**
   * A function to filter FEATURE_SWITCH_CONFIG by platform
   */
  static getConfigListByPlatform(platform: TargetPlatform): FeatureSwitch[] {
    if (__IS_PRODUCTION__) return [];
    return FEATURE_SWITCH_CONFIG.reduce<FeatureSwitch[]>((a, e) => {
      if (e.targetPlatforms.some(p => p === platform)) {
        const obj = {
          ...e,
          children: (e as FeatureSwitchContainer).children && (e as FeatureSwitchContainer).children.filter(childrenItem => (childrenItem as FeatureSwitchConfigItem).targetPlatforms.some(p => p === platform)),
        };
        a.push(obj);
      }
      return a;
    }, []);
  }

  /**
   * A helper data retrieve function
   */
  static get(key: Path): FeatureSwitchValue {
    return (new FeatureSwitchManager()).get(key);
  }

  static isDefault(key: Path): boolean {
    return FeatureSwitchManager.get(key) === FeatureSwitchManager.DEFAULT_VALUE;
  }

  static isEnabled(key: Path): boolean {
    return FeatureSwitchManager.get(key) === FeatureSwitchManager.ENABLE_VALUE;
  }

  static isDisabled(key: Path): boolean {
    return FeatureSwitchManager.get(key) === FeatureSwitchManager.DISABLE_VALUE;
  }

  /**
   * A helper data storage function
   */
  static set(key: Path, value: FeatureSwitchValue) {
    (new FeatureSwitchManager()).set(key, value);
  }

  static setOnSelectParams(params: OnSelectParams): void {
    (new FeatureSwitchManager()).setOnSelectParams(params);
  }

  /**
   * A helper data storage function
   */
  static clear() {
    (new FeatureSwitchManager()).clear();
  }

  static isFeatureSwitchLeaf(config: FeatureSwitch): config is FeatureSwitchLeaf {
    return typeof (config as FeatureSwitchLeaf).options !== 'undefined';
  }

  static isFeatureSwitchContainer(config: FeatureSwitch): config is FeatureSwitchContainer {
    return typeof (config as FeatureSwitchContainer).children !== 'undefined';
  }

  static getConfig(key: Path): FeatureSwitch | undefined {
    if (__IS_PRODUCTION__) return;

    const path = Array.isArray(key) ? key : [key];
    const topConfig = FEATURE_SWITCH_CONFIG.find(item => item.key === path[0]);
    if (!topConfig) return;
    if (path.length === 1) return topConfig;
    if (!FeatureSwitchManager.isFeatureSwitchContainer(topConfig)) return;

    const leafConfig = topConfig.children.find(item => item.key === path[1]);
    if (leafConfig && FeatureSwitchManager.isFeatureSwitchLeaf(leafConfig)) return leafConfig;
  }

  private settings: FeatureSwitchSettings = {};

  private onSelectParams: OnSelectParams = { dispatch: () => { /* empty */ } };

  constructor() {
    if (FeatureSwitchManager.instance instanceof FeatureSwitchManager) return FeatureSwitchManager.instance;

    this.load();
    FeatureSwitchManager.instance = this;
  }

  get(key: Path): FeatureSwitchValue {
    if (__IS_PRODUCTION__) return FeatureSwitchManager.DEFAULT_VALUE;
    if (__SERVER__) {
      // Load latest settings on server side first to catch up possible changes made on client side
      this.load();
    }

    return get(this.settings, key, FeatureSwitchManager.DEFAULT_VALUE);
  }

  set(key: Path, value: FeatureSwitchValue) {
    if (__IS_PRODUCTION__) return;

    const leafConfig = FeatureSwitchManager.getConfig(key);
    if (!leafConfig) {
      throw new Error(`No such a feature switch ${key}`);
    }
    if (!FeatureSwitchManager.isFeatureSwitchLeaf(leafConfig)) {
      throw new Error(`Could not set value on feature switch container ${key}`);
    }
    const optionConfig = leafConfig.options.find(option => option.value === value);
    if (!optionConfig) {
      throw new Error(`No such option ${value} in feature switch ${key}`);
    }

    if (optionConfig.onSelect) {
      // if an option has an onSelect function defined, just call that instead of changing the value
      optionConfig.onSelect(this.onSelectParams);
      return;
    }

    if (value === FeatureSwitchManager.DEFAULT_VALUE) {
      unset(this.settings, key);
      this.settings = omitBy(this.settings, isEmpty);
    } else {
      set(this.settings, key, value);
    }
    this.save();
  }

  clear() {
    if (__IS_PRODUCTION__) return;

    removeCookie(FeatureSwitchManager.COOKIE_NAME);
    removeLocalData(FeatureSwitchManager.LOCAL_STORAGE_NAME);
    this.settings = {};
  }

  load() {
    if (__IS_PRODUCTION__) return;

    try {
      const localStorageData = __CLIENT__ ? JSON.parse(getLocalData(FeatureSwitchManager.LOCAL_STORAGE_NAME) || '{}') : {};
      // On server side, it has to run after React Cookie `plugToRequest` method to get valid Cookie settings
      const rawCookieData = getCookie(FeatureSwitchManager.COOKIE_NAME);
      const cookieData = (rawCookieData && JSON.parse(rawCookieData)) || {};

      this.settings = {
        ...localStorageData,
        ...cookieData,
      };
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.error('fail to load settings from local storage / cookie', ex);
    }
  }

  /**
   * Populate the parameters passed to the onSelect function for some options.
   * This is necessary because FeatureSwitchManager does not have access to the store or anything.
   */
  setOnSelectParams(params: OnSelectParams): void {
    this.onSelectParams = params;
  }

  private save() {
    if (__IS_PRODUCTION__) return;

    const topKeyList = Object.keys(this.settings);
    const storageGroups = supportsLocalStorage() ? groupBy(topKeyList, (key) => {
      const { cookie } = FeatureSwitchManager.getConfig(key) || {};
      return cookie ? 'cookie' : 'localStorage';
    }) : { cookie: topKeyList };

    if (isEmpty(storageGroups.cookie)) {
      removeCookie(FeatureSwitchManager.COOKIE_NAME);
    } else {
      setCookie(
        FeatureSwitchManager.COOKIE_NAME,
        JSON.stringify(pick(this.settings, storageGroups.cookie)),
        MAX_AGE
      );
    }

    if (isEmpty(storageGroups.localStorage)) {
      removeLocalData(FeatureSwitchManager.LOCAL_STORAGE_NAME);
    } else {
      setLocalData(FeatureSwitchManager.LOCAL_STORAGE_NAME, JSON.stringify(pick(this.settings, storageGroups.localStorage)));
    }
  }
}
