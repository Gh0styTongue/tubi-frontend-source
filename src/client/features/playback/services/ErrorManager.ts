import type { ErrorDetails } from '@adrise/hls.js';
import {
  ErrorType,
  PLAYER_ERROR_DETAILS,
  PLAYER_EVENTS,
  MEDIA_ERR_DECODE_MESSAGE,
  ERROR_SOURCE,
  PlayerName,
  isHlsExtensionConfig,
} from '@adrise/player';
import type {
  Player,
  ErrorEventData,
  AdError,
  AdErrorEventData } from '@adrise/player';
import { debug } from '@adrise/player/lib/utils/tools';
import { buildQueryString } from '@adrise/utils/lib/queryString';

import { isFatalError } from 'client/features/playback/error/isFatalError';
import {
  isDrmError,
  isHDCPIncomplianceError,
  isAudioDecoderInitError,
  isAutoStartFailedError,
  isDomExceptionAbortError,
  isHlsJsCodecError,
  isInvalidCharacterError,
  isDecodeError,
  isWebAndroidUnknownNativeError,
  isContentStartupStallError,
  isSrcNotSupportedError,
  isTizen6UnknownError,
  isTokenExpiredError,
} from 'client/features/playback/error/predictor';
import * as PreviewVideoSession from 'client/features/playback/session/PreviewVideoSession';
import * as VODPageSession from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import {
  trackErrorModalShow,
  trackVODError,
  trackFallback,
} from 'client/features/playback/track/client-log';
import type {
  QoSErrorCodeValues, QoSErrorTypeValues,
} from 'client/features/playback/utils/convertErrorToUnifiedEnum';
import {
  QoSErrorCode,
  convertErrorToUnifiedEnum,
  QoSErrorType,
} from 'client/features/playback/utils/convertErrorToUnifiedEnum';
import { exposeToTubiGlobal } from 'client/global';
import { addSentryBreadcrumb } from 'client/utils/sentry';
import { RESUME_TIME_QUERY } from 'common/constants/constants';
import { updateAftmmConfig } from 'common/features/playback/hooks/useExperimentalConfig';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getPlayerExtensionConfig } from 'common/features/playback/utils/getPlayerExtensionConfig';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import { getVideoProps } from 'common/features/playback/utils/getVideoProps';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import mockOTTErrorService from 'common/services/MockOTTErrorService';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import type { VideoResource } from 'common/types/video';
import { isAFTMMModel } from 'common/utils/device';
import { errorContexts, buildErrorCode } from 'common/utils/errorCapture';

import { BasePlayerManager } from './BasePlayerManager';

export type ErrorModalType =
  'SETUP_ERROR' |
  'FATAL_ERROR' |
  'DRM_ERROR' |
  'HDCP_ERROR' |
  'AD_ERROR';

export interface ErrorManagerParams {
  player: Player,
  contentId?: string,
  enableVideoSessionCollect?: boolean,
  tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined,
  playerErrorHandle?: (error: ErrorEventData) => void,
  videoResourceManagerV2?: VideoResourceManager,
  getVideoResource: () => VideoResource | undefined;
  refetchContent: () => void;
}

const MAX_RELOAD_COUNT = 3;
const MAX_TOKEN_EXPIRED_RETRY_COUNT = 3;
const MIN_BUFFER_DATA_NOT_DEPLETED_LENGTH = 0.5;
const INVALID_CHARACTER_ERR_PLATFORMS = ['XBOXONE', 'COMCAST'];

export class ErrorManager extends BasePlayerManager<Player> {

  private contentId?: string;

  private getVideoResource: () => VideoResource | undefined;

  private enableVideoSessionCollect?: boolean;

  private videoResourceManagerV2?: VideoResourceManager;

  private showModal?: (type: ErrorModalType, options: {
    error: ErrorEventData;
    errorCode: string;
    position: number;
  }) => void;

  private closeModal?: () => void;

  private tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined;

  private playerErrorHandle?: (error: ErrorEventData) => void;

  private reloadCount: number = 0;

  private tokenExpiredRetryCount: number = 0;

  private errorWaitBufferDataDepleted: ErrorEventData | undefined;

  private detachPlayerEventsList: (() => void)[] = [];

  private refetchContent: () => void;

