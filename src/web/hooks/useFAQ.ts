import type { IntlFormatters } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import { isUsCountrySelector } from 'common/selectors/ui';

const messages = defineMessages({
  title1: {
    description: 'FAQ block list item No. 1 title',
    defaultMessage: 'What is Tubi?',
  },
  detail1: {
    description: 'FAQ block list item No. 1 detail',
    defaultMessage:
      'Tubi\'s the #1 free ad-supported entertainment streamer. With the largest library in the entire streaming universe and personalized content recommendations, we\'ve got it all—available on all your devices. Discover hit movies, bingeable shows, and award-winning Originals. No subscriptions. No credit cards. No fees.',
  },
  detail1ForUS: {
    description: 'FAQ block list item No. 1 detail',
    defaultMessage:
      'Tubi\'s the #1 free ad-supported entertainment streamer. With the largest library in the entire streaming universe and personalized content recommendations, we\'ve got it all—available on all your devices. Discover hit movies, bingeable shows, live TV, and award-winning Originals. No subscriptions. No credit cards. No fees.',
  },
  title2: {
    description: 'FAQ block list item No. 2 title',
    defaultMessage: 'Is Tubi really free?',
  },
  detail2: {
    description: 'FAQ block list item No. 2 detail',
    defaultMessage:
      'Yes! Tubi is a free (and legal) video streaming application. To keep our service free and legal, we include ads, which monetize the content that our partners, such as MGM, Lionsgate, and Paramount, provide to us!',
  },
  title3: {
    description: 'FAQ block list item No. 3 title',
    defaultMessage: 'Is Tubi legal?',
  },
  detail3: {
    description: 'FAQ block list item No. 3 detail',
    defaultMessage:
      'Yes! Tubi is a legal (and free) video streaming application. To keep our service legal and free, we include ads, which monetize the content that our partners, such as MGM, Lionsgate, and Paramount, provide to us!',
  },
});

export const getFAQMessages = (formatMessage: IntlFormatters['formatMessage'], isUsCountry: boolean) => [
  {
    id: messages.title1.defaultMessage,
    title: formatMessage(messages.title1),
    detail: formatMessage(isUsCountry ? messages.detail1ForUS : messages.detail1),
  },
  {
    id: messages.title2.defaultMessage,
    title: formatMessage(messages.title2),
    detail: formatMessage(messages.detail2),
  },
  {
    id: messages.title3.defaultMessage,
    title: formatMessage(messages.title3),
    detail: formatMessage(messages.detail3),
  },
];

const useFAQ = (): { id: string; title: string; detail: string }[] => {
  const { formatMessage } = useIntl();
  const isUsCountry = useAppSelector(isUsCountrySelector);

  return getFAQMessages(formatMessage, isUsCountry);
};

export default useFAQ;
