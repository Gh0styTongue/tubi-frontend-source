import { getIsKidsMode, processSearchResponse } from 'common/actions/search';
import { LOAD_PERSON } from 'common/constants/action-types';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { isKidsModeSelector } from 'common/selectors/ui';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { decodePersonName } from 'common/utils/seo';
import { getAnonymousTokenRequestOptions } from 'common/utils/token';
import { contentIdsByIdSelector } from 'web/features/person/selectors/person';
import type { RouteParams } from 'web/features/person/types/person';

export const fetchPerson = ({ id, name }: RouteParams): TubiThunkAction =>
  (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
    const state = getState();

    const nameWithQuotes = decodePersonName(`person-${name}`);
    const baseUrl = `/oz/search/${encodeURIComponent(nameWithQuotes)}`;

    const contentIds = contentIdsByIdSelector(state, id);
    const isKidsMode = getIsKidsMode(parentalRatingSelector(state), isKidsModeSelector(state));
    const useAnonymousToken = !isLoggedInSelector(state);

    return dispatch({
      type: LOAD_PERSON,
      id,
      nameWithQuotes,
      payload: () => {
        if (Array.isArray(contentIds)) {
          return Promise.resolve(contentIds);
        }

        return client
          .get(baseUrl, {
            ...getAnonymousTokenRequestOptions(useAnonymousToken),
            params: {
              isKidsMode,
            },
            // "timeout" and "deadline" were copied from the search action,
            // and they should be deleted after migrating to the new person API.
            timeout: 5000, // 5 secs to receive first byte
            deadline: 20000, // 20 secs to receive full response (might be a big search result query)
          })
          .then((r) => {
            const { result: contentIds, action } = processSearchResponse(r);
            return dispatch(action).then(() => contentIds);
          })
          .catch((err) => {
            logger.error(err, `fetchPerson failed. id: ${id}, name: ${name}`);
            return Promise.reject(err);
          });
      },
    });
  };
