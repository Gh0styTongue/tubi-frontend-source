import { ATag } from '@tubitv/web-ui';
import React, { Fragment } from 'react';

import { GENRE_TAGS } from 'common/constants/genre-tags';
import { getContainerUrl } from 'common/utils/urlConstruction';

import styles from './GenreTags.scss';

interface GenreTagsProps {
  tags?: string[];
  separator?: string;
}

const GenreTags = ({ tags = [], separator = ' · ' }: GenreTagsProps) => {
  const genreList = tags.map((tag, i) => {
    const slug = GENRE_TAGS[tag];
    const node = slug ? (
      <ATag key={slug} to={getContainerUrl(slug)}>{tag}</ATag>
    ) : (<span>{tag}</span>);
    return (
      <Fragment key={slug ?? tag}>
        {node}
        {i < tags.length - 1 ? <span>{separator}</span> : null}
      </Fragment>
    );
  });
  return genreList.length ? (
    <div className={styles.genreTags}>{genreList}</div>
  ) : null;
};

export default GenreTags;
