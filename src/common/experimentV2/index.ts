import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentProps, ComponentType } from 'react';
import { createElement } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import type { StoreState } from 'common/types/storeState';

import type { ExperimentDescriptor } from './configs/types';
import experiment from './experiment';
import { experimentUserSelector, type ExperimentOptions } from './utils';

export const { initializeExperimentClient, getExperiment, getClientInitializeResponse } = experiment;

export { experimentUserSelector, type ExperimentOptions, type ExperimentUser } from './utils';

export const useExperiment = <TParams extends Record<string, unknown>>(experimentDescriptor: ExperimentDescriptor<TParams>, options?: Omit<ExperimentOptions, 'user'>) => {
  const user = useAppSelector(experimentUserSelector);
  return experiment.getExperiment(experimentDescriptor, { ...options, user });
};

// Helper type for experiment configuration with optional options
type ExperimentConfig<TParams extends Record<string, unknown> = Record<string, unknown>> = {
  config: ExperimentDescriptor<TParams>;
  options?: Omit<ExperimentOptions, 'user'> | ((state: StoreState) => Omit<ExperimentOptions, 'user'>);
};

export type ExperimentConfigMap= Record<string, ExperimentConfig>;

// Helper type to create the experiment values type
type ExperimentValues<M extends Record<string, ExperimentConfig<Record<string, unknown>>>> = {
  [K in keyof M]: M[K] extends ExperimentConfig<infer TParams>
    ? ReturnType<typeof experiment.getExperiment<TParams>>
    : never;
};

export const withExperiment = <
  C extends ComponentType<any>,
  M extends Record<string, ExperimentConfig<Record<string, unknown>>>
>(
    WrappedComponent: C,
    experimentMap: M
  ): hoistNonReactStatics.NonReactStatics<C> & ComponentType<ComponentProps<C> & ExperimentValues<M>> => {
  function EnhancedComponent(props: Omit<ComponentProps<C>, keyof ExperimentValues<M>>) {
    const user = useAppSelector(experimentUserSelector);
    const state = useAppSelector((state: StoreState) => state);

    const experimentProps = Object.fromEntries(
      Object.entries(experimentMap).map(([key, experimentConfig]) => {
        const { config: experimentDescriptor, options } = experimentConfig;

        let resolvedOptions: Omit<ExperimentOptions, 'user'> = {};
        if (options) {
          resolvedOptions = typeof options === 'function' ? options(state) : options;
        }

        const value = experiment.getExperiment(experimentDescriptor, { ...resolvedOptions, user });
        return [key, value];
      })
    ) as ExperimentValues<M>;

    const element = createElement(WrappedComponent, {
      ...props,
      ...experimentProps,
    } as ComponentProps<C>);
    return element;
  }
  return hoistNonReactStatics(EnhancedComponent, WrappedComponent);
};

export type ExperimentProps<T extends Record<string, ExperimentConfig<Record<string, unknown>>>> = {
  [K in keyof T]: {
    get: <P extends keyof T[K]['config']['defaultParams']>(
      key: P
    ) => T[K]['config']['defaultParams'][P];
  };
};
