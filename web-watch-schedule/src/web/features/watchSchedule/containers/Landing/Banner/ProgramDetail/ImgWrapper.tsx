import React from 'react';

import type { Program } from 'common/types/epg';

import styles from './ProgramDetail.scss';

interface ImgWrapperProps {
  program: Program;
}

const ImgWrapper = ({ program }: ImgWrapperProps) => (
  <div className={styles.imgWrapper}>
    <img alt={program.title} src={program.images.thumbnail[0]} />
  </div>
);

export default ImgWrapper;
