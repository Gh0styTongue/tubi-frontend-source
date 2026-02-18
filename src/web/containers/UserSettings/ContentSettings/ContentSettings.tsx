import { Button, Dropdown, ErrorMessage } from '@tubitv/web-ui';
import type { DropdownOption } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import type { RouteComponentProps } from 'react-router';

import { addNotification, toggleEnterPasswordModal } from 'common/actions/ui';
import { updateParental, updateContentSettingsForKid } from 'common/actions/userSettings';
import DynamicButton from 'common/components/uilib/DynamicButton/DynamicButton';
import type { ParentalRating } from 'common/constants/ratings';
import { isCurrentUserKidAccountSelector, tubiIdForContentSettingsSelector, userSelector } from 'common/features/authentication/selectors/auth';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { parentalRatingsSelector } from 'common/selectors/ui';
import { hasPINSelector, userKidsSelector } from 'common/selectors/userSettings';
import type { Notification } from 'common/types/ui';
import { isRatingUpgrade } from 'common/utils/ratings';
import NoPassword from 'web/components/NoPassword/NoPassword';
import AccountSelector from 'web/features/authentication/components/AccountSelector/AccountSelector';
import type { AccountSelectorRef } from 'web/features/authentication/components/AccountSelector/AccountSelector';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';

import styles from './ContentSettings.scss';
import messages from './contentSettingsMessages';

interface ContentSettingsProps extends RouteComponentProps<Record<string, never>, Record<string, never>> {
  destroyPlayers?: (id?: string) => void;
}

