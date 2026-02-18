import type { VideoResourceType } from 'common/types/video';

// Make sure to keep both of these up to date to get proper type safety
export type PlatformLowercase = 'firetv_hyb' | 'androidtv' | 'sony' | 'tizen' |
  'comcast' | 'comcasthosp' | 'rogers' | 'cox' | 'tivo' | 'web' | 'ps5' | 'ps4' | 'vizio' |
  'xboxone' | 'hisense' | 'lgtv' | 'windows' | 'shaw' | 'verizontv' |
  'hilton' | 'directvhosp' | 'bridgewater' | 'netgem';

export type PlatformUppercase = 'FIRETV_HYB' | 'ANDROIDTV' | 'SONY' | 'TIZEN' |
  'COMCAST' | 'COMCASTHOSP' | 'ROGERS' | 'COX' | 'TIVO' | 'WEB' | 'PS5' | 'PS4' | 'VIZIO' |
  'XBOXONE' | 'HISENSE' | 'LGTV' | 'WINDOWS' | 'SHAW' | 'VERIZONTV' |
  'HILTON' | 'DIRECTVHOSP' | 'BRIDGEWATER' | 'NETGEM';

type PlatformItem = Readonly<{
  analytics: string;
  gaTrackerId?: string;
  rainmakerAlias: string;
  uapiAlias?: PlatformUapiAlias;
  videoMonitoringBrand?: string; // Device vendor name, more general than `videoMonitoringCode`
  videoMonitoringCode?: string; // If `videoMonitoringCode` is specified, it will rewrite info gotten from user agent
  videoResourceTypes?: VideoResourceType[];
  nonPSSHv0VideoResourceTypes?: VideoResourceType[];
  hlsV3VideoResourceTypes?: VideoResourceType[];
  shouldSupportFallbackForDRM?: boolean;
  errorReportingAlias?: string;
  useHTTP?: boolean; // whether the platform uses HTTP or HTTPS
  videoResourceTag?: string;
  showToUser: string;
}>;

export type PlatformUapiAlias = 'amazon' | 'samsung' | 'comcast' | 'hisense' | 'rogers' | 'web';

export type UapiPlatformType = Exclude<PlatformLowercase, 'firetv_hyb' | 'tizen' | 'rogers' | 'hisense'> | PlatformUapiAlias;

export type PlatformsType = {
  [k in PlatformLowercase]: UapiPlatformType;
};

type PlatformHash = Readonly<{
  [K in PlatformUppercase]: PlatformItem;
}>;

