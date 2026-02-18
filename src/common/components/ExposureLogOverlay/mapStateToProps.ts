import values from 'lodash/values';

import { isWhitelisted, realExperimentName } from 'common/experiments/isWhitelisted';
import experiment from 'common/experimentV2/experiment';
import type StoreState from 'common/types/storeState';

import type { ExperimentExposureDetails, ExposureLogProps } from './types';

// Because we only have access to the current store state and not the previous state, we can't determine here
// what has changed. So we return the current state and have to compare it to the previous state inside the component
// via the function in `computeExposureLogEntries.ts`.
export function mapStateToProps(state: StoreState): Omit<ExposureLogProps, 'dispatch'> {
  const { experiments: { namespaces, localOverrides } } = state;
  const exposuresLogged: ExperimentExposureDetails[] = [];
  values(namespaces).forEach(namespace => {
    values(namespace.parameters).forEach(param => {
      if (!param.exposureLogged) return;
      // check for local override details first
      const localOverrideParamDetails = localOverrides?.[namespace.name]?.parameters[param.name];
      const parameterDetails = localOverrideParamDetails ?? param;
      const { experiment: rawExperiment, treatment = '???' /* should never happen */ } = parameterDetails;
      exposuresLogged.push({
        experiment: realExperimentName(rawExperiment),
        treatment,
        isWhitelisted: isWhitelisted(rawExperiment),
        isLocalOverride: localOverrideParamDetails != null,
      });
    });
  });
  // add the StatSig exposures
  experiment.exposuredExperiments.forEach((exposedExperiment) => {
    if (exposedExperiment.treatment) {
      exposuresLogged.push({
        experiment: exposedExperiment.name,
        treatment: exposedExperiment.treatment,
        isWhitelisted: false,
        isLocalOverride: false,
      });
    }
  });
  return { exposuresLogged };
}
