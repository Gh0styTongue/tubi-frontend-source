import Analytics from '@tubitv/analytics';

import { autoCheckDRMSecurityLevel } from 'client/features/playback/detection/DRMSecurityLevel';
import { doesMSESupportCodec, HEVCLadder } from 'client/features/playback/detection/hevc';
import { isProgressiveFetchSupported } from 'client/features/playback/detection/hls';
import systemApi from 'client/systemApi';
import type FireTvHybSystemApi from 'client/systemApi/firetv-hyb';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { safeRequestIdleCallback } from 'common/utils/async';
import { trackLogging } from 'common/utils/track';

import { getDeviceSpecSampleRate } from '../getDeviceSpecSampleRate';

export const collectDeviceSpecInfo = () => {
  // collect up to 100,000 times everyday on each platform
  /* istanbul ignore if */
  if (Math.random() > getDeviceSpecSampleRate()) {
    return;
  }

  const collectTask = async () => {
    const HEVCResult = {};
    HEVCLadder.forEach((item) => {
      HEVCResult[item.codec] = doesMSESupportCodec(item.codec);
    });
    const message: Record<string, unknown> = {
      hevc: HEVCResult,
    };
    const hasApi = typeof systemApi.support4KDisplay === 'function' || typeof systemApi.support4KDecode === 'function';
    /* istanbul ignore next */
    if (hasApi) {
      const support4KDisplay =
        typeof systemApi.support4KDisplay === 'function' ? await systemApi.support4KDisplay() : 'unknown';
      const support4KDecode =
        typeof systemApi.support4KDecode === 'function' ? await systemApi.support4KDecode() : 'unknown';
      message.uhd = {
        decode: support4KDecode,
        display: support4KDisplay,
      };
    }
    if (__OTTPLATFORM__ === 'FIRETV_HYB' && typeof (systemApi as FireTvHybSystemApi).getVideoCodecInfo === 'function') {
      const videoCodecInfo = (systemApi as FireTvHybSystemApi).getVideoCodecInfo();
      /* istanbul ignore else */
      if (videoCodecInfo) {
        message.fps = videoCodecInfo.reduce((prev, info) => {
          prev[info.mimeType] = info.frameRateUpperForMaxWH;
          return prev;
        }, {});
      }
    }
    const { model } = Analytics.getAnalyticsConfig();

    message.model = model;
    message.hardwareConcurrency = systemApi.getHardwareConcurrency();
    message.deviceMemory = systemApi.getDeviceMemory();
    message.jsHeapSizeLimit = systemApi.getJsHeapSizeLimit();
    message.progressive = isProgressiveFetchSupported();

    /* istanbul ignore next */
    if (__OTTPLATFORM__ === 'PS4') {
      message.systemVersion = systemApi.getSystemVersion?.();
    }

    // The UA and maxTouchPoints help us recognize iPads/iPhone browsers that
    // have "request desktop" mode enabled. We don't _need_ the UA as we can
    // do a join in our queries with the activation events, but it's nice to have.
    // This code can be removed if/when we enhance our analytics code to in some
    // way detect the case where we have iPads/iPhones w/ "request desktop" mode.
    // When the user agent includes "Macintosh; Intel Mac OS X" and we have
    // >1 touch points, we can assume it's either an iPad or iPhone with
    // "request desktop" mode, though we can't tell which from this info alone.
    message.maxTouchPoints = systemApi.getMaxTouchPoints();

    // Collect the support DRM security level
    const DRMSecurityLevelResults = await autoCheckDRMSecurityLevel();
    message.DRMSL = DRMSecurityLevelResults;

    trackLogging({
      type: TRACK_LOGGING.clientInfo,
      subtype: LOG_SUB_TYPE.COMPATIBILITY.DEVICE_SPEC_INFO,
      message,
    });
  };
  safeRequestIdleCallback(collectTask);
};
