/* istanbul ignore file */
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import Collapse from 'web/components/Collapse/Collapse';
import FaqPageSchema from 'web/features/seo/components/FaqPageSchema/FaqPageSchema';
import type { FaqItem } from 'web/features/seo/utils/seo';
import { formatFaqItemsForSeo } from 'web/features/seo/utils/seo';
import { SB_HELP_CENTER_URL } from 'web/features/superbowl/containers/SuperBowl/sb-constants';

import styles from '../SuperBowl.scss';

const messages = defineMessages({
  questionTitle: {
    defaultMessage: 'Frequently Asked Questions',
    description: 'Frequently Asked Questions',
  },
  question1: {
    defaultMessage: 'Can I watch Super Bowl LIX live on Tubi?',
    description: 'Question about watching the Super Bowl live on Tubi',
  },
  answer1: {
    defaultMessage:
      'Yes! You can stream Super Bowl LIX for free when you register. Super Bowl LIX is also available to watch on FOX, FOX Deportes, Telemundo and across NFL digital properties with unauthenticated access across devices.',
    description: 'Answer to question about watching the Super Bowl live on Tubi',
  },
  question2: {
    defaultMessage: 'Is it free to stream Super Bowl LIX on Tubi?',
    description: 'Question about the cost of streaming the Super Bowl on Tubi',
  },
  answer2: {
    defaultMessage: 'Absolutely! There are no fees or subscriptions required (ever). No credit card required.',
    description: 'Answer to question about the cost of streaming the Super Bowl on Tubi',
  },
  question3: {
    defaultMessage: 'What devices can I use to stream Super Bowl LIX on Tubi?',
    description: 'Question about the devices compatible with streaming the Super Bowl on Tubi',
  },
  answer3: {
    defaultMessage:
      'Tubi works on most smart TVs, mobile devices, and streaming sticks. Visit the <tubiCom>Help Center</tubiCom> for a complete list of supported devices.',
    description: 'faq answer',
  },
  question4: {
    defaultMessage: 'Which devices support 4K?',
    description: 'faq',
  },
  answer4: {
    defaultMessage:
      'You\'ll be able to stream in 4K on supported devices like Roku, Fire TV, Android TV and Apple TV. To enjoy 4K quality, make sure you’re all set with the right setup: a 4K TV, a 4K-compatible streaming device, and a 4K-compatible HDMI cable, along with a fast, reliable internet connection',
    description: 'faq answer',
  },
  question5: {
    defaultMessage: 'What time is kick off for Super Bowl LIX?',
    description: 'faq question',
  },
  answer5: {
    defaultMessage:
      'Super Bowl LIX kick off is at 6:30 PM ET. You can join us early for both the official FOX Pre-Game Show at 11:00 AM ET and the exclusive Tubi Red Carpet at 3:30 PM ET.',
    description: 'faq answer',
  },
  question11: {
    defaultMessage: 'Which teams are playing in Super Bowl LIX?',
    description: 'faq question',
  },
  answer11: {
    defaultMessage:
      'The matchup for Super Bowl LIX is set! The Kansas City Chiefs will face off against the Philadelphia Eagles in what promises to be an epic championship game. Stay tuned for more updates and insights on these teams as they prepare for the big event.',
    description: 'faq answer',
  },
  question6: {
    defaultMessage: 'Will Super Bowl LIX be streamed in Spanish?',
    description: 'faq question',
  },
  answer6: {
    defaultMessage: 'Yes! Super Bowl LIX will be available on Tubi in Spanish through the FOX Deportes Live Stream.',
    description: 'faq answer',
  },
  question7: {
    defaultMessage: 'Where can I learn more about Super Bowl LIX on Tubi?',
    description: 'faq question',
  },
  answer7: {
    defaultMessage: 'Please visit <tubiCom>https://tubitv.com/how-to-watch-the-super-bowl</tubiCom>',
    description: 'faq answer',
  },
  question10: {
    defaultMessage: 'Where can I find more information about Super Bowl LIX on Feb 9th 2025',
    description: 'faq question',
  },
  answer10: {
    defaultMessage:
      'You can find more information about Super Bowl LIX and all the playoff coverage and updates for before, during and after the game at <tubiCom>Fox Sports Super Bowl LIX coverage.</tubiCom>',
    description: 'faq answer',
  },
  answer7b: {
    defaultMessage: 'Please visit <tubiCom>https://tubitv.com/superbowl</tubiCom>',
    description: 'faq answer',
  },
  question9: {
    defaultMessage: 'Will Tubi stream Super Bowl LIX ads?',
    description: 'faq question',
  },
  answer9: {
    defaultMessage: 'Yes! The ads seen on our stream will be the same as a typical broadcast.',
    description: 'faq answer',
  },
  question8: {
    defaultMessage: 'Why should I register for a free Tubi account?',
    description: 'faq question',
  },
  answer8: {
    defaultMessage:
      'To stream Super Bowl LIX live and for free, of course! Plus, 270+ other live TV channels. Registered users also get better, more personalized recommendations on what to watch, and access to fun mobile-only features.',
    description: 'faq answer',
  },
  question12: {
    defaultMessage: 'When is the NFL Draft?',
    description: 'faq question',
  },
  answer12: {
    defaultMessage: 'April 24-26, 2025',
    description: 'faq answer',
  },
  question13: {
    defaultMessage: 'What time does the NFL Draft start?',
    description: 'faq question',
  },
  answer13: {
    defaultMessage: 'Day 1 (April 24): 8 PM ET<tagbreak></tagbreak>Day 2 (April 25): 7 PM ET<tagbreak></tagbreak>Day 3 (April 26): 12 PM ET',
    description: 'faq answer',
  },
  question14: {
    defaultMessage: 'Where can I watch the NFL Draft?',
    description: 'faq question',
  },
  answer14: {
    defaultMessage: 'Watch every pick on the NFL Channel via NFL Draft Center live and for free on Tubi.',
    description: 'faq answer',
  },
  question15: {
    defaultMessage: 'Who will be the number 1 pick?',
    description: 'faq question',
  },
  answer15: {
    defaultMessage: 'Stay tuned to Mock Draft Live for updates.',
    description: 'faq answer',
  },
});

