import { Grid, RowHeader } from '@tubitv/web-ui';
import React from 'react';

import styles from './SectionTitle.scss';

interface SectionTitleProps {
  title: string;
  href?: string;
}

const SectionTitle = ({ title, href }: SectionTitleProps) => (
  <div className={styles.root}>
    <Grid.Container as="h2">
      <RowHeader href={href}>{title}</RowHeader>
    </Grid.Container>
  </div>
);

export default SectionTitle;
