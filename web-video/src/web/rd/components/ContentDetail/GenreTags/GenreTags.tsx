import { ATag } from '@tubitv/web-ui';
import React, { Fragment } from 'react';

import { GENRE_TAGS } from 'common/constants/genre-tags';
import { getContainerUrl } from 'common/utils/urlConstruction';

import styles from './GenreTags.scss';

interface GenreTagsProps {
  tags?: string[];
}

const GenreTags = ({ tags = [] }: GenreTagsProps) => {
  const genreList = tags.map((tag, i) => {
    const slug = GENRE_TAGS[tag];
    // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for middot
    const separator = i < tags.length - 1 ? <span>{' · '}</span> : null;
    const node = slug ? (
      <ATag key={slug} to={getContainerUrl(slug)}>{tag}</ATag>
    ) : (<span>{tag}</span>);
    return (
      <Fragment key={slug ?? tag}>
        {node}
        {separator}
      </Fragment>
    );
  });
  return genreList.length ? (
    <div className={styles.genreTags}>{genreList}</div>
  ) : null;
};

export default GenreTags;