  constructor(option: ErrorManagerParams) {
    super(option);
    if (!FeatureSwitchManager.isDefault(['Logging', 'Player'])) {
      this.log = debug('ErrorManager');
    }
    this.player = option.player;
    this.contentId = option.contentId;
    this.getVideoResource = option.getVideoResource;
    this.enableVideoSessionCollect = option.enableVideoSessionCollect;
    this.videoResourceManagerV2 = option.videoResourceManagerV2;
    this.tryFallbackVideoResource = option.tryFallbackVideoResource;
    this.playerErrorHandle = option.playerErrorHandle;
    this.refetchContent = option.refetchContent;
    this.detachPlayerEventsList.push(this.attachPlayerEvents(option.player));
    this.log('create');

    this.addDebugMethod();
  }

  private attachPlayerEvents(player: Player) {
    const listeners: [PLAYER_EVENTS, ((data: ErrorEventData) => void) | ((error: AdError, data: AdErrorEventData) => void)][] = [
      [PLAYER_EVENTS.error, this.receivedError],
      [PLAYER_EVENTS.adError, this.receivedAdError],
      [PLAYER_EVENTS.canPlay, this.reloadSuccess],
    ];

    listeners.forEach(listener => {
      player.on(listener[0], listener[1]);
    });

    return () => {
      listeners.forEach(listener => {
        player.removeListener(listener[0], listener[1]);
      });
    };
  }

  bufferingStartShowNetworkErrorModal = () => {
    if (this.errorWaitBufferDataDepleted) {
      const error = this.errorWaitBufferDataDepleted;
      const { errorType, errorCode } = convertErrorToUnifiedEnum(error);
      this.showAlertModal(error, 'FATAL_ERROR', {
        errorType,
        errorCode,
      });
    }
  };

  reloadSuccess = () => {
    this.reloadCount = 0;
    this.tokenExpiredRetryCount = 0;
  };

  receivedAdError = (adError: AdError, { isConstrainView }: AdErrorEventData) => {
    if (__WEBPLATFORM__ === 'WEB' && isConstrainView !== undefined) {
      if (isConstrainView) {
        const error: ErrorEventData = {
          type: ErrorType.OTHER_ERROR,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
          fatal: true,
          message: adError.message,
          code: adError.code,
          details: PLAYER_ERROR_DETAILS.AD_REQUEST_BLOCKED_ERROR,
        };
        const { errorType, errorCode } = convertErrorToUnifiedEnum(error);
        this.showAlertModal(error, 'AD_ERROR', {
          errorType,
          errorCode,
        });
      }
    }
  };

  receivedError = (error: ErrorEventData) => {
    /* istanbul ignore if: safety check only */
    if (!this.player) return;
    const player = this.player;
    trackVODError(error, {
      contentId: this.contentId ?? '',
      videoResource: this.getVideoResource(),
      playerInstance: player as Player,
      cdn: player?.getCDN(),
    });
    if (player.playerName === PlayerName.VOD && error.details === PLAYER_ERROR_DETAILS.BUFFER_NUDGE_ON_STALL) {
      VODPlaybackSession.getInstance().bufferNudgeOnStall();
    }
    if (__ISOTT__) {
      this.handleOTTError(player, error);
    } else {
      this.handleWebError(player as Player, error);
    }
    addSentryBreadcrumb({
      category: 'error',
      message: `${error.code}-${error.message}`,
    });
    if (this.enableVideoSessionCollect) {
      this.handleVideoSessionCollect(player, error);
    }
  };

  private handleOTTError(player: Player, error: ErrorEventData) {
    const playerName = player.playerName;
    if (playerName === PlayerName.VOD && player) {
      this.handleOTTVODError(player, error);
    } else if (playerName === PlayerName.Trailer) {
      this.handleOTTTrailerError(error);
    }
  }

  private handleOTTTrailerError(error: ErrorEventData) {
    if (error.fatal) {
      tubiHistory.goBack();
    }
  }

  private reloadMediaUrl(player: Player, videoResource?: VideoResource) {
    const { mediaUrl, drmKeySystem, licenseUrl, serverCertificateUrl, hdcpVersion } = getVideoProps(videoResource);
    VODPageSession.reloadSrc();
    player.setMediaUrl(mediaUrl, player.getPosition(), {
      drmKeySystem,
      licenseUrl,
      serverCertificateUrl,
      hdcpVersion,
    });
  }

  private recoverTokenExpiredError(player: Player, error: ErrorEventData): boolean {
    if (isTokenExpiredError(error)
      && this.tokenExpiredRetryCount < MAX_TOKEN_EXPIRED_RETRY_COUNT
      && this.contentId
    ) {
      this.tokenExpiredRetryCount++;
      this.updateContent(player, this.contentId);
      return true;
    }
    return false;
  }

