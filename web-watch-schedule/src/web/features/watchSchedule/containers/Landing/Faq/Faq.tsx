import React from 'react';
import { useIntl } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import Accordion from 'web/components/Accordion/Accordion';
import { isSportsEventSelector, titleSelector } from 'web/features/watchSchedule/selectors/landing';

import styles from './Faq.scss';
import messages from './faqMessages';

const Faq = () => {
  const { formatMessage } = useIntl();
  const isSportsEvent = useAppSelector(isSportsEventSelector);
  const title = useAppSelector(titleSelector);

  const items = [
    ...([1, 2, 3] as const).map((num) => {
      let detailMessage = formatMessage(messages[`q${num}Answer`], {
        title,
      });

      if (isSportsEvent && num === 1) {
        detailMessage = formatMessage(messages[`q${num}AnswerForSportsEvent`], {
          title,
        });
      }

      return {
        id: `q${num}`,
        title: formatMessage(messages[`q${num}Title`], {
          title,
        }),
        detail: detailMessage,
      };
    }),
  ];

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <h2 className={styles.head}>{formatMessage(messages.title)}</h2>
        <Accordion items={items} />
      </div>
    </div>
  );
};

export default Faq;
