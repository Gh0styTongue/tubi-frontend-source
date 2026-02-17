import { Subtitles } from '@tubitv/icons';
import type { FC } from 'react';
import React from 'react';

import {
  Duration,
  GenreList,
  RatingWithDescriptor,
} from 'common/components/VideoComponents/VideoComponents';
import type { VideoRating } from 'common/types/video';

import styles from './AutoPlayContentMetadata.scss';

export interface AutoPlayContentMetadataProps {
    duration: number;
    year?: number;
    ratings?: VideoRating[];
    genres?: string[];
    showCC?: boolean;
}

const AutoPlayContentMetadata: FC<AutoPlayContentMetadataProps> = ({ duration, year, ratings, genres, showCC }) => {
  return <div className={styles.autoplayContentMetadata}>
    <div className={styles.row}>
      {year ? <div>{year}</div> : null}
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
      {!!year && !!duration ? <span>&nbsp;·&nbsp;</span> : null}
      <Duration key="duration" duration={duration} />
      {showCC ? <Subtitles className={styles.ccIcon} /> : null}
      <RatingWithDescriptor rating={ratings} cls={styles.rating} descriptorCls={styles.descriptor} />
    </div>
    <div className={styles.row}>
      <GenreList genres={genres} splitSymbol=" · " />
    </div>
  </div>;
};

export default AutoPlayContentMetadata;
