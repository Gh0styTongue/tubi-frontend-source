import type Hls from '@adrise/hls.js';
import type { Adapter, Player } from '@adrise/player';
import type HlsExtension from '@adrise/player/lib/utils/hlsExtension';

import type { getHlsPlatformSpecificProps } from 'client/features/playback/props/props';
import type { HDMIManager } from 'client/features/playback/services/HDMIManager';
import type { LiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import type { LiveVideoStack } from 'client/features/playback/session/LiveVideoStack';
import type { PreviewVideoSession } from 'client/features/playback/session/PreviewVideoSession';
import type { VODPageSession } from 'client/features/playback/session/VODPageSession';
import type BaseSystemApi from 'client/systemApi/systemApi';
import type { ExperimentManager } from 'common/experiments/ExperimentManager';
import type { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import type { WPFPlayer } from 'common/features/purpleCarpet/type';
import type FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export type TubiGlobalPlayer = Omit<Player, 'adapter'> & {
  adapter: (Adapter & {
    extension?: (Omit<HlsExtension, 'hls'> & {
      hls: Hls;
      Hls: typeof Hls;
      isPreloaded: boolean;
    }),
    Hls?: typeof Hls,
    player?: Hls,
    videoElement: HTMLVideoElement,
  })
};

declare global {
  interface Window {
    Tubi?: {
      crashSnapshot?: unknown,
      createSnapshot?: unknown,
      customHlsConfig?: ReturnType<typeof getHlsPlatformSpecificProps>,
      emitBufferAppendError?: () => void;
      emitBufferNudgeOnStallError?: () => void;
      emitBufferStalledError?: () => void;
      emitContentStartupStallError?: () => void;
      emitDRMFallback?: () => void;
      emitHDCPError?: () => void;
      emitInvalidCharacterError?: () => void;
      emitManifestLoadTimeoutError?: () => void;
      emitMediaErrSrcNotSupportedError?: () => void;
      emitNetworkError?: () => void;
      emitNonFatalDRMError?: () => void;
      emitPipelineDecodeError?: () => void;
      emitSetupError?: () => void;
      ExperimentManager?: ExperimentManager,
      FeatureSwitchManager?: typeof FeatureSwitchManager,
      fngPlayer?: WPFPlayer;
      hdmiManager?: HDMIManager;
      liveVideoSession?: LiveVideoSession;
      liveVideoStack?: LiveVideoStack;
      logoutAction?: (args: any) => unknown;
      mockOTTErrorService?: unknown;
      playbackE2EMetric?: { [x: number]: any };
      player?: TubiGlobalPlayer;
      previewVideoSession?: PreviewVideoSession;
      qualityManager?: LivePlaybackQualityManager;
      sendId?: (id: string) => void;
      systemApi?: BaseSystemApi;
      togglePlaybackInfo?: () => void;
      tubiPlayer?: {
        seekTo: (pos: number | string) => void;
      },
      videoResourceManager?: VideoResourceManager;
      VODPageSession?: VODPageSession;
      reloadFNGPlayer?: () => void;
    };
    TUBI_WEB_FQDN?: string | undefined;
    wpf?: {
      player: {
        WPFPlayer: new (el: HTMLElement, config: Record<string, any>) => WPFPlayer;
      }
    },
  }
}

export function exposeToTubiGlobal(exposedObjects: Partial<Window['Tubi']>) {
  if (!__SERVER__ && (!__PRODUCTION__ || __IS_ALPHA_ENV__)) {
    if (!window.Tubi) {
      window.Tubi = {};
    }
    window.Tubi = {
      ...window.Tubi,
      ...exposedObjects,
    };
  }
}
