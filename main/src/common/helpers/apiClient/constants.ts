export const CLIENT_ERROR_CONFIG_PRODUCTION = 'https://md0.tubitv.com/error-handler/v2/client-error-config.json';
export const CLIENT_ERROR_CONFIG_STAGING = 'https://md0-staging.tubitv.com/error-handler/v2/client-error-config.json';

type RetryBlacklistEntry = {
  hostname: string;
  pathname?: string;
  methods?: string[];
};

export const retryBlacklist: RetryBlacklistEntry[] = [
  {
    hostname: 'prod.api.haw.digitalvideoplatform.com',
    pathname: '/v3.0/listings',
  },
];
