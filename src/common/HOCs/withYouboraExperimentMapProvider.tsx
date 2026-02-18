import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentType } from 'react';
import React from 'react';

import { YouboraExperimentMapProvider } from 'common/features/playback/context/YouboraExperimentMapContext';

export default function withYouboraExperimentMapProvider<P extends object>(WrappedComponent: ComponentType<P>) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithProvider = (props: P) => {
    return <YouboraExperimentMapProvider><WrappedComponent {...(props)} /></YouboraExperimentMapProvider>;
  };

  hoistNonReactStatics(ComponentWithProvider, WrappedComponent);

  ComponentWithProvider.displayName = `withYouboraExperimentMapProvider(${displayName})`;
  return ComponentWithProvider;
}
