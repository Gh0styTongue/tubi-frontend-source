import type { Store } from 'redux';

import {
  addExperimentOverride,
  removeExperimentOverride,
  removeExperimentOverrideNamespace,
} from 'common/actions/experiments';
import * as actionTypes from 'common/constants/action-types';
import { EXPERIMENT_MANAGER_EVENTS } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { FAKE_SALT_FOR_OVERRIDES } from 'common/constants/experiments';
import type { ExperimentConfig, ExperimentID, ExperimentTreatment } from 'common/experiments/ExperimentManager';
import { isWhitelisted } from 'common/experiments/isWhitelisted';
import {
  persistExperimentOverride,
  removeExperimentOverride as removePersistedOverride,
} from 'common/experiments/overridePersistence';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { experimentParameterSelector, isExperimentInHoldoutSelector, localOverrideParameterSelector, holdoutDomainSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getInstance as getTrackingManager } from 'common/services/TrackingManager';
import type { ExperimentParameter, LocalOverrideParameter } from 'common/types/experiments';
import type { StoreState } from 'common/types/storeState';
import { buildExposureEvent } from 'common/utils/analytics';

export interface ExperimentParams<T, K extends string> extends ExperimentConfig<T, K> {
  store: Store<StoreState>;
  client: ApiClient;
}

/**
 * Generic parameters:
 * V: the type of the experiment parameter's value, returned by `expInstance.getValue()`. Usually `boolean`.
 * T: the union of string literals representing the possible treatment names. e.g. `'control' | 'in_experiment'`.
 */
export class Experiment<V = unknown, T extends string = string> {
  readonly id: ExperimentID;

  readonly namespace: string;

  /**
   * Returns whether the experiment is currently enabled or not.
   */
  readonly enabled: boolean = true;

  /**
   * The default value to return if not overridden and data not loaded.
   */
  protected readonly defaultValue: V;

  /**
   * Whether the `init()` method has been called yet. Use of methods like `getValue()` and `logExposure()` won't
   * work unless the store has been populated with results from the server.
   */
  protected isInitialized: boolean = false;

  /**
   * Whether ExperimentManager should fetch the namespace or not.
   * Overridden by MockExperiment and NoOpExperiment classes.
   */
  protected shouldFetchNS: boolean;

  /**
   * The current name of the experiment. Will start with "qa." if the user's device ID is whitelisted,
   * or the experiment is overridden.
   */
  private expName: string = '';

  /**
   * A necessary but fairly useless value. The intention is that the salt remains constant throughout an experiment.
   * In the case of overridden experiments, the salt is set to a fixed, arbitrary string. Otherwise, it is the
   * "segment" returned by Popper.
   */
  private expSalt: string = '';

  /**
   * The name of the current treatment, if the experiment is overridden or the user is in the experiment naturally.
   */
  private expTreatment: T | null = null;

  /**
   * The experiment name returned by Popper if the user is in the experiment. Will start with `qa.` if whitelisted.
   */
  private originalExperimentName: string;

  /**
   * The `segment` value returned from Popper, if the user is in the experiment.
   */
  private originalSalt: string = '';

  /**
   * The `treatment` returned by Popper if the user is in the experiment, `null` if not.
   */
  private originalTreatment: T | null = null;

  /**
   * The value of the resource parameter if returned by Popper, or the default value.
   */
  private originalValue: V;

  /**
   * The name of the experiment passed in when it is registered. Will never start with `qa.`.
   * This gives us a reliable way of getting the plain experiment name, regardless of whitelisting status or overrides.
   */
  readonly configuredExperimentName: string;

  /**
   * The name of the property on the resource object for the namespace that is used to evaluate the value of the experiment.
   */
  private readonly expParameter: string;

  /**
   * A selector to get the parameter object from the store (source of truth) for the local override, if present.
   */
  private readonly overrideParameterSelector: (state: StoreState) => (LocalOverrideParameter<T> | null);

