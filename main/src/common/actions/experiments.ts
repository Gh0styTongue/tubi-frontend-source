import get from 'lodash/get';
import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import * as eventTypes from 'common/constants/event-types';
import logger from 'common/helpers/logging';
import trackingManager from 'common/services/TrackingManager';
import type { ExperimentNamespace, ExperimentsState } from 'common/types/experiments';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { buildExposureEvent } from 'common/utils/analytics';

type OverrideParams = {
  namespace: string,
  parameter: string,
  experiment: string,
  treatment: string,
};

export const GET_REMOTE_CONFIG_TIMEOUT_MS = 1000;

export function setNamespace(namespace: ExperimentNamespace) {
  return { type: actions.SET_EXPERIMENT_NAMESPACE, namespace };
}

function logExposureAction(namespaceName: string, parameter: string) {
  return { type: actions.LOG_EXPERIMENT_EXPOSURE, namespaceName, parameter };
}

export function clearAllLoggedExposures() {
  return { type: actions.CLEAR_LOGGED_EXPOSURES };
}

function getParameter(namespace: ExperimentNamespace, parameter: string) {
  return namespace && namespace.parameters && namespace.parameters[parameter];
}

function hasParameter(namespace: ExperimentNamespace, parameter: string) {
  return !!getParameter(namespace, parameter);
}

function sendExposureEvent(namespace: ExperimentNamespace, parameter: string, exposureLogged: boolean) {
  return (dispatch: TubiThunkDispatch) => {
    const parameterObj = getParameter(namespace, parameter);
    if (!parameterObj) {
      // user is probably not in an experiment that contains that value, so don't do anything
      return;
    }

    const { experiment, name, salt, value, treatment, valueIsDefault } = parameterObj;
    if (!exposureLogged && !valueIsDefault) {
      // set the flag so nothing else will log this experiment this session
      dispatch(logExposureAction(namespace.name, parameter));
      const event = buildExposureEvent({
        namespace: namespace.name,
        name: experiment,
        salt,
        parameter_name: name,
        parameter_value: String(treatment || value),
      });
      return trackingManager.addEventToQueue(eventTypes.EXPOSURE, event);
    }
  };
}

/**
 * Check if the namespace exists in redux store, if so use its value for exposure events
 * @param {*} namespaceName
 * @param {*} parameter
 */
export function logExperimentExposure(namespaceName: string, parameter: string) {
  return (dispatch: TubiThunkDispatch<AnyAction>, getState: () => StoreState) => {
    const { experiments } = getState();
    // If we have a local override entry for this parameter in the given namespace, use the overridden value instead.
    // This allows the forcing of experiment state for testing/QA purposes.
    const namespaceOverride = experiments.localOverrides[namespaceName] as ExperimentNamespace;
    const namespace = hasParameter(namespaceOverride, parameter)
      ? namespaceOverride
      : experiments.namespaces[namespaceName];
    const exposureLoggedPath = ['namespaces', namespaceName, 'parameters', parameter, 'exposureLogged'];
    return dispatch(sendExposureEvent(namespace, parameter, get(experiments, exposureLoggedPath, false)));
  };
}

export function addExperimentOverride(override: OverrideParams) {
  return {
    type: actions.ADD_EXPERIMENT_OVERRIDE,
    payload: override,
  };
}

export function removeExperimentOverride(namespace:string, parameter: string) {
  return {
    type: actions.REMOVE_EXPERIMENT_OVERRIDE,
    payload: { namespace, parameter },
  };
}

export function removeExperimentOverrideNamespace(namespace: string) {
  return {
    type: actions.REMOVE_EXPERIMENT_OVERRIDE_NAMESPACE,
    payload: namespace,
  };
}

export function restoreExperimentOverrides(localOverrides: ExperimentsState['localOverrides']) {
  return {
    type: actions.RESTORE_EXPERIMENT_OVERRIDES,
    payload: localOverrides,
  };
}

/**
 * Adds an override for the specific experiment, useful for testing purposes. Depending on the experiment, it may
 * need the cooperation from the server, this is nothing but a simple key/value store
 *
 * @param experiment the name of the experiment. Doesn't have to be the exact experiment name, just something we know
 *  to lookup
 * @param value the value to override with
 */
export function addGlobalOverride(experiment: string, value: ExperimentsState['overrides']) {
  logger.info({ experiment, value }, 'Adding experiment override');
  return {
    type: actions.ADD_GLOBAL_OVERRIDE,
    result: { [experiment]: value },
  };
}

/**
 * Differ performance metrics from experiment/control group
 */
export function addPerformanceTag(tagName: string, value: string) {
  return {
    type: actions.ADD_PERFORMANCE_TAG,
    tagName,
    value,
  };
}
