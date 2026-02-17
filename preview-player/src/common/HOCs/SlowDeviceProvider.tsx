import type { ReactElement } from 'react';
import { connect } from 'react-redux';

import type { StoreState } from 'common/types/storeState';

interface SlowDeviceProviderProps {
  render: (isSlowDevice: boolean) => ReactElement | null;
  isSlowDevice: boolean;
}

/**
 * THIS HOC ('Render Prop') will call the render prop with a boolean for isSlowDevice attribute
 * @link https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce
 */
const SlowDeviceProvider = ({ render, isSlowDevice }: SlowDeviceProviderProps) => render(isSlowDevice);

const connectedComponent = connect(({ ui: { isSlowDevice } }: StoreState) => ({ isSlowDevice }))(SlowDeviceProvider);
if (!__PRODUCTION__) {
  // We don't want to warn about this component re-rendering. Unfortunately, it needs to or a number of things break
  // and stop working. We are therefore relying on React's speedy diffing algorithm to minimize the amount of DOM changes
  // necessary.
  connectedComponent.whyDidYouRender = false;
}

export default connectedComponent;