  /**
   * A selector to get the parameter object from the store (source of truth) for the results from Popper, if present.
   */
  private readonly parameterSelector: (state: StoreState) => (ExperimentParameter<V, T> | null);

  private readonly holdoutInHoldoutSelector: (state: StoreState) => boolean;

  private readonly holdoutDomainSelector: (state: StoreState) => string;

  private readonly store: Store<StoreState>;

  private readonly client: ApiClient;

  private readonly getManagerInstance: ExperimentParams<V, T>['getManagerInstance'];

  /**
   * An array of treatment names and values that corresponds to the ones registered in popper-config.
   */
  readonly treatments: ExperimentTreatment<V, T>[];

  inYoubora: boolean = false;

  constructor({
    id,
    namespace,
    experimentName,
    parameter,
    defaultValue,
    treatments,
    store,
    client,
    inYoubora,
    getManagerInstance,
  }: ExperimentParams<V, T>) {
    this.id = id;
    this.namespace = namespace;
    if (experimentName.indexOf('qa.') === 0) {
      throw new Error('Do not register experiments using their whitelisted name (qa.<whatever>).');
    }
    /*
     * Until we fetch anything from the store, initialize most of the exp name properties to the passed in exp name.
     * Some of these will get overridden after the fetched results are received.
     */
    this.expName = this.originalExperimentName = this.configuredExperimentName = experimentName;
    this.expParameter = parameter;
    this.store = store;
    const props = { namespace, parameter };
    this.parameterSelector = (state: StoreState) => experimentParameterSelector<V, T>(state, props);
    this.overrideParameterSelector = (state: StoreState) => localOverrideParameterSelector<T>(state, props);
    this.holdoutInHoldoutSelector = (state: StoreState) => isExperimentInHoldoutSelector(state, props);
    this.holdoutDomainSelector = (state: StoreState) => holdoutDomainSelector(state, props);
    this.originalValue = defaultValue; // just in case we call getValue() before the promise resolves
    this.treatments = treatments;
    this.defaultValue = defaultValue;
    this.shouldFetchNS = true;
    this.client = client;
    this.initYouboraConfig(inYoubora);
    this.getManagerInstance = getManagerInstance;
  }

  // need to make these 3 readonly by only having a public getter due to limitations
  // with the use of the readonly modifier with this code.
  get experimentName(): string {
    return this.expName;
  }

  get parameter(): string {
    return this.expParameter;
  }

  get expDefaultValue(): Readonly<V> {
    return this.defaultValue;
  }

  get salt(): string {
    return this.expSalt;
  }

  get shouldFetchNamespace(): boolean {
    return this.shouldFetchNS;
  }

  get treatment(): T | null {
    return this.expTreatment;
  }

  get treatmentFromServer(): T | null {
    return this.originalTreatment;
  }

  init(): void {
    /*
     * Since the store is updated (on the server at least) after the experiment is registered, we need to wait
     * until that happens before we can read values from it. This method is called after
     * the store is updated, to ensure things happen in the right order.
     */
    const state = this.store.getState();
    const parameterObj = this.parameterSelector(state);
    const overrideParameterObj = this.overrideParameterSelector(state);
    const isOverridden = overrideParameterObj !== null;
    this.expSalt = isOverridden ? FAKE_SALT_FOR_OVERRIDES : (parameterObj?.salt ?? '');
    if (parameterObj === null) {
      // if couldn't fetch, set default values
      this.originalValue = this.defaultValue;
      this.originalSalt = '';
      this.originalExperimentName = '';
    } else {
      this.originalValue = parameterObj.value;
      this.originalSalt = parameterObj.salt;
      this.originalExperimentName = parameterObj.experiment;
    }
    /*
     * Set the current experiment name based on what was overridden, what was fetched from Popper, or what it was
     * created with.
     */
    const overriddenExpName = overrideParameterObj?.experiment ?? '';
    const possibleValues = [
      overriddenExpName && isWhitelisted(overriddenExpName) ? overriddenExpName : null,
      overriddenExpName && !isWhitelisted(overriddenExpName) ? `qa.${overriddenExpName}` : null,
      parameterObj?.experiment,
    ];
    this.expName = possibleValues.find((val) => !!val) || '';
    this.originalTreatment = parameterObj?.treatment || null;
    this.expTreatment = overrideParameterObj?.treatment || this.originalTreatment;
    this.isInitialized = true;
  }

