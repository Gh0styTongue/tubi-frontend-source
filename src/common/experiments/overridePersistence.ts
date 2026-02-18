import merge from 'lodash/merge';

import { getCookie, setCookie } from 'client/utils/localDataStorage';
import { FAKE_SALT_FOR_OVERRIDES } from 'common/constants/experiments';
import type { ExperimentsState } from 'common/types/experiments';

interface OverrideSettings<T extends string> {
  namespace: string;
  parameter: string;
  experiment: string;
  treatment: T;
}

type LocalOverridesState = ExperimentsState['localOverrides'];

/*
 Persistence format (JSON):
 {"namespace:parameter":["experiment", "treatment"]}
 Multiple overrides become separate properties.

 I wanted to keep it simple to make it easy to add an override manually, even for less technical folks.
 I also wanted a succinct format.
 */

const PERSISTENCE_KEY = 'exp_overrides';

interface OverrideObject<T = unknown> {
  [namespaceParameter: string]: [string, T];
}

export function persistExperimentOverride<T extends string>(params: OverrideSettings<T>): void {
  const { namespace, parameter, experiment, treatment } = params;
  const overridesObject = loadOverridesObject();
  const key = getKey(namespace, parameter);
  overridesObject[key] = [experiment, treatment];
  saveOverridesObject(overridesObject);
}

export function removeExperimentOverride({ namespace, parameter }: { namespace: string, parameter: string }): void {
  const overridesObject = loadOverridesObject();
  delete overridesObject[getKey(namespace, parameter)];
  saveOverridesObject(overridesObject);
}

export function loadPersistedExperimentOverrideState(): LocalOverridesState {
  const localOverrides: LocalOverridesState = {};
  const overridesObject = loadOverridesObject();
  for (const key in overridesObject) {
    if (overridesObject.hasOwnProperty(key)) {
      const [namespace, parameter] = key.split(':');
      const [experiment, treatment] = overridesObject[key];
      merge(localOverrides, {
        [namespace]: {
          name: namespace,
          parameters: {
            [parameter]: {
              name: parameter,
              salt: FAKE_SALT_FOR_OVERRIDES,
              experiment,
              treatment,
            },
          },
        },
      });
    }
  }
  return localOverrides;
}

function getKey(namespace: string, parameter: string): string {
  return `${namespace}:${parameter}`;
}

function loadOverridesObject(): OverrideObject {
  try {
    return JSON.parse(getCookie(PERSISTENCE_KEY) || '{}');
  } catch {
    // if anything went wrong with parsing due to bad JSON, return an empty object
    return {};
  }
}

function saveOverridesObject(overridesObject: OverrideObject): void {
  setCookie(PERSISTENCE_KEY, JSON.stringify(overridesObject));
}
