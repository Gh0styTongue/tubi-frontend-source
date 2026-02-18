import React from 'react';
import { useIntl } from 'react-intl';

import Accordion from 'web/components/Accordion/Accordion';
import styles from 'web/features/watchSchedule/containers/Landing/Faq/Faq.scss';
import messages from 'web/features/watchSchedule/containers/Landing/Faq/faqMessages';
import useFAQ from 'web/hooks/useFAQ';

const Faq = () => {
  const { formatMessage } = useIntl();
  const items = useFAQ();

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
