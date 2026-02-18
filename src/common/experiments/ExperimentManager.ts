import { hours } from '@adrise/utils/lib/time';
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import { uniq } from 'lodash';
import type { Store } from 'redux';

import { restoreExperimentOverrides, setNamespace } from 'common/actions/experiments';
import type { PopperResponse } from 'common/api/popper';
import { fetchPopperEvaluateNamespaces } from 'common/api/popper';
import { EXPERIMENT_MANAGER_EVENTS } from 'common/constants/constants';
import { Experiment } from 'common/experiments/Experiment';
import MockExperiment from 'common/experiments/MockExperiment';
import NoOpExperiment from 'common/experiments/NoOpExperiment';
import { loadPersistedExperimentOverrideState } from 'common/experiments/overridePersistence';
import type { ExperimentManagerEvents } from 'common/experiments/types';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type { ExperimentNamespace, ExperimentParameter } from 'common/types/experiments';
import type { StoreActions, StoreState, TubiStore } from 'common/types/storeState';

export namespace TubiExperiments {
  // empty namespaces do not export as an empty object, so define an unused local variable
  const __UNUSED__ = null;
}

// Only allow constants defined on the TubiExperiments namespace to be used as IDs.
// This is to prevent the potential for typos by forcing you to always reference a constant.
export type ExperimentID = typeof TubiExperiments[keyof typeof TubiExperiments];

export interface ExperimentTreatment<T, K extends string> {
  name: K;
  value: T;
}

export interface ExperimentConfig<T, K extends string> {
  id: ExperimentID;
  namespace: string;
  experimentName: string;
  parameter: string;
  defaultValue: T;
  treatments: ExperimentTreatment<T, K>[];
  /**
   * Set to a function that returns false to return an Experiment that always returns the default value,
   * cannot be overridden and does nothing when calling logExposure().
   */
  enabledSelector?: (state: StoreState) => boolean;
  inYoubora?: boolean | ((state: StoreState) => boolean);
  getManagerInstance?: () => ExperimentManager
}

type PopperExperimentConfig<T, K extends string> = Omit<ExperimentConfig<T, K>, 'id' | 'enabledSelector'> & { start: Date };

interface ExperimentMapValue {
  experiment: Experiment;
  prevIsEnabledValue: boolean;
}

export const REFRESH_TIMER_MS = hours(1);

export class ExperimentManager extends TypedEventEmitter<ExperimentManagerEvents> {

  private readonly experiments: Map<ExperimentID, ExperimentMapValue> = new Map();

  private popperConfigs: PopperExperimentConfig<unknown, string>[] | undefined;

  private timerId: number | undefined;

  exposuredExperiments: Experiment[] = [];

  constructor(private store: Store<StoreState>, private client: ApiClient, private useMocks: boolean) {
    super();
    this.restoreLocalOverrides();
    this.addExperimentExposureListener();
  }

  destroy(): void {
    this.reset();
    clearInterval(this.timerId);
    this.removeExperimentExposureListener();
  }

  registerExperiment<V, T extends string>(config: ExperimentConfig<V, T>): Experiment<V, T> {
    const mapEntry = this.experiments.get(config.id);

    // Check the enabledSelector condition, if specified.
    // If a function returning false, return a NoOpExperiment instead.
    const isEnabled = config.enabledSelector === undefined || config.enabledSelector(this.store.getState());
    if (mapEntry?.prevIsEnabledValue === isEnabled) {
      return mapEntry.experiment as Experiment<V, T>;
    }

    const experimentParams = { ...config, store: this.store, client: this.client, getManagerInstance: () => this };
    let experiment: Experiment<V, T>;
    if (isEnabled && !__IS_E2E_TEST__) {
      experiment = this.useMocks
        ? new MockExperiment<V, T>(experimentParams)
        : new Experiment<V, T>(experimentParams);
    } else {
      experiment = new NoOpExperiment<V, T>(experimentParams);
    }
    this.experiments.set(config.id, { experiment, prevIsEnabledValue: isEnabled });
    return experiment;
  }

  addExperimentExposureListener() {
    this.on(EXPERIMENT_MANAGER_EVENTS.logExposure, this.recordExperimentExposure);
  }

  removeExperimentExposureListener() {
    this.off(EXPERIMENT_MANAGER_EVENTS.logExposure, this.recordExperimentExposure);
  }

  startUpdatePoll(): void {
    clearInterval(this.timerId);
    this.timerId = window.setInterval(this.fetchAllNamespaces, REFRESH_TIMER_MS);
  }

