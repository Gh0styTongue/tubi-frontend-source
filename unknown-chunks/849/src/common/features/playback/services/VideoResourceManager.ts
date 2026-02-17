import { DrmKeySystem } from '@adrise/player';
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import uaParser from '@adrise/utils/lib/ua-parser';
import memoize from 'lodash/memoize';

import { supportHEVC } from 'client/features/playback/detection/hevc';
import { trackInvalidCDNResource, trackRestoreDRMLevelFromStorage, trackDRMLevelStorageExpired } from 'client/features/playback/track/client-log';
import { setLocalData, getLocalData, removeLocalData } from 'client/utils/localDataStorage';
import { SHOULD_FETCH_DATA_ON_SERVER } from 'common/constants/constants';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { HDCPVersion, VideoResource, VideoResourceType } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { getDebugLog } from 'common/utils/debug';

const log = getDebugLog('VideoResourceManager');
const RESOURCE_LEVEL_LOCAL_STORAGE_KEY = 'videoResourceManagerResourceUsed';
export const RESOURCE_STORAGE_EXPIRATION = 2;
const ONE_DAY = 24 * 3600 * 1000;
declare global {
  interface Window {
    DEBUG_VIDEO_RESOURCE_TYPES?: WebDebugVideoResourceLevel[];
  }
}

interface VideoResourceManagerOptions {
  drmKeySystem?: DrmKeySystem;
  isDRMSupported: boolean;
  videoResources: VideoResource[];
  rememberFallback?: boolean;
  resourceStorageExpiration?: number;
}

export interface VideoResourceAttributes {
  codec?: VIDEO_RESOURCE_CODEC;
  type: VideoResourceType;
  hdcp?: HDCPVersion;
  selected: boolean | undefined;
}

export interface VideoResourceLevel {
  drm: boolean;
  hdcp: boolean;
  resources: VideoResource[];
}

export interface VideoResourceCodecLevel {
  codec: VIDEO_RESOURCE_CODEC,
  resources: VideoResourceLevel[];
}

export enum WebDebugVideoResourceLevel {
  HDCP_V2_ERROR = 'HDCP_V2_ERROR',
  HDCP_V2 = 'HDCP_V2',
  HDCP_V1_ERROR = 'HDCP_V1_ERROR',
  HDCP_V1 = 'HDCP_V1',
  SD_ERROR = 'SD_ERROR',
  SD = 'SD',
  DEFAULT = 'DEFAULT',
}

export interface DrmLevel {
  drm?: boolean;
  hdcp?: boolean;
}

/**
 * expand HDCP level with error indicator,
 * when level number % 2 !== 0, it means error license url
 */
/* istanbul ignore next */
const getWebDebugVideoResourceLevelNumber = (value: WebDebugVideoResourceLevel): number | undefined => {
  switch (value) {
    case WebDebugVideoResourceLevel.HDCP_V2_ERROR:
      return 5;
    case WebDebugVideoResourceLevel.HDCP_V2:
      return 4;
    case WebDebugVideoResourceLevel.HDCP_V1_ERROR:
      return 3;
    case WebDebugVideoResourceLevel.HDCP_V1:
      return 2;
    case WebDebugVideoResourceLevel.SD_ERROR:
      return 1;
    case WebDebugVideoResourceLevel.SD:
      return 0;
    case WebDebugVideoResourceLevel.DEFAULT:
      return -1;
    default:
      return undefined;
  }
};

export const isDRMResource = (resource: VideoResource): boolean => !!resource.license_server;

export const isHDCPResource = (resource: VideoResource): boolean => resource.license_server ? resource.license_server.hdcp_version !== 'hdcp_disabled' : false;

