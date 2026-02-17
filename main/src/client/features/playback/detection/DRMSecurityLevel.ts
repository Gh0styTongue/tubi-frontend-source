import systemApi from 'client/systemApi';
import type { WidevineSecurityLevelResult } from 'client/systemApi/systemApi';

type KeySystems = 'com.widevine.alpha' | 'com.microsoft.playready';

export const WIDEVINE = 'com.widevine.alpha';
export const PLAYREADY = 'com.microsoft.playready';
const NewPlayReadyKeySystem = 'com.microsoft.playready.recommendation';
const NewPlayReadyKeySystemInWindowsEdge10 = 'com.microsoft.playready.recommendation.3000';

type WidevineRobustnessLevel =
  'SW_SECURE_CRYPTO' | 'SW_SECURE_DECODE' // L3
  | 'HW_SECURE_CRYPTO' // L2
  | 'HW_SECURE_DECODE' | 'HW_SECURE_ALL'; // L1

type PlayReadyRobustnessLevel = '150' | '2000' | '3000';

type SecurityLevel = {
  audioRobustness: WidevineRobustnessLevel | PlayReadyRobustnessLevel,
  videoRobustness: WidevineRobustnessLevel | PlayReadyRobustnessLevel,
};

type Capabilities = { contentType: string; robustness?: string };

const AudioCodecs = ['audio/mp4;codecs="mp4a.40.2"'];

const VideoCodecs = [
  'video/mp4;codecs="hvc1.1.6.L63.90"',
  'video/mp4;codecs="hvc1.1.6.L90.90"',
  'video/mp4;codecs="hvc1.1.6.L93.90"',
  'video/mp4;codecs="avc1.4d401e"',
  'video/mp4;codecs="avc1.640028"',
];

export const WIDEVINE_ROBUSTNESS_RULE : {
  [key: string] : SecurityLevel | undefined
} = {
  L3: {
    audioRobustness: 'SW_SECURE_CRYPTO',
    videoRobustness: 'SW_SECURE_CRYPTO',
  },
  L2: {
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_CRYPTO',
  },
  L1: {
    /**
     * It is recommended by  https://github.com/shaka-project/shaka-player/issues/4013#issuecomment-1062008944
     * And you can view chromium source to check the limit max robustness https://source.chromium.org/chromium/chromium/src/+/main:components/cdm/renderer/key_system_support_update.cc;l=391;bpv=0;bpt=0?q=max_audio_robustness&ss=chromium%2Fchromium%2Fsrc
     */
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_DECODE',
  },
  L1_ALL: {
    audioRobustness: 'HW_SECURE_CRYPTO',
    videoRobustness: 'HW_SECURE_ALL',
  },
  NO_LEVEL: undefined,
};

export const PLAYREADY_ROBUSTNESS_RULE : {
  [key: string] : SecurityLevel | undefined
} = {
  SL150: {
    audioRobustness: '150',
    videoRobustness: '150',
  },
  SL2000: {
    audioRobustness: '2000',
    videoRobustness: '2000',
  },
  SL3000: {
    audioRobustness: '2000',
    videoRobustness: '3000',
  },
  NO_LEVEL: undefined,
};

const isEdgeBrowser = ():boolean => {
  return /Edg/.test(navigator.userAgent);
};

const buildKeySystemConfigurations = (securityLevel: SecurityLevel | undefined) => {
  const baseConfig: {
    audioCapabilities: Capabilities[];
    videoCapabilities: Capabilities[];
  } = {
    audioCapabilities: [],
    videoCapabilities: [],
  };

  AudioCodecs.forEach((value) => {
    const audioCapability: Capabilities = {
      contentType: value,
    };
    audioCapability.robustness = securityLevel ? securityLevel.audioRobustness : undefined;
    baseConfig.audioCapabilities.push(audioCapability);
  });

  VideoCodecs.forEach((value) => {
    const videoCapability: Capabilities = {
      contentType: value,
    };
    videoCapability.robustness = securityLevel ? securityLevel.videoRobustness : undefined;
    baseConfig.videoCapabilities.push(videoCapability);
  });

  return [baseConfig];
};

export function checkDRMSecurityLevel(keySystems: KeySystems, securityLevel: SecurityLevel | undefined) {
  if (
    typeof navigator === 'object' &&
    typeof navigator.requestMediaKeySystemAccess === 'function'
  ) {
    const config = buildKeySystemConfigurations(securityLevel);
    if (securityLevel?.videoRobustness === '3000') {
      return navigator.requestMediaKeySystemAccess(isEdgeBrowser() ? NewPlayReadyKeySystemInWindowsEdge10 : NewPlayReadyKeySystem, config);
    }
    return navigator.requestMediaKeySystemAccess(keySystems, config);
  }

  const error = new Error('requestMediaKeySystemAccess not available');
  return Promise.reject(error);
}

export const checkNativeBridgeDRMSecurityLevelResult = async (): Promise<WidevineSecurityLevelResult> => {
  return await systemApi.getWidevineSecurityLevel?.() ?? 'unknown';
};

export const autoCheckDRMSecurityLevel = async (): Promise<{[x:string]: true | string}> => {
  const results: {[x:string]: true | string} = {};
  const widevineCheckPromiseArr = Object.keys(WIDEVINE_ROBUSTNESS_RULE).map(key => {
    return checkDRMSecurityLevel(WIDEVINE, WIDEVINE_ROBUSTNESS_RULE[key]).then(() => {
      results[`WV${key}`] = true;
    }).catch(() => {});
  });
  const playreadyCheckPromiseArr = Object.keys(PLAYREADY_ROBUSTNESS_RULE).map(key => {
    return checkDRMSecurityLevel(PLAYREADY, PLAYREADY_ROBUSTNESS_RULE[key]).then(() => {
      results[`PR${key}`] = true;
    }).catch(() => {});
  });

  results.NativeWideVineTest = await checkNativeBridgeDRMSecurityLevelResult();

  await Promise.all([
    ...widevineCheckPromiseArr,
    ...playreadyCheckPromiseArr,
  ]);

  return results;
};