const platformHash: PlatformHash = {
  FIRETV_HYB: {
    analytics: 'tubitv-amazon', // platform string used for analytics
    errorReportingAlias: 'FTV',
    gaTrackerId: 'UA-49139204-33',
    rainmakerAlias: 'AMAZON',
    uapiAlias: 'amazon', // uapi knows firetv_hyb as amazon but we like calling it firetv_hyb :)
    videoMonitoringCode: 'FireTV',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    videoResourceTag: 'allow_drm_fallback_with_sw_secure', // indicate that handle non-hdcp resource with SW_SECURE_CRYPTO option for FTV
    shouldSupportFallbackForDRM: true,
    showToUser: 'Amazon',
  },
  ANDROIDTV: {
    analytics: 'tubitv-androidtv',
    errorReportingAlias: 'ATV',
    gaTrackerId: 'UA-49139204-22',
    rainmakerAlias: 'ANDROIDTV',
    videoMonitoringCode: 'AndroidTV',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv3', 'hlsv6'],
    nonPSSHv0VideoResourceTypes: ['hlsv6_widevine', 'hlsv3', 'hlsv6'],
    showToUser: 'Android',
  },
  SONY: {
    analytics: 'tubitv-sony',
    errorReportingAlias: 'SO',
    gaTrackerId: 'UA-49139204-12',
    rainmakerAlias: 'SONY',
    videoMonitoringCode: 'SonyBluray',
    useHTTP: true,
    videoResourceTypes: ['hlsv3'],
    showToUser: 'Sony',
  },
  TIZEN: {
    analytics: 'tubitv-samsung',
    errorReportingAlias: 'SA',
    gaTrackerId: 'UA-49139204-16',
    rainmakerAlias: 'SAMSUNG',
    uapiAlias: 'samsung',
    videoMonitoringCode: 'SamsungTizen',
    videoResourceTag: 'allow_drm_fallback_v2', // indicator for CCS team that this version has DRM support
    videoResourceTypes: ['dash_playready_psshv0'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Samsung',
  },
  COMCAST: {
    analytics: 'tubitv-comcast',
    errorReportingAlias: 'XC',
    gaTrackerId: 'UA-49139204-23',
    rainmakerAlias: 'COMCAST',
    videoMonitoringCode: 'ComcastXfinity',
    // Comcast supports Widevine DRM and fallback to hlsv6 for all
    // non-DRM titles and those DRM titles that fail to start playback
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Comcast',
  },
  COMCASTHOSP: {
    analytics: 'tubitv-comcasthosp',
    errorReportingAlias: 'XCH',
    gaTrackerId: 'UA-49139204-32',
    rainmakerAlias: 'COMCASTHOSP',
    // ComcastHosp supports Widevine DRM and fallback to hlsv6 for all
    // non-DRM titles and those DRM titles that fail to start playback
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'ComcastHosp',
  },
  COX: {
    analytics: 'tubitv-cox',
    errorReportingAlias: 'COX',
    gaTrackerId: 'UA-49139204-27',
    rainmakerAlias: 'COX',
    videoMonitoringCode: 'CoxContourTV',
    // Cox supports Widevine DRM and fallback to hlsv6 for all
    // non-DRM titles and those DRM titles that fail to start playback
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Cox',
  },
  ROGERS: {
    analytics: 'tubitv-rogers',
    errorReportingAlias: 'ROG',
    gaTrackerId: 'UA-49139204-34',
    rainmakerAlias: 'ROGERS',
    // Rogers no longer requests HLSv6 so the video team can run experiments on
    // different packagers
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Rogers',
  },
  TIVO: {
    analytics: 'tubitv-tivo',
    errorReportingAlias: 'TI',
    gaTrackerId: 'UA-49139204-13',
    rainmakerAlias: 'TIVO',
    videoMonitoringCode: 'Tivo_STB',
    videoResourceTypes: ['hlsv6_playready_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'TiVo',
  },
  WEB: {
    analytics: 'tubitv-web',
    gaTrackerId: 'UA-49139204-1',
    rainmakerAlias: 'WEB',
    errorReportingAlias: 'WEB',
    videoMonitoringBrand: 'Web',
    // prioritize non-clearlead widevine to prevent interruptions in playback since
    // the DRM would happen when reaching 2nd segment with clearlead resources
    videoResourceTypes: ['hlsv6_widevine_nonclearlead', 'hlsv6_playready_psshv0', 'hlsv6_fairplay', 'hlsv6'],
    showToUser: 'Web',
  },
  WINDOWS: {
    analytics: 'tubitv-windows',
    gaTrackerId: 'G-HT8YZ21K53',
    rainmakerAlias: 'WINDOWS',
    errorReportingAlias: 'WIN',
    videoMonitoringBrand: 'Windows',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6_playready_psshv0', 'hlsv6_fairplay', 'hlsv6'],
    showToUser: 'Windows',
  },
  PS5: {
    analytics: 'tubitv-ps5',
    errorReportingAlias: 'PS5',
    gaTrackerId: 'UA-49139204-39',
    rainmakerAlias: 'PS5',
    videoMonitoringCode: 'PS5',
    videoResourceTypes: ['hlsv6_playready_nonclearlead', 'hlsv6'],
    videoResourceTag: 'allow_drm_fallback', // Only allow those clients that pass this tag in the DRM experiment.
    shouldSupportFallbackForDRM: true,
    showToUser: 'PS5',
  },
  PS4: {
    analytics: 'tubitv-ps4',
    errorReportingAlias: 'PS4',
    gaTrackerId: 'UA-49139204-17',
    rainmakerAlias: 'PS4',
    videoMonitoringCode: 'Playstation4',
    videoResourceTypes: ['dash_playready_psshv0', 'dash'],
    videoResourceTag: 'allow_drm_fallback', // indicator for CCS team that this version has DRM support where you can use fallbacks
    shouldSupportFallbackForDRM: true,
    useHTTP: true,
    showToUser: 'PS4',
  },
  XBOXONE: {
    analytics: 'tubitv-xboxone',
    errorReportingAlias: 'XB',
    gaTrackerId: 'UA-49139204-26',
    rainmakerAlias: 'XBOXONE',
    videoMonitoringCode: 'XboxOne',
    videoResourceTypes: ['hlsv6_playready_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Xbox One',
  },
  VIZIO: {
    analytics: 'tubitv-vizio',
    gaTrackerId: 'UA-49139204-29',
    rainmakerAlias: 'VIZIO',
    errorReportingAlias: 'VIZ',
    videoMonitoringCode: 'Vizio',
    videoResourceTypes: ['hlsv6_widevine_nonclearlead', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'VIZIO',
  },
  HILTON: {
    analytics: 'tubitv-hilton',
    gaTrackerId: 'G-439F9CKRXZ',
    rainmakerAlias: 'HILTON',
    errorReportingAlias: 'HILTON',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv3', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Hilton',
  },
  HISENSE: {
    analytics: 'tubitv-hisense',
    uapiAlias: 'hisense',
    gaTrackerId: 'UA-49139204-31',
    rainmakerAlias: 'HISENSE',
    errorReportingAlias: 'HIS',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Hisense',
  },
  LGTV: {
    analytics: 'tubitv-lg',
    gaTrackerId: 'G-87MXKGYCS4',
    rainmakerAlias: 'LGTV',
    errorReportingAlias: 'LGTV',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'LG',
  },
  SHAW: {
    analytics: 'tubitv-shaw',
    gaTrackerId: 'UA-49139204-14',
    rainmakerAlias: 'SHAW',
    errorReportingAlias: 'SHAW',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Shaw',
  },
  VERIZONTV: {
    analytics: 'tubitv-verizontv',
    gaTrackerId: 'G-Y4295XWY1T',
    errorReportingAlias: 'VERIZONTV',
    rainmakerAlias: 'VERIZONTV',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Verizon',
  },
  DIRECTVHOSP: {
    analytics: 'tubitv-directvhosp',
    errorReportingAlias: 'DIRECTVHOSP',
    rainmakerAlias: 'DIRECTVHOSP',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'DirecTV Hospitality',
  },
  BRIDGEWATER: {
    analytics: 'tubitv-bridgewater',
    errorReportingAlias: 'BRIDGEWATER',
    rainmakerAlias: 'BRIDGEWATER',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Bridgewater',
  },
  NETGEM: {
    analytics: 'tubitv-netgem',
    errorReportingAlias: 'NETGEM',
    rainmakerAlias: 'NETGEM',
    videoResourceTypes: ['hlsv6_widevine_psshv0', 'hlsv6'],
    shouldSupportFallbackForDRM: true,
    showToUser: 'Netgem',
  },
};

export default platformHash;

/**
 * creating a platform constant based on the platformHash above
 * there are special cases where uapi knows a platform with a different name { firetv_hyb: 'amazon' }
 */
const platforms = {};

Object.keys(platformHash).forEach((key) => {
  const p = key.toLowerCase();
  platforms[p] = platformHash[key].uapiAlias || p;
});

export const PLATFORMS: PlatformsType = platforms as PlatformsType;

export function getRainmakerAlias() {
  const targetPlatform = platformHash[__OTTPLATFORM__ || __WEBPLATFORM__];

  if (targetPlatform) {
    return targetPlatform.rainmakerAlias;
  }

  if (__DEVELOPMENT__ && !targetPlatform) {
    throw new Error('no target platform found for rainmakerAlias.');
  }
}

export const SAMSUNG_CW_SUPPORT = {
  UG: 'universal guide',
  HOME: 'extended home screen',
};

export const DISABLE_INFINITE_BACK_LOOP = __OTTPLATFORM__ === 'ANDROIDTV';

export const ONE_BACK_CLICK_RETURN_TO_LIVE_TAB = __OTTPLATFORM__ === 'ANDROIDTV';
