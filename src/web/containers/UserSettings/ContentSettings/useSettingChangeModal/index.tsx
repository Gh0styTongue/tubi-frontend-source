import React, { useCallback, useState } from 'react';

import type {
  ModalType,
  ShowPreConfirmModalProps,
  ShowPostConfirmModalProps,
} from 'common/features/contentSettings/settingChangeModal/types';

import SettingChangeModal from './SettingChangeModal';

interface UseSettingChangeModalReturn {
  showPreConfirmModal: (props: ShowPreConfirmModalProps) => void;
  showPostConfirmModal: (props: ShowPostConfirmModalProps) => void;
  SettingChangeModalComponent: React.ReactNode;
}

const useSettingChangeModal = (): UseSettingChangeModalReturn => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [changedSetting, setChangedSetting] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<VoidFunction | null>(null);

  const closeModal = useCallback(() => {
    setModalType(null);
    setChangedSetting('');
    setOnConfirmCallback(null);
  }, []);

  const showPreConfirmModal = useCallback(({ changedSetting: setting, onConfirm }: ShowPreConfirmModalProps) => {
    setChangedSetting(setting);
    // Wrap in arrow function to store the callback itself, not its return value
    // (React setState treats functions as updaters, so passing onConfirm directly would invoke it)
    setOnConfirmCallback(() => onConfirm);
    setModalType('pre-confirm');
  }, []);

  const showPostConfirmModal = useCallback(({ changedSetting: setting }: ShowPostConfirmModalProps) => {
    setChangedSetting(setting);
    setModalType('post-confirm');
  }, []);

  const handleConfirm = useCallback(() => {
    closeModal();
    onConfirmCallback?.();
  }, [closeModal, onConfirmCallback]);

  const handleCancel = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleOk = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const SettingChangeModalComponent = (
    <SettingChangeModal
      modalType={modalType}
      changedSetting={changedSetting}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onOk={handleOk}
    />
  );

  return {
    showPreConfirmModal,
    showPostConfirmModal,
    SettingChangeModalComponent,
  };
};

export default useSettingChangeModal;
