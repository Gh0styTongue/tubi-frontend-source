import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  season: {
    description: 'number of seasons',
    defaultMessage: '{seriesSeasonNum, select, 1 {1 Season} other {{seriesSeasonNum} Seasons}}',
  },
});

export const getSeasonDisplayText = (formatMessage: IntlShape['formatMessage'], seriesSeasonNum?: number) => {
  if (!seriesSeasonNum) {
    return '';
  }
  return formatMessage(messages.season, { seriesSeasonNum });
};
