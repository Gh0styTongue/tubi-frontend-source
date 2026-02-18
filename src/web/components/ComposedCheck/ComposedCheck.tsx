import type { SelectOptions } from '@adrise/web-ui/lib/Select/Select';
import { Checkbox } from '@tubitv/web-ui';
import React, { useCallback } from 'react';

interface ComposedCheckProps {
  name: string;
  value?: string;
  options: SelectOptions[];
  setFieldError: (name: string, msg: string) => void;
  error?: string;
  handleSelectChange?: (field: string, value: string, shouldValidate?: boolean) => void;
  type?: 'radio' | 'checkbox';
}
// Lets us compose with more props and control handleSelect with formik without having to make changes in web-ui
const ComposedCheck = (props: ComposedCheckProps) => {
  const { options, value, name, error, setFieldError, handleSelectChange } = props;

  const handleSelectChangeCallback = useCallback((id?: string) => {
    if (error) setFieldError(name, '');
    if (handleSelectChange && !!id) {
      handleSelectChange(name, id === value ? '' : id);
    }
  }, [name, value, error, setFieldError, handleSelectChange]);

  return (
    options.map(option => (
      <Checkbox
        {...props}
        key={option.value}
        id={option.value}
        value={option.value}
        label={option.label}
        checked={value === option.value}
        onChange={handleSelectChangeCallback}
        inverted
        useDefaultIcon
      />
    ))
  );
};

ComposedCheck.displayName = 'ComposedCheck';

export default ComposedCheck;
