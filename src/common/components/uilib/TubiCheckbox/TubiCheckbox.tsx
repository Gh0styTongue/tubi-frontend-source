import classNames from 'classnames';
import React, { useCallback } from 'react';

import styles from './TubiCheckbox.scss';

export interface TubiCheckboxProps {
  value: string,
  handleChange?: (key: TubiCheckboxProps['checkboxKey']) => void,
  checkboxKey: string,
  checked?: boolean,
  extraClassName?: string,
}

function TubiCheckbox({ value, checked = true, extraClassName, checkboxKey, handleChange }: TubiCheckboxProps) {

  const handleClick = useCallback(() => {
    if (handleChange) {
      handleChange(checkboxKey);
    }
  }, [handleChange, checkboxKey]);

  return (
    <div className={classNames(styles.checkbox, extraClassName)}>
      <label>
        <input
          type="checkbox"
          value={value}
          checked={checked}
          onChange={handleClick}
        />
        {value}
      </label>
    </div>
  );
}

export default TubiCheckbox;
