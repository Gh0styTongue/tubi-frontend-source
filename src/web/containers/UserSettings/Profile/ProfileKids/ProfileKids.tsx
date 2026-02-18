import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { updateKidAccount } from 'common/features/authentication/api/kidAccount';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { validateFirstName } from 'common/utils/form';

import AccountDeletion from '../../AccountDeletion/AccountDeletion';
import sharedStyles from '../../UserSettings.scss';
import messages from '../messages';
import styles from '../Profile.scss';
import ProfileUserInfo from '../ProfileUserInfo/ProfileUserInfo';

export interface ProfileKidsProps {
  isAccountPickerEnabled: boolean;
  firstName: string;
  onUpdateKidSuccess: (tubiId: string, updatedKid: Kid | null) => void;
  tubiId: string;
  updateDimmer: (modalKey: number) => void;
}

interface ProfileState {
  firstName: string;
  updateErrorMessage: string | null;
}

const ProfileKids: FC<ProfileKidsProps> = ({
  isAccountPickerEnabled,
  firstName: savedFirstName,
  onUpdateKidSuccess,
  tubiId,
  updateDimmer,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const {
    deleteError,
    deleteSuccess,
    hasPassword,
  } = useAppSelector(state => state.userSettings);
  const [{ firstName, updateErrorMessage }, setState] = useState<ProfileState>({
    firstName: savedFirstName,
    updateErrorMessage: null,
  });

  const setFieldState = useCallback(<K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setState(prevState => ({
      ...prevState,
      [key]: value,
      updateErrorMessage: null,
    }));
  }, []);

  useEffect(() => {
    // update state.firstName when the selected kid account changes
    setFieldState('firstName', savedFirstName);
  }, [savedFirstName, setFieldState]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldState('firstName', e.target.value);
  }, [setFieldState]);

  const handleSaveSettings = useCallback(() => {
    const name = firstName.trim();
    const { firstName: nameError } = validateFirstName({ firstName: name, intl });
    if (nameError || !name) {
      setState(prevState => ({
        ...prevState,
        updateErrorMessage: nameError || intl.formatMessage(messages.invalidName),
      }));
      return Promise.reject();
    }

    return dispatch(updateKidAccount({ tubi_id: tubiId, name }))
      .then((updatedKid) => {
        onUpdateKidSuccess(tubiId, updatedKid);
        // clear any error messages
        setState(prevState => ({
          ...prevState,
          updateErrorMessage: '',
        }));
      })
      .catch((err: Error) => {
        const updateErrorMessage = err.message || intl.formatMessage(messages.generalError);
        setState(prevState => ({
          ...prevState,
          updateErrorMessage,
        }));
        return Promise.reject(err);
      });
  }, [dispatch, firstName, intl, onUpdateKidSuccess, tubiId]);

  const onDeleteSuccess = useCallback(() => {
    onUpdateKidSuccess(tubiId, null);
  }, [onUpdateKidSuccess, tubiId]);

  const hasUnsavedChanges = useMemo(() => firstName.trim() !== savedFirstName, [firstName, savedFirstName]);

  const headerCls = classNames(sharedStyles.header, { [sharedStyles.withAccountDropdown]: isAccountPickerEnabled });

  return (
    <>
      <div className={classNames(sharedStyles.main, styles.main)} data-test-id="profile-kids">
        <h1 className={headerCls}>{intl.formatMessage(messages.myAccount)}</h1>
        <p className={sharedStyles.subheader}>{intl.formatMessage(messages.myAccountKidsDesc)}</p>
        <ProfileUserInfo
          firstName={firstName}
          handleNameChange={handleNameChange}
          handleSave={handleSaveSettings}
          unsaved={hasUnsavedChanges}
          updateErrorMessage={updateErrorMessage}
        />
      </div>
      <AccountDeletion
        deleteError={deleteError}
        deleteSuccess={deleteSuccess}
        dispatch={dispatch}
        kidTubiId={tubiId}
        hasPassword={hasPassword}
        onDeleteSuccess={onDeleteSuccess}
        updateDimmer={updateDimmer}
      />
    </>
  );
};

export default ProfileKids;