const CLOSED_FAQ_MENU_STATE_IDX = -1;

const QuestionList: React.FC<any> = ({ isSuperbowlPage, isDraftPage }: { isSuperbowlPage?: boolean, isDraftPage?: boolean }) => {
  const { formatMessage } = useIntl();
  const [FAQSelectedIdx, setFAQSelectedIdx] = useState(CLOSED_FAQ_MENU_STATE_IDX);
  const clickFAQCollapse = useCallback(
    (idx: number) => {
      if (FAQSelectedIdx === idx) {
        setFAQSelectedIdx(CLOSED_FAQ_MENU_STATE_IDX);
        return;
      }

      setFAQSelectedIdx(idx);
    },
    [FAQSelectedIdx]
  );

  let faqItems = [
    {
      title: formatMessage(messages.question1),
      detail: formatMessage(messages.answer1),
    },
    {
      title: formatMessage(messages.question2),
      detail: formatMessage(messages.answer2),
    },
    {
      title: formatMessage(messages.question3),
      detail: formatMessage(messages.answer3, {
        tubiCom: (msg: ReactNode) => (
          <Link to={SB_HELP_CENTER_URL} target="_blank" className={styles.link}>
            {msg}
          </Link>
        ),
      }),
    },
    {
      title: formatMessage(messages.question4),
      detail: formatMessage(messages.answer4),
    },
    {
      title: formatMessage(messages.question5),
      detail: formatMessage(messages.answer5),
    },
    {
      title: formatMessage(messages.question11),
      detail: formatMessage(messages.answer11),
    },
    {
      title: formatMessage(messages.question6),
      detail: formatMessage(messages.answer6, {
        tubiCom: (msg: ReactNode) => (
          <Link to={SB_HELP_CENTER_URL} target="_blank" className={styles.link}>
            {msg}
          </Link>
        ),
      }),
    },
    {
      title: formatMessage(messages.question7),
      detail: isSuperbowlPage
        ? formatMessage(messages.answer7, {
          tubiCom: (msg: ReactNode) => (
            <Link to={WEB_ROUTES.howToWatchSuperBowl} target="_blank" className={styles.link}>
              {msg}
            </Link>
          ),
        })
        : formatMessage(messages.answer7b, {
          tubiCom: (msg: ReactNode) => (
            <Link to={WEB_ROUTES.superBowl} target="_blank" className={styles.link}>
              {msg}
            </Link>
          ),
        }),
    },
    {
      title: formatMessage(messages.question10),
      detail: formatMessage(messages.answer10, {
        tubiCom: (msg: ReactNode) => (
          <Link to="https://www.foxsports.com/nfl/super-bowl" target="_blank" className={styles.link}>
            {msg}
          </Link>
        ),
      }),
    },
    {
      title: formatMessage(messages.question9),
      detail: formatMessage(messages.answer9),
    },
    {
      title: formatMessage(messages.question8),
      detail: formatMessage(messages.answer8),
    },
  ] as FaqItem[];

  if (isDraftPage) {
    faqItems = [
      {
        title: formatMessage(messages.question12),
        detail: formatMessage(messages.answer12),
      },
      {
        title: formatMessage(messages.question13),
        detail: formatMessage(messages.answer13, {
          tagbreak: () => (
            <br />
          ),
        }),
      },
      {
        title: formatMessage(messages.question14),
        detail: formatMessage(messages.answer14),
      },
      {
        title: formatMessage(messages.question15),
        detail: formatMessage(messages.answer15),
      },
    ];
  }

  return (
    <div className={styles.questionContainer}>
      <h2 className={classNames(styles.containerTitle, styles.questionTitle)}>
        {formatMessage(messages.questionTitle)}
      </h2>
      <Collapse list={faqItems} selectedIdx={FAQSelectedIdx} onClick={clickFAQCollapse} />
      <FaqPageSchema items={formatFaqItemsForSeo(faqItems)} />
    </div>
  );
};

export default QuestionList;
