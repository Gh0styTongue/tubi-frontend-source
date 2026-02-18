import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentType, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, MemoExoticComponent, FC, ComponentProps, ForwardedRef } from 'react';
import React, { forwardRef, memo } from 'react';

import type { Experiment } from 'common/experiments/Experiment';
import { ExperimentStoreConsumer } from 'common/experiments/ExperimentStoreContext';
import type { ExperimentFactory } from 'common/experiments/types';

interface Options {
  forwardRef?: boolean;
  memo?: boolean;
}

type InnerWrapperProps<PROPS, CONFIG, REF> =
  Omit<PROPS, keyof CONFIG>
  & RefAttributes<REF>
  & {
    /** provided by the forwardRef wrapper */
    forwardedRef?: ForwardedRef<REF>
  }
  & OptionalPlaybackComponentExperimentProps;

type InnerWrapperComponent<ORIGINAL_COMPONENT extends ComponentType<any>, CONFIG, REF> =
  FC<InnerWrapperProps<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>>;

type ForwardRefWrapper<PROPS, CONFIG, REF> =
  ForwardRefExoticComponent<
    PropsWithoutRef<
      InnerWrapperProps<PROPS, CONFIG, REF>
    >
  >;

type WithExperimentIntermediate<ORIGINAL_COMPONENT extends ComponentType<any>, CONFIG, OPTIONS extends Options, REF> =
  (OPTIONS['forwardRef'] extends true
    ? OPTIONS['memo'] extends true
      ? MemoExoticComponent<ForwardRefWrapper<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>>
      : ForwardRefWrapper<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>
    : OPTIONS['memo'] extends true
      ? MemoExoticComponent<InnerWrapperComponent<ORIGINAL_COMPONENT, CONFIG, REF>>
      : FC<InnerWrapperProps<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>>);

type WithHoistedStatics<WRAPPER extends ComponentType<any>, ORIGINAL_COMPONENT extends ComponentType<any>> = WRAPPER & hoistNonReactStatics.NonReactStatics<ORIGINAL_COMPONENT>;

type WithExperimentComponent<ORIGINAL_COMPONENT extends ComponentType<any>, CONFIG, OPTIONS extends Options, REF> =
  WithHoistedStatics<
    WithExperimentIntermediate<ORIGINAL_COMPONENT, CONFIG, OPTIONS, REF>,
    ORIGINAL_COMPONENT
  > & {WrappedComponent: 'WrappedComponent' extends keyof ORIGINAL_COMPONENT ? ORIGINAL_COMPONENT['WrappedComponent'] : ORIGINAL_COMPONENT };

interface OptionalPlaybackComponentExperimentProps {
  youboraExperimentMap?: {[key: string]: Experiment};
}

export type PlaybackComponentExperimentProps = Required<OptionalPlaybackComponentExperimentProps>;

type PropsFromExperiments<CONFIG> = {
  [KEY in keyof CONFIG]: CONFIG extends ExperimentFactory<infer V, any> ? V : never
};

/**
 * This higher-order component injects multiple `Experiment` instances as props
 * to the wrapped component. Use this to avoid errors during server rendering,
 * when the `ExperimentManager` instance is unique for each request and requires
 * the store to get the correct instance.
 *
 * @param InnerComponent - The component to wrap
 * @param config - An object literal where the key is the prop name, and the
 * value is a function that returns an Experiment instance given an optional
 * store. This function is usually a default export from a file in the
 * `src/common/experiments/config/` directory.
 *
 * @remarks
 *
 * If used with a Redux connected component, this HOC should wrap the return
 * value of `connect()`, not the other way around. The HOC forwards static
 * properties including `WrappedComponent`.
 *
 * Usage example:
 * ```ts
 * import React, { Component } from 'react';
 * import { Experiment } from 'common/experiments/Experiment';
 * import withExperiment from 'common/HOCs/withExperiment';
 * import OTTLandingPageFlow, { TreatmentName, TreatmentValue } from 'common/experiments/config/ottLandingPageFlow';
 *
 * interface Props { ottLandingPageFlow: Experiment<TreatmentValue, TreatmentName> };
 *
 * class MyLandingPage extends Component {
 *   componentDidMount() {
 *     this.props.ottLandingPageFlow.logExposure();
 *   }
 *
 *   render() {
 *     const { ottLandingPageFlow } = this.props;
 *     const experimentValue = ottLandingPageFlow.getValue();
 *     // Render using experiment value...
 *   }
 * }
 *
 * export default withExperiment(MyLandingPage, { ottLandingPageFlow: OTTLandingPageFlow });
 * ```
 */
const withExperiment = <
  ORIGINAL_COMPONENT extends ComponentType<any>,
  CONFIG extends Record<string, ExperimentFactory<any, any>>,
  OPTIONS extends Options = Options,
  REF = OPTIONS['forwardRef'] extends true ? unknown : never,
>(InnerComponent: ORIGINAL_COMPONENT, config: CONFIG, options?: OPTIONS): WithExperimentComponent<ORIGINAL_COMPONENT, CONFIG, OPTIONS, REF> => {
  // We have to cast here because for various reasons TypeScript doesn't special
  // case Object.keys()
  const keys = Object.keys(config) as (string & keyof typeof config)[];

  // use the same object to avoid prop changes
  let youboraExperimentMap: {[key: string]: Experiment} = {};

  const InnerWrapper: InnerWrapperComponent<ORIGINAL_COMPONENT, CONFIG, REF> = (propsWithForwardedRef) => (
    <ExperimentStoreConsumer>
      {(store) => {
        // use the forwarded ref property if it exists
        if (propsWithForwardedRef.youboraExperimentMap) {
          youboraExperimentMap = propsWithForwardedRef.youboraExperimentMap;
        }
        const propsFromExperiments = keys.reduce<PropsFromExperiments<CONFIG>>((all, propName) => {
          const experiment = config[propName](store);
          if (experiment.inYoubora) {
            youboraExperimentMap[propName] = experiment;
          }
          return {
            ...all,
            [propName]: experiment,
          };
        }, {} as PropsFromExperiments<CONFIG>);
        const { forwardedRef, ...ownProps } = propsWithForwardedRef;
        const allProps = { ...ownProps, ...propsFromExperiments, ref: forwardedRef } as ComponentProps<ORIGINAL_COMPONENT>;
        if (Object.keys(youboraExperimentMap).length) {
          allProps.youboraExperimentMap = youboraExperimentMap;
        }

        return <InnerComponent {...allProps} />;
      }}
    </ExperimentStoreConsumer>
  );

  /* istanbul ignore next */
  const OuterWrapper = options?.forwardRef
    ? options?.memo
      ? memo(forwardRef<REF, InnerWrapperProps<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>>((props, ref) => (<InnerWrapper {...props} forwardedRef={ref} />)))
      : forwardRef<REF, InnerWrapperProps<ComponentProps<ORIGINAL_COMPONENT>, CONFIG, REF>>((props, ref) => (<InnerWrapper {...props} forwardedRef={ref} />))
    : options?.memo
      ? memo(InnerWrapper)
      : InnerWrapper;

  return hoistNonReactStatics(
    Object.assign(OuterWrapper, { WrappedComponent: InnerComponent }),
    InnerComponent
  ) as WithExperimentComponent<ORIGINAL_COMPONENT, CONFIG, OPTIONS, REF>;
};

export default withExperiment;
