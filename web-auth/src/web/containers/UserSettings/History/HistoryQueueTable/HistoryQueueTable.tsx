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
}

const HistoryQueueTable: FC<HistoryQueueTableProps> = ({
  className,
  contentIds,
  deleteHandler,
  deleteButtonText,
}) => {
  const [getRef] = useRefMap<HTMLDivElement | null>(null);

  if (contentIds.length === 0) return null;

  const tableCls = classNames(styles.table, className);
  return (
    <div className={tableCls}>
      <TransitionGroup component="div" enter={false}>
        {
          contentIds.map(contentId => (
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
              />
            </CSSTransition>
          ))
        }
      </TransitionGroup>
    </div>
  );
};

export default HistoryQueueTable;
