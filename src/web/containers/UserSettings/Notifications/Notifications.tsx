import { Checkbox, ErrorMessage } from '@tubitv/web-ui';
import type { ComponentProps } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import DynamicButton from 'common/components/uilib/DynamicButton/DynamicButton';
import gdprMessages from 'common/features/gdpr/messages';
import { isInGDPRCountryWithKidsSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from './Notifications.scss';
import sharedStyles from '../UserSettings.scss';

export const messages = defineMessages({
  title: {
    description: 'notifications settings page title',
    defaultMessage: 'Notifications',
  },
  desc: {
    description: 'choose notifications label text',
    defaultMessage: 'Select which type of communication you would like to receive from Tubi.',
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

export interface SubscribeOption {
  key: string;
  selected: boolean;
  text: string;
  description?: string;
}

interface NotificationsProps {
  handleSave: () => Promise<any>;
  handleSelect: ComponentProps<typeof Checkbox>['onChange'];
  subscribeOptions: SubscribeOption[];
  unsaved?: boolean;
  updateErrorMessage?: string;
}

const Notifications: React.FC<NotificationsProps> = ({
  handleSave,
  handleSelect,
  subscribeOptions,
  unsaved,
  updateErrorMessage = '',
}) => {
  const { formatMessage } = useIntl();
  const isInGDPRCountryWithKids = useAppSelector(isInGDPRCountryWithKidsSelector);

  if (isInGDPRCountryWithKids) {
    return (
      <div className={sharedStyles.main} data-test-id="notifications-refresh">
        <h1 className={sharedStyles.header}>{formatMessage(messages.title)}</h1>
        <p className={sharedStyles.caution}>
          {formatMessage(gdprMessages.privacyPreferencesLockedWeb, { settingTitle: formatMessage(messages.title) })}
        </p>
      </div>
    );
  }

  return (
    <div className={sharedStyles.main} data-test-id="notifications-refresh">
      <h1 className={sharedStyles.header}>{formatMessage(messages.title)}</h1>
      <p className={sharedStyles.subheader}>{formatMessage(messages.desc)}</p>
      <div className={styles.formContainer}>
        {updateErrorMessage && <ErrorMessage className={styles.errorMessage} message={updateErrorMessage} />}
        {
          subscribeOptions.map(({ text, key, selected, description }) => {
            return (
              <div className={styles.item}>
                <Checkbox
                  checked={selected}
                  id={key}
                  key={key}
                  label={text}
                  onChange={handleSelect}
                />
                <div className={styles.desc}>{description}</div>
              </div>
            );
          })
        }
        <DynamicButton
          className={styles.submitButton}
          defaultLabel={formatMessage(messages.save)}
          promise={handleSave}
          submittingLabel={formatMessage(messages.saving)}
          successLabel={formatMessage(messages.saved)}
          unsaved={unsaved}
          useRefreshStyle
        />
      </div>
    </div>
  );
};

export default Notifications;
