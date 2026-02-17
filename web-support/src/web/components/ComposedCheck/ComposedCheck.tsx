import type { SelectOptions } from '@adrise/web-ui/lib/Select/Select';
import { Checkbox } from '@tubitv/web-ui';
import React, { PureComponent } from 'react';

interface ComposedSelectProps {
  name: string;
  value?: string;
  options: SelectOptions[];
  setFieldError: (name: string, msg: string) => void;
  error?: string;
  handleSelectChange?: (field: string, value: string, shouldValidate?: boolean) => void;
  type?: 'radio' | 'checkbox';
}
// Lets us compose with more props and control handleSelect with formik without having to make changes in web-ui
class ComposedCheck extends PureComponent<ComposedSelectProps> {
  /* istanbul ignore next */
  handleSelectChange = (id?: string) => {
    const { name, error, setFieldError, handleSelectChange, value } = this.props;
    if (error) setFieldError(name, '');
    if (handleSelectChange && !!id) {
      handleSelectChange(name, id === value ? '' : id);
    }
  };

  render() {
    const { options, value, ...others } = this.props;
    return (
      options.map(option => (
        <Checkbox
          id={option.value}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          onChange={this.handleSelectChange.bind(this)}
          inverted
          useDefaultIcon
          {...others}
        />
      ))
    );
  }
}
export default ComposedCheck;
