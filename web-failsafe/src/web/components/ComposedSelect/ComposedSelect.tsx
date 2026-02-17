import type { SelectOptions } from '@adrise/web-ui/lib/Select/Select';
import Select from '@adrise/web-ui/lib/Select/Select';
import React, { PureComponent } from 'react';

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
class ComposedSelect extends PureComponent<ComposedSelectProps> {
  handleSelectChange = (e: { target: { value: string } }) => {
    const { name, error, setFieldError, handleSelectChange } = this.props;
    const { target: { value: newValue } } = e;
    if (error) setFieldError(name, '');
    if (handleSelectChange && !!newValue) {
      handleSelectChange(name, newValue);
    }
  };

  render() {
    const { error, name, ...others } = this.props;
    return (
      <Select
        name={name}
        onChange={this.handleSelectChange.bind(this)}
        error={error}
        {...others}
      />
    );
  }
}
export default ComposedSelect;