export function getFeatureSwitchHDCPValue(key: string): {
  hdcp_version?: HDCPVersion,
  drm_token?: string,
} {
  if (__PRODUCTION__ && !__IS_ALPHA_ENV__) return {};
  switch (key) {
    case 'HDCP disabled, analog output enabled':
    case '0':
      return {
        hdcp_version: 'hdcp_disabled',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiZW5hYmxlZCIsImhkY3AiOiJkaXNhYmxlZCIsInByX3NlY3VyaXR5X2xldmVsIjoyMDAwLCJ3dl9zZWN1cml0eV9sZXZlbCI6MSwiZXhwIjoxNjExNDA4NTY5fQ.qoSil0BT35Pc7PhEtx7K_2GMCKq0YNwFZTv1cOc0ufA',
      };
    case 'HDCP v1, analog output cgms-a required':
    case '1':
      return {
        hdcp_version: 'hdcp_v1',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiY2dtc19yZXF1aXJlZCIsImhkY3AiOiJ2MSIsInByX3NlY3VyaXR5X2xldmVsIjoyMDAwLCJ3dl9zZWN1cml0eV9sZXZlbCI6MSwiZXhwIjoxNjExNDA4NDEyfQ.ger6q3UjkR195rQHoKkf-p0xJ3c-KotDPt-I-dDjMfY',
      };
    case 'HDCP v1, analog output disabled':
      return {
        hdcp_version: 'hdcp_v2',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiZGlzYWJsZWQiLCJoZGNwIjoidjEiLCJwcl9zZWN1cml0eV9sZXZlbCI6MjAwMCwid3Zfc2VjdXJpdHlfbGV2ZWwiOjEsImV4cCI6MTYxMTQwODgwN30.s8PwawuS4hvw0MNXdkl1wZEuT6cPEM-YyItcyPe8pWU',
      };
    case 'HDCP v2, analog output cgms-a required':
    case '2':
      return {
        hdcp_version: 'hdcp_v2',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiY2dtc19yZXF1aXJlZCIsImhkY3AiOiJ2MiIsInByX3NlY3VyaXR5X2xldmVsIjoyMDAwLCJ3dl9zZWN1cml0eV9sZXZlbCI6MSwiZXhwIjoxNjExNDA4NDg4fQ.3t3xAdtgi_hlPleHmmw0W4EY3D4CheKJ38eLmaxfG9U',
      };
    case 'HDCP v2, analog output disabled':
      return {
        hdcp_version: 'hdcp_v2',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiZGlzYWJsZWQiLCJoZGNwIjoidjIiLCJwcl9zZWN1cml0eV9sZXZlbCI6MjAwMCwid3Zfc2VjdXJpdHlfbGV2ZWwiOjEsImV4cCI6MTYxMTQwODkyNn0.vsMjLYc1RKBMsOJ3bE1bfa_aJ5tlgiyYuPYuH-W40-g',
      };
    case 'XBOXONE, development mode':
      return {
        hdcp_version: 'hdcp_disabled',
        drm_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbmFsb2dfb3V0IjoiZGlzYWJsZWQiLCJoZGNwIjoiZGlzYWJsZWQiLCJwcl9zZWN1cml0eV9sZXZlbCI6MTUwLCJ3dl9zZWN1cml0eV9sZXZlbCI6MSwiZXhwIjoxNjE2NzgzNDYzfQ.qC5nPDmPeF3A8dpt3zKgWZLYwx289_M3Hylw716PcQQ',
      };
    default:
      break;
  }
  return {};
}

export const matchDRMKeySystem = (resource: VideoResource, drmKeySystem: DrmKeySystem): boolean => {
  switch (drmKeySystem) {
    case DrmKeySystem.PlayReady:
      return resource.type.includes('playready');
    case DrmKeySystem.Widevine:
      return resource.type.includes('widevine');
    case DrmKeySystem.FairPlay:
      return resource.type.includes('fairplay');
    default:
      return false;
  }
};

/* istanbul ignore next */
const getWebDebugKeyLevels = (): WebDebugVideoResourceLevel[] | undefined => window.DEBUG_VIDEO_RESOURCE_TYPES;

/* istanbul ignore next */
const getCachedVideoResourceManagerCacheKey = (...args: unknown[]): string => {
  return JSON.stringify(args);
};

/* istanbul ignore next */
const getVideoResourceManager = (options: VideoResourceManagerOptions): VideoResourceManager => {
  options.rememberFallback = options.rememberFallback !== false;
  return new VideoResourceManager(options);
};

/* istanbul ignore next */
export const getCachedVideoResourceManager = __CLIENT__
  ? memoize(
    getVideoResourceManager,
    getCachedVideoResourceManagerCacheKey // use `JSON.stringify` to hash option object for comparing
  )
  : getVideoResourceManager;

export default class VideoResourceManager {
  private videoResourceCodecLevels: VideoResourceCodecLevel[];

  private videoResourceLevels: VideoResourceLevel[];

