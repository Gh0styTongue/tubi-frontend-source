/* istanbul ignore file */
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import styles from 'web/features/superbowl/containers/SuperBowl/HowToWatchSuperBowl.scss';

import type { Guide } from './GuideList';

interface GuideList {
  title: string;
  description?: string | React.ReactNode;
  list: Guide[];
}
const messages = defineMessages({
  stepByStepTitle: {
    defaultMessage: 'Step-by-Step Guide',
    description: 'Step-by-Step Guide',
  },
  stepByStep1: {
    defaultMessage: 'Download the app or visit the Tubi website:',
    description: 'Download the app or visit the Tubi website:',
  },
  stepByStep101: {
    defaultMessage:
      'You can download the Tubi app from the Apple App Store, Google Play Store, or your smart TV\'s app marketplace.',
    description:
      'description',
  },
  stepByStep102: {
    defaultMessage: 'Alternatively, visit <tubiCom>tubitv.com</tubiCom> on your browser.',
    description: 'description',
  },
  stepByStep2: {
    defaultMessage: 'Create a free account (if you don\'t already have one):',
    description: 'description',
  },
  stepByStep201: {
    defaultMessage:
      'While Tubi doesn\'t normally require users to create an account to access content, an account will be required for the Super Bowl.',
    description: 'description',
  },
  stepByStep3: {
    defaultMessage: 'Find Super Bowl LIX stream on game day:',
    description: 'description',
  },
  stepByStep301: {
    defaultMessage: 'Navigate to Super Bowl LIX streaming link featured on the Tubi homepage.',
    description: 'description',
  },
  stepByStep4: {
    defaultMessage: 'Ensure a smooth streaming experience:',
    description: 'description',
  },
  stepByStep401: {
    defaultMessage: 'Make sure you\'re on a stable internet connection.',
    description: 'description',
  },
  stepByStep402: {
    defaultMessage: 'Check that your device supports the Tubi app.',
    description: 'description',
  },
  whichAppsToDownloadTitle: {
    defaultMessage: 'Which Apps to Download to Watch Super Bowl LIX',
    description: 'description',
  },
  whichAppsToDownload1: {
    defaultMessage:
      'To watch Super Bowl LIX on Tubi, download the Tubi app, which is compatible with the following devices:',
    description: 'description',
  },
  whichAppsToDownload101: {
    defaultMessage: 'Streaming devices: Roku sticks, Amazon Fire sticks, Apple TV, and Google Chromecast',
    description: 'description',
  },

  whichAppsToDownload102: {
    defaultMessage: 'Smart TVs: Samsung, LG, Vizio, Sony, and devices with GoogleTV OS',
    description: 'description',
  },
  whichAppsToDownload103: {
    defaultMessage: 'Mobile devices: iOS and Android smartphones and tablets',
    description: 'description',
  },
  whichAppsToDownloadDescription: {
    defaultMessage: 'The Tubi app is available on all major app stores, making it easy to set up before game day.',
    description: 'description',
  },
  matchupTitle: {
    defaultMessage: 'What Time is Super Bowl LIX?',
    description: 'description',
  },
  matchup1: {
    defaultMessage: 'Kick off is at 6:30 PM ET, with pregame coverage starting at 11 AM ET.',
    description: 'description',
  },
});

const useGuideList = () => {
  const intl = useIntl();
  const stepByStepList: GuideList = {
    title: intl.formatMessage(messages.stepByStepTitle),
    list: [
      {
        id: 1,
        description: intl.formatMessage(messages.stepByStep1),
        children: [
          {
            id: 101,
            description: intl.formatMessage(messages.stepByStep101),
          },
          {
            id: 102,
            description: intl.formatMessage(messages.stepByStep102, {
              tubiCom: (msg: React.ReactNode[]) => <Link to={WEB_ROUTES.home} className={styles.link}>{msg}</Link>,
            }),
          },
        ],
      },
      {
        id: 2,
        description: intl.formatMessage(messages.stepByStep2),
        children: [
          {
            id: 201,
            description: intl.formatMessage(messages.stepByStep201),
          },
        ],
      },
      {
        id: 3,
        description: intl.formatMessage(messages.stepByStep3),
        children: [
          {
            id: 301,
            description: intl.formatMessage(messages.stepByStep301),
          },
        ],
      },
      {
        id: 4,
        description: intl.formatMessage(messages.stepByStep4),
        children: [
          {
            id: 401,
            description: intl.formatMessage(messages.stepByStep401),
          },
          {
            id: 402,
            description: intl.formatMessage(messages.stepByStep402),
          },
        ],
      },
    ],
  };

  const whichAppsToDownloadList: GuideList = {
    title: intl.formatMessage(messages.whichAppsToDownloadTitle),
    description: intl.formatMessage(messages.whichAppsToDownloadDescription),
    list: [
      {
        id: 1,
        description: intl.formatMessage(messages.whichAppsToDownload1),
        children: [
          {
            id: 101,
            description: intl.formatMessage(messages.whichAppsToDownload101),
          },
          {
            id: 102,
            description: intl.formatMessage(messages.whichAppsToDownload102),
          },
          {
            id: 103,
            description: intl.formatMessage(messages.whichAppsToDownload103),
          },
        ],
      },
    ],
  };

  const matchupList: GuideList = {
    title: intl.formatMessage(messages.matchupTitle),
    list: [
      {
        id: 1,
        description: intl.formatMessage(messages.matchup1),
      },
    ],
  };

  return {
    stepByStepList,
    whichAppsToDownloadList,
    matchupList,
  };
};

export default useGuideList;
