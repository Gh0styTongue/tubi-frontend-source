import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import React, { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import * as eventTypes from 'common/constants/event-types';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import Collapse from 'web/components/Collapse/Collapse';
import FaqPageSchema from 'web/features/seo/components/FaqPageSchema/FaqPageSchema';
import type { FaqItem } from 'web/features/seo/utils/seo';
import { formatFaqItemsForSeo } from 'web/features/seo/utils/seo';

import { FOX_SPORTS_THANKSGIVING_DAY_URL, HELP_CENTER_URL, HOW_TO_WATCH_URL } from '../constants';
import styles from '../containers/LiveEventDetails/LiveEventDetails.scss';

const onLinkClick = /* istanbul ignore next */() => {
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'CONFIRM',
    component: 'BUTTON',
    buttonType: ButtonType.TEXT,
    buttonValue: 'FAQ_LINK',
  });
  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
};

const inlineTag = {
  link:
    (to: string, className?: string) =>
      (chunks: ReactNode) =>
        (
          <Link
            to={to}
            rel="noopener noreferrer"
            target="_blank"
            className={className}
            onClick={onLinkClick}
          >
            {chunks}
          </Link>
        ),
};

const messages = defineMessages({
  questionTitle: {
    defaultMessage: 'Frequently Asked Questions',
    description: 'Frequently Asked Questions',
  },
  questionSubtitle: {
    defaultMessage: 'Get ahead of the game and learn how to stream Packers vs. Lions.',
    description: 'FAQ subtitle about streaming Packers vs. Lions',
  },
  question1: {
    defaultMessage: 'What time is kick off for Packers vs. Lions?',
    description: 'Question about watching Packers vs. Lions live on Tubi',
  },
  answer1: {
    defaultMessage: 'Packers vs. Lions kick off is at 1:00 PM ET. You can join us early for the official FOX Pregame Show at 11:00 AM ET.',
    description: 'Answer to question about watching Packers vs. Lions live on Tubi',
  },
  question2: {
    defaultMessage: 'Can I watch Packers vs. Lions live on Tubi?',
    description: 'Question about watching Packers vs. Lions live on Tubi',
  },
  answer2: {
    defaultMessage:
      'Yes! You can stream Packers vs. Lions on Tubi when you register for a free account. Packers vs. Lions is also available to watch on FOX and FOX One.',
    description: 'Answer to question about watching Packers vs. Lions live on Tubi',
  },
  question3: {
    defaultMessage: 'Is it free to stream Packers vs. Lions on Tubi?',
    description: 'Question about the cost of streaming Packers vs. Lions on Tubi',
  },
  answer3: {
    defaultMessage: 'Absolutely. We’ll never ask you for fees or subscriptions (ever). No credit card required.',
    description: 'Answer about the cost of streaming Packers vs. Lions on Tubi',
  },
  question4: {
    defaultMessage: 'How do I watch Packers vs. Lions on Tubi?',
    description: 'Question about how to watch Packers vs. Lions on Tubi',
  },
  answer4: {
    defaultMessage: 'Visit <customTag>Help Center</customTag> for a step-by-step guide on how to watch.',
    description: 'Answer about how to watch Packers vs. Lions on Tubi',
  },
  question5: {
    defaultMessage: 'Do I need an account to watch Packers vs. Lions on Tubi?',
    description: 'Question about account requirement',
  },
  answer5: {
    defaultMessage: 'Yes, you need to register for a free account and sign in to watch the game.',
    description: 'Answer about account requirement',
  },
  question6: {
    defaultMessage: 'Why should I register for a Tubi account?',
    description: 'Question about account requirement',
  },
  answer6: {
    defaultMessage: 'You’ll be able to pick up where you’ve left off on anything you’re watching and access fun mobile-only features. Plus, you’ll have access to 270+ Live TV channels and Tubi’s entire library of shows and movies—including iconic sports stories that’ll fuel your fandom all year long.',
    description: 'Answer about account requirement',
  },
  question7: {
    defaultMessage: 'Can I watch all NFL games for free on Tubi?',
    description: 'Question about all NFL games for free on Tubi',
  },
  answer7: {
    defaultMessage:
      'No, but you can get 24/7 access to NFL content on the NFL Channel. Check out live game-day coverage, NFL game replays, original shows, and more. Always on, always free.',
    description: 'Answer about all NFL games for free on Tubi',
  },
  question8: {
    defaultMessage: 'What devices can I use to stream Packers vs. Lions on Tubi?',
    description: 'Question about devices to stream Packers vs. Lions on Tubi',
  },
  answer8: {
    defaultMessage:
      'Tubi works on most smart TVs, mobile devices, and streaming sticks. Visit the <customTag>Help Center</customTag> for a complete list of supported devices. Traveling on Thanksgiving Day? Get the Tubi mobile app to take the game on the go.',
    description: 'Answer about devices to stream Packers vs. Lions on Tubi',
  },
  question9: {
    defaultMessage: 'What devices support 4K?',
    description: 'Question about 4K support',
  },
  answer9: {
    defaultMessage: 'Visit the <customTag>Help Center</customTag> for a complete list of devices',
    description: 'Answer about 4K support',
  },
  question10: {
    defaultMessage: 'Will Packers vs. Lions be streamed in Spanish on Tubi?',
    description: 'Question about Packers vs. Lions being streamed in Spanish on Tubi',
  },
  answer10: {
    defaultMessage: 'Packers vs. Lions will not be available in Spanish on Tubi. Spanish coverage of the game will be available on FOX Deportes and FOX One.',
    description: 'Answer about Packers vs. Lions being streamed in Spanish on Tubi',
  },
  question11: {
    defaultMessage: 'Where can I get help while streaming Packers vs. Lions on Tubi?',
    description: 'Question about getting help while streaming Packers vs. Lions on Tubi',
  },
  answer11: {
    defaultMessage: 'Visit the <customTag>Help Center</customTag> for additional assistance.',
    description: 'Answer about getting help while streaming Packers vs. Lions on Tubi',
  },
  question12: {
    defaultMessage: 'Where can I find more information about Packers vs. Lions?',
    description: 'Question about finding more information about Packers vs. Lions',
  },
  answer12: {
    defaultMessage:
      'You can find more information about Packers vs. Lions and ongoing 2025 season coverage before, during, and after the game at <customTag>Fox Sports Thanksgiving Day 2025</customTag>.',
    description: 'Answer about finding more information about Packers vs. Lions',
  },
});

