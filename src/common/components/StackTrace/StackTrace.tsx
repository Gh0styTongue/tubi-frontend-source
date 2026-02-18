import type { ErrorInfo } from 'react';
import React from 'react';

import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import styles from './StackTrace.scss';

const StackTrace = ({ error, errorInfo }: { error: Error, errorInfo?: ErrorInfo }) => {
  const shouldShowError = FeatureSwitchManager.isDefault(['Logging', 'ShowErrorOnPopcornPage'])
    ? (!__PRODUCTION__ && !__IS_ALPHA_ENV__)
    : !FeatureSwitchManager.isDisabled(['Logging', 'ShowErrorOnPopcornPage']);

  if (!shouldShowError) {
    return null;
  }

  return (
    <pre className={styles.errorStack}>
      {error?.stack ?? error?.message}
      {errorInfo?.componentStack ? `\n\nThe above error occurred in one of your React components:${errorInfo.componentStack}` : null}
    </pre>
  );
};

export default StackTrace;
