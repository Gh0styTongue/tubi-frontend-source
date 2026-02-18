import { ProgressType } from '@tubitv/analytics/lib/registerEvent';

import {
  REGISTRATION_FORM_FIELD_NAMES,
  ADD_KID_FORM_FIELD_NAMES,
} from 'common/constants/constants';
import { trackRegisterEvent } from 'common/utils/analytics';

const {
  FIRST_NAME,
  EMAIL,
  PASSWORD,
  AGE,
  BIRTH_YEAR,
  GENDER,
} = REGISTRATION_FORM_FIELD_NAMES;

const {
  KIDS_FIRST_NAME,
  KIDS_PIN,
} = ADD_KID_FORM_FIELD_NAMES;

const {
  COMPLETED_NAME,
  COMPLETED_EMAIL,
  COMPLETED_PASSWORD,
  COMPLETED_BIRTHDAY,
  COMPLETED_GENDER,
  COMPLETED_PIN,
} = ProgressType;

const registrationProgressMap = {
  [FIRST_NAME]: COMPLETED_NAME,
  [EMAIL]: COMPLETED_EMAIL,
  [PASSWORD]: COMPLETED_PASSWORD,
  [AGE]: COMPLETED_BIRTHDAY,
  [BIRTH_YEAR]: COMPLETED_BIRTHDAY,
  [GENDER]: COMPLETED_GENDER,
  [KIDS_FIRST_NAME]: COMPLETED_NAME,
  [KIDS_PIN]: COMPLETED_PIN,
};

interface Target {
  name: string;
  value: string;
}
interface FormEvent {
  target: Target
}

/**
 * send track event for tracking registration progress. Completion of certain fields warrant event firing
 * @param e - dom event
 */
export const trackRegisterProcess = (e: FormEvent) => {
  const { name, value } = e.target as HTMLInputElement;
  if (value?.length > 0) {
    trackRegisterEvent({ progress: registrationProgressMap[name as keyof typeof registrationProgressMap] });
  }
};

// export as shortcuts to save multiple imports and variable deconstruction
export { trackRegisterEvent, ProgressType };
