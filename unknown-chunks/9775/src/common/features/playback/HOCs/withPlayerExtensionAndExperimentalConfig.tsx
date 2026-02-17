import type { ExperimentalConfig, ExtensionConfig } from '@adrise/player';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentType } from 'react';
import React from 'react';

import useExperimentalConfig from '../hooks/useExperimentalConfig';
import useExtensionConfig from '../hooks/useExtensionConfig';
import type { UseExtensionConfigProps } from '../hooks/useExtensionConfig';

type InjectedProps = {
  experimentalConfig: ExperimentalConfig;
  extensionConfig: ExtensionConfig;
};

export interface WithPlayerExtensionAndExperimentalConfigProps extends UseExtensionConfigProps, Partial<InjectedProps> {}

export function withPlayerExtensionAndExperimentalConfig<P extends Omit<WithPlayerExtensionAndExperimentalConfigProps, keyof InjectedProps>>(Component: ComponentType<P>) {
  /* istanbul ignore next */
  const displayName = Component.displayName || Component.name || 'Component';

  const WithPlayerExtensionAndExperimentalConfig: ComponentType<P> = (props: P) => {
    const { videoResource, getVideoResource } = props;
    const resource = getVideoResource ? getVideoResource() : videoResource;
    const experimentalConfig = useExperimentalConfig({
      videoResource: resource,
    });
    const extensionConfig = useExtensionConfig({
      ...props,
      videoResource: resource,
    });

    const injectedProps: P & InjectedProps = {
      ...props,
      experimentalConfig,
      extensionConfig,
    };

    return (
      <Component
        {...injectedProps}
      />
    );
  };

  WithPlayerExtensionAndExperimentalConfig.displayName = `withPlayerExtensionAndExperimentalConfig(${displayName})`;

  hoistNonReactStatics(WithPlayerExtensionAndExperimentalConfig, Component);
  return WithPlayerExtensionAndExperimentalConfig;
}
