import { defineMessages } from 'react-intl';

const landingPageMessages = defineMessages({
  title: {
    description: 'landing page title',
    defaultMessage: 'Watch Free Movies and TV Shows Online | Free Streaming Video | Tubi',
  },
  description: {
    description: 'landing page description',
    defaultMessage: 'Watch free on Tubi. From deep cuts to hit movies, shows, series, live TV and awarded originals. No subscription. Free forever.',
  },
  keywords: {
    description: 'landing page keywords',
    defaultMessage: 'Watch Free Movies, Watch Free TV, Full Length Movies, Full TV Series, Online Movies, Streaming Movies, HD Movies',
  },
  startWatchingBlockHeader1: {
    description: 'start watching block header texts 1',
    defaultMessage: 'Free Movies & TV',
  },
  startWatchingBlockHeader2: {
    description: 'start watching block header texts 2',
    defaultMessage: 'Fewer Ads than Cable',
  },
  startWatchingBlockHeader3: {
    description: 'start watching block header texts 3',
    defaultMessage: 'No Subscription Required',
  },
  startWatchingBlockSubheader: {
    description: 'start watching block subheader text',
    defaultMessage: 'Thousands of movies and TV shows. Always Free. 100% Legal.',
  },
  startWatchingBlockButton: {
    description: 'start watching block button text',
    defaultMessage: 'Start Watching',
  },
  streamAnywhereBlockHeader: {
    description: 'stream anywhere block header',
    defaultMessage: 'Stream Anywhere',
  },
  streamAnywhereBlockSubheader: {
    description: 'stream anywhere block subheader text',
    defaultMessage: 'Tubi is available for free on Android, iOS, Roku, Apple TV, Amazon Fire TV, Xfinity X1, Xbox, Samsung Smart TVs, Sony Smart TVs, PlayStation and the web.',
  },
  streamAnywhereBlockButton: {
    description: 'stream anywhere block button text',
    defaultMessage: 'Supported Devices',
  },
  thousandsTitlesBlockHeader: {
    description: 'thousands titles block header',
    defaultMessage: 'Thousands of titles',
  },
  thousandsTitlesBlockSubheader: {
    description: 'thousands titles block subheader text',
    defaultMessage: 'Watch amazing movies and TV shows for free. No subscription fees, and no credit cards. Just thousands of hours of streaming video content from studios like Paramount, Lionsgate, MGM and more.',
  },
  thousandsTitlesBlockButton: {
    description: 'thousands titles block button text',
    defaultMessage: 'Browse Titles',
  },
  FAQBlockHeader: {
    description: 'FAQ block header',
    defaultMessage: 'Frequently Asked Questions',
  },
  registerBlockHeader: {
    description: 'register block header',
    defaultMessage: 'Get an account today',
  },
  registerBlockSubheader: {
    description: 'register block subheader text',
    defaultMessage: 'Access free content on all of your devices, sync your list and continue watching anywhere.',
  },
  registerBlockButton: {
    description: 'register block button text',
    defaultMessage: 'Register Free',
  },
});

export const LANDING_PAGE_TEXT = {
  pageMeta: {
    title: landingPageMessages.title,
    description: landingPageMessages.description,
    keywords: landingPageMessages.keywords,
  },
  startWatchingBlock: {
    header: [
      landingPageMessages.startWatchingBlockHeader1,
      landingPageMessages.startWatchingBlockHeader2,
      landingPageMessages.startWatchingBlockHeader3,
    ],
    subheader: landingPageMessages.startWatchingBlockSubheader,
    button: landingPageMessages.startWatchingBlockButton,
  },
  streamAnywhereBlock: {
    header: landingPageMessages.streamAnywhereBlockHeader,
    subheader: landingPageMessages.streamAnywhereBlockSubheader,
    button: landingPageMessages.streamAnywhereBlockButton,
  },
  thousandsTitlesBlock: {
    header: landingPageMessages.thousandsTitlesBlockHeader,
    subheader: landingPageMessages.thousandsTitlesBlockSubheader,
    button: landingPageMessages.thousandsTitlesBlockButton,
  },
  FAQBlock: {
    header: landingPageMessages.FAQBlockHeader,
  },
  registerBlock: {
    header: landingPageMessages.registerBlockHeader,
    subheader: landingPageMessages.registerBlockSubheader,
    button: landingPageMessages.registerBlockButton,
  },
};
