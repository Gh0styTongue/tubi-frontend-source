import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';

import { EXPERIMENT_MANAGER_EVENTS } from 'common/constants/constants';

let instance: ExposureEmitter | undefined;

export type ExposedExperiment = {
  experimentName: string;
  inYoubora?: boolean;
  treatment: string | null;
};

type ExperimentManagerEvents = {
  [EXPERIMENT_MANAGER_EVENTS.logExposure]: (experiment: ExposedExperiment) => void;
};

export default class ExposureEmitter extends TypedEventEmitter<ExperimentManagerEvents> {
  exposedExperiments: ExposedExperiment[] = [];
  static getInstance() {
    if (instance === undefined) {
      instance = new ExposureEmitter();
    }
    return instance;
  }

  clear() {
    this.exposedExperiments = [];
  }

  add(experiment: ExposedExperiment) {
    // already exposed
    if (this.exposedExperiments.some((exposed) => exposed.experimentName === experiment.experimentName)) {
      return;
    }
    this.exposedExperiments.push(experiment);
    this.emit(EXPERIMENT_MANAGER_EVENTS.logExposure, experiment);
  }
}
