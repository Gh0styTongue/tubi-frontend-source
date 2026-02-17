import { Plus } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useState, Fragment } from 'react';

import FaqPageSchema from 'web/features/seo/components/FaqPageSchema/FaqPageSchema';
import { formatFaqItemsForSeo } from 'web/features/seo/utils/seo';

import styles from './Accordion.scss';

interface AccordionItem {
  id: string;
  title: string;
  detail: string;
}

interface Props {
  items: AccordionItem[];
  isRichResultsEnabled?: boolean;
  useLegacyTheme?: boolean;
}

const Accordion = ({ items, isRichResultsEnabled = true, useLegacyTheme }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (id: string) => setSelectedId(selectedId === id ? null : id);

  return (
    <Fragment>
      <ul
        className={classNames(styles.root, {
          [styles.legacyTheme]: useLegacyTheme,
        })}
      >
        {items.map(({ id, title, detail }: AccordionItem) => {
          const selected = selectedId === id;
          const titleId = `${id}title`;
          const detailId = `${id}detail`;

          return (
            <li key={id} className={selected ? styles.show : styles.hide}>
              <button
                id={titleId}
                className={styles.title}
                onClick={() => handleClick(id)}
                aria-expanded={selected}
                aria-controls={detailId}
              >
                {title}
                <Plus className={styles.icon} />
              </button>
              <div
                id={detailId}
                className={styles.detail}
                aria-labelledby={titleId}
                role="region"
                aria-hidden={!selected}
              >
                {detail}
              </div>
            </li>
          );
        })}
      </ul>

      {isRichResultsEnabled && <FaqPageSchema items={formatFaqItemsForSeo(items)} />}
    </Fragment>
  );
};

export default Accordion;
