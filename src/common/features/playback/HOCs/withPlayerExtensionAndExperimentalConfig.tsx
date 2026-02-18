import type { ExperimentalConfig, ExtensionConfig } from '@adrise/player';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentType } from 'react';
import React from 'react';

import { isAFTMMModel } from 'common/utils/device';

import type { UseExperimentalProps } from '../hooks/useExperimentalConfig';
import useExperimentalConfig from '../hooks/useExperimentalConfig';
import useExtensionConfig from '../hooks/useExtensionConfig';
import type { UseExtensionConfigProps } from '../hooks/useExtensionConfig';

type InjectedProps = {
  experimentalConfig: ExperimentalConfig;
  extensionConfig: ExtensionConfig;
};

export interface WithPlayerExtensionAndExperimentalConfigProps extends UseExtensionConfigProps, UseExperimentalProps, Partial<InjectedProps> {}

export function withPlayerExtensionAndExperimentalConfig<P extends Omit<WithPlayerExtensionAndExperimentalConfigProps, keyof InjectedProps>>(Component: ComponentType<P>) {
  /* istanbul ignore next */
  const displayName = Component.displayName || Component.name || 'Component';

  const WithPlayerExtensionAndExperimentalConfig: ComponentType<P> = (props: P) => {
    const { videoResource, getVideoResource, playerName } = props;
    const resource = getVideoResource ? getVideoResource() : videoResource;
    const experimentalConfig = useExperimentalConfig({
      videoResource: resource,
      playerName,
    });
    const extensionConfig = useExtensionConfig({
      ...props,
      videoResource: resource,
      forceClearMediaKeysAfterDetached: isAFTMMModel() && experimentalConfig.enableHlsDetachDuringAds,
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