  private recoverHlsError(player: Player, error: ErrorEventData): boolean {
    if (error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.fatal && !isHlsJsCodecError(error)) {
      return player.recoverHlsError(error);
    }
    return false;
  }

  private handleOTTVODError(player: Player, error: ErrorEventData) {
    const videoResource = this.getVideoResource();
    const isDRMError = isDrmError(error);

    if (!error.fatal && !isDRMError) return;

    if (isDomExceptionAbortError(error)) return;

    if (isTizen6UnknownError(error) && !player.getSDKInfo()?.isStable) return;

    const { errorType, errorCode } = VODPlaybackSession.getInstance().breakOff(error);

    if (this.recoverTokenExpiredError(player, error)) return;

    if (this.recoverHlsError(player, error)) return;

    if (error.type === ErrorType.SETUP_ERROR) {
      VODPlaybackSession.getInstance().error(error);
      this.showAlertModal(error, 'SETUP_ERROR', {
        errorType,
        errorCode,
      });
      return;
    }

    const fallbackResource = this.videoResourceManagerV2 ? this.webottFallbackVideoResource(player, error) : this.tryFallbackVideoResource?.(error, player.getPosition());
    if (fallbackResource) {
      VODPlaybackSession.getInstance().fallback();
      VODPageSession.fallback();
      if (this.videoResourceManagerV2) {
        const { mediaUrl, drmKeySystem, licenseUrl, serverCertificateUrl, hdcpVersion } = getVideoProps(fallbackResource);
        const extensionConfig = getPlayerExtensionConfig({
          isDrmContent: !!licenseUrl,
          hdcpVersion,
        });
        // @TODO this is in initial design. We may use the player current config value here
        const experimentalConfig = {
          customPlaybackHandlers: [],
          enableSeekWithResumePosition: false,
        };
        if (isAFTMMModel()) {
          updateAftmmConfig(fallbackResource, experimentalConfig);
        }
        this.log('ott fallback call player setMediaUrl');
        player.setMediaUrl(mediaUrl, player.getPosition(), {
          drmKeySystem,
          licenseUrl,
          serverCertificateUrl,
          hdcpVersion,
          drmSystemOptions: isHlsExtensionConfig(extensionConfig) ? extensionConfig.hls.drmSystemOptions : undefined,
          ...experimentalConfig,
        });
      }
      return;
    }

    if ((isDecodeError(error))
      || (INVALID_CHARACTER_ERR_PLATFORMS.includes(__OTTPLATFORM__) && !VODPlaybackSession.getVODPlaybackInfo().isAd && isInvalidCharacterError(error))
      || (isSrcNotSupportedError(error) && this.shouldRecoverSrcNotSupportedError())
      || (isContentStartupStallError(error) && this.shouldRecoverContentStartupStallError())) {
      if (this.reloadCount < MAX_RELOAD_COUNT) {
        this.reloadCount++;
        VODPlaybackSession.getInstance().reload();
        this.reloadMediaUrl(player, videoResource);
        return;
      }
    }

    VODPlaybackSession.getInstance().error(error);

    const isDRMResource = videoResource && videoResource.license_server;
    const isHDCPError = isHDCPIncomplianceError(error);

    if (__OTTPLATFORM__ === 'FIRETV_HYB'
      && isDRMResource
      && isAudioDecoderInitError(error)) {
      player.pause();
      location.reload();
    }

    const bufferedLength = player.getBufferedLength() ?? 0;
    if (errorType === QoSErrorType.NETWORK_ERROR
      && bufferedLength > MIN_BUFFER_DATA_NOT_DEPLETED_LENGTH
      && !VODPlaybackSession.getVODPlaybackInfo().isBuffering) {
      if (this.errorWaitBufferDataDepleted) {
        // wait with existed bufferStart listener
        return;
      }
      // wait for buffer data depleted
      this.errorWaitBufferDataDepleted = error;
      player.once(PLAYER_EVENTS.bufferStart, this.bufferingStartShowNetworkErrorModal);
      this.detachPlayerEventsList.push(() => {
        player.removeListener(PLAYER_EVENTS.bufferStart, this.bufferingStartShowNetworkErrorModal);
      });
      return;
    }

    switch (errorType) {
      case QoSErrorType.DRM_ERROR:
        this.showAlertModal(error, isHDCPError ? 'HDCP_ERROR' : 'DRM_ERROR', {
          errorType,
          errorCode,
        });
        return;
      case QoSErrorType.NETWORK_ERROR:
        this.showAlertModal(error, 'FATAL_ERROR', {
          errorType,
          errorCode,
        });
        return;
      default:
        // For the fatal error which hls.js will stop load and cannot be recovered by player automatically,
        // we show error modal to the user
        if (([
          QoSErrorCode.HLSJS_BUFFER_APPEND_ERROR,
          QoSErrorCode.HLSJS_BUFFER_REVERT_APPEND_ERROR,
        ] as QoSErrorCodeValues[]).includes(errorCode)) {
          this.showAlertModal(error, 'FATAL_ERROR', {
            errorType,
            errorCode,
          });
        }
    }
  }

