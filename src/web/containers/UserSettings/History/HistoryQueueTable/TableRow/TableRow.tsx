import { Button, Rating } from '@tubitv/web-ui';
import React, { useCallback, forwardRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import type StoreState from 'common/types/storeState';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import styles from './TableRow.scss';

const messages = defineMessages({
  watch: {
    description: 'watch item a11y announcement',
    defaultMessage: 'Watch',
  },
  rated: {
    description: 'movie rating a11y announcement',
    defaultMessage: 'Rated',
  },
  itemPosition: {
    description: 'item position in list',
    defaultMessage: 'Item {index} of {total}',
  },
  selectToContinueOrDelete: {
    description: 'select to continue or delete a11y announcement',
    defaultMessage: 'Select to watch or delete {title}',
  },
});

interface OwnProps {
  contentId: string;
  deleteHandler: (id: string) => void;
  deleteButtonText: string;
  index: number;
  totalItems: number;
}

interface TableRowProps extends OwnProps {
  poster?: string;
  rating?: string;
  tags?: string[];
  title: string;
  url: string;
  year?: string | number;
}

/*
 * Component used with HistoryQueueTable
 * One row element of table that displays metadata and a Delete Button
 */
const TableRow = forwardRef<HTMLLIElement, TableRowProps>(({
  contentId,
  deleteHandler,
  deleteButtonText,
  poster,
  rating,
  tags = [],
  title,
  url,
  year = 0,
  index,
  totalItems,
}, ref) => {
  const handleDelete = useCallback(() => deleteHandler(contentId), [contentId, deleteHandler]);
  const intl = useIntl();

  const a11yDescription = `${intl.formatMessage(messages.watch)} ${title} ${year ? `(${year})` : ''} ${tags.length ? `(${tags.join(', ')})` : ''} ${rating ? `${`${intl.formatMessage(messages.rated)} ${rating}`}` : ''}`;

  return (
    <li
      ref={ref}
      className={styles.historyQueueTableRow}
      aria-posinset={index + 1}
      aria-setsize={totalItems}
      aria-label={`${intl.formatMessage(messages.selectToContinueOrDelete, { title })}`}
    >
      <Link
        to={url}
        className={styles.posterLink}
        aria-label={a11yDescription}
      >
        <img className={styles.poster} src={poster} alt={title} aria-hidden="true" />
      </Link>
      <div className={styles.contentData}>
        {year ? <div className={styles.year}>{year}</div> : null}
        <div className={styles.title}>{title}</div>
        {tags.length ? <div className={styles.tags}> {tags.join(', ')}</div> : null}
        {rating ? <div className={styles.rating}><Rating>{rating}</Rating></div> : null}
      </div>
      <div className={styles.deleteButtonContainer}>
        <Button
          className={styles.deleteButton}
          type="button"
          appearance="tertiary"
          onClick={handleDelete}
          aria-label={`${deleteButtonText} ${title}`}
        >
          {deleteButtonText}
        </Button>
      </div>
    </li>
  );
});

const mapStateToProps = ({ video: { byId } }: StoreState, { contentId }: OwnProps) => {
  const video = byId[contentId];
  /* istanbul ignore next */
  const { title = '', year, ratings = [], posterarts: posters, tags } = video;
  const url = getUrlByVideo({ video });

  return {
    poster: posters[0],
    title,
    year,
    rating: ratings[0] ? ratings[0].value : '',
    url,
    tags,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(TableRow);
