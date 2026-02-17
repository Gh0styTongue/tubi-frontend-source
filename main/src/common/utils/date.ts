import { mins } from '@adrise/utils/lib/time';

/**
  * @param {Date}
  * @param {Date}
  * @returns {number}
  */
export const timeDiffInDays = (date1: Date, date2: Date): number => {
  const diff = date1.getTime() - date2.getTime();
  if (typeof diff === 'number' && !isNaN(diff)) {
    const days = diff / 1000 / 60 / 60 / 24;
    return days > 0 ? Math.ceil(days) : Math.floor(days);
  }
  return 0;
};

export const isLeapYear = (year: number): boolean => {
  return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
};

// convert epoch time in seconds to seconds from given time time
// returns < 0 if epochMs time is in the past
export const convertEpochToSecondsFromCurrentTime = (epochSeconds: number) => {
  return Math.round(epochSeconds - (Date.now() / 1000));
};

/**
 * Validates that the date string is a valid date string that is parsable with
 * the native Date constructor.
 */
export const isValidDateString = (date: string): boolean => !isNaN(new Date(date).valueOf());

// Date will convert the UTC date to local time when displaying
// This corrects for the timezone offset so the correct date is shown
export const convertLocalDateToUTC = (date: string) => {
  const localDate = new Date(date);
  // Convert the minutes returned by getTimezoneOffset() to milliseconds and add the milliseconds returned by getTime()
  const UTCDate = new Date(localDate.getTime() + mins(localDate.getTimezoneOffset()));
  return UTCDate;
};