  private showAlertModal(error: ErrorEventData, type: ErrorModalType, options: {
    errorType: QoSErrorTypeValues,
    errorCode: QoSErrorCodeValues,
  }) {
    const player = this.player;
    if (!player) return;
    this.errorWaitBufferDataDepleted = undefined;
    const { errorType: errt, errorCode: errc } = options;
    const errorCode = buildErrorCode(errorContexts.PLAYER, errc);

    trackErrorModalShow({
      player: player as Player,
      errorMessage: error.message,
      errt,
      errc,
    });

    // some error will lead to a crash on player and the pause will throw an error in these cases
    try {
      player.pause();
    } finally {
      if (this.showModal) {
        this.showModal(type, {
          error,
          errorCode,
          position: player.getPosition(),
        });
      } else {
        logger.error('cannot show error modal');
      }
    }
  }

  private async handleWebError(player: Player, error: ErrorEventData) {
    if (error.fatal) {
      if (error.type === ErrorType.SETUP_ERROR) {
        logger.error({ error, contentId: this.contentId }, 'Player initialization error');
      } else if (error.type === ErrorType.NETWORK_ERROR) {
        logger.error({ error, contentId: this.contentId }, 'Player network error');
      }
    }

    if (this.recoverTokenExpiredError(player, error)) return;

    this.playerErrorHandle?.(error);

    const isDRMError = isDrmError(error);
    if (isAutoStartFailedError(error) || (!error.fatal && !isDRMError)) return;
    if (isDomExceptionAbortError(error)) return;
    if (isWebAndroidUnknownNativeError(error)) return; // With checking user logs, we find this web android error will not affect the normal playback.

    // fatal false warning
    if (error.details === PLAYER_ERROR_DETAILS.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED) {
      return;
    }

    const { errorCode: errc } = VODPlaybackSession.getInstance().breakOff(error);

    if (this.recoverHlsError(player, error)) return;

    if (error.type === ErrorType.SETUP_ERROR) {
      VODPlaybackSession.getInstance().error(error);
      return;
    }

    const fallbackResource = this.videoResourceManagerV2 ? this.webottFallbackVideoResource(player, error) : this.tryFallbackVideoResource?.(error);
    if (fallbackResource) {

      VODPlaybackSession.getInstance().fallback();
      VODPageSession.fallback();
      if (this.videoResourceManagerV2) {
        const { mediaUrl, drmKeySystem, licenseUrl, serverCertificateUrl, hdcpVersion } = getVideoProps(fallbackResource);
        const extensionConfig = getPlayerExtensionConfig({
          isDrmContent: !!licenseUrl,
          hdcpVersion,
        });
        this.log('web fallback call player setMediaUrl');
        await player.setMediaUrl(mediaUrl, player.getPosition(), {
          drmKeySystem,
          licenseUrl,
          serverCertificateUrl,
          hdcpVersion,
          drmSystemOptions: isHlsExtensionConfig(extensionConfig) ? extensionConfig.hls.drmSystemOptions : undefined,
        });
      }
      return;
    }

    VODPlaybackSession.getInstance().error(error);

    if (isDRMError) {
      player.pause();
      const errorCode = buildErrorCode(errorContexts.PLAYER, errc);

      if (this.showModal) {
        this.showModal('DRM_ERROR', {
          error,
          errorCode,
          position: player.getPosition(),
        });
      } else {
        logger.error('cannot show error modal');
      }
    }
  }

  private shouldRecoverSrcNotSupportedError() {
    VODPlaybackSession.getInstance().setFeatureInfo('srcNotSupportedErrorRetry', true);
    return true;
  }

