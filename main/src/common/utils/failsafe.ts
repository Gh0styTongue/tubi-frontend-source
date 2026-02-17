import { toAMOrPM, isNextDay } from '@adrise/utils/lib/time';
import { defineMessages } from 'react-intl';
import type { IntlShape } from 'react-intl';

import tubiHistory from 'common/history';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { forceFailsafeExperimentSelector } from 'common/selectors/experiments/forceFailsafe';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type StoreState from 'common/types/storeState';
import { getPlatform } from 'common/utils/platform';

// For failsafe CDN request, we need to add the following headers:
export const getFailSafeHeaders = (state: StoreState, contentMode?: string) => {
  const headers: Record<string, string | number> = {};
  const { auth: { user }, userSettings } = state;

  const isForcedFailsafe = forceFailsafeExperimentSelector(state) || FeatureSwitchManager.get('force_failsafe') === FeatureSwitchManager.ENABLE_VALUE;
  if (isForcedFailsafe) {
    headers['X-TRIGGER-FAILSAFE'] = 'GAME_DAY_EXPERIENCE';
  }
  headers['X-TUBI-PLATFORM'] = getPlatform();
  headers['X-TUBI-MODE'] = contentMode || currentContentModeSelector(state, { pathname: tubiHistory.getCurrentLocation().pathname });
  if (user && userSettings) {
    headers['X-TUBI-RATING'] = userSettings.parentalRating;
  }
  return headers;
};

const messages = defineMessages({
  feature: {
    description: 'default feature name',
    defaultMessage: 'Feature',
  },
  search: {
    description: 'Search page name',
    defaultMessage: 'Search',
  },
  myStuff: {
    description: 'My stuff page name',
    defaultMessage: 'My Stuff',
  },
  rating: {
    description: 'Rating feature name',
    defaultMessage: 'Rating',
  },
  myList: {
    description: 'My List feature name',
    defaultMessage: 'My List',
  },
  reminder: {
    description: 'Reminder feature name',
    defaultMessage: 'Reminder',
  },
  continueWatching: {
    description: 'Continue Watching feature name',
    defaultMessage: 'Continue Watching',
  },
  tomorrow: {
    description: 'The text for the end time of failsafe tomorrow, for example, "3:00 PM tomorrow".',
    defaultMessage: '{time} tomorrow',
  },
});

export type FailsafeMessageKey = keyof typeof messages;
interface GetFormattedFailsafeMessageParams {
  intl: IntlShape;
  currentDate: Date;
  endTime?: string;
  header?: string;
  subtext?: string;
  feature: FailsafeMessageKey;
}
export const getFormattedFailsafeMessage = ({
  intl,
  currentDate,
  endTime,
  header,
  subtext,
  feature,
}: GetFormattedFailsafeMessageParams) => {
  let formattedHeader;
  let formattedSubtext;
  if (!endTime) {
    return { formattedHeader, formattedSubtext };
  }
  const isStartingTomorrow = isNextDay(currentDate, new Date(endTime));
  let date = isStartingTomorrow ? intl.formatMessage(messages.tomorrow, {
    time: toAMOrPM(endTime),
  }) : toAMOrPM(endTime);
  date = date.replace(' ', '\u00A0');

  formattedHeader = header ? header.replace('{feature}', intl.formatMessage(messages[feature] || messages.feature)) : null;
  formattedSubtext = subtext ? subtext.replace('{time}', date) : null;

  return { formattedHeader, formattedSubtext };
};