const CLOSED_FAQ_MENU_STATE_IDX = -1;

const FAQ: React.FC = () => {
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

  const faqItems = useMemo(() => [
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
      detail: formatMessage(messages.answer3),
    },
    {
      title: formatMessage(messages.question4),
      detail: formatMessage(messages.answer4, {
        customTag: inlineTag.link(HOW_TO_WATCH_URL, styles.clickable),
      }),
    },
    {
      title: formatMessage(messages.question5),
      detail: formatMessage(messages.answer5),
    },
    {
      title: formatMessage(messages.question6),
      detail: formatMessage(messages.answer6),
    },
    {
      title: formatMessage(messages.question7),
      detail: formatMessage(messages.answer7),
    },
    {
      title: formatMessage(messages.question8),
      detail: formatMessage(messages.answer8, {
        customTag: inlineTag.link(HELP_CENTER_URL, styles.clickable),
      }),
    },
    {
      title: formatMessage(messages.question9),
      detail: formatMessage(messages.answer9, {
        customTag: inlineTag.link(HELP_CENTER_URL, styles.clickable),
      }),
    },
    {
      title: formatMessage(messages.question10),
      detail: formatMessage(messages.answer10),
    },
    {
      title: formatMessage(messages.question11),
      detail: formatMessage(messages.answer11, {
        customTag: inlineTag.link(HELP_CENTER_URL, styles.clickable),
      }),
    },
    {
      title: formatMessage(messages.question12),
      detail: formatMessage(messages.answer12, {
        customTag: inlineTag.link(FOX_SPORTS_THANKSGIVING_DAY_URL, styles.clickable),
      }),
    },
  ] as FaqItem[], [formatMessage]);

  return (
    <div className={styles.faqSection}>
      <h2 className={styles.title}>
        {formatMessage(messages.questionTitle)}
      </h2>
      <p className={styles.description}>
        {formatMessage(messages.questionSubtitle)}
      </p>
      <Collapse
        list={faqItems}
        selectedIdx={FAQSelectedIdx}
        onClick={clickFAQCollapse}
      />
      <FaqPageSchema items={formatFaqItemsForSeo(faqItems)} />
    </div>
  );
};

export default FAQ;
