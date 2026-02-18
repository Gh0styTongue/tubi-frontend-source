import { useContext } from 'react';

import { FREEZED_EMPTY_FUNCTION, FREEZED_EMPTY_OBJECT } from '../../../constants/constants';
import { YouboraExperimentMapContext } from '../context/YouboraExperimentMapContext';

export function useYouboraExperimentMap() {
  const context = useContext(YouboraExperimentMapContext);
  const youboraExperimentMap = context?.getMap() || FREEZED_EMPTY_OBJECT;
  const addYouboraExperimentToMap = context?.addExperimentToMap || FREEZED_EMPTY_FUNCTION;
  return {
    youboraExperimentMap,
    addYouboraExperimentToMap,
  };
}
