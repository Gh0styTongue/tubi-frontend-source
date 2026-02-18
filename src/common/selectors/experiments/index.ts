import get from 'lodash/get';
import { createSelector } from 'reselect';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import type { ExperimentValue } from 'common/experiments/types';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { ExperimentParameter, LocalOverrideParameter } from 'common/types/experiments';
import type { StoreState } from 'common/types/storeState';

interface ExperimentProps {
  namespace: string;
  parameter: string;
}

export interface ExperimentPropsWithConfig<T extends ExperimentConfig<unknown, string>> extends ExperimentProps {
  config: T;
  experimentName?: string;
}

type NullableParam<V = unknown, T extends string = string> = ExperimentParameter<V, T> | null;
type NullableOverrideParam<T extends string> = LocalOverrideParameter<T> | null;

export const experimentParameterSelector = createSelector(
  (state: StoreState) => state.experiments,
  (_: StoreState, { namespace }: ExperimentProps) => namespace,
  (_: StoreState, { parameter }: ExperimentProps) => parameter,
  (experiments, namespace, parameter) => {
    return get(experiments, ['namespaces', namespace, 'parameters', parameter], null);
  },
) as <V, T extends string>(state: StoreState, props: ExperimentProps) => NullableParam<V, T>;

export const isExperimentInHoldoutSelector = createSelector(
  (state: StoreState) => state.experiments,
  (_: StoreState, { namespace }: ExperimentProps) => namespace,
  (_: StoreState, { parameter }: ExperimentProps) => parameter,
  (experiments, namespace, parameter) => {
    return get(experiments, ['namespaces', namespace, 'parameters', parameter, 'inHoldout'], false);
  },
) as (state: StoreState, props: ExperimentProps) => boolean;

export const holdoutDomainSelector = createSelector(
  (state: StoreState) => state.experiments,
  (_: StoreState, { namespace }: ExperimentProps) => namespace,
  (_: StoreState, { parameter }: ExperimentProps) => parameter,
  (experiments, namespace, parameter) => {
    return get(experiments, ['namespaces', namespace, 'parameters', parameter, 'domain'], '');
  },
) as (state: StoreState, props: ExperimentProps) => string;

export const localOverrideParameterSelector = createSelector(
  (state: StoreState) => state.experiments,
  (_: StoreState, { namespace }: ExperimentProps) => namespace,
  (_: StoreState, { parameter }: ExperimentProps) => parameter,
  (experiments, namespace, parameter) => {
    return get(experiments, ['localOverrides', namespace, 'parameters', parameter], null);
  },
) as <T extends string>(state: StoreState, props: ExperimentProps) => NullableOverrideParam<T>;

// extract popper experiment value from redux state
export const popperExperimentsSelector = createSelector(
  experimentParameterSelector,
  localOverrideParameterSelector,
  <T extends ExperimentConfig<unknown, string>>(_: StoreState, { config }: ExperimentPropsWithConfig<T>) => config,
  (
    experimentParameter: NullableParam<unknown, string>,
    localOverrideParameter: NullableOverrideParam<string>,
    config: ExperimentConfig<unknown, string>,
  ) => {
    if (FeatureSwitchManager.isDisabled('Experiments')) return config.defaultValue;
    if (localOverrideParameter !== null) {
      const treatmentObj = config.treatments.find((t) => t.name === localOverrideParameter.treatment);
      if (treatmentObj) {
        return treatmentObj.value;
      }
    }
    return experimentParameter?.value ?? config.defaultValue;
  },
) as <T extends ExperimentConfig<unknown, string>>(state: StoreState, props: ExperimentPropsWithConfig<T>) => ExperimentValue<T>;

