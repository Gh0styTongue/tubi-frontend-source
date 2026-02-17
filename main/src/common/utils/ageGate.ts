import { resolve } from '@adrise/utils/lib/resolver';
import { days, hours, secs } from '@adrise/utils/lib/time';
import { DateId } from '@tubitv/ott-ui';

import { getCookie, setCookie } from 'client/utils/localDataStorage';
import { AGE_GATE_COOKIE, COPPA_COMPLIANT, NOT_COPPA_COMPLIANT, COPPA_REQUIRE_LOGOUT } from 'common/constants/cookies';
import { GOOGLE_API_CLIENT, GOOGLE_API } from 'common/constants/resources';
import { WEB_ROUTES } from 'common/constants/routes';
import type { UserCoppaStates } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { isLeapYear } from 'common/utils/date';
import conf from 'src/config';

import GoogleAuth = gapi.auth2.GoogleAuth;

export const YEAR_OF_BIRTH_VARIANT_MIN_AGE = 2;

export enum AgeGatePageType {
  HOME = 'HOME',
  DETAILS = 'DETAILS',
  PLAYBACK = 'PLAYBACK',
}

export function setCoppaCompliantCookie() {
  setCookie(
    AGE_GATE_COOKIE,
    COPPA_COMPLIANT,
    days(60) / secs(1), // Set the cookie to 60 day if age >= 13
  );
}

export function setLockedInKidsModeCookie() {
  setCookie(
    AGE_GATE_COOKIE,
    NOT_COPPA_COMPLIANT,
    hours(24) / secs(1), // Set the cookie to 1 day/24 hours if age < 13
  );
}

export function setRequireLogoutCookie() {
  setCookie(
    AGE_GATE_COOKIE,
    COPPA_REQUIRE_LOGOUT,
    hours(24) / secs(1), // Set the cookie to 1 day/24 hours if age < 18 in GDPR countries
  );
}

export function doesAgeGateCookieExist(): boolean {
  return !!getCookie(AGE_GATE_COOKIE);
}

export function isUserNotCoppaCompliant(): boolean {
  return getCookie(AGE_GATE_COOKIE) === NOT_COPPA_COMPLIANT;
}

// Check if year is within valid age range
export function isValidYear(year: number): boolean {
  const age = new Date().getUTCFullYear() - year;
  return isAgeValid(age, YEAR_OF_BIRTH_VARIANT_MIN_AGE);
}

// Check if month is valid
export function isValidMonth(month: number): boolean {
  return month >= 1 && month <= 12;
}

// Check if day is valid based on the month
export function isValidDay(day: number, month?: number, year?: number): boolean {
  if (month == null) {
    return day >= 1 && day <= 31;
  }
  const monthLength = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Condition to check for leap year
  if (year != null && !isNaN(year) && year.toString().length === 4) {
    if (!isLeapYear(year)) {
      monthLength[1] = 28;
    }
    const birthdayDate = new Date(`${year}/${month}/${day}`);
    if (isNaN(birthdayDate.getTime())) {
      return false;
    }
  }

  // Check the range of the day
  return day > 0 && day <= monthLength[month - 1];
}

// Validates that the input string is a valid date formatted as "MMDDYYYY"
export function isValidDate(dateString: string) {
  // First check for length MMDDYYYY
  if (dateString.length !== 8) { return false; }

  // Parse the date parts to integers
  const [month, day, year] = getDateParts(dateString, ['mm', 'dd', 'yyyy']);

  // Check the ranges of month
  if (!isValidMonth(parseInt(month, 10))) { return false; }

  // Check the range of the day
  return isValidDay(parseInt(day, 10), parseInt(month, 10), parseInt(year, 10));
}

// Construct the date error object for the Birthday component
export function constructBirthDateErrorObject(dateString: string) {
  if (dateString.length <= 1) return null;

  const [month, day, year] = getDateParts(dateString, ['mm', 'dd', 'yyyy']);
  let invalidFields = [];

  // Invalid month
  if (month != null && !isValidMonth(parseInt(month, 10))) {
    invalidFields.push(DateId.MONTH);
  }
  // Invalid date
  if (day != null && day.length === 2 && !isValidDay(parseInt(day, 10), parseInt(month, 10), parseInt(year, 10))) {
    invalidFields.push(DateId.DAY);
  }
  // Invalid year
  if (year != null && !isValidDay(parseInt(day, 10), parseInt(month, 10), parseInt(year, 10))) {
    invalidFields = [DateId.YEAR, DateId.MONTH, DateId.DAY];
  }
  return invalidFields.length === 0 ? null : invalidFields;
}

