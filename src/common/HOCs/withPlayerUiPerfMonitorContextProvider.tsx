import hoistNonReactStatics from 'hoist-non-react-statics';
import React from 'react';
import type { ComponentType } from 'react';

import { PlayerUiPerfMonitorProvider } from 'web/features/playback/contexts/playerUiPerfMonitorContext/playerUiPerfMonitorContext';

export default function withPlayerUiPerfMonitorContextProvider<P extends object>(WrappedComponent: ComponentType<P>) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithProvider = (props: P) => {
    return <PlayerUiPerfMonitorProvider><WrappedComponent {...(props)} /></PlayerUiPerfMonitorProvider>;
  };

  hoistNonReactStatics(ComponentWithProvider, WrappedComponent);

  ComponentWithProvider.displayName = `withPlayerUiPerfMonitorContextProvider(${displayName})`;
  return ComponentWithProvider;
}