  getValue(): V {
    this.throwIfNotInitialized('getValue');
    if (FeatureSwitchManager.isDisabled('Experiments')) return this.defaultValue;
    const state = this.store.getState();
    const param = this.parameterSelector(state);
    const overrideParam = this.overrideParameterSelector(state);
    if (overrideParam !== null) {
      const treatmentObj = this.getTreatmentObj(overrideParam.treatment);
      if (treatmentObj) {
        return treatmentObj.value;
      }
      const name = `${this.namespace}:${this.parameter}`;
      logger.debug(`WARNING: Treatment "${overrideParam.treatment}" was not found for ${name} local override. Ignoring.`);
    }
    if (param === null) {
      // return either the default value, or if for some reason the namespace or parameter got removed
      // since the app started, the value we first fetched.
      return this.originalValue;
    }
    return param.value;
  }

  getTreatments(): Promise<ExperimentTreatment<V, T>[]> {
    // in the future, this will likely fetch treatments from the experiment definition on Popper,
    // so make it async now to support that use case better.
    return Promise.resolve(this.treatments);
  }

  canOverride(): boolean {
    // For an experiment whitelisted, we can still override it for development purpose
    return true;
  }

  enableOverride(treatmentName: T): void {
    if (!this.canOverride()) return;
    const treatmentObj = this.getAndValidateTreatmentObj(treatmentName);
    if (typeof treatmentObj.value === 'undefined') {
      throw new Error(`Treatment "${treatmentName}" value is undefined somehow. Cannot continue.`);
    }
    this.store.dispatch(
      addExperimentOverride({
        namespace: this.namespace,
        parameter: this.parameter,
        experiment: this.configuredExperimentName,
        treatment: treatmentName,
      }),
    );
    this.expName = `qa.${this.configuredExperimentName}`;
    this.expSalt = FAKE_SALT_FOR_OVERRIDES;
    this.expTreatment = treatmentName;
    persistExperimentOverride({
      namespace: this.namespace,
      parameter: this.parameter,
      experiment: this.configuredExperimentName,
      treatment: treatmentName,
    });
    logger.debug(treatmentObj.value, `Enable override for experiment ${this.id}. Treatment: ${treatmentName}, value`);
  }

  disableOverride(): void {
    this.expName = this.originalExperimentName;
    this.expSalt = this.originalSalt;
    this.expTreatment = this.originalTreatment;
    this.store.dispatch(removeExperimentOverride(this.namespace, this.parameter));
    // remove entire namespace if no more parameters overridden
    if (Object.keys(this.store.getState().experiments.localOverrides[this.namespace]?.parameters ?? {}).length === 0) {
      this.store.dispatch(removeExperimentOverrideNamespace(this.namespace));
    }
    removePersistedOverride({ namespace: this.namespace, parameter: this.parameter });
    logger.debug(`Disabling override for experiment ${this.id}`);
  }

  isOverriddenOrWhitelisted(): boolean {
    return isWhitelisted(this.expName);
  }

  isInHoldout(): boolean {
    return this.holdoutInHoldoutSelector(this.store.getState());
  }

  isInExperiment() {
    const isInExperimentAndNotOverriddenOrWhitelisted = this.experimentName === this.configuredExperimentName;
    const isInExperimentDueToBeingOverriddenOrWhitelisted = this.experimentName === `qa.${this.configuredExperimentName}`;
    return isInExperimentAndNotOverriddenOrWhitelisted || isInExperimentDueToBeingOverriddenOrWhitelisted || this.isInHoldout();
  }

