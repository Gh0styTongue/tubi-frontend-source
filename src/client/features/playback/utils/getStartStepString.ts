import type { ValueOf } from 'ts-essentials';

import { START_STEP } from 'common/playback/VODPlaybackSession';

export const getStartStepString = (stepNumber: ValueOf<typeof START_STEP>): keyof typeof START_STEP => {
  for (const key of Object.keys(START_STEP)) {
    if (START_STEP[key as keyof typeof START_STEP] === stepNumber) {
      return key as keyof typeof START_STEP;
    }
  }
  return 'UNKNOWN';
};
