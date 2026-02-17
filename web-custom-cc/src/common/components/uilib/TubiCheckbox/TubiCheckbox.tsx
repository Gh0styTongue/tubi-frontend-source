import classNames from 'classnames';
import React, { PureComponent } from 'react';

import styles from './TubiCheckbox.scss';

export interface TubiCheckboxProps {
  value: string,
  handleChange?: (key: TubiCheckboxProps['checkboxKey']) => void,
  checkboxKey: string,
  checked?: boolean,
  extraClassName?: string,
}

class TubiCheckbox extends PureComponent<TubiCheckboxProps> {
  static defaultProps = {
    checked: true,
  };

  handleClick = () => {
    const { handleChange, checkboxKey } = this.props;
    if (handleChange) {
      handleChange(checkboxKey);
    }
  };

  render() {
    const { value, checked, extraClassName } = this.props;
    return (
      <div className={classNames(styles.checkbox, extraClassName)}>
        <label>
          <input
            type="checkbox"
            value={value}
            checked={checked}
            onChange={this.handleClick}
          />
          {value}
        </label>
      </div>
    );
  }
}
export default TubiCheckbox;
