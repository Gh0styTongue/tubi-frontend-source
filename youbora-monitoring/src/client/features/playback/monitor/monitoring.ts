import type { Player } from '@adrise/player/lib/index';
import type { AnalyticsConfigProps } from '@tubitv/analytics/lib/baseTypes';
import youbora from 'youboralib';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { YOUBORA_EXPERIMENT_OPTION_BACKUP } from 'common/constants/constants';
import { YouboraContentTypes } from 'common/features/playback/constants/youbora';
import type { VideoResourceType, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import type { YouboraOptionNames } from 'common/types/youbora';

import YouboraAdapter from './YouboraAdapter';
import YouboraAdsAdapter from './YouboraAdsAdapter';
import config from '../../../../config';

const { videoMonitoringCode, videoMonitoringBrand } = config;

interface SetupOptions {
  contentId: string;
  contentType: YouboraContentTypes;
  title?: string;
  userId?: number;
  analyticsConfig: AnalyticsConfigProps;
  experimentName?: string;
  experimentTreatmentName?: string;
  playbackType?: VideoResourceType;
  playbackCodec?: VIDEO_RESOURCE_CODEC;
  drm?: string;
  duration?: number;
  language?: string;
  needAdsAdapter?: boolean;
  titanVersion?: string;
  generatorVersion?: string;
  ssaiVersion?: string;
  dimensions?: Record<string, string | number>;
  runningExperiments?: string;
  ignoreShortBuffering?: boolean;
}

export interface Monitoring {
  plugin: {
    options: {
      [key in YouboraOptionNames]: any
    }
  };
  remove: () => void;
}

export const setup = (player: LivePlayerWrapper | Player, options: SetupOptions): Monitoring => {
  // Only pass playbackType property if it is available
  const playbackTypeProps = options.playbackType ? {
    'content.playbackType': options.playbackType,
  } : {};

  const playbackCodecProps = options.playbackCodec ? {
    'content.encoding.videoCodec': options.playbackCodec,
  } : {};

  const {
    analyticsConfig,
    contentId,
    contentType = YouboraContentTypes.UNKNOWN,
    needAdsAdapter = true,
    title,
    userId,
    titanVersion,
    generatorVersion,
    ssaiVersion,
    dimensions,
    ignoreShortBuffering = false,
    runningExperiments = '',
  } = options;

  const {
    app_version,
    browser_name,
    browser_version,
    device_id,
    model,
    os_version,
    platform,
  } = analyticsConfig;

  const browserVersion = (player as Player).SDKVersion || browser_version;
  // You can check option in this file
  // https://bitbucket.org/npaw/lib-plugin-js/src/master/src/plugin/options.js
  const setupOptions = {
    'accountCode': __PRODUCTION__ ? 'tubitv' : 'tubitvdev',
    'app.name': 'tubi',
    'app.releaseVersion': app_version,
    'content.customDimension.2': titanVersion,
    'content.customDimension.3': ssaiVersion,
    [YOUBORA_EXPERIMENT_OPTION_BACKUP]: runningExperiments,
    'content.customDimension.10': generatorVersion,
    'content.id': contentId,
    'content.title': title,
    'content.type': contentType,
    'device.brand': videoMonitoringBrand,
    'device.browserName': browser_name,
    'device.browserVersion': browserVersion,
    'device.code': videoMonitoringCode,
    'device.id': device_id,
    'device.model': model,
    'device.name': model,
    'device.osName': platform, // The os in analyticsConfig is parsed from UAParser and it's not accurate on some platforms.
    'device.osVersion': os_version,
    'enabled': true,
    // legacy issue, let's still keep it for a while
    'extraparam.1': contentId,
    // https://documentation.npaw.com/integration-docs/docs/options-analytics-js#second-option-example
    'content.customDimensions': dimensions,
    'user.name': userId,
    // Allow to send background / foreground event on Youbora
    // https://bitbucket.org/npaw/lib-plugin-js/src/6e7a0c553797dd3634e475ac825ef82b3f192dc5/src/plugin/options.js#lines-607
    // Default behavior
    // Desktop: null
    // tv: stop
    // playstation: stop
    'background.enabled': true,
    'waitForMetadata': true,
    'pendingMetadata': ['param7'],
    ...playbackTypeProps,
    ...playbackCodecProps,
    'ignoreShortBuffering': ignoreShortBuffering,
  };

  if (options.experimentName && options.experimentTreatmentName) {
    // Pass the experiment info to Youbora plugin, so we can use it in Youbora adapters to change the player version reported to Youbora,
    setupOptions['tubi.experimentName'] = options.experimentName;
    setupOptions['tubi.experimentTreatmentName'] = options.experimentTreatmentName;
  }
  if (options.drm) {
    setupOptions['content.drm'] = options.drm;
  }
  if (options.duration) {
    setupOptions['content.duration'] = options.duration;
  }
  if (options.language) {
    setupOptions['content.language'] = options.language;
  }

  const plugin = new youbora.Plugin(setupOptions);
  plugin.setAdapter(new YouboraAdapter(player));
  if (needAdsAdapter) {
    plugin.setAdsAdapter(new YouboraAdsAdapter(player));
  }

  // Send `start` request whenever the player is inited
  plugin.getAdapter().fireStart();

  return {
    remove() {
      if (needAdsAdapter) {
        plugin.removeAdsAdapter();
      }
      plugin.removeAdapter();
    },
    plugin,
  };
};