  private codecIndex: number = 0; // [H.265(optional), H.264, unknown]

  private DRMIndex: number = 0;

  private CDNIndex: number = 0; // for cdn fallback

  private rememberFallback: boolean = false;

  private resourceStorageExpiration: number = RESOURCE_STORAGE_EXPIRATION;

  private isUsingRememberValue: boolean = false;

  private ua = uaParser();

  isEmptyDueToDrmSupport?: boolean;

  constructor(options: VideoResourceManagerOptions) {
    this.videoResourceCodecLevels = this.createLevels(options);
    this.videoResourceLevels = this.videoResourceCodecLevels[this.codecIndex]?.resources ?? [];

    this.rememberFallback = FeatureSwitchManager.isDefault(['Player', 'RememberFallback'])
      ? !!options.rememberFallback : false;
    if (options.resourceStorageExpiration) {
      this.resourceStorageExpiration = options.resourceStorageExpiration;
    }
    if (this.rememberFallback) {
      log('rememberFallback resourceStorageExpiration: ', this.resourceStorageExpiration);

      const defaultLevel = this.readResourceLevelFromStorage();
      this.resetDRMIndexFromDefaultLevel(defaultLevel);
    }
  }

  /**
   * We do codec fallback in three cases
   * 1. SSR: HEVC resources are provided in SSR, but not supported by client
   * 2. DRM: HEVC_DRM is supported by safari on web only, otherwise we'll do codecfallback
   * 3. Platform: On platforms we don't support HEVC, including SONY and TIVO
   */
  checkCodecFallback() {
    /* istanbul ignore next */
    if (FeatureSwitchManager.isEnabled(['Player', 'HEVC']) || __SERVER__) return;
    // For the case of SSR (refresh player page),
    // We need to query hevc streams during server render,
    // But client may not support hevc
    if (SHOULD_FETCH_DATA_ON_SERVER && !supportHEVC()) {
      this.codecFallback();
      return;
    }
    const resource = this.getCurrentDRMResource();
    // HEVC_DRM is only supported by safari on web
    /* istanbul ignore next */
    if (resource?.drm && __WEBPLATFORM__ && this.ua?.browser?.name !== 'Safari') {
      this.codecFallback();
      return;
    }
    /* istanbul ignore next */
    if (!__IS_HEVC_720P_SUPPORTED__) {
      // For SONY and TIVO
      // On SONY, we use hlsv3, but HEVC should be served over hlsv6
      // On TIVO, HEVC is supported by API, but fail to play with blackscreen
      this.codecFallback();
    }
  }

  /**
   * Return the current active resource
   */
  getCurrentResource(): VideoResource | undefined {
    if (FeatureSwitchManager.isEnabled(['Player', 'SimulateNoVideoResource'])) {
      return undefined;
    }

    if (this.getCurrentDRMResource()?.resources[0]?.codec === VIDEO_RESOURCE_CODEC.HEVC) {
      this.checkCodecFallback();
    }
    return this.getCurrentDRMResource()?.resources[0];
  }

  /**
   * Find the next valid resource and return it
   */
  fallback(options: {skipDRM?: boolean, changeCodec?: boolean} = { skipDRM: false }): VideoResource | undefined {
    if (options.changeCodec) {
      return this.codecFallback();
    }
    return this.DRMFallback(options);
  }

  codecFallback(drmIndex?: number): VideoResource | undefined {
    const fallbackVideoResourceLevels = this.videoResourceCodecLevels[this.codecIndex + 1]?.resources;
    if (!fallbackVideoResourceLevels) return undefined;
    this.codecIndex++;
    this.videoResourceLevels = fallbackVideoResourceLevels;
    const fallbackResourceLevel = this.getCurrentDRMResource(drmIndex);
    if (!fallbackResourceLevel) return undefined;
    return fallbackResourceLevel.resources[0];
  }

