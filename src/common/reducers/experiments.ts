import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import { FAKE_SALT_FOR_OVERRIDES } from 'common/constants/experiments';
import type { ExperimentsState } from 'common/types/experiments';

/**
 * @type {{namespaces: {}, localOverrides: {}, overrides: {}, performanceTag: {}}}
 */
export const initialState = {
  namespaces: {},
  localOverrides: {},
  overrides: {},
  performanceTag: {},
} as ExperimentsState;

export default function Experiments(
  state: ExperimentsState = initialState,
  action: AnyAction = {} as AnyAction
): ExperimentsState {
  const { payload } = action;

  switch (action.type) {
    case actions.SET_EXPERIMENT_NAMESPACE: {
      return merge({}, state, {
        namespaces: {
          [action.namespace.name]: action.namespace,
        },
      });
    }

    case actions.LOG_EXPERIMENT_EXPOSURE: {
      return merge({}, state, {
        namespaces: {
          [action.namespaceName]: {
            name: action.namespaceName,
            parameters: {
              [action.parameter]: {
                name: action.parameter,
                exposureLogged: true,
              },
            },
          },
        },
      });
    }

    case actions.CLEAR_LOGGED_EXPOSURES: {
      const newNamespacesState = mapValues(state.namespaces, (namespace) => {
        return {
          ...namespace,
          parameters: mapValues(namespace.parameters, (parameter) => omit(parameter, 'exposureLogged')),
        };
      });

      return {
        ...state,
        namespaces: newNamespacesState,
      };
    }

    case actions.RESTORE_EXPERIMENT_OVERRIDES: {
      return {
        ...state,
        localOverrides: payload,
      };
    }

    case actions.ADD_EXPERIMENT_OVERRIDE: {
      const { namespace, parameter, experiment, treatment } = payload;

      return merge({}, state, {
        localOverrides: {
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
        },
      });
    }

    case actions.REMOVE_EXPERIMENT_OVERRIDE: {
      const newLocalOverridesState = { ...(state.localOverrides || {}) };
      const existingNamespace = newLocalOverridesState[payload.namespace];

      if (!existingNamespace) {
        return state;
      }

      delete (existingNamespace as any).parameters[payload.parameter];

      // if no more parameters, delete the entire namespace override object
      if (Object.keys(existingNamespace.parameters).length === 0) {
        delete newLocalOverridesState[payload.namespace];
      }

      return {
        ...state,
        localOverrides: newLocalOverridesState,
      };
    }

    case actions.REMOVE_EXPERIMENT_OVERRIDE_NAMESPACE: {
      const newLocalOverridesState = { ...(state.localOverrides || {}) };

      delete newLocalOverridesState[payload];

      return {
        ...state,
        localOverrides: newLocalOverridesState,
      };
    }

    case actions.ADD_GLOBAL_OVERRIDE: {
      const override = action.result;

      return {
        ...state,
        overrides: {
          ...state.overrides,
          ...override,
        },
      };
    }

    case actions.ADD_PERFORMANCE_TAG: {
      const { tagName, value: perfValue } = action;

      return {
        ...state,
        performanceTag: {
          ...state.performanceTag,
          [tagName]: perfValue,
        },
      };
    }

    default:
      return state;
  }
}
