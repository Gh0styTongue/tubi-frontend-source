import classNames from 'classnames';
import type { FormikProps } from 'formik';
import React, { useEffect, useState } from 'react';
import type { IntlFormatters, IntlShape } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { monthOptionsMessages } from 'common/constants/constants-message';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { isLeapYear } from 'common/utils/date';
import ComposedSelect from 'web/components/ComposedSelect/ComposedSelect';

import type { AllProps, InputValue } from '../AgeGateForm';
import styles from '../AgeGateForm.scss';
import messages from '../ageGateFormMessages';

export const getMonthOptions = (formatMessage: IntlFormatters['formatMessage']): InputValue[] => {
  // on mobile, add a placeholder option so that the first option could trigger 'onChange' event
  return ([{ label: '', value: '' }]).concat([
    { label: formatMessage(monthOptionsMessages.jan), value: '1' },
    { label: formatMessage(monthOptionsMessages.feb), value: '2' },
    { label: formatMessage(monthOptionsMessages.mar), value: '3' },
    { label: formatMessage(monthOptionsMessages.apr), value: '4' },
    { label: formatMessage(monthOptionsMessages.may), value: '5' },
    { label: formatMessage(monthOptionsMessages.june), value: '6' },
    { label: formatMessage(monthOptionsMessages.july), value: '7' },
    { label: formatMessage(monthOptionsMessages.aug), value: '8' },
    { label: formatMessage(monthOptionsMessages.sep), value: '9' },
    { label: formatMessage(monthOptionsMessages.oct), value: '10' },
    { label: formatMessage(monthOptionsMessages.nov), value: '11' },
    { label: formatMessage(monthOptionsMessages.dec), value: '12' },
  ]);
};

export const getDayOptions = (year: number, month: number): InputValue[] => {
  const dayOptions = [{ label: '', value: '' }];
  let dayLength = 30;
  if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
    dayLength = 31;
  }
  if (month === 2) {
    dayLength = isLeapYear(year) ? 29 : 28;
  }
  for (let i = 1; i <= dayLength; i++) {
    dayOptions.push({ label: `${i}`, value: `${i}` });
  }
  return dayOptions;
};

export const getYearOptions = (): InputValue[] => {
  const year = new Date().getFullYear();
  const last125Years: InputValue[] = [{ label: '', value: '' }];
  for (let i = 0; i < 125; i++) {
    const yearValue = `${year - i}`;
    last125Years.push({ label: yearValue, value: yearValue });
  }
  return last125Years;
};

const {
  BIRTH_MONTH,
  BIRTH_DAY,
  BIRTH_YEAR,
} = REGISTRATION_FORM_FIELD_NAMES;

export interface DateOfBirthFieldProps {
  intl: IntlShape;
  values: FormValues;
  errors: FormikProps<FormValues>['errors'];
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  setFieldError: FormikProps<FormValues>['setFieldError'];
  trackRegisterProcess?: AllProps['trackRegisterProcess'];
}

const DateOfBirthField: React.FC<DateOfBirthFieldProps> = ({
  intl: { formatMessage },
  values,
  errors,
  setFieldValue,
  setFieldError,
  trackRegisterProcess,
}) => {
  const [monthOptions, updateMonth] = useState<InputValue[]>([]);
  const [dayOptions, updateDay] = useState<InputValue[]>([]);
  const [yearOptions, updateYear] = useState<InputValue[]>([]);

  const onSelect = (name: string, value: string) => {
    if (trackRegisterProcess) {
      trackRegisterProcess({ target: { name, value } });
    }
    setFieldValue(name, value);
  };

  useEffect(() => {
    updateMonth(getMonthOptions(formatMessage));
    updateYear(getYearOptions());
    const dayOptions = getDayOptions(Number(values.birthYear), Number(values.birthMonth));
    updateDay(dayOptions);
    // if currently selected day is beyond the range of selected month, set it as last day
    const lastDayOfMonth = dayOptions[dayOptions.length - 1].value;
    if (Number(values.birthDay) > Number(lastDayOfMonth)) {
      setFieldValue(BIRTH_DAY, lastDayOfMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.birthYear, values.birthMonth]);

  return (
    <div className={styles.birthdayWrapper}>
      {errors.birthYear ? (
        <div className={classNames(styles.fieldHeader, styles.fieldError)}>{errors.birthYear}</div>
      ) : (
        <div className={styles.fieldHeader}>{formatMessage(messages.dobHeaderLabel)}</div>
      )}
      <div className={styles.birthdayFlexWrapper}>
        <ComposedSelect
          name={BIRTH_MONTH}
          setFieldError={setFieldError}
          label={formatMessage(messages.birthMonthLabel)}
          native
          options={monthOptions}
          value={values.birthMonth}
          handleSelectChange={setFieldValue}
          className={styles.birthMonth}
        />
        <ComposedSelect
          name={BIRTH_DAY}
          setFieldError={setFieldError}
          label={formatMessage(messages.birthDayLabel)}
          native
          options={dayOptions}
          value={values.birthDay}
          className={styles.birthDay}
          handleSelectChange={setFieldValue}
        />
        <ComposedSelect
          name={BIRTH_YEAR}
          setFieldError={setFieldError}
          options={yearOptions}
          label={formatMessage(messages.birthYearLabel)}
          native
          value={values.birthYear}
          className={styles.birthYear}
          handleSelectChange={onSelect}
        />
      </div>
    </div>
  );
};

export default DateOfBirthField;