  DRMFallback(options: {skipDRM?: boolean, changeCodec?: boolean} = { skipDRM: false }): VideoResource | undefined {
    let drmIndex = this.DRMIndex;

    // If the remember value still trigger a fallback, then skip it and reset DRMIndex to 0
    if (this.isUsingRememberValue && this.DRMIndex > 0) {
      this.isUsingRememberValue = false;
      drmIndex = 0;
      removeLocalData(RESOURCE_LEVEL_LOCAL_STORAGE_KEY);
    } else {
      drmIndex++;
    }

    this.setCDNIndex(0);
    const fallbackResourceLevel = this.getCurrentDRMResource(drmIndex);
    if (!fallbackResourceLevel) {
      if (this.videoResourceCodecLevels[this.codecIndex]?.codec !== VIDEO_RESOURCE_CODEC.HEVC) return undefined;
      // Reset DRMIndex for two reasons: 1. Not sure if the index exists in AVC list, 2. Not sure if the same DRM error will happen on AVC resource.
      const resource = this.codecFallback(0);
      /* istanbul ignore next */
      if (resource) this.DRMIndex = 0;
      return resource;
    }
    this.DRMIndex = drmIndex;
    if (options.skipDRM && fallbackResourceLevel.drm) {
      return this.fallback({ skipDRM: true });
    }
    if (this.rememberFallback) {
      try {
        this.saveResourceLevel();
      } catch (e) {
        /* istanbul ignore next */
        log('save resource level failed', e);
      }
    }
    return fallbackResourceLevel.resources[0];
  }

  getVideoResourceAttributes(): VideoResourceAttributes[] {
    const attributesList: VideoResourceAttributes[] = [];
    this.videoResourceCodecLevels.forEach((codecLevel, codecIdx) => {
      codecLevel.resources.forEach(({ resources }, drmIdx) => {
        if (resources.length > 0) {
          const resource = resources[0];
          const hdcpValue = resource.license_server?.hdcp_version;
          attributesList.push({
            codec: resource.codec,
            type: resource.type,
            hdcp: hdcpValue,
            selected: this.codecIndex === codecIdx && this.DRMIndex === drmIdx ? true : undefined,
          });
        }
      });
    });
    return attributesList;
  }

  getAllCodecLevels(): VideoResourceCodecLevel[] {
    return this.videoResourceCodecLevels;
  }

  getAllLevels(): VideoResourceLevel[] {
    return this.videoResourceLevels;
  }

  getCDNIndex(): number {
    return this.CDNIndex;
  }

  setCDNIndex(index: number) {
    this.CDNIndex = index;
  }

  getDRMIndex(): number {
    return this.DRMIndex;
  }

  getCodecIndex(): number {
    return this.codecIndex;
  }

  private saveResourceLevel(): void {
    const currentLevel = this.getCurrentDRMResource();

    /* istanbul ignore next */
    if (!currentLevel
      || currentLevel.drm === undefined
      || currentLevel.hdcp === undefined) {
      return;
    }

    setLocalData(RESOURCE_LEVEL_LOCAL_STORAGE_KEY, JSON.stringify({
      drm: currentLevel.drm,
      hdcp: currentLevel.hdcp,
      time: +new Date(),
    }));
  }

  private readResourceLevelFromStorage(): DrmLevel {
    const savedLevelJson = getLocalData(RESOURCE_LEVEL_LOCAL_STORAGE_KEY);
    /* istanbul ignore else */
    if (savedLevelJson) {
      try {
        const savedLevel = JSON.parse(savedLevelJson);
        if (savedLevel?.time && new Date().getTime() < savedLevel.time + this.resourceStorageExpiration * ONE_DAY) {
          return savedLevel;
        }
        // remove expired saved level
        removeLocalData(RESOURCE_LEVEL_LOCAL_STORAGE_KEY);
        trackDRMLevelStorageExpired(savedLevel);
        return {};

      } catch (e) {
        /* istanbul ignore next */
        log('read resource level failed', e);
      }
    }
    /* istanbul ignore next */
    return {};
  }

  private resetDRMIndexFromDefaultLevel(defaultLevel: DrmLevel): void {
    /* istanbul ignore next */
    if (defaultLevel.drm === undefined || defaultLevel.hdcp === undefined) {
      return;
    }

    for (let i = this.codecIndex; i < this.videoResourceCodecLevels.length; i++) {
      const { resources } = this.videoResourceCodecLevels[i];
      /* istanbul ignore next */
      if (!(resources?.length > 0)) continue;
      for (let j = 0; j < resources.length; j++) {
        if (resources[j].drm === defaultLevel.drm
          && resources[j].hdcp === defaultLevel.hdcp) {
          this.codecIndex = i;
          this.DRMIndex = j;
          this.isUsingRememberValue = true;
          this.videoResourceLevels = resources;
          trackRestoreDRMLevelFromStorage(defaultLevel);
          return;
        }
      }
    }
    log('DRM remember fallback fail');
  }

