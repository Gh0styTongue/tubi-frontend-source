import type { ExperimentParams } from './Experiment';
import { Experiment } from './Experiment';

/**
 * A subclass of Experiment<T> that can be used in place of an experiment when testing
 * so that a particular state can be easily forced.
 */
export default class MockExperiment<T, K extends string> extends Experiment<T, K> {
  logExposure = jest.fn();

  private forcedValue: T;

  private isOverridden: boolean;

  constructor(params: ExperimentParams<T, K>) {
    super(params);
    this.forcedValue = params.defaultValue;
    this.shouldFetchNS = false;
    // When using mock experiments, there is usually no fetch of experiment data or even experiment data in the store.
    // We just use the mock value or the default value instead, so skip the deferred initialization stuff.
    this.isInitialized = true;
    this.isOverridden = false;
  }

  init(): void {
    // deliberately empty, there is nothing to do here for mocked experiments
  }

  getValue(): T {
    return this.forcedValue;
  }

  enableOverride(treatment: K): void {
    const treatmentObj = this.getAndValidateTreatmentObj(treatment);
    this.forcedValue = treatmentObj.value;
    this.isOverridden = true;
  }

  disableOverride(): void {
    this.forcedValue = this.defaultValue;
    this.isOverridden = false;
  }

  isInExperiment(): boolean {
    // return false unless it has been overridden
    return this.isOverridden;
  }

  isInHoldout(): boolean {
    return false;
  }
}
