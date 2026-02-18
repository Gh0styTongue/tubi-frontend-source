import type { DropdownOption, DropdownProps } from '@tubitv/web-ui';
import { Dropdown } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo } from 'react';

import { updateKids } from 'common/actions/userSettings';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import {
  clearTubiIdForContentSettings,
  setTubiIdForContentSettings,
} from 'common/features/authentication/actions/auth';
import { loadKidAccounts } from 'common/features/authentication/actions/kidAccount';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import { tubiIdForContentSettingsSelector } from 'common/features/authentication/selectors/auth';
import type { Kid, AvatarUrl } from 'common/features/authentication/types/auth';
import { ThemeContext } from 'common/features/theme/context';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import { firstNameSelector, userAvatarUrlSelector, userKidsSelector } from 'common/selectors/userSettings';

import styles from './AccountSelector.scss';

interface AccountSelectorProps {
  onVisibilityChange?: (isVisible: boolean) => void;
  className?: string;
}

export interface AccountSelectorRef {
  updateKid: (tubiId: string, updatedKid: Kid | null) => void;
}

const getAccountDropdownOptions = ({ adminTubiId, firstName, kids }: {
  adminTubiId: string;
  firstName: string;
  kids: Kid[];
}) => {
  if (kids.length === 0) return [];
  return [
    { label: firstName, value: adminTubiId },
    ...kids.map(kid => ({ label: kid.name, value: kid.tubiId })),
  ];
};

const AccountDropdownLabel: FC<{ name: string; isKid: boolean; avatarUrl?: AvatarUrl }> = ({ name, isKid, avatarUrl }) => (
  <div className={classNames(styles.accountDropdownOption, { [styles.kidAccount]: isKid })}>
    <Avatar name={name} size="xs" avatarUrl={avatarUrl} />
    <div className={styles.label}>
      <div>{name}</div>
      {isKid && <Tubi className={styles.kidsLogo} isKidsModeEnabled />}
    </div>
  </div>
);

const AccountSelector = forwardRef<AccountSelectorRef, AccountSelectorProps>(({
  onVisibilityChange,
  className,
}, ref) => {
  const dispatch = useAppDispatch();
  const firstName = useAppSelector(firstNameSelector);
  const adminTubiId = useAppSelector(state => state.auth.tubiId) || '';
  const userAvatarUrl = useAppSelector(userAvatarUrlSelector);

  const kidsFromRedux = useAppSelector(userKidsSelector);
  const kids = useMemo(() => kidsFromRedux || [], [kidsFromRedux]);

  useEffect(() => {
    dispatch(loadKidAccounts());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearTubiIdForContentSettings());
    };
  }, [dispatch]);

  const accountDropdownOptions = getAccountDropdownOptions({ adminTubiId, firstName, kids });
  const isAccountPickerEnabled = accountDropdownOptions.length > 0;

  useEffect(() => {
    onVisibilityChange?.(isAccountPickerEnabled);
  }, [isAccountPickerEnabled, onVisibilityChange]);

  const { setTheme } = useContext(ThemeContext);
  const isKidsModeEnabled = useAppSelector(isKidsModeEnabledSelector);
  useEffect(() => {
    return () => {
      // restore original theme when component unmounts
      setTheme(isKidsModeEnabled ? 'kidsDark' : 'defaultDark');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKidsModeEnabled]);

  const tubiIdForContentSettings = useAppSelector(tubiIdForContentSettingsSelector);
  const selectedTubiId = tubiIdForContentSettings || adminTubiId;

  const handleSelectAccount = useCallback(({ value }: Pick<DropdownOption, 'value'>) => {
    dispatch(setTubiIdForContentSettings(value));
    setTheme(value === adminTubiId ? 'defaultDark' : 'kidsDark');
  }, [adminTubiId, dispatch, setTheme]);

  useImperativeHandle(ref, () => ({
    updateKid: (tubiId: string, updatedKid: Kid | null) => {
      if (updatedKid) {
        const updatedKids = kids.map(kid => kid.tubiId === tubiId ? updatedKid : kid);
        dispatch(updateKids(updatedKids));
      } else {
        dispatch(setTubiIdForContentSettings(adminTubiId));
        setTheme('defaultDark');
        const filteredKids = kids.filter(kid => kid.tubiId !== tubiId);
        dispatch(updateKids(filteredKids));
      }
    },
  }), [adminTubiId, dispatch, kids, setTheme]);

  const renderOption: DropdownProps['renderOption'] = useCallback((option: DropdownOption) => {
    const { label, value } = option;
    const isKid = value !== adminTubiId;
    const avatarUrl = isKid ? kids.find(kid => kid.tubiId === value)?.avatarUrl : userAvatarUrl;
    return <AccountDropdownLabel name={label} isKid={isKid} avatarUrl={avatarUrl} />;
  }, [adminTubiId, kids, userAvatarUrl]);

  const selectedOption = useMemo(() => {
    return accountDropdownOptions.find(opt => opt.value === selectedTubiId) || accountDropdownOptions[0];
  }, [accountDropdownOptions, selectedTubiId]);

  if (!isAccountPickerEnabled) {
    return null;
  }

  return (
    <div className={classNames(styles.accountDropdownContainer, className)}>
      <Dropdown
        defaultOption={selectedOption}
        name="accountDropdown"
        onSelect={handleSelectAccount}
        options={accountDropdownOptions}
        renderOption={renderOption}
        renderSelectedOption={renderOption}
      />
    </div>
  );
});

AccountSelector.displayName = 'AccountSelector';

export default AccountSelector;