  getExperiment<V, T extends string = string>(id: ExperimentID): Experiment<V, T> | undefined {
    return this.experiments.get(id)?.experiment as Experiment<V, T>;
  }

  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).map(({ experiment }) => experiment);
  }

  findControlTreatment<T>(treatments: ExperimentTreatment<T, string>[]): ExperimentTreatment<T, string> | undefined {
    return treatments.find(treatment => treatment.name === 'control');
  }

  getNamespaces() {
    const namespaces: string[] = [];
    this.experiments.forEach(({ experiment }) => {
      if (experiment.shouldFetchNamespace) {
        namespaces.push(experiment.namespace);
      }
    });
    return uniq(namespaces);
  }

  async fetchAllNamespaces({ init = true }: {init?: boolean} = {}): Promise<void> {
    const namespaces = this.getNamespaces();
    if (!namespaces.length) {
      return Promise.resolve();
    }
    try {
      // TODO: after we start using a failsafe-enabled popper endpoint, we won't
      // need the server-side route, so we can just use `fetchPopperEvaluateNamespaces`
      // instead of falling back to /oz/experiments/popper on the server.
      const results: PopperResponse = __CLIENT__
        ? await fetchPopperEvaluateNamespaces(
          this.store as TubiStore,
          this.client,
          namespaces
        )
        : await this.client.get('/oz/experiments/popper', { params: { namespaces } });
      (results || []).namespace_results?.forEach((result) => {
        const resource = JSON.parse(result.resource);
        const experimentResult = result.experiment_result;
        const parameters = {};
        const inHoldout = !!experimentResult?.holdout_info?.in_holdout;
        if (inHoldout) {
          this.getExperiments().forEach(experiment => {
            if (experiment.namespace === result.namespace && !resource.hasOwnProperty(experiment.parameter)) {
              // User should see status_quo frozen experience when missing feature flags in resource
              resource[experiment.parameter] = experiment.expDefaultValue;
            }
          });
        }
        Object.keys(resource).forEach((parameter) => {
          const value = resource[parameter];
          const expParam: ExperimentParameter = {
            name: parameter,
            salt: experimentResult?.segment ?? '',
            experiment: experimentResult?.experiment_name ?? '',
            value,
            valueIsDefault: !experimentResult,
            inHoldout,
            domain: experimentResult?.holdout_info?.domain ?? '',
          };
          if (experimentResult) {
            expParam.treatment = experimentResult.treatment;
          }
          parameters[parameter] = expParam;
        });
        const namespace: ExperimentNamespace = { name: result.namespace, parameters };
        this.store.dispatch(setNamespace(namespace));
      });
    } catch (ex) {
      logger.error(ex, 'Error fetching all namespaces from Popper');
    }
    if (init) {
      this.initAllExperiments();
    }
  }

  /**
   * clears registered experiments, resets internal state
   */
  reset(): void {
    this.experiments.clear();
  }

  initAllExperiments(): void {
    // Tell all the experiments it is safe to read from the store now.
    this.experiments.forEach(({ experiment }) => experiment.init());
  }

  private restoreLocalOverrides(): void {
    // grab the overrides from where they were saved and put them in the store
    const savedOverrideState = loadPersistedExperimentOverrideState();
    this.store.dispatch(restoreExperimentOverrides(savedOverrideState));
  }

  private recordExperimentExposure = (experiment: Experiment):void => {
    this.exposuredExperiments.push(experiment);
  };
}

// if using this on the server, we must know the store for this request, so we can have each request have
// its own ExperimentManager instance. Otherwise, users will share results.
const createInstanceOrMap = (): WeakMap<Store<StoreState>, ExperimentManager> | ExperimentManager | undefined => {
  return __SERVER__
    ? new WeakMap<Store<StoreState>, ExperimentManager>()
    : undefined;
};

let instanceOrMap = createInstanceOrMap();

// Define overloads so we know the correct return type based on the throwErrors parameter value.
// If throwErrors is true, it will throw an error if it would return undefined, so if it returns at all, it will
// be with a valid instance. Otherwise, it might return an instance or undefined.
function getInstanceImpl(store: Store<StoreState> | undefined, throwErrors: true): ExperimentManager;
function getInstanceImpl(store: Store<StoreState> | undefined, throwErrors: false): ExperimentManager | undefined;
function getInstanceImpl(store: Store<StoreState> | undefined, throwErrors: boolean) {
  let instance: ExperimentManager | undefined;
  if (__SERVER__) {
    if (!store && throwErrors) {
      throw new Error('store is a required parameter when invoking ExperimentManager\'s default export on the server');
    }
    instance = (instanceOrMap as WeakMap<Store<StoreState>, ExperimentManager>).get(store!);
  } else {
    instance = (instanceOrMap as ExperimentManager | undefined);
  }
  if (throwErrors && instance == null) {
    throw new Error('Must call configure() with store and ApiClient first');
  }
  return instance;
}

export const removeInstance = (store?: Store<StoreState>) => {
  const instance = getInstanceImpl(store, false);
  // Sometimes when testing we are evaluating when __CLIENT__ is true but the instance was created on the "server"
  // as a WeakMap, so don't crash if we don't have a destroy() method available.
  if (!instance || (__TESTING__ && !instance.destroy)) {
    return;
  }
  instance.destroy();
  // We don't need to remove it from the map or clear the instance, because it is a WeakMap (so doesn't add a reference)
  // or will be overridden if a singleton on the client.
};

// only used for testing
export const removeAllInstances = () => instanceOrMap = createInstanceOrMap();

export const configure = (store: Store<StoreState, StoreActions>, client: ApiClient, useMocks: boolean = false) => {
  const deviceId = __SERVER__ ? deviceIdSelector(store.getState()) : null;
  if (__SERVER__ && !deviceId) {
    throw new Error('Store must be initialized with a deviceId first, before passing it to ExperimentManager#configure()');
  }
  removeInstance(store);
  const experimentManager = new ExperimentManager(store, client, useMocks);
  if (__SERVER__) {
    const map = instanceOrMap as WeakMap<Store<StoreState>, ExperimentManager>;
    map.set(store, experimentManager);
  } else {
    instanceOrMap = experimentManager;
  }
};

export default function getInstance(store?: Store<StoreState, StoreActions>): ExperimentManager {
  return getInstanceImpl(store, true);
}
