import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import logger from 'common/helpers/logging';
import { trackLogging } from 'common/utils/track';

interface TrackUserSessionLoggingParams {
  loggerConfig?: {
    shouldSend?: boolean;
    data?: Record<string, unknown>;
  };
  message: string | number;
  sampleRate?: number;
  type?: string;
}

export const USER_SESSION_LOGGING_TYPES = {
  ERROR: 'error',
  LENGTH_IN_DAYS: 'lengthInDays',
};

export const trackUserSessionLogging = ({
  loggerConfig = {},
  message,
  sampleRate = 1,
  type = USER_SESSION_LOGGING_TYPES.ERROR,
}: TrackUserSessionLoggingParams) => {
  const { shouldSend: shouldSendToDatadog = true, data: loggerData } = loggerConfig;
  const subtype = [LOG_SUB_TYPE.USER_SESSION, type].join('@');
  const finalSampleRate = __PRODUCTION__ ? sampleRate : 1;

  if (Math.random() <= finalSampleRate) {
    trackLogging({
      type: TRACK_LOGGING.clientInfo,
      subtype,
      message,
    });

    if (type === USER_SESSION_LOGGING_TYPES.ERROR && shouldSendToDatadog) {
      const messageWithLabel = `userSession: ${message}`;

      if (loggerData) {
        logger.error(loggerData, messageWithLabel);
      } else {
        logger.error(messageWithLabel);
      }
    }
  }
};
