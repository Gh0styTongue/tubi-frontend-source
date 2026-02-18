import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { WithRouterProps } from 'react-router';

import { tubiIdForContentSettingsSelector } from 'common/features/authentication/selectors/auth';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { userKidsSelector } from 'common/selectors/userSettings';
import AccountSelector from 'web/features/authentication/components/AccountSelector/AccountSelector';
import type { AccountSelectorRef } from 'web/features/authentication/components/AccountSelector/AccountSelector';

import Profile from '../Profile/Profile';
import styles from '../Profile.scss';
import ProfileKids from '../ProfileKids/ProfileKids';

const ProfileWrapper: FC<WithRouterProps> = (props) => {
  const adminTubiId = useAppSelector(state => state.auth.tubiId) || '';
  const accountSelectorRef = useRef<AccountSelectorRef>(null);

  const kidsFromRedux = useAppSelector(userKidsSelector);
  const kids = useMemo(() => kidsFromRedux || [], [kidsFromRedux]);
  const tubiIdForContentSettings = useAppSelector(tubiIdForContentSettingsSelector);
  const selectedTubiId = tubiIdForContentSettings || adminTubiId;

  const [isAccountPickerEnabled, setIsAccountPickerEnabled] = useState(false);

  const selectedKid = useMemo(
    () => kids.find(kid => kid.tubiId === selectedTubiId),
    [kids, selectedTubiId]
  );

  const handleUpdateKidSuccess = useCallback((tubiId: string, updatedKid: Kid | null) => {
    accountSelectorRef.current?.updateKid(tubiId, updatedKid);
  }, []);

  const [modalKey, setModalKey] = useState(0);
  const dimmerCls = classNames(styles.overlayDimmer, { [styles.overlayDimmerActive]: modalKey });

  return (
    <div className={styles.userProfile}>
      <div className={styles.mainWrapper}>
        <div className={dimmerCls} />
        <AccountSelector
          ref={accountSelectorRef}
          onVisibilityChange={setIsAccountPickerEnabled}
        />
        {selectedKid ? (
          <ProfileKids
            firstName={selectedKid.name}
            tubiId={selectedKid.tubiId}
            isAccountPickerEnabled={isAccountPickerEnabled}
            onUpdateKidSuccess={handleUpdateKidSuccess}
            updateDimmer={setModalKey}
          />
        ) : (
          <Profile
            {...props}
            isAccountPickerEnabled={isAccountPickerEnabled}
            kids={kids}
            updateDimmer={setModalKey}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileWrapper;