const ContentSettings: FC<ContentSettingsProps> = ({ location, destroyPlayers }) => {
  const dispatch = useAppDispatch();
  const { formatMessage } = useIntl();

  // istanbul ignore next -- defensive fallback for missing tubiId
  const adminTubiId = useAppSelector(state => state.auth.tubiId) || '';
  const adminParentalRating = useAppSelector(state => state.userSettings.parentalRating);
  const hasPassword = useAppSelector(state => state.userSettings.hasPassword);
  const hasPIN = useAppSelector(hasPINSelector);
  const isCurrentUserKidAccount = useAppSelector(isCurrentUserKidAccountSelector);
  const currentUser = useAppSelector(userSelector);
  const userList = useAppSelector(state => state.auth.userList);

  // Account selector ref for updating kid
  const accountSelectorRef = useRef<AccountSelectorRef>(null);

  const kidsFromRedux = useAppSelector(userKidsSelector);
  const kids = useMemo(() => kidsFromRedux || [], [kidsFromRedux]);
  const tubiIdForContentSettings = useAppSelector(tubiIdForContentSettingsSelector);
  const selectedTubiId = tubiIdForContentSettings || adminTubiId;

  const selectedKid = useMemo(
    () => kids.find(kid => kid.tubiId === selectedTubiId),
    [kids, selectedTubiId]
  );

  const [isAccountPickerEnabled, setIsAccountPickerEnabled] = useState(false);

  const [updateError, setUpdateError] = useState('');
  const [unsaved, setUnsaved] = useState(false);

  const isEditingKidAccount = selectedKid !== undefined || isCurrentUserKidAccount;

  const ratingsList = useAppSelector(state => parentalRatingsSelector(state, isEditingKidAccount));

  const parentUser = useMemo(() => {
    if (!isCurrentUserKidAccount) return undefined;
    const kid = currentUser as Kid;
    return userList?.find(u => u.tubiId === kid.parentTubiId);
  }, [isCurrentUserKidAccount, currentUser, userList]);

  const currentRating = useMemo(() => {
    if (selectedKid) {
      return selectedKid.parentalRating;
    }
    return adminParentalRating;
  }, [selectedKid, adminParentalRating]);

  const [localRating, setLocalRating] = useState<ParentalRating>(currentRating);

  useEffect(() => {
    setLocalRating(currentRating);
    setUnsaved(false);
    setUpdateError('');
  }, [currentRating, selectedTubiId]);

  const dropdownOptions = useMemo(() => {
    return ratingsList.map(({ value: _value, displayText, rating, ratingCodes }) => ({
      value: String(rating),
      label: `${formatMessage(displayText)} (${ratingCodes.join(', ')})`,
      rating,
    }));
  }, [ratingsList, formatMessage]);

  const activeDropdownOption = useMemo(() => {
    return dropdownOptions.find(option => option.rating === localRating);
  }, [dropdownOptions, localRating]);

  const handleSelectRating = useCallback(({ value }: DropdownOption) => {
    const newRating = parseInt(value, 10) as ParentalRating;
    setLocalRating(newRating);
    setUnsaved(newRating !== currentRating);
    setUpdateError('');
  }, [currentRating]);

  const showNotification = useCallback((rating: ParentalRating) => {
    const ratingOption = ratingsList.find(r => r.rating === rating);
    // istanbul ignore next -- defensive fallback for missing rating option
    const ratingText = ratingOption ? formatMessage(ratingOption.label) : '';

    const notification: Notification = {
      status: 'success',
      title: formatMessage(messages.notificationTitle),
      description: formatMessage(messages.notificationDesc, { rating: ratingText }),
      autoDismiss: false,
      buttons: [
        {
          title: formatMessage(messages.notificationButton),
          primary: true,
        },
      ],
    };
    dispatch(addNotification(notification, 'content-settings-update'));
  }, [dispatch, formatMessage, ratingsList]);

  const performUpdate = useCallback(async (rating: ParentalRating, password?: string) => {
    try {
      if (!isCurrentUserKidAccount && selectedTubiId === adminTubiId) {
        await dispatch(updateParental({ location, rating, password: password || '' }));
        // istanbul ignore next -- destroyPlayers provided by playerPortalContext, hard to test in isolation
        if (rating < currentRating && destroyPlayers) {
          destroyPlayers();
        }
      } else {
        await dispatch(updateContentSettingsForKid({
          rating,
          tubiId: selectedTubiId,
          password,
        }));
        // istanbul ignore else
        if (selectedKid) {
          const updatedKid = { ...selectedKid, parentalRating: rating };
          accountSelectorRef.current?.updateKid(selectedTubiId, updatedKid);
        }
      }
      showNotification(rating);
      setUnsaved(false);
      setUpdateError('');
    } catch (error) {
      // istanbul ignore next -- defensive fallback for errors without message
      setUpdateError((error as Error).message || 'An error occurred');
      throw error;
    }
  }, [adminTubiId, currentRating, destroyPlayers, dispatch, isCurrentUserKidAccount, location, selectedKid, selectedTubiId, showNotification]);

  const handleSave = useCallback(() => {
    // istanbul ignore next
    if (!unsaved) return Promise.reject();

    const newRating = localRating;
    const isUpgrade = isRatingUpgrade({
      currentRating,
      updatedRating: newRating,
    });

    if (isUpgrade) {
      // istanbul ignore next -- kid account save flow requires complex DynamicButton promise chain testing
      if (isCurrentUserKidAccount && parentUser) {
        dispatch(toggleEnterPasswordModal({
          isVisible: true,
          variant: 'editContentSettingsKid',
          targetUser: parentUser,
          onSuccess: (password) => performUpdate(newRating, password),
        }));
      } else {
        dispatch(toggleEnterPasswordModal({
          isVisible: true,
          variant: 'editContentSettings',
          onSuccess: (password) => performUpdate(newRating, password),
        }));
      }
      return Promise.reject(); // Don't continue with DynamicButton's promise chain
    }

    return performUpdate(newRating);
  }, [unsaved, localRating, currentRating, isCurrentUserKidAccount, parentUser, dispatch, performUpdate]);

  const handlePINClick = useCallback(() => {
    dispatch(toggleEnterPasswordModal({
      isVisible: true,
      variant: hasPIN ? 'editPin' : 'createPin',
    }));
  }, [dispatch, hasPIN]);

  if (!hasPassword) {
    return (
      <div className={styles.contentSettings} data-test-id="web-content-settings">
        <h1 className={styles.header}>{formatMessage(messages.title)}</h1>
        <NoPassword textClassName={styles.subheader} useRefreshStyle />
      </div>
    );
  }

  return (
    <div className={styles.contentSettings} data-test-id="web-content-settings">
      <div className={styles.accountSelectorWrapper}>
        <AccountSelector
          ref={accountSelectorRef}
          onVisibilityChange={setIsAccountPickerEnabled}
        />
      </div>

      <h1 className={classNames(styles.header, { [styles.withAccountDropdown]: isAccountPickerEnabled })}>
        {formatMessage(messages.title)}
      </h1>
      <p className={styles.subheader}>
        {formatMessage(messages.subtitle)}
      </p>

      <form className={styles.formContainer}>
        {updateError && <ErrorMessage className={styles.error} message={updateError} />}
        <fieldset>
          <legend className="sr-only">{formatMessage(messages.dropdownLabel)}</legend>
          <div className={styles.dropdownWrapper}>
            <Dropdown
              defaultOption={activeDropdownOption}
              name="contentRating"
              label={formatMessage(messages.dropdownLabel)}
              options={dropdownOptions}
              onSelect={handleSelectRating}
              aria-label={formatMessage(messages.dropdownLabel)}
            />
          </div>
        </fieldset>
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
      </form>

      {selectedTubiId === adminTubiId && !isCurrentUserKidAccount && (
        <>
          <div className={styles.divider} />
          <div className={styles.pinSection}>
            <h2 className={styles.pinHeader}>
              {formatMessage(messages.pinSectionTitle)}
            </h2>
            <p className={styles.pinSubheader}>
              {formatMessage(messages.pinSectionSubtitle)}
            </p>
            <Button
              className={styles.pinButton}
              onClick={handlePINClick}
              appearance="primary"
            >
              {hasPIN ? formatMessage(messages.editPin) : formatMessage(messages.createPin)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const ContentSettingsContainer: FC<Omit<ContentSettingsProps, 'destroyPlayers'>> = (props) => {
  const { destroyPlayers } = usePlayerPortal();
  return <ContentSettings {...props} destroyPlayers={destroyPlayers} />;
};

export default ContentSettingsContainer;
