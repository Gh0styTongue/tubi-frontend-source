import { Button, Rating } from '@tubitv/web-ui';
import React, { forwardRef } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import type StoreState from 'common/types/storeState';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import styles from './TableRow.scss';

interface OwnProps {
  contentId: string;
  deleteHandler: (id: string) => void;
  deleteButtonText: string;
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
const TableRow = forwardRef<HTMLDivElement, TableRowProps>(({
  contentId,
  deleteHandler,
  deleteButtonText,
  poster,
  rating,
  tags = [],
  title,
  url,
  year = 0,
}, ref) => {
  const handleDelete = () => deleteHandler(contentId);
  return (
    <div ref={ref} className={styles.historyQueueTableRow}>
      <Link to={url} className={styles.posterLink}>
        <img className={styles.poster} src={poster} alt={title} />
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
    </div>
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
