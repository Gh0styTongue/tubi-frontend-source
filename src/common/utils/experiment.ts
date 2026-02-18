import { addGlobalOverride } from 'common/actions/experiments';
import { legalExpOverridePrefix, legalExpOverrides } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import type { ExperimentsState } from 'common/types/experiments';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

/**
 * whether an querystring key is an valid experiment override name
 * @param {String} key
 * @return {Boolean}
 */
export function isLegalExpOverride(key: string): boolean {
  return legalExpOverrides.includes(key) || key.startsWith(legalExpOverridePrefix);
}

export const handleExperimentOverride = (query: Record<string, unknown>, dispatch: TubiThunkDispatch) => {
  // handle experiment code
  Object.keys(query)
    .filter(isLegalExpOverride)
    .forEach((key) => {
      try {
        dispatch(addGlobalOverride(key, query[key] as ExperimentsState['overrides']));
      } catch (jsonErr) {
        logger.warn(jsonErr, `Error parsing experiment override ${key}`);
      }
    });
};
