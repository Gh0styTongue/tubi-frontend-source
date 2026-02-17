import { Dropdown, ErrorMessage, TextInput } from '@tubitv/web-ui';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { IntlFormatters } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import DynamicButton from 'common/components/uilib/DynamicButton/DynamicButton';
import { genderOptionsMessages } from 'common/constants/constants';

import styles from './ProfileUserInfo.scss';

const messages = defineMessages({
  firstName: {
    description: 'first name input field label',
    defaultMessage: 'First Name',
  },
  email: {
    description: 'email input field label',
    defaultMessage: 'Email',
  },
  gender: {
    description: 'gender input field label',
    defaultMessage: 'Gender',
  },
  save: {
    description: 'save changes button text',
    defaultMessage: 'Save',
  },
  saving: {
    description: 'save changes button text during settings being saved',
    defaultMessage: 'Saving...',
  },
  saved: {
    description: 'save changes button text when settings have been saved',
    defaultMessage: 'Saved!',
  },
});

interface GenderOption {
  label: string;
  value: string;
}

const getGenderOptions = (formatMessage: IntlFormatters['formatMessage']): GenderOption[] => {
  return [
    { label: formatMessage(genderOptionsMessages.male), value: 'MALE' },
    { label: formatMessage(genderOptionsMessages.female), value: 'FEMALE' },
    { label: formatMessage(genderOptionsMessages.other), value: 'OTHER' },
  ];
};

export interface ProfileUserInfoProps {
  email: string;
  firstName: string;
  gender?: string;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenderChange: (option: GenderOption) => void;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: () => Promise<any>;
  unsaved: boolean;
  updateErrorMessage: string | null;
}

export const ProfileUserInfo: FC<ProfileUserInfoProps> = ({
  firstName,
  handleNameChange,
  handleEmailChange,
  email,
  gender,
  handleGenderChange,
  handleSave,
  unsaved,
  updateErrorMessage,
}) => {
  const { formatMessage } = useIntl();
  const options = useMemo(() => getGenderOptions(formatMessage), [formatMessage]);
  const defaultOption = useMemo(() => {
    return options.find(option => option.value === gender);
  }, [gender, options]);

  return (
    <div className={styles.formContainer}>
      {updateErrorMessage && <ErrorMessage message={updateErrorMessage} />}
      <TextInput
        autoComplete="given-name"
        containerClass={styles.input}
        label={formatMessage(messages.firstName)}
        name="firstName"
        onChange={handleNameChange}
        type="text"
        value={firstName}
      />
      <TextInput
        autoComplete="email"
        containerClass={styles.input}
        label={formatMessage(messages.email)}
        name="email"
        onChange={handleEmailChange}
        type="email"
        value={email}
      />
      <Dropdown
        defaultOption={defaultOption}
        containerClass={styles.input}
        label={formatMessage(messages.gender)}
        name="gender"
        onSelect={handleGenderChange}
        options={options}
      />
      <DynamicButton
        className={styles.submitButton}
        defaultLabel={formatMessage(messages.save)}
        promise={handleSave}
        submittingLabel={formatMessage(messages.saving)}
        successLabel={formatMessage(messages.saved)}
        type="submit"
        unsaved={unsaved}
        useRefreshStyle
      />
    </div>
  );
};

export default ProfileUserInfo;
