import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export interface DeviceSpecInfo {
  hevc: Record<string, boolean>;
  model: string | undefined;
  hardwareConcurrency: number | undefined;
  deviceMemory: number | undefined;
  jsHeapSizeLimit: number | undefined;
  mp2t: boolean;
  maxTouchPoints: number | undefined;
  DRMSL: Record<string, true | string>;
  uhd?: {
    decode: boolean | 'unknown';
    display: boolean | 'unknown';
  };
  fps?: Record<string, string>;
  systemVersion?: string;
}

export function trackDeviceSpecInfo(deviceSpecInfo: DeviceSpecInfo): void {
  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.COMPATIBILITY.DEVICE_SPEC_INFO,
    message: deviceSpecInfo,
  });
}
