import type { IntlFormatters } from 'react-intl';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  hour: {
    description: 'abbreviation for hour',
    defaultMessage: '{hours} hr',
  },
  minute: {
    description: 'abbreviation for minute',
    defaultMessage: '{minutes} min',
  },
  hoursAndMinutes: {
    description: 'hours and minutes',
    defaultMessage: '{hours, plural, =0 {} other {# hr }}{minutes, plural, =0 {} other {# min }}{remaining, select, true {left} other {}}',
  },
  sunday: {
    description: 'abbreviation for Sunday',
    defaultMessage: 'Sun',
  },
  monday: {
    description: 'abbreviation for Monday',
    defaultMessage: 'Mon',
  },
  tuesday: {
    description: 'abbreviation for Tuesday',
    defaultMessage: 'Tue',
  },
  wednesday: {
    description: 'abbreviation for Wednesday',
    defaultMessage: 'Wed',
  },
  thursday: {
    description: 'abbreviation for Thursday',
    defaultMessage: 'Thu',
  },
  friday: {
    description: 'abbreviation for Friday',
    defaultMessage: 'Fri',
  },
  saturday: {
    description: 'abbreviation for Saturday',
    defaultMessage: 'Sat',
  },
});

export function getPaddingNumber(num: number): string {
  let result = '';
  if (num === 0) {
    result = '00';
  } else {
    result = num < 10 ? `0${num}` : `${num}`;
  }

  return result;
}

/**
 * @param sec Duration in seconds
 * @param formatMessage [optional] Only use this with the component support i18n
 * @param remaining [optional] If true, prints `1h left` instead of just `1hr`
 */
export const secondsToHoursAndMinutes = (sec?: number, formatMessage?: IntlFormatters['formatMessage'], remaining = false): string => {
  if (!sec || sec === Infinity) {
    return '';
  }
  const totalMinutes = Math.ceil(sec / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = parseInt(`${totalMinutes % 60}`, 10);
  const supportsPluralRules = typeof Intl !== 'undefined' && 'PluralRules' in Intl;

  if (formatMessage && supportsPluralRules) {
    return formatMessage(messages.hoursAndMinutes, { hours, minutes, remaining }).trim();
  }

  return [
    hours ? `${hours} hr` : '',
    minutes ? `${minutes} min` : '',
    remaining ? 'left' : '',
  ].filter(Boolean).join(' ');
};

/**
 * seconds to HH:MM:SS
 * @param sec
 * @returns {String}
 */
export const secondsToHMS = (sec?: number): string => {
  if (!sec) {
    return '00:00:00';
  }

  const totalMinutes = Math.floor(sec / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = parseInt(`${totalMinutes % 60}`, 10);
  const seconds = parseInt(`${sec % 60}`, 10);

  const minutesSecondsStr = `${getPaddingNumber(minutes)}:${getPaddingNumber(seconds)}`;

  let hoursStr = '';
  // if hours is 0, omit it
  if (hours) {
    hoursStr = `${getPaddingNumber(hours)}:`;
  }

  return hoursStr + minutesSecondsStr;
};

export const toHumanReadableDuration = (durationInSeconds: number): string => {
  const totalLengthInMins = Math.floor(durationInSeconds / 60);
  const hours = Math.floor(totalLengthInMins / 60);
  const minutes = totalLengthInMins % 60;
  const hoursToString = hours ? `${hours} hr ` : '';
  return `${hoursToString}${minutes} min`;
};

export const getTodayRemainingSeconds = (): number => {
  const now = new Date();
  const theEnd = new Date();
  theEnd.setHours(23);
  theEnd.setMinutes(59);
  theEnd.setSeconds(59);
  return Math.round((+theEnd - +now) / 1000);
};

export const getWeekDayName = (day:number, formatMessage: IntlFormatters['formatMessage']) => {
  switch (day) {
    case 0:
      return formatMessage(messages.sunday);
    case 1:
      return formatMessage(messages.monday);
    case 2:
      return formatMessage(messages.tuesday);
    case 3:
      return formatMessage(messages.wednesday);
    case 4:
      return formatMessage(messages.thursday);
    case 5:
      return formatMessage(messages.friday);
    case 6:
      return formatMessage(messages.saturday);
    default:
      break;
  }
};
