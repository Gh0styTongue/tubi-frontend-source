import { useContext } from 'react';

import type { Experiment } from 'common/experiments/Experiment';
import { useExperimentStore } from 'common/experiments/ExperimentStoreContext';
import type { ExperimentFactory } from 'common/experiments/types';
import { YouboraExperimentMapContext } from 'common/features/playback/context/YouboraExperimentMapContext';

/**
 * This hook allows access to an `Experiment` instance during rendering. Use
 * this to avoid errors during server rendering, when the `ExperimentManager`
 * instance is unique for each request and requires the store to get the correct
 * instance.
 *
 * @param factory - A function that returns an Experiment instance given an
 * optional store. This is usually a default export from a file in the
 * `src/common/experiments/config/` directory.
 */
export default function useExperiment<V, T extends string>(factory: ExperimentFactory<V, T>): Experiment<V, T> {
  const store = useExperimentStore();
  const experiment = factory(store);
  const context = useContext(YouboraExperimentMapContext);
  if (experiment.inYoubora && context) {
    context.map[experiment.id] = experiment;
    context.updateMap(context.map);
  }
  return experiment;
}
