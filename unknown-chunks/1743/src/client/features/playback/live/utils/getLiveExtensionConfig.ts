import { HLS_JS_LEVEL } from '@adrise/player';

import { getHlsChunk } from 'common/features/playback/utils/getHlsChunk';

import { getHlsPlatformSpecificProps, getOverrideWebWorkerConfig, getOverrideBufferConfig } from '../../props/props';

export function getLiveExtensionConfig({
  useHlsNext,
}: {
  useHlsNext: boolean;
}) {
  return {
    hls: {
      ...getHlsPlatformSpecificProps({ enableCEA708Captions: true, emeEnabled: false, useHlsNext, startLevel: HLS_JS_LEVEL.HIGH }),
      ...getOverrideWebWorkerConfig(),
      ...getOverrideBufferConfig(),
    },
    externalHlsResolver: getHlsChunk(useHlsNext).then(({ default: ExternalHls }) => ExternalHls),
  };
}
