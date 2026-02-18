import type Hls from '@adrise/hls.js';
import { type ExtensionConfig, type HlsExtensionConfig, isHlsExtensionConfig } from '@adrise/player';

import { MAX_LEAD_VIDEO_FRAG_LOAD_COUNT_OVER_AUDIO } from 'common/constants/constants';
import OTTMultiplePlatformsDecreasePrerollBufferStall from 'common/experiments/config/ottMultiplePlatformsDecreasePrerollBufferStall';
import { useExperiment as useExperimentV2 } from 'common/experimentV2';
import OTTPlayerAlwaysEmitEMEDestroyed from 'common/experimentV2/configs/ottPlayerAlwaysEmitEmeDestroyed';
import useExperiment from 'common/hooks/useExperiment';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResource } from 'common/types/video';
import hasTrailerValue from 'common/utils/hasTrailerValue';
import { isSamsung2017Or2018 } from 'common/utils/tizenTools';

import { useHlsChunk } from '../utils/getHlsChunk';
import { getPlayerExtensionConfig } from '../utils/getPlayerExtensionConfig';
import { getVideoProps } from '../utils/getVideoProps';
import type { VideoProps } from '../utils/getVideoProps';

export interface UseExtensionConfigProps {
  videoResource?: VideoResource;
  getVideoResource?: () => VideoResource | undefined;
  trailerId?: string | number;
  videoPreviewUrl?: string;
  forceHlsJS?: boolean;
  resumePos?: number;
  defaultBandWidthEstimate?: number;
  enableFrontBufferFlush?: boolean;
  forceClearMediaKeysAfterDetached?: boolean;
}

// this config is set to hls.js. And -1 could be the default config value of hls.js config https://github.com/video-dev/hls.js/blob/02e57367370c70fa1840a5e9b3c9faa87143cc0a/src/config.ts#L337
const DEFAULT_HLS_CONFIG_START_POSITION = -1;

function useExtensionConfig(props: UseExtensionConfigProps): ExtensionConfig {
  const {
    videoResource,
    trailerId,
    videoPreviewUrl,
    forceHlsJS,
    resumePos,
    defaultBandWidthEstimate,
    forceClearMediaKeysAfterDetached,
  } = props;
  const resource = videoResource;

  const isTrailer = hasTrailerValue(trailerId);
  const isVideoPreview = !!videoPreviewUrl;

  const mediaProps: VideoProps = getVideoProps(resource);
  const { hdcpVersion } = mediaProps;
  const isDrmContent = !isTrailer && !isVideoPreview && !!(mediaProps.licenseUrl);

  const ottMultiplePlatformsDecreasePrerollBufferStall = useExperiment(OTTMultiplePlatformsDecreasePrerollBufferStall);
  const alwaysEmitEMEDestroyed = useExperimentV2(OTTPlayerAlwaysEmitEMEDestroyed).get('always_emit_destroyed');

  const maxLeadVideoFragLoadCountOverAudio = __OTTPLATFORM__ === 'FIRETV_HYB' ? MAX_LEAD_VIDEO_FRAG_LOAD_COUNT_OVER_AUDIO : undefined;

  const shouldReportBufferChange = isVideoPreview || FeatureSwitchManager.isEnabled(['Player', 'Info']);

  const startPosition = (resumePos && resumePos > 0) ? resumePos : DEFAULT_HLS_CONFIG_START_POSITION;

  const extensionConfig: ExtensionConfig = getPlayerExtensionConfig({
    isDrmContent,
    hdcpVersion,
    forceHlsJS,
    shouldReportBufferChange,
    startPosition,
    enableWorker: isSamsung2017Or2018(),
    abrEwmaDefaultEstimate: defaultBandWidthEstimate,
    maxLeadVideoFragLoadCountOverAudio,
    forceClearMediaKeysAfterDetached,
    deprecateFilterDrmKeySystemWithConfig: false,
  });

  if (ottMultiplePlatformsDecreasePrerollBufferStall.getValue()) {
    (extensionConfig as HlsExtensionConfig).relyOnAutoplayAttribute = true;
  }

  if (__OTTPLATFORM__ === 'PS4') {
    (extensionConfig as HlsExtensionConfig).enableFrontBufferFlush = true;
  }

  // for hls.js upgrade on PS4 and Samsung
  if (__OTTPLATFORM__ === 'PS4' || __OTTPLATFORM__ === 'TIZEN') {
    (extensionConfig as HlsExtensionConfig).relyOnAutoplayAttribute = true;
  }
  const { getHlsChunk } = useHlsChunk();
  (extensionConfig as HlsExtensionConfig).externalHlsResolver = getHlsChunk()
    .then(({ default: ExternalHls }: { default: typeof Hls }) => ExternalHls) as Promise<typeof Hls>;

  if (isHlsExtensionConfig(extensionConfig)) {
    extensionConfig.hls.alwaysEmitDestroyed = alwaysEmitEMEDestroyed;
  }

  return extensionConfig;
}

export default useExtensionConfig;
