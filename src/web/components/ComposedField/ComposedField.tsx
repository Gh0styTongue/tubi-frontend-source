import { FastField } from 'formik';
import React, { useRef } from 'react';

export interface ComposedFieldProps {
  name: string;
  component: React.ComponentType<any>;
  format?: (arg: string) => string;
  validate?: ((arg: string) => string) | ((args: string) => Promise<unknown>);
  handleBlur?: (e: FormEvent) => void;
  handleFocus?: (e: React.SyntheticEvent<HTMLInputElement>) => void;
  label?: string;
  tag?: string;
  fixedLabel?: unknown;
  hint?: string;
  containerClass?: string;
  canShowPassword?: boolean;
  enablePasswordToggle?: boolean;
  required?: boolean;
  id?: string;
}

interface Target {
  name: string;
  value: string;
}
interface FormEvent {
  target: Target;
}

interface FastFieldProps {
  field: {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: FormEvent) => void;
    onFocus: (e: React.SyntheticEvent) => void;
  };
  form: {
    errors?: Record<string, unknown>;
    touched?: Record<string, unknown>;
    status?: { formError: string };
    setFieldError: (name: string, msg: string) => void;
    setStatus: (arg: { formError: string }) => void;
  };
}

const ComposedField: React.FunctionComponent<JSX.IntrinsicElements['input'] & ComposedFieldProps> = ({
  name,
  format,
  validate,
  component: FormComponent,
  handleBlur,
  handleFocus,
  required,
  id,
  ...props
}) => {
  const wasAutoFocusedRef = useRef(false);
  const FastFieldRender: React.FunctionComponent<FastFieldProps> = ({
    field: { onChange, onBlur, onFocus, ...fieldProps },
    form: { touched = {}, errors = {}, status = {}, setFieldError, setStatus },
  }) => {
    const error = errors && name && touched && touched[name] && errors[name];
    const { formError } = status;

    // Generate unique ID if not provided
    const inputId = id || `${name}-field`;

    return (
      <FormComponent
        name={name}
        id={inputId}
        error={error}
        required={required}
        onChange={/* istanbul ignore next */(e: React.ChangeEvent<HTMLInputElement>) => {
          if (format) e.target.value = format(e.target.value);
          onChange(e);
          if (formError) setStatus({ formError: '' });
          if (error) setFieldError(name, '');
        }}
        onBlur={(e: FormEvent) => {
          if (handleBlur) handleBlur(e);
          onBlur(e);
        }}
        onFocus={(e: React.SyntheticEvent<HTMLInputElement>) => {
          if (props.autoFocus && !wasAutoFocusedRef.current) {
            wasAutoFocusedRef.current = true;
          }
          if (handleFocus) handleFocus(e);
          /* istanbul ignore next */
          if (onFocus) onFocus(e);
        }}
        {...fieldProps}
        {...props}
      />
    );
  };

  return <FastField name={name} validate={validate} render={FastFieldRender} />;
};

export default ComposedField;
