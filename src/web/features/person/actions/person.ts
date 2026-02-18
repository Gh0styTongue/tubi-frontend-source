import { fetchWithToken } from 'common/actions/fetch';
import { flattenSearchResponse, getIsKidsMode, processSearchResponse } from 'common/actions/search';
import type { SearchResponse } from 'common/actions/search';
import getConfig from 'common/apiConfig';
import { LOAD_PERSON } from 'common/constants/action-types';
import logger from 'common/helpers/logging';
import { isKidsModeSelector } from 'common/selectors/ui';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import { getWebImageQuery } from 'common/utils/imageResolution';
import { decodePersonName } from 'common/utils/seo';
import { contentIdsByIdSelector } from 'web/features/person/selectors/person';
import type { RouteParams } from 'web/features/person/types/person';

export const fetchPerson = ({ id, name }: RouteParams): TubiThunkAction => {
  return (dispatch, getState) => {
    const state = getState();

    const nameWithQuotes = decodePersonName(`person-${name}`);
    const contentIds = contentIdsByIdSelector(state, id);
    const isKidsMode = getIsKidsMode(parentalRatingSelector(state), isKidsModeSelector(state));

    return dispatch({
      type: LOAD_PERSON,
      id,
      nameWithQuotes,
      payload: async () => {
        if (Array.isArray(contentIds)) {
          return contentIds;
        }

        try {
          const response = await dispatch(
            fetchWithToken<SearchResponse>(`${getConfig().searchServicePrefix}/api/v2/search`, {
              params: {
                search: nameWithQuotes,
                is_kids_mode: isKidsMode,
                images: getWebImageQuery(),
              },
              qsStringifyOptions: {
                arrayFormat: 'brackets',
              },
              timeout: 5000, // 5 secs to receive the first byte
            })
          );

          const searchContents = flattenSearchResponse(response);

          const { result: contentIds, action } = processSearchResponse(searchContents.contents);
          await dispatch(action);

          return contentIds;
        } catch (err) {
          logger.error(err, `fetchPerson failed. id: ${id}, name: ${name}`);
          throw err;
        }
      },
    });
  };
};
