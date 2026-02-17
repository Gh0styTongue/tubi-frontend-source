import { LOAD_PERSON } from 'common/constants/action-types';

import type { PersonState } from '../types/person';

export const initialState: PersonState = {
  id: '',
  nameWithQuotes: '',
  results: {},
};

interface FetchPersonAction {
  type: typeof LOAD_PERSON.FETCH;
  id: string;
  nameWithQuotes: string;
}

export interface FetchPersonSuccessAction extends FetchPersonAction {
  type: typeof LOAD_PERSON.SUCCESS;
  payload: string[];
}

type Action = FetchPersonAction | FetchPersonSuccessAction;

export default function reducer(state: PersonState = initialState, action = {} as Action): PersonState {
  switch (action.type) {
    case LOAD_PERSON.FETCH: {
      const { id, nameWithQuotes } = action as FetchPersonAction;

      return {
        ...state,
        id,
        nameWithQuotes,
      };
    }

    case LOAD_PERSON.SUCCESS: {
      const { id, payload: contentIds } = action as FetchPersonSuccessAction;

      return {
        ...state,
        results: {
          ...state.results,
          [id]: contentIds,
        },
      };
    }

    default:
      return state;
  }
}
