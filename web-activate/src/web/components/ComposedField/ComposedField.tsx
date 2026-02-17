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
  ...props
}) => {
  const wasAutoFocusedRef = useRef(false);
  const FastFieldRender: React.FunctionComponent<FastFieldProps> = ({
    field: { onChange, onBlur, onFocus, ...fieldProps },
    form: { touched = {}, errors = {}, status = {}, setFieldError, setStatus },
  }) => {
    const error = errors && name && touched && touched[name] && errors[name];
    const { formError } = status;
    return (
      <FormComponent
        name={name}
        error={error}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
            // When autoFocused is enabled, react focuses the field on mount,
            // which then immediately clears any field errors that were set.
            // We'll prevent this here by only calling setFieldError for
            // subsequent focus events.
            wasAutoFocusedRef.current = true;
          } else if (error) {
            setFieldError(name, '');
          }
          if (handleFocus) handleFocus(e);
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