// Split date parts in a specific format
export function getDateParts(value: string, dateParts: string[]) {
  const lengthOfParts = dateParts.map(part => part.length);
  const parts = [];
  let part = '';
  let activeIdx = 0;
  for (const char of value) {
    part += char;
    parts[activeIdx] = part;
    if (part.length === lengthOfParts[activeIdx]) {
      activeIdx++;
      part = '';
    }
  }

  // just return the first 3 parts
  return parts.slice(0, dateParts.length);
}

// Generally, an age between 0 and 125 is valid. But for YOB variant, it should between 2 and 125
export function isAgeValid(age: number | null, minAge = 0) {
  if (age === null) return false;
  return age >= minAge && age <= 125;
}

export function isAgePotentiallyInvalid(age: number) {
  return age >= 0 && age <= 4;
}

// Calculate age from date
type GetAgeOptions = {
  precision: number;
};
export function getAge(date: Date, options?: GetAgeOptions): number;
// Calculate age from dateString in MMDDYYYY format
export function getAge(date: string, options?: GetAgeOptions): number | null;
export function getAge(date: Date | string, options: GetAgeOptions = { precision: 0 }): number | null {
  let birthday = null;

  if (typeof date === 'string') {
    const parts = getDateParts(date, ['mm', 'dd', 'yyyy']);
    if (!parts || parts.length === 0) return null;
    // date string in MM/DD/YYYY format
    const dateWithSlashes = parts.join('/');
    birthday = new Date(dateWithSlashes);
    const year = Number(parts[2]);
    if (year < 100) {
      // If a year between 0 and 99 is specified, the method converts the year to a year in the 21th century.
      // For example year 0000 is understood as 2000, 0001 as 2001, etc...
      // This is a problem for us as if you enter 0010, age returned is 10. And this is actually not what user meant to enter.
      // calling setFullYear makes it works as expected.
      birthday.setFullYear(year);
    }
  } else {
    birthday = date;
  }

  const ageDifMs = Date.now() - birthday.getTime();
  if (options.precision) {
    // take a year's length as 24 * 3600 * 365.25 * 1000
    return parseFloat((ageDifMs / 31557600000).toFixed(options.precision));
  }
  const ageDate = new Date(ageDifMs); // milliseconds from epoch
  return ageDate.getUTCFullYear() - 1970;
}

export function getYOBAge(date: Date): number;
export function getYOBAge(date: string): number | null;
export function getYOBAge(date: Date | string): number | null {
  let birthYear = null;
  if (typeof date === 'string') {
    const parts = getDateParts(date, ['mm', 'dd', 'yyyy']);
    if (!parts || parts.length === 0) return null;
    birthYear = Number(parts[2]);
  } else {
    birthYear = date.getUTCFullYear();
  }

  return new Date().getUTCFullYear() - birthYear;
}

export const convertAgeToBirthday = (age: number) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = (`0${yesterday.getUTCDate()}`).slice(-2);
  const month = (`0${yesterday.getUTCMonth() + 1}`).slice(-2);
  const year = String(new Date().getUTCFullYear() - age);
  return {
    day,
    month,
    year,
  };
};

export function shouldSkipCoppaCheck(pathname: string) {
  // for WEB platform
  return ([
    WEB_ROUTES.landing,
    WEB_ROUTES.activate,
    WEB_ROUTES.signIn,
    WEB_ROUTES.register,
  ] as string[]).includes(pathname) || pathname.startsWith('/static/') || pathname.startsWith('/privacy/');
}

/*
 * Assign coppaState to an error object
 * and returns a new error type
 */
export class UserCoppaError extends Error {
  coppaState: UserCoppaStates;

  constructor(error: Error, coppaState: UserCoppaStates) {
    super();
    this.coppaState = coppaState;
    Object.getOwnPropertyNames(error).forEach((k) => {
      this[k] = error[k];
    });
  }
}

export function unlinkGoogle() {
  return new Promise<void>((res, rej) => {
    // Windows app breaks when loading api:client.js for unknown reason, use
    // equivalent replacement
    resolve(__WEBPLATFORM__ === 'WINDOWS' ? GOOGLE_API : GOOGLE_API_CLIENT).then(
      () => {
        if (!window.gapi) {
          rej(new Error('window.gapi doesn\'t exist.'));
          return;
        }
        window.gapi.load('auth2', () => {
          gapi.auth2.init({
            client_id: conf?.google?.clientID,
          }).then((auth2Client: GoogleAuth) => {
            // this will revoke tubi permission on the user's Google Account
            auth2Client.currentUser.get().disconnect();
            res();
          }, (error) => {
            logger.error({ error }, 'Error unlinking google app from tubi app');
            rej(error);
          });
        });
      },
      () => {
        rej(new Error('load google api client failed.'));
      },
    );
  });
}

export function getSSOUnlinkAction(authType: string | undefined) {
  if (authType === 'GOOGLE') {
    return unlinkGoogle();
  }
}
