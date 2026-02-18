import systemApi from 'client/systemApi';
import platformHash from 'common/constants/platforms';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResourceType } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC, VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';

const getVideoResourceTypes = ({
  isPSSHv0Supported = true,
  androidTVUseHlsv6 = false,
  tizenUseHls = false,
}: {
  isPSSHv0Supported?: boolean;
  androidTVUseHlsv6?: boolean;
  tizenUseHls?: boolean;
}): VideoResourceType[] | undefined => {
  if (!FeatureSwitchManager.isDefault(['Player', 'VideoResourceType'])) {
    return [FeatureSwitchManager.get(['Player', 'VideoResourceType'])] as VideoResourceType[];
  }
  const targetPlatform = platformHash[__OTTPLATFORM__ || __WEBPLATFORM__];
  let videoResourceTypes = targetPlatform
    && ((isPSSHv0Supported ? targetPlatform.videoResourceTypes
      : targetPlatform.nonPSSHv0VideoResourceTypes)
      || targetPlatform.videoResourceTypes);

  if (videoResourceTypes && __IS_ANDROIDTV_HYB_PLATFORM__) {
    const filteredItem = androidTVUseHlsv6 ? 'hlsv3' : 'hlsv6';
    videoResourceTypes = videoResourceTypes.filter(item => item !== filteredItem);
  }

  if (__OTTPLATFORM__ === 'PS4') {
    // as of WebMAF 3.1.8 clearlead support logs that support is experimental
    return ['hlsv6_playready_nonclearlead', 'hlsv6'];
  }

  if (tizenUseHls) {
    return ['hlsv6_playready_psshv0', 'hlsv6'];
  }
  return videoResourceTypes;
};

const isHEVCEnabled = (enableHEVC?: boolean): Promise<boolean> => {
  if (typeof enableHEVC !== 'undefined') {
    return Promise.resolve(enableHEVC);
  }
  if (!FeatureSwitchManager.isDefault(['Player', 'HEVC'])) {
    return Promise.resolve(FeatureSwitchManager.isEnabled(['Player', 'HEVC']));
  }
  return systemApi.supportHEVC();
};

const getResolution = async (enable4K?: boolean): Promise<VIDEO_RESOURCE_RESOLUTION> => {
  if (!FeatureSwitchManager.isDefault(['Player', 'RESOLUTION'])) {
    return FeatureSwitchManager.get(['Player', 'RESOLUTION']) as VIDEO_RESOURCE_RESOLUTION;
  }
  const specialResolution = systemApi.getSpecialResolution();
  if (specialResolution) {
    return specialResolution;
  }
  const is4KSupported = enable4K ?? await systemApi.support4K();
  return is4KSupported ? VIDEO_RESOURCE_RESOLUTION.RES_4K : VIDEO_RESOURCE_RESOLUTION.RES_1080P;
};

const getLimitResolutions = async ({
  enableHEVC,
  enable4K,
}: {
  enableHEVC?: boolean,
  enable4K?: boolean,
}) => {
  const codec = await isHEVCEnabled(enableHEVC) ? VIDEO_RESOURCE_CODEC.HEVC : VIDEO_RESOURCE_CODEC.AVC;
  const resolution = await getResolution(enable4K);
  const result = [`${VIDEO_RESOURCE_CODEC.AVC}_${resolution === VIDEO_RESOURCE_RESOLUTION.RES_4K ? VIDEO_RESOURCE_RESOLUTION.RES_1080P : resolution}`];
  if (codec === VIDEO_RESOURCE_CODEC.HEVC) {
    result.push(`${codec}_${resolution}`);
  }
  return result.map(item => item.toLowerCase());
};

export const getVideoResourceQueryParameters = async ({
  isPSSHv0Supported,
  enableHEVC,
  enable4K,
  androidTVUseHlsv6,
  tizenUseHls,
}: {
  isPSSHv0Supported?: boolean;
  enableHEVC?: boolean;
  enable4K?: boolean;
  androidTVUseHlsv6?: boolean;
  tizenUseHls?: boolean;
} = {}) => {
  const videoResourceTypes = getVideoResourceTypes({
    isPSSHv0Supported,
    androidTVUseHlsv6,
    tizenUseHls,
  });
  const limitResolutions = await getLimitResolutions({
    enableHEVC,
    enable4K,
  });
  if (videoResourceTypes && videoResourceTypes.length) {
    return {
      limit_resolutions: limitResolutions,
      video_resources: videoResourceTypes,
    };
  }
  return {
    limit_resolutions: limitResolutions,
  };
};
