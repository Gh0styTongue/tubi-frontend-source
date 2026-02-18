import { useRefMap } from '@adrise/utils/lib/useRefMap';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import styles from './HistoryQueueTable.scss';
import TableRow from './TableRow/TableRow';

/**
 *
 * @param contentIds - array of ids to display
 * @returns a very basic list/table
 *
 */

const itemTransitions = {
  exit: styles.itemLeave,
  exitActive: styles.itemLeaveActive,
};

interface HistoryQueueTableProps {
  className?: string;
  contentIds: string[];
  deleteHandler: (id: string) => void;
  deleteButtonText: string;
  listTitle: string;
}

const HistoryQueueTable: FC<HistoryQueueTableProps> = ({
  className,
  contentIds,
  deleteHandler,
  deleteButtonText,
  listTitle,
}) => {
  const [getRef] = useRefMap<HTMLLIElement | null>(null);

  if (contentIds.length === 0) return null;

  const tableCls = classNames(styles.table, className);

  return (
    <TransitionGroup component="ul" className={tableCls} aria-label={listTitle} enter={false}>
      {
        contentIds.map((contentId, index) => (
          <CSSTransition
            classNames={itemTransitions}
            timeout={{ exit: 400 }}
            key={contentId}
            nodeRef={getRef(contentId)}
          >
            <TableRow
              ref={getRef(contentId)}
              deleteHandler={deleteHandler}
              contentId={contentId}
              deleteButtonText={deleteButtonText}
              index={index}
              totalItems={contentIds.length}
            />
          </CSSTransition>
        ))
      }
    </TransitionGroup>
  );
};

export default HistoryQueueTable;
