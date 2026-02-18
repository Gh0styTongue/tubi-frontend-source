import type { FC } from 'react';
import React from 'react';

import { PurpleCarpetDetails as PurpleCarpetDetailsComponent } from 'web/features/purpleCarpet/components/PurpleCarpetDetails/PurpleCarpetDetails';

import styles from './PurpleCarpetDetails.scss';

export const PurpleCarpetDetails: FC<{ id: string; loaded: boolean; }> = ({ id, loaded }) => {

  return (
    <div className={styles.container}>
      <PurpleCarpetDetailsComponent id={id} type="fullscreen" loading={!loaded} />
    </div>
  );
};