  getCurrentDRMResource(drmIndex?:number): VideoResourceLevel | undefined {
    if (drmIndex === undefined) drmIndex = this.DRMIndex;
    const currentResourceLevel = this.videoResourceLevels[drmIndex];
    return currentResourceLevel;
  }

  private preprocessVideoResources(videoResources: VideoResource[]): VideoResource[] {
    // return original video resource if production no matter what.
    if (__PRODUCTION__ && !__IS_ALPHA_ENV__) {
      return videoResources;
    }

    // return original video if it's not client environment
    /* istanbul ignore next */
    if (typeof window === 'undefined') {
      return videoResources;
    }

    // web use a different debug process to manipulate video resources
    if (__WEBPLATFORM__) {
      return this.preprocessWebVideoResources(videoResources);
    }

    return this.preprocessOTTVideoResources(videoResources);
  }

  private preprocessWebVideoResources(videoResources: VideoResource[]): VideoResource[] {
    let debugKeyLevels = getWebDebugKeyLevels();

    if (!Array.isArray(debugKeyLevels)) {
      return videoResources;
    }

    const keyLevelsRange = Object.keys(WebDebugVideoResourceLevel);

    /* istanbul ignore next */
    if (debugKeyLevels.length > 0 && debugKeyLevels.some((v) => !keyLevelsRange.includes(v))) {
      log('debug video resource types must be in range of', keyLevelsRange, ', but applied value is', debugKeyLevels);
      debugKeyLevels = debugKeyLevels.filter((v) => keyLevelsRange.includes(v));
    }

    /* istanbul ignore next */
    if (debugKeyLevels.length === 0) {
      return videoResources;
    }

    const playreadyVideoResource = videoResources.find((v) => v.type === 'hlsv6_playready');
    const widevineVideoResource = videoResources.find((v) => v.type === 'hlsv6_widevine');
    const fairplayVideoResource = videoResources.find((v) => v.type === 'hlsv6_fairplay');
    const defaultVideoResource = videoResources.find((v) => v.type === 'hlsv3');

    const nextVideoResources: VideoResource[] = [];

    // make the debug list from high index to low index
    const debugValues: number[] = debugKeyLevels
      .map((v) => getWebDebugVideoResourceLevelNumber(v))
      .filter((v): v is number => typeof v === 'number');
    debugValues.sort((p, n) => n - p);

    for (const debugValue of debugValues) {
      const hdcpVersion = debugValue >= 0 ? Math.round((debugValue + 1) / 2) - 1 : -1;
      if (hdcpVersion >= 0) {
        const resources = [playreadyVideoResource, widevineVideoResource, fairplayVideoResource].filter(Boolean) as VideoResource[];
        for (const resource of resources) {
          const { hdcp_version, drm_token } = getFeatureSwitchHDCPValue(`${hdcpVersion}`);
          nextVideoResources.push({
            ...resource,
            license_server: {
              ...resource.license_server!,
              // The hdcpVersion has been filtered before
              hdcp_version: hdcp_version as HDCPVersion,
              // debugValue % 2 === 0 means no error, debugValue % 2 === 1 means error license url.
              url: debugValue % 2 !== 0 ? 'https://example.com' : addQueryStringToUrl(resource.license_server!.url, { drm_token }),
            },
          });
        }
      } else {
        if (defaultVideoResource) {
          nextVideoResources.push({
            ...defaultVideoResource,
          });
        }
      }
    }

    return nextVideoResources;
  }