  logExposure(): boolean {
    this.throwIfNotInitialized('logExposure');
    this.throwIfLogExposureInServerSide();
    const state = this.store.getState();
    const parameterObject = this.parameterSelector(state);
    const overrideParam = this.overrideParameterSelector(state);
    if (!parameterObject && !overrideParam) return false;
    const treatment: T | undefined = overrideParam?.treatment ?? parameterObject?.treatment;
    const { exposureLogged } = parameterObject ?? {};
    if (this.isInExperiment() && !exposureLogged && treatment) {
      this.dispatchExposureLoggedAction();
      this.dispatchAddEventToQueueAction(treatment);

      const manager = this.getManagerInstance?.();
      manager?.emit(EXPERIMENT_MANAGER_EVENTS.logExposure, this);
      return true;
    }
    return false;
  }

  protected getAndValidateTreatmentObj(treatment: T): ExperimentTreatment<V, T> {
    const treatmentObj = this.getTreatmentObj(treatment);
    if (!treatmentObj) {
      throw new Error(`Unknown treatment "${treatment}". Make sure the treatment mappings are specified when registering the experiment.`);
    }
    return treatmentObj;
  }

  protected getTreatmentObj(treatment: T): ExperimentTreatment<V, T> | undefined {
    return this.treatments.find((t) => t.name === treatment);
  }

  private isWhitelistedInPopper(): boolean {
    return isWhitelisted(this.originalExperimentName);
  }

  private dispatchExposureLoggedAction() {
    // duplicating this from `actions/experiments.js`, because I don't want to export
    //  that function, or people may use it by mistake.
    const action = { type: actionTypes.LOG_EXPERIMENT_EXPOSURE, namespaceName: this.namespace, parameter: this.parameter };
    this.store.dispatch(action);
  }

  private dispatchAddEventToQueueAction(treatment: T) {
    const experiment = {
      namespace: this.isInHoldout() ? this.holdoutDomainSelector(this.store.getState()) : this.namespace,
      name: this.experimentName,
      salt: this.salt,
      parameter_name: this.parameter,
      parameter_value: treatment,
    };
    const event = buildExposureEvent(experiment);
    const trackingManager = getTrackingManager(this.store);
    trackingManager.addEventToQueue(eventTypes.EXPOSURE, event);
  }

  private throwIfNotInitialized(methodName: keyof Experiment): void {
    if (!this.isInitialized) {
      const addToIndexReminder = 'Did you forget to add it to the common/experiments/config/index.ts file, by any chance? 😁';
      throw new Error(`Cannot call ${methodName}() before the init() method has been called.\n${addToIndexReminder}`);
    }
  }

  /**
   * We determined to forbid logging exposure in server side
   * Cause we cannot make sure the exposure can be sent successfully in some cases
   * i.e. we call logExposure in onEnter hook src/common/helpers/routing.ts if we call replace as well, the exposure will not be sent
   * @param exposureLogged
   * @private
   */
  private throwIfLogExposureInServerSide(): void {
    if (__SERVER__ && !__PRODUCTION__) {
      const errorReminder = 'Refer to https://www.notion.so/tubi/Why-we-call-replace-in-route-onEnter-hook-will-lose-the-event-exposure-24011fb867444eb299fac3e22bf83c80';
      throw new Error(`Cannot call logExposure in server side. ${errorReminder}`);
    }
  }

  /**
   * @param inYoubora
   * @private
   */
  private initYouboraConfig(inYoubora: ExperimentConfig<V, T>['inYoubora']):void {
    this.inYoubora = (typeof inYoubora === 'function'
      ? (inYoubora(this.store.getState()))
      : inYoubora) || false;
  }
}