  private shouldRecoverContentStartupStallError() {
    const result = __SHOULD_RECOVER_CONTENT_STARTUP_STALL__;
    VODPlaybackSession.getInstance().setFeatureInfo('contentStartupStallRecovery', result);
    return result;
  }

  private webottFallbackVideoResource(player: Player, error: ErrorEventData) {
    const isDRMError = isDrmError(error);
    const videoResourceManager = this.videoResourceManagerV2;
    const failedVideoResource = this.videoResourceManagerV2?.getCurrentResource();
    const isDRMResource = failedVideoResource && failedVideoResource.license_server;
    const decodeErrorFallback = isDecodeError(error);
    const invalidCharacterErrorFallback = INVALID_CHARACTER_ERR_PLATFORMS.includes(__OTTPLATFORM__) && !VODPlaybackSession.getVODPlaybackInfo().isAd && isInvalidCharacterError(error);
    const srcNotSupportedErrorFallback = isSrcNotSupportedError(error) && this.shouldRecoverSrcNotSupportedError();
    const contentStartupStallErrorFallback = isContentStartupStallError(error) && this.shouldRecoverContentStartupStallError();

    const shouldDrmFallback = ((isDRMResource && isDRMError) || decodeErrorFallback || invalidCharacterErrorFallback || srcNotSupportedErrorFallback || contentStartupStallErrorFallback)
      && (!!__SHOULD_SUPPORT_FALLBACK_FOR_DRM__ || __WEBPLATFORM__ === 'WEB');

    let fallbackVideoResource;
    if (isHlsJsCodecError(error)
      || (__WEBPLATFORM__ === 'WEB' && failedVideoResource?.codec === VIDEO_RESOURCE_CODEC.HEVC && isFatalError(error))) {
      fallbackVideoResource = videoResourceManager?.fallback({ changeCodec: true });
      if (fallbackVideoResource) {
        trackFallback('CODEC', { contentId: this.contentId ?? '', failedVideoResource, fallbackVideoResource });
      }
    } else if (shouldDrmFallback) {
      const webNotSkipDrm = __WEBPLATFORM__ === 'WEB' && [
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INTERNAL_ERROR,
        PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_INVALID_HDCP_VERSION,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INVALID_STATUS,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
      ].includes(error.details as string);
      if (__ISOTT__ || webNotSkipDrm) {
        fallbackVideoResource = videoResourceManager?.fallback();
      } else {
        fallbackVideoResource = videoResourceManager?.fallback({ skipDRM: true });
      }
      if (fallbackVideoResource) {
        trackFallback('DRM', { contentId: this.contentId ?? '', failedVideoResource, fallbackVideoResource, reason: error.details });
      }
    }
    return fallbackVideoResource;
  }

  private handleVideoSessionCollect(player: Player, error: ErrorEventData) {
    const playerName = player.playerName;
    if (playerName === PlayerName.Preview) {
      PreviewVideoSession.contentError(error);
    } else {
      if (error.message === PLAYER_ERROR_DETAILS.INTERNAL_EXCEPTION) {
        logger.error(error.err || error.error, PLAYER_ERROR_DETAILS.INTERNAL_EXCEPTION);
      }
      VODPageSession.contentError(error);
    }
  }

  setShowModal = (showModal: (type: ErrorModalType, options: {
    error: ErrorEventData;
    errorCode: string;
    position: number;
  }) => void) => {
    this.showModal = showModal;
  };

  setCloseModal = (closeModal: () => void) => {
    this.closeModal = closeModal;
  };

  destroy = () => {
    this.log('destroy');
    if (this.player) {
      this.detachPlayerEventsList.forEach(detachPlayerEvents => {
        detachPlayerEvents();
      });
    }
    super.destroy();
  };

  private updateContent(player: Player, contentId: string) {
    const position = player.getPosition();
    const query = __ISOTT__ ? {
      [RESUME_TIME_QUERY]: position,
    } : {
      startPos: position,
    };
    tubiHistory.replace(`${__ISOTT__ ? getPlayerUrl(contentId) : location.pathname}${buildQueryString(query)}`);
    this.refetchContent();
  }

