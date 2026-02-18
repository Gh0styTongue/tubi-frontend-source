import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import gdprMessages from 'common/features/gdpr/messages';
import { ONETRUST_SDK_INITED_EVENT_NAME } from 'common/features/gdpr/onetrust/onetrust';
import LegalLinks from 'web/features/gdpr/components/LegalLinks/LegalLinks';

import styles from './PrivacyCenter.scss';
import sharedStyles from '../UserSettings.scss';

export const messages = defineMessages({
  privacy: {
    description: 'settings title',
    defaultMessage: 'Privacy',
  },
  description: {
    description: 'Description for the privacy center page',
    defaultMessage: 'You must save privacy setting changes and refresh Tubi for changes to take effect.',
  },
  save: {
    description: 'save button label',
    defaultMessage: 'Save and Refresh',
  },
  privacySettingButton: {
    description: 'Button for open View Privacy Settings',
    defaultMessage: 'View Privacy Settings',
  },
});

const reloadWhenConsentChanges = () => {
  window.OneTrust.OnConsentChanged(() => {
    // When consent changed, OT SDK will send a request to sync consent to OT
    // On iOS, if we reload page immediately, the request from OT will be canceled by browser.
    // There is no easy way to know if the request is finished, we have to use setTimeout to reload page
    // The request usually finished less than 1s, set to 2s for safe
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  });
};

const PrivacyCenter = () => {
  const intl = useIntl();

  useEffect(() => {
    // Reload App when consent changes
    document.addEventListener(ONETRUST_SDK_INITED_EVENT_NAME, reloadWhenConsentChanges);
    return () => {
      document.removeEventListener(ONETRUST_SDK_INITED_EVENT_NAME, reloadWhenConsentChanges);
    };
  }, []);

  const toggleInfoDisplay = useCallback(() => {
    return window.OneTrust.ToggleInfoDisplay();
  }, []);

  return (
    <div className={classNames(sharedStyles.main, styles.main)}>
      <h1 className={sharedStyles.header}>{intl.formatMessage(gdprMessages.privacyCenter)}</h1>
      <p className={classNames(sharedStyles.subheader, styles.subheader)}>{intl.formatMessage(messages.description)}</p>
      <Button appearance="tertiary" className={styles.viewButton} onClick={toggleInfoDisplay}>
        {intl.formatMessage(messages.privacySettingButton)}
      </Button>
      <LegalLinks />
    </div>
  );
};

export default PrivacyCenter;
