import hoistNonReactStatics from 'hoist-non-react-statics';
import React from 'react';
import type { ComponentType } from 'react';

import { VideoPlayerProvider } from 'common/features/playback/context/playerContext/playerContext';

export default function withPlayerContextProvider<P extends object>(WrappedComponent: ComponentType<P>) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithProvider = (props: P) => {
    return <VideoPlayerProvider><WrappedComponent {...(props)} /></VideoPlayerProvider>;
  };

  hoistNonReactStatics(ComponentWithProvider, WrappedComponent);

  ComponentWithProvider.displayName = `withPlayerContextProvider(${displayName})`;
  return ComponentWithProvider;
}
