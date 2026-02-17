import type { SentryRate } from 'common/constants/constants';

import type { PlatformUppercase } from './platforms';

interface SampleRateConfig {
  performance: {
    vod: number;
    preview: number;
    live: number;
  };
  sentry: SentryRate;
}

export const DEFAULT_SENTRY_RATE: SentryRate = {
  error: 0.2,
  transition: 0,
};

export const DEVICE_SAMPLE_RATE: {
  [k in PlatformUppercase] : SampleRateConfig;
} = {
  ANDROIDTV: {
    performance: {
      vod: 0,
      live: 0.3,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  HILTON: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  DIRECTVHOSP: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  BRIDGEWATER: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  NETGEM: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  COMCAST: {
    performance: {
      vod: 0.04,
      live: 0.2,
      preview: 0,
    },
    sentry: {
      error: 0.5,
      transition: 0,
    },
  },
  COMCASTHOSP: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: {
      error: 0.5,
      transition: 0,
    },
  },
  COX: {
    performance: {
      vod: 0.5,
      live: 1,
      preview: 0,
    },
    sentry: {
      error: 0.5,
      transition: 0,
    },
  },
  FIRETV_HYB: {
    performance: {
      vod: 0.03,
      live: 0.04,
      preview: 0.02,
    },
    sentry: {
      error: 0.2,
      transition: 0.0001,
    },
  },
  PS4: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  PS5: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  ROGERS: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: {
      error: 0.5,
      transition: 0,
    },
  },
  SONY: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  TIVO: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  TIZEN: {
    performance: {
      vod: 0,
      live: 0.5,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  VIZIO: {
    performance: {
      vod: 0.05,
      live: 0.2,
      preview: 0.1,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  XBOXONE: {
    performance: {
      vod: 0.25,
      live: 0.5,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  HISENSE: {
    performance: {
      vod: 0,
      live: 0,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  LGTV: {
    performance: {
      vod: 0.15,
      live: 0.5,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  WEB: {
    performance: {
      vod: 0.1,
      live: 1,
      preview: 0,
    },
    sentry: {
      error: 0.2,
      transition: 0.007,
    },
  },
  WINDOWS: {
    performance: {
      vod: 0.1,
      live: 1,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
  SHAW: {
    performance: {
      vod: 0.1,
      live: 1,
      preview: 0,
    },
    sentry: {
      error: 0.5,
      transition: 0,
    },
  },
  VERIZONTV: {
    performance: {
      vod: 0.25,
      live: 0.5,
      preview: 0,
    },
    sentry: DEFAULT_SENTRY_RATE,
  },
};
