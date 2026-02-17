import dayjs from 'dayjs';

import type { AgeGateData } from 'common/features/authentication/types/auth';

export const getBirthdayISOStr = ({ birthYear, birthMonth, birthDay }: AgeGateData) => {
  const birth = new Date(Date.UTC(
    parseInt(birthYear, 10), // year
    parseInt(birthMonth, 10) - 1, // monthIndex
    parseInt(birthDay, 10), // day
  ));

  return birth.toISOString().substring(0, 10); // YYYY-MM-DD
};

export function checkBirthdayLocally({ birthYear, birthMonth, birthDay }: AgeGateData) {
  const birth = dayjs(Date.UTC(
    parseInt(birthYear, 10), // year
    parseInt(birthMonth, 10) - 1, // monthIndex
    parseInt(birthDay, 10), // day
  ));

  return birth.add(18, 'years') < dayjs();
}
