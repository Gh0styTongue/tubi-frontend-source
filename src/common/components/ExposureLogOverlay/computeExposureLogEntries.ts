import type { Experiment } from 'common/experiments/Experiment';
import type ExperimentManager from 'common/experiments/ExperimentManager';
import experimentClient from 'common/experimentV2/experiment';

import { getExposuresSeen } from './storeExposures';
import type { ExperimentExposureDetails, ExposureLogEntry } from './types';

function getTreatmentsLogged(
  experiment: string,
  treatmentsSeen: string[],
  experimentManager?: ReturnType<typeof ExperimentManager>,
): ExposureLogEntry['treatmentsLogged'] {
  const statsigExperiment = experimentClient.exposuredExperiments.find((x) => x.name === experiment);

  if (statsigExperiment && statsigExperiment.treatment) {
    return { [statsigExperiment.treatment]: treatmentsSeen.includes(statsigExperiment.treatment) };
  }

  const experimentObject = experimentManager?.getExperiments().find((x: Experiment) => x.configuredExperimentName === experiment);
  // if we can't find a matching experiment, at least just return the ones we have seen
  if (!experimentObject) {
    return treatmentsSeen.reduce<Record<string, boolean>>((acc, treatment) => {
      acc[treatment] = true;
      return acc;
    }, {});
  }
  return experimentObject.treatments.reduce<Record<string, boolean>>((acc, { name }) => {
    acc[name] = treatmentsSeen.includes(name);
    return acc;
  }, {});
}

const EMPTY_ARRAY: ExposureLogEntry[] = [];

// Figures out which exposure event is new (if any) based on the previous list of exposure events seen.
// Assumption 1: There is only ever one new exposure event per state update, so we can skip after we find one.
// Assumption 2: There is only ever one exposure for a given experiment per session.
export default function computeExposureLogEntries(
  current: ExperimentExposureDetails[],
  previous: ExposureLogEntry[],
  experimentManager?: ReturnType<typeof ExperimentManager>,
): ExposureLogEntry[] {
  // if entries were all cleared, then respect that and start again.
  if (!current.length) return EMPTY_ARRAY;
  // Construct a map first so we have a constant lookup time (O(1)) for each entry in `current`.
  const previousMap: Record<string, ExposureLogEntry> = {};
  previous.forEach(entry => {
    previousMap[entry.experiment] = entry;
  });
  // using a for loop so we can return early if we find a new one
  for (let index = 0, len = current.length; index < len; ++index) {
    const entry = current[index];
    const { experiment } = entry;
    if (!(experiment in previousMap)) {
      return [
        {
          ts: new Date(),
          ...entry,
          treatmentsLogged: getTreatmentsLogged(experiment, getExposuresSeen(experiment), experimentManager),
        },
        ...previous,
      ];
    }
  }
  return previous;
}
