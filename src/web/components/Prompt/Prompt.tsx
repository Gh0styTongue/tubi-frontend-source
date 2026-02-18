import { PlusStroke } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { useCallback } from 'react';

import { isCastConnected as checkIsCastConnected } from 'client/utils/clientTools';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from './Prompt.scss';

export type PromptProps = {
  isOpen: boolean;
  title: string;
  buttonText: string;
  onDismiss?: () => void;
  onContinue?: () => void;
};

const Prompt: React.FC<PromptProps> = ({ isOpen, title, buttonText, onDismiss, onContinue }) => {
  const onClickDismiss = useCallback(() => {
    if (onDismiss) onDismiss();
  }, [onDismiss]);
  const onClickContinue = useCallback(() => {
    if (onContinue) onContinue();
  }, [onContinue]);

  const isCastConnected = useAppSelector(
    ({ chromecast }) => chromecast?.castApiAvailable && checkIsCastConnected(chromecast?.castReceiverState)
  );

  return (
    <div
      className={classnames(styles.promptContainer, {
        [styles.isOpen]: isOpen,
        [styles.isCastConnected]: isCastConnected,
      })}
      data-test-id="prompt"
    >
      <div className={styles.promptTopGradient} />
      <div className={styles.promptBottomGradient} />
      <div className={styles.promptBackground} />
      <PlusStroke onClick={onClickDismiss} className={styles.closedIcon} />
      <div className={styles.promptBody}>
        <div className={styles.promptContent}>
          <Tubi className={styles.promptTubiLogo} />
          <div className={styles.promptTitle}>{title}</div>
        </div>
        <Button onClick={onClickContinue} className={styles.promptButton}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default Prompt;
