import { HLS_JS_LEVEL } from '@adrise/player';

import type { getHlsChunkType } from 'common/features/playback/utils/getHlsChunk';

import { getHlsPlatformSpecificProps, getOverrideWebWorkerConfig, getOverrideBufferConfig } from '../../props/props';

export function getLiveExtensionConfig({
  getHlsChunk,
}: {
  getHlsChunk: getHlsChunkType;
}) {
  return {
    hls: {
      ...getHlsPlatformSpecificProps({ enableCEA708Captions: true, emeEnabled: false, startLevel: HLS_JS_LEVEL.HIGH }),
      ...getOverrideWebWorkerConfig(),
      ...getOverrideBufferConfig(),
    },
    externalHlsResolver: getHlsChunk().then(({ default: ExternalHls }) => ExternalHls),
  };
}
