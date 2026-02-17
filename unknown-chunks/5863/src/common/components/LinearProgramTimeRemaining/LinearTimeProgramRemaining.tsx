import { durationToHourAndMinute, isInProgress, timeDiffInSeconds } from '@adrise/utils/lib/time';
import type { ReactElement } from 'react';
import type React from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import type { Program } from 'common/types/epg';

interface PropsWithChildren {
  children?: (timeLeft: string) => ReactElement;
  activeProgram: Program;
}

const LinearProgramTimeRemaining: React.FC<PropsWithChildren> = ({ activeProgram, children }) => {
  const currentDate = useAppSelector(state => state.ui.currentDate);
  if (!activeProgram) {
    return children ? children('') : null;
  }

  const startTime = new Date(activeProgram.start_time);
  const endTime = new Date(activeProgram.end_time);
  const inProgress = isInProgress(startTime, endTime, currentDate);

  const duration = timeDiffInSeconds(
    inProgress ? currentDate : startTime,
    endTime
  );

  return (
    children ? children(durationToHourAndMinute(duration)) : null
  );
};

export default LinearProgramTimeRemaining;
