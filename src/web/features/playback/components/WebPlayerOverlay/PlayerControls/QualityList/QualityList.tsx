import type { QualityLevel } from '@adrise/player';
import { OptionList } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './QualityList.scss';

const QUALITY_MENU_ID = 'qualityList';

interface QualityListProps {
  qualityList: QualityLevel[];
  qualityIndex: number;
  qualityListRef: React.RefObject<HTMLDivElement>;
  setQuality: (index: number) => void;
}

const messages = defineMessages({
  videoQuality: {
    description: 'video quality menu label text',
    defaultMessage: 'Video Quality',
  },
});

const stopPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const QualityList: React.FC<QualityListProps> = ({
  qualityList,
  qualityIndex,
  qualityListRef,
  setQuality,
}) => {
  const intl = useIntl();
  if (qualityList.length <= 1) return null;

  return (
    <div
      id={QUALITY_MENU_ID}
      onClick={stopPropagation}
      className={classNames(styles.qualityList)}
      ref={qualityListRef}
      data-test-id="quality-menu"
    >
      <section>
        <h3>{intl.formatMessage(messages.videoQuality)}</h3>
        <OptionList
          options={qualityList}
          activeLabel={qualityList[qualityIndex].label}
          onOptionSelect={setQuality}
        />
      </section>
    </div>
  );
};

export default QualityList;
