import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    description: 'faq section title',
    defaultMessage: 'Frequently Asked Questions',
  },
  q1Title: {
    description: 'title of Q1',
    defaultMessage: 'Can I watch {title} for free?',
  },
  q1Answer: {
    description: 'answer to Q1',
    defaultMessage:
      'Yes! Tubi has {title} available for free. You’ll be able to access scheduled episodes on WBTV Channels on Tubi.',
  },
  q1AnswerForSportsEvent: {
    description: 'answer to Q1 for sports event',
    defaultMessage:
      'Yes! Tubi has {title} available for free. You’ll be able to access scheduled matches on Fox Sports Channel on Tubi.',
  },
  q2Title: {
    description: 'title of Q2',
    defaultMessage: 'Where can I watch {title} for free?',
  },
  q2Answer: {
    description: 'answer to Q2',
    defaultMessage:
      '{title} on Tubi is available for free on Android, iOS, Roku, Apple TV, Amazon Fire TV, Xfinity X1, Xbox, Samsung Smart TVs, Sony Smart TVs, Playstation, LG TV and the web.',
  },
  q3Title: {
    description: 'title of Q3',
    defaultMessage: 'Is {title} on Tubi Legal?',
  },
  q3Answer: {
    description: 'answer to Q3',
    defaultMessage:
      'Yes! Tubi is a free and legal video streaming service. To Keep our service free and legal, we include ads, which monetize {title} via linear channels as well as movies and TV shows that you love.',
  },
});

export default messages;
