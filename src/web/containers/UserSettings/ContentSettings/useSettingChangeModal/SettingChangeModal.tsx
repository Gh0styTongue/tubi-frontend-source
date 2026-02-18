import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import { settingChangeModalMessages } from 'common/features/contentSettings/settingChangeModal/messages';
import type { ModalType } from 'common/features/contentSettings/settingChangeModal/types';
import BaseModal from 'web/components/BaseModal/BaseModal';

import styles from './SettingChangeModal.scss';

interface SettingChangeModalProps {
  modalType: ModalType;
  changedSetting: string;
  onConfirm: () => void;
  onCancel: () => void;
  onOk: () => void;
}

const SettingChangeModal = ({ modalType, changedSetting, onConfirm, onCancel, onOk }: SettingChangeModalProps) => {
  const { formatMessage } = useIntl();

  const isPreConfirm = modalType === 'pre-confirm';
  const handleClose = isPreConfirm ? onCancel : onOk;

  return (
    <BaseModal isOpen={!!modalType} onClose={handleClose} isCloseOnEscape>
      <div className={styles.textSection}>
        <h2 className={styles.header}>{formatMessage(settingChangeModalMessages.header)}</h2>
        {isPreConfirm && <p className={styles.subheader}>{formatMessage(settingChangeModalMessages.subheader)}</p>}
        <p className={styles.alert}>
          {formatMessage(settingChangeModalMessages.alert, {
            br: <br />,
            changedSetting,
          })}
        </p>
      </div>
      <div className={classNames(styles.buttons, isPreConfirm ? styles.twoButtons : styles.singleButton)}>
        {isPreConfirm ? (
          <>
            <Button appearance="tertiary" onClick={onCancel}>
              {formatMessage(settingChangeModalMessages.cancelBtn)}
            </Button>
            <Button appearance="primary" onClick={onConfirm}>
              {formatMessage(settingChangeModalMessages.confirmBtn)}
            </Button>
          </>
        ) : (
          <Button appearance="primary" onClick={onOk}>
            {formatMessage(settingChangeModalMessages.okBtn)}
          </Button>
        )}
      </div>
    </BaseModal>
  );
};

export default SettingChangeModal;