  /**
   * Preprocess the original video resources according to feature switch settings
   * in order to help development efficiently
   */
  private preprocessOTTVideoResources(videoResources: VideoResource[]): VideoResource[] {
    let resources = [...videoResources];

    // Modify HDCP level of the first DRM resource if specified in feature switch
    if (!FeatureSwitchManager.isDefault(['DRM', 'HDCP']) && resources[0] && isDRMResource(resources[0])) {
      const { hdcp_version, drm_token } = getFeatureSwitchHDCPValue(FeatureSwitchManager.get(['DRM', 'HDCP'])?.toString());
      const licenseServer = resources[0].license_server!;
      licenseServer.url = addQueryStringToUrl(licenseServer.url, { drm_token });
      if (hdcp_version) licenseServer.hdcp_version = hdcp_version;
    }

    // Insert a DRM w/o HDCP resource after the only and very first DRM resource
    if (FeatureSwitchManager.get(['DRM', 'Fallback']) === 'drm-sd') {
      const drmResources = resources.filter(isDRMResource);
      if (drmResources.length > 0) {
        const { hdcp_version, drm_token } = getFeatureSwitchHDCPValue('0');
        resources = [
          drmResources[0],
          {
            ...drmResources[0],
            license_server: {
              ...resources[0].license_server!,
              url: addQueryStringToUrl(resources[0].license_server!.url, { drm_token }),
              // The hdcp is 0 here, so there must be a legal hdcp version
              hdcp_version: hdcp_version as HDCPVersion,
            },
          },
        ];
      }
    }

    return FeatureSwitchManager.isDisabled(['DRM', 'Fallback']) ? resources.slice(0, 1) : resources;
  }

  private normalizeResourceLevel(levels: VideoResourceLevel[]) {
    if (!levels[0]) return levels;
    const length = levels[0].resources.length;
    const result = [levels[0]];
    let hasInvalidCDNResource = false;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] && levels[i].resources.length === length) {
        result.push(levels[i]);
      } else {
        hasInvalidCDNResource = true;
      }
    }
    if (hasInvalidCDNResource) {
      trackInvalidCDNResource(levels);
    }
    return result;
  }

  /**
   * Split the original video resources to different codecs:
   * - H.265/HEVC (optional)
   * - H.264/AVC
   */
  private createLevels(options: VideoResourceManagerOptions): VideoResourceCodecLevel[] {
    const { drmKeySystem, isDRMSupported, videoResources } = options;

    const codecResourceSet: Partial<Record<VIDEO_RESOURCE_CODEC, VideoResource[]>> = {};
    videoResources.forEach(item => {
      if (!item.codec) {
        item.codec = VIDEO_RESOURCE_CODEC.UNKNOWN;
      }
      (codecResourceSet[item.codec] ??= []).push(item);
    });

    const result: VideoResourceCodecLevel[] = [];
    [VIDEO_RESOURCE_CODEC.HEVC, VIDEO_RESOURCE_CODEC.AVC, VIDEO_RESOURCE_CODEC.UNKNOWN].forEach(codec => {
      const item = codecResourceSet[codec] as VideoResource[];
      if (item?.length > 0) {
        const resources = this.groupVideoResourceByDRM({ drmKeySystem, isDRMSupported, videoResources: item });
        if (resources.length > 0) {
          result.push({
            codec,
            resources,
          });
        }
      }
    });

    return result;
  }

  /**
   * Split the original video resources to several levels used for fallback strategy:
   * - DRM w/ HDCP
   * - DRM w/o HDCP
   * - non-DRM
   */
  private groupVideoResourceByDRM(options: VideoResourceManagerOptions): VideoResourceLevel[] {
    const { drmKeySystem, isDRMSupported, videoResources } = options;
    const resources = this.preprocessVideoResources(videoResources);

    // filter and format all resources
    const filteredWithDRM = resources
      .map((resource) => ({
        drm: isDRMResource(resource),
        hdcp: isHDCPResource(resource),
        resource,
      }))
      .filter((level) => {
        if (!isDRMSupported) {
          return !level.drm;
        }
        if (level.drm && typeof drmKeySystem !== 'undefined') {
          return matchDRMKeySystem(level.resource, drmKeySystem);
        }
        return true;
      });

    this.isEmptyDueToDrmSupport = filteredWithDRM.length === 0 && resources.length > 0 && (!isDRMSupported || drmKeySystem === DrmKeySystem.Invalid);

    // group resources according to drm and hdcp
    const result: VideoResourceLevel[] = [];
    const hasSet: Record<string, number> = {};
    for (const cur of filteredWithDRM) {
      const key = `${cur.drm}${cur.hdcp}`;
      if (hasSet[key] === undefined) {
        hasSet[key] = result.length;
        result.push({
          drm: cur.drm,
          hdcp: cur.hdcp,
          resources: [],
        });
      }
      result[hasSet[key]].resources.push(cur.resource);
    }

    return this.normalizeResourceLevel(result);
  }
}