  private addDebugMethod() {
    exposeToTubiGlobal({
      emitDRMFallback: () => {
        const error = {
          fatal: true,
          type: ErrorType.KEY_SYSTEM_ERROR,
          details: PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED as ErrorDetails,
          code: '',
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitCodecFallback: () => {
        const error = {
          fatal: true,
          type: ErrorType.MEDIA_ERROR,
          details: PLAYER_ERROR_DETAILS.MANIFEST_INCOMPATIBLE_CODECS_ERROR as ErrorDetails,
          code: '',
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitNonFatalDRMError: () => {
        const error = {
          fatal: false,
          type: ErrorType.KEY_SYSTEM_ERROR,
          details: PLAYER_ERROR_DETAILS.KEY_SYSTEM_NO_SESSION as ErrorDetails,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitHDCPError: () => {
        const error = {
          fatal: true,
          type: ErrorType.KEY_SYSTEM_ERROR,
          details: PLAYER_ERROR_DETAILS.KEY_SYSTEM_INVALID_HDCP_VERSION as ErrorDetails,
          code: '',
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitNetworkError: () => {
        const error = {
          fatal: true,
          type: ErrorType.NETWORK_ERROR,
          details: PLAYER_ERROR_DETAILS.FRAG_LOAD_TIMEOUT as ErrorDetails,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitManifestLoadTimeoutError: () => {
        const error = {
          fatal: true,
          type: ErrorType.NETWORK_ERROR,
          details: PLAYER_ERROR_DETAILS.MANIFEST_LOAD_TIMEOUT as ErrorDetails,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitTokenExpiredError: () => {
        const error = {
          fatal: true,
          details: PLAYER_ERROR_DETAILS.FRAG_LOAD_ERROR as ErrorDetails,
          response: {
            code: 403,
            url: 'https://www.test.com/test.mp4',
            data: 'test',
          },
          type: ErrorType.NETWORK_ERROR,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitInvalidCharacterError: () => {
        const error = {
          fatal: true,
          type: ErrorType.MEDIA_ERROR,
          code: DOMException.INVALID_CHARACTER_ERR,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
        };
        this.receivedError(error);
      },
      emitContentStartupStallError: () => {
        const error = {
          type: ErrorType.MEDIA_ERROR,
          fatal: true,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
          details: PLAYER_ERROR_DETAILS.CONTENT_STARTUP_STALL,
          message: PLAYER_ERROR_DETAILS.CONTENT_STARTUP_STALL,
        };
        this.receivedError(error);
      },
      emitPipelineDecodeError: () => {
        const error = {
          fatal: true,
          type: ErrorType.MEDIA_ERROR,
          message: MEDIA_ERR_DECODE_MESSAGE.PIPELINE_ERROR_DECODE,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
        };
        this.receivedError(error);
      },
      emitMediaErrSrcNotSupportedError: () => {
        const error = {
          fatal: true,
          type: ErrorType.MEDIA_ERROR,
          code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
        };
        this.receivedError(error);
      },
      emitBufferStalledError: () => {
        const error = {
          fatal: true,
          message: PLAYER_ERROR_DETAILS.BUFFER_STALLED_ERROR,
          details: PLAYER_ERROR_DETAILS.BUFFER_STALLED_ERROR as ErrorDetails,
          code: '',
          type: ErrorType.MEDIA_ERROR,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitBufferNudgeOnStallError: () => {
        const error = {
          fatal: false,
          message: PLAYER_ERROR_DETAILS.BUFFER_NUDGE_ON_STALL,
          details: PLAYER_ERROR_DETAILS.BUFFER_NUDGE_ON_STALL as ErrorDetails,
          type: ErrorType.MEDIA_ERROR,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitBufferAppendError: () => {
        const error = {
          fatal: true,
          message: PLAYER_ERROR_DETAILS.BUFFER_APPEND_ERROR,
          details: PLAYER_ERROR_DETAILS.BUFFER_APPEND_ERROR as ErrorDetails,
          code: '',
          type: ErrorType.MEDIA_ERROR,
          errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
        };
        this.receivedError(error);
      },
      emitUnknownMediaDecodeError: () => {
        const error = {
          fatal: true,
          type: ErrorType.MEDIA_ERROR,
          code: MediaError.MEDIA_ERR_DECODE,
          errorSource: ERROR_SOURCE.OTHER,
        };
        this.receivedError(error);
      },
      emitSetupError: () => {
        const error = {
          fatal: true,
          type: ErrorType.SETUP_ERROR,
          code: '',
          errorSource: ERROR_SOURCE.OTHER,
        };
        this.receivedError(error);
      },
      mockOTTErrorService,
    });
  }
}
