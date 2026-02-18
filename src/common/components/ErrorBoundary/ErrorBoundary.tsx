import type { ComponentProps, ComponentType, ErrorInfo, ReactNode } from 'react';
import React, { PureComponent } from 'react';

import logger from 'common/helpers/logging';

export type ErrorBoundaryFallback = (error: Error, errorInfo?: ErrorInfo) => ReactNode;

type Props = {
  readonly children: ReactNode;
  readonly fallback: ErrorBoundaryFallback;
};

type State = { error?: Error, errorInfo?: ErrorInfo };

class ErrorBoundary extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error): Pick<State, 'error'> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.fatal({ error, errorInfo }, `Client side rendering failure: ${error.message}`);
    this.setState({ error, errorInfo });
  }

  override render(): ReactNode {
    const { error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (error != null) {
      return fallback(error, errorInfo);
    }

    return children;
  }
}

export const withErrorBoundary =
  <COMPONENT extends ComponentType<any>>(fallback: ErrorBoundaryFallback, Component: COMPONENT) =>
    (props: ComponentProps<COMPONENT>) =>
      (
        <ErrorBoundary fallback={fallback}>
          <Component {...props} />
        </ErrorBoundary>
      );
