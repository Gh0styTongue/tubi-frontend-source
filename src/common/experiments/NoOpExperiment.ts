import type { ExperimentParams } from './Experiment';
import { Experiment } from './Experiment';

/**
 * A subclass of Experiment<T> that can be used in place of an experiment so that it has the same API, but does
 * nothing and cannot be overridden.
 *
 * Especially useful in the case where we want to disable an experiment in code, but still leave all the rest
 * of the code unchanged. For example, on platforms where it does not apply.
 */
export default class NoOpExperiment<T, K extends string> extends Experiment<T, K> {
  /**
   * Returns whether the experiment is currently enabled or not.
   */
  readonly enabled: boolean = false;

  private readonly forcedValue: T;

  constructor(params: ExperimentParams<T, K>) {
    super(params);
    this.forcedValue = params.defaultValue;
    this.shouldFetchNS = false;
    // When using no-op experiments, there is no fetch of experiment data and thus no experiment data in the store.
    // We just use the default value instead, so skip the deferred initialization stuff.
    this.isInitialized = true;
  }

  init(): void {
    // deliberately empty, there is nothing to do here for disabled experiments
  }

  getValue(): T {
    return this.forcedValue;
  }

  canOverride(): boolean {
    return false;
  }

  disableOverride(): void {
    // do nothing, since it can't be overridden
  }

  logExposure(): boolean {
    // do nothing
    return false;
  }

  isInExperiment(): boolean {
    return false;
  }

  isInHoldout(): boolean {
    return false;
  }
}
