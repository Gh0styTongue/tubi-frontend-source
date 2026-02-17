import classNames from 'classnames';
import React, { PureComponent } from 'react';

import styles from './Popup.scss';

export type Placement =
    | 'top'
    | 'topRight'
    | 'topLeft'
    | 'bottom'
    | 'bottomRight'
    | 'bottomLeft';

interface PopupProps {
  className?: string,
  placement: Placement
}

/**
 * simple popup with a small arrow
 */
class Popup extends PureComponent<React.PropsWithChildren<PopupProps>> {
  static defaultProps = {
    placement: 'top',
  };

  render() {
    const { className, placement, children } = this.props;
    const classes = classNames(styles.popup, styles[placement], className);
    return (
      <div
        className={classes}
        data-test-id="uilib-popup"
      >
        {children}
      </div>
    );
  }
}
export default Popup;
