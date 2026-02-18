import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { LD_RETURNING_USER_VISIT_COUNT } from 'common/constants/constants';

export const getReturningUserVisitCount = (): number => {
  const count = getLocalData(LD_RETURNING_USER_VISIT_COUNT);
  const parsedCount = parseInt(count, 10);
  return isNaN(parsedCount) ? 0 : parsedCount;
};

export const setReturningUserVisitCount = (visitCount: number) => {
  setLocalData(LD_RETURNING_USER_VISIT_COUNT, visitCount.toString());
};
