import type { SelectOptions } from '@adrise/web-ui/lib/Select/Select';
import Select from '@adrise/web-ui/lib/Select/Select';
import React, { useCallback } from 'react';

interface ComposedSelectProps {
  name: string;
  options: SelectOptions[];
  setFieldError: (name: string, msg: string) => void;
  error?: string;
  handleSelectChange?: (field: string, value: string, shouldValidate?: boolean) => void;
  fixedLabel?: boolean;
  label?: string;
  native?: boolean;
  value?: string;
  className?: string;
}
// Lets us compose with more props and control handleSelect with formik without having to make changes in web-ui
const ComposedSelect = (props: ComposedSelectProps) => {
  const { name, error, label, setFieldError, handleSelectChange } = props;
  const handleSelectChangeCallback = useCallback((e: { target: { value: string; }; }) => {
    const { target: { value: newValue } } = e;
    if (error) setFieldError(name, '');
    if (handleSelectChange && !!newValue) {
      handleSelectChange(name, newValue);
    }
  }, [name, error, setFieldError, handleSelectChange]);

  return (
    <Select
      {...props}
      onChange={handleSelectChangeCallback}
      aria-label={label}
    />
  );
};

ComposedSelect.displayName = 'ComposedSelect';

export default ComposedSelect;
