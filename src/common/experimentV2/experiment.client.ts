import type { StatsigClientEvent, StatsigOptions } from '@statsig/js-client';
import { StatsigClient } from '@statsig/js-client';
import { isEmpty } from 'lodash';

import { exposeToTubiGlobal } from 'client/global';
import { removeCookie, getAllKeysFromCookie } from 'client/utils/localDataStorage';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import type { ExperimentDescriptor } from './configs/types';
import ExposureEmitter, { type ExposedExperiment } from './ExposureEmitter';
import type { GetExperiment, ExperimentOptions, ExperimentUser } from './utils';
import { STATSIG_API_HOST, getEnvironment, STATSIG_CLIENT_SDK_KEY } from './utils';

interface InitializeExperimentClientOptions {
  user?: ExperimentUser;
}

const CONFIG_EXPOSURE_NAME = 'statsig::config_exposure';
const LAYER_EXPOSURE_NAME = 'statsig::layer_exposure';

class ExperimentClient {
  private static instance: ExperimentClient | undefined;
  private experimentClient: StatsigClient | undefined;

  private experimentsMap: Record<string, ExposedExperiment> = {};

  private statsigOptions: Required<Pick<StatsigOptions, 'networkConfig'>> & StatsigOptions = {
    environment: { tier: getEnvironment() },
    networkConfig: {
      api: STATSIG_API_HOST,
    },
  };

  static getInstance(): ExperimentClient {
    if (!ExperimentClient.instance) {
      ExperimentClient.instance = new ExperimentClient();
    }
    return ExperimentClient.instance;
  }

  initializeExperimentClient = async (options: InitializeExperimentClientOptions = {}): Promise<void> => {
    if (!this.experimentClient) {
      if (!options.user) {
        throw new Error('User is required for client-side experiments');
      }
      if (__IS_COMCAST_PLATFORM_FAMILY__) {
        this.removeStatsigCookie();
      }
      /* istanbul ignore next */
      if (__TESTING__ || FeatureSwitchManager.isDisabled('Experiments')) {
        this.statsigOptions.networkConfig.preventAllNetworkTraffic = true;
      }
      /* istanbul ignore next */
      if (__IS_ALPHA_ENV__ || !__PRODUCTION__) {
        const { LocalOverrideAdapter } = require('@statsig/js-local-overrides');
        const overrideAdapter = new LocalOverrideAdapter(STATSIG_CLIENT_SDK_KEY);
        this.statsigOptions.overrideAdapter = overrideAdapter;
        exposeToTubiGlobal({ statsigOverrideAdapter: overrideAdapter });
      }
      this.experimentClient = new StatsigClient(STATSIG_CLIENT_SDK_KEY, options.user, this.statsigOptions);
      await this.experimentClient.initializeAsync();
      if (window.__EXPERIMENT_INITIALIZE_RESPONSE__) {
        this.experimentClient.dataAdapter.setData(window.__EXPERIMENT_INITIALIZE_RESPONSE__);
        delete window.__EXPERIMENT_INITIALIZE_RESPONSE__;
      }
      this.addEventListener();
      window.addEventListener('beforeunload', () => {
        this.removeEventListener();
        this.experimentClient?.shutdown();
      });
    }
  };

  /**
   * Remove all statsig cookies from the browser since we got a lot of set cookie error logs from comcast
   * We can remove this code once the logs are gone
   */
  private removeStatsigCookie() {
    const cookies = getAllKeysFromCookie();
    cookies.forEach((cookie) => {
      // The statsig cookies key has timestamp in it, so we use prefix to remove all statsig cookies
      if (cookie.startsWith('statsig')) {
        removeCookie(cookie);
      }
    });
  }

  private getExperimentClient(): StatsigClient {
    if (!this.experimentClient) {
      throw new Error('Experiment client not initialized');
    }
    return this.experimentClient;
  }

  private addEventListener = () => {
    const client = this.getExperimentClient();
    client.on('logs_flushed', this.handleExperimentExposure);
  };

  private removeEventListener = () => {
    const client = this.getExperimentClient();
    client.off('logs_flushed', this.handleExperimentExposure);
  };

  private handleExperimentExposure = (event: StatsigClientEvent<'logs_flushed'>) => {
    event.events.forEach((event) => {
      if ([CONFIG_EXPOSURE_NAME, LAYER_EXPOSURE_NAME].includes(event?.eventName as string)) {
        const experimentName = (event.metadata as { config: string })?.config;
        const experimentDescriptor = this.experimentsMap[experimentName];
        if (experimentDescriptor) {
          ExposureEmitter.getInstance().add(experimentDescriptor);
        }
      }
    });
  };

  getExperiment: GetExperiment = <TParams extends Record<string, unknown>>(experimentDescriptor: ExperimentDescriptor<TParams>, options?: ExperimentOptions) => {
    const experimentName = experimentDescriptor.layer ?? experimentDescriptor.name;
    const client = this.getExperimentClient();

    const getFn = experimentDescriptor.isDynamicConfig ? client.getDynamicConfig : experimentDescriptor.layer ? client.getLayer : client.getExperiment;
    const experiment = getFn(experimentName, {
      disableExposureLog: options?.disableExposureLog,
    });
    const isInExperiment = 'groupName' in experiment ? !!experiment.groupName : false;
    const value: TParams = 'value' in experiment && !isEmpty(experiment.value) ? (experiment.value as TParams) : (experimentDescriptor.defaultParams as TParams);
    this.experimentsMap[experimentName] = {
      experimentName: experimentDescriptor.name,
      inYoubora: experimentDescriptor.inYoubora,
      treatment: 'groupName' in experiment ? experiment.groupName : null,
    };
    // when developing log exposure right away for the overlay
    if (!__PRODUCTION__ && !FeatureSwitchManager.isDefault('ExposureLogOverlay')) {
      client.flush();
    }
    return {
      get: <K extends keyof TParams>(key: K): TParams[K] => experiment.get(key as string, experimentDescriptor.defaultParams[key]) as TParams[K],
      isInExperiment,
      value,
    };
  };
  getClientInitializeResponse = (): void => {};
}

// Create a singleton instance
const experimentClientInstance = ExperimentClient.getInstance();

export default experimentClientInstance;
