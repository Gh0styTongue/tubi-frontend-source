import classNames from 'classnames';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

import { addNotification } from 'common/actions/ui';
import { updateUserSettings } from 'common/actions/userSettings';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { useLocation, useRouter } from 'common/context/ReactRouterModernContext';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import { userSettingsSelector } from 'common/selectors/userSettings';
import type { Notification } from 'common/types/ui';
import type { UserSettingsState } from 'common/types/userSettings';
import { validateFirstName } from 'common/utils/form';

import AccountDeletion from '../../AccountDeletion/AccountDeletion';
import sharedStyles from '../../UserSettings.scss';
import messages from '../messages';
import styles from '../Profile.scss';
import ProfileChangePassword from '../ProfileChangePassword/ProfileChangePassword';
import type { ProfileUserInfoProps } from '../ProfileUserInfo/ProfileUserInfo';
import ProfileUserInfo from '../ProfileUserInfo/ProfileUserInfo';

export type ProfileProps = {
  isAccountPickerEnabled: boolean;
  kids: Kid[];
  updateDimmer: (modalKey: number) => void;
};

interface ProfileState {
  firstName: string;
  email: string;
  gender?: string;
  modalKey: number;
  updateErrorMessage: string | null;
  birthMonth?: string;
  birthDay?: string;
  birthYear?: string;
}

interface ChangedProfileFields {
  email: boolean;
  firstName: boolean;
  gender: boolean;
}

export const Profile: React.FC<ProfileProps> = ({
  isAccountPickerEnabled,
  kids,
  updateDimmer,
}) => {
  const intl = useIntl();
  const location = useLocation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const {
    first_name,
    email: savedEmail,
    hasPassword,
    gender: savedGender,
    deleteError,
    deleteSuccess,
    avatarUrl: userAvatarUrl,
  } = useAppSelector(userSettingsSelector);

  const savedFirstName = first_name || '';
  const gender = savedGender || '';
  const [{ firstName, email, gender: genderState, updateErrorMessage }, setFormState] = useState<ProfileState>({
    firstName: savedFirstName,
    email: savedEmail,
    gender,
    modalKey: 0,
    updateErrorMessage: null as string | null,
  });

  const setFieldState = useCallback(<K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setFormState(prev => ({
      ...prev,
      [key]: value,
      updateErrorMessage: key === 'updateErrorMessage' ? value as string | null : null,
    }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldState('firstName', e.target.value);
  }, [setFieldState]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldState('email', e.target.value);
  }, [setFieldState]);

  const handleGenderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldState('gender', e.target.value);
  }, [setFieldState]);

  const validateEmail = useCallback(() => REGEX_EMAIL_VALIDATION.test(email), [email]);

  const validateName = useCallback(() => {
    const { firstName: nameError } = validateFirstName({ firstName, intl });
    return nameError;
  }, [firstName, intl]);

  const showVerifyEmailNotification = useCallback(() => {
    const notification: Notification = {
      status: 'success',
      title: intl.formatMessage(messages.notificationTitle),
      description: intl.formatMessage(messages.notificationDesc),
      autoDismiss: false,
      withShadow: true,
      buttons: [
        {
          title: intl.formatMessage(messages.notificationButton),
          primary: true,
        },
      ],
    };

    dispatch(addNotification(notification, 'email-update'));
  }, [intl, dispatch]);

  const getChangedFields = useCallback((): ChangedProfileFields => {
    return {
      email: email !== savedEmail,
      firstName: firstName.trim() !== savedFirstName,
      gender: genderState !== gender,
    };
  }, [email, savedEmail, firstName, savedFirstName, genderState, gender]);

  const checkForUnsavedChanges = useCallback((): boolean => {
    const fields = getChangedFields();
    return Object.values(fields).includes(true);
  }, [getChangedFields]);

  const unsavedChangesWarning = intl.formatMessage(messages.saveSetting);

  const checkForUnsavedChangesRef = useRef(checkForUnsavedChanges);
  checkForUnsavedChangesRef.current = checkForUnsavedChanges;

  useEffect(() => {
    checkForUnsavedChangesRef.current = checkForUnsavedChanges;
  }, [checkForUnsavedChanges]);

  useEffect(() => {
    if (!isMobile && router) {
      const currentRoute = { path: location.pathname };
      const routerWillLeave = () => {
        const hasUnsavedChanges = checkForUnsavedChangesRef.current();
        if (hasUnsavedChanges) {
          return unsavedChangesWarning;
        }
      };

      router.setRouteLeaveHook(currentRoute, routerWillLeave);

      return () => {
        router.setRouteLeaveHook(currentRoute, () => {});
      };
    }
  }, [isMobile, router, location.pathname, unsavedChangesWarning]);

  const handleSaveSettings = useCallback(() => {
    const firstNameTrimmed = firstName.trim();
    const userSettings: Partial<UserSettingsState> = {};
    const changedFields = getChangedFields();

    if (changedFields.email && !validateEmail()) {
      setFieldState('updateErrorMessage', intl.formatMessage(messages.invalidEmail));
      return Promise.reject();
    }

    if (changedFields.firstName) {
      const nameError = validateName();
      if (nameError || !firstNameTrimmed) {
        setFieldState('updateErrorMessage', nameError || intl.formatMessage(messages.invalidName));
        return Promise.reject();
      }
      userSettings.first_name = firstNameTrimmed;
    }

    if (changedFields.email) {
      userSettings.email = email;
    }

    if (changedFields.gender) {
      userSettings.gender = genderState;
    }

    return dispatch(updateUserSettings(location, userSettings, false))
      .then(() => {
        setFieldState('updateErrorMessage', '');
        if (changedFields.email) {
          showVerifyEmailNotification();
        }
      })
      .catch((err: Error & { messages?: Record<string, string>[] }) => {
        const updateErrorMessage = err.message || err.messages?.[0].message || intl.formatMessage(messages.generalError);
        setFieldState('updateErrorMessage', updateErrorMessage);
        return Promise.reject(err);
      });
  }, [firstName, email, genderState, intl, location, getChangedFields, validateEmail, validateName, showVerifyEmailNotification, setFieldState, dispatch]);

  const handleGenderChangeValue: ProfileUserInfoProps['handleGenderChange'] = useCallback(({ value }: { value: string }) => {
    return handleGenderChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
  }, [handleGenderChange]);

  const fields = { firstName, email, gender: genderState };

  const hasUnsavedChanges = checkForUnsavedChanges();

  const headerCls = classNames(sharedStyles.header, { [sharedStyles.withAccountDropdown]: isAccountPickerEnabled });

  return (
    <>
      <div className={classNames(sharedStyles.main, styles.main)} data-test-id="profile">
        <h1 className={headerCls}>{intl.formatMessage(messages.myAccount)}</h1>
        <p className={sharedStyles.subheader}>{intl.formatMessage(messages.myAccountDesc)}</p>
        <ProfileUserInfo
          {...fields}
          handleNameChange={handleNameChange}
          handleEmailChange={handleEmailChange}
          handleGenderChange={handleGenderChangeValue}
          handleSave={handleSaveSettings}
          unsaved={hasUnsavedChanges}
          updateErrorMessage={updateErrorMessage}
        />
      </div>
      <ProfileChangePassword />
      <AccountDeletion
        deleteError={deleteError}
        deleteSuccess={deleteSuccess}
        dispatch={dispatch}
        firstName={firstName}
        hasPassword={hasPassword}
        kids={kids}
        updateDimmer={updateDimmer}
        userAvatarUrl={userAvatarUrl}
      />
    </>
  );
};

export default Profile;
