/**
 * Utility functions for age gate date calculations.
 */
import dayjs from 'dayjs';

import type { AgeGateData } from 'common/features/authentication/types/auth';

/**
 * Converts age gate form data to ISO date string (YYYY-MM-DD).
 */
export const getBirthdayISOStr = ({ birthYear, birthMonth, birthDay }: AgeGateData) => {
  const birth = new Date(Date.UTC(
    parseInt(birthYear, 10), // year
    parseInt(birthMonth, 10) - 1, // monthIndex
    parseInt(birthDay, 10), // day
  ));

  return birth.toISOString().substring(0, 10); // YYYY-MM-DD
};

/**
 * Checks if user is 18 or older based on birthday.
 * Used for local age verification before server check.
 */
export function checkBirthdayLocally({ birthYear, birthMonth, birthDay }: AgeGateData) {
  const birth = dayjs(Date.UTC(
    parseInt(birthYear, 10), // year
    parseInt(birthMonth, 10) - 1, // monthIndex
    parseInt(birthDay, 10), // day
  ));

  return birth.add(18, 'years') < dayjs();
}
