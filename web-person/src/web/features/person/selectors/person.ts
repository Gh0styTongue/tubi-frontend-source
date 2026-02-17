import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, FREEZED_EMPTY_ARRAY } from 'common/constants/constants';
import { containerChildrenIdMapSelector } from 'common/selectors/container';
import type { StoreState } from 'common/types/storeState';
import { FEATURED_CONTENTS_LIMIT } from 'web/features/person/constants/person';

const personSelector = ({ person }: StoreState) => person;

const nameWithQuotesSelector = createSelector(personSelector, (person) => person.nameWithQuotes);

export const nameSelector = createSelector(nameWithQuotesSelector, (nameWithQuotes) =>
  nameWithQuotes.replace(/^"(.*)"$/, '$1')
);

const idSelector = createSelector(personSelector, (person) => person.id);
const resultsSelector = createSelector(personSelector, (person) => person.results);

export const contentIdsSelector = createSelector(
  idSelector,
  resultsSelector,
  (id, results) => results[id] || FREEZED_EMPTY_ARRAY
);

export const contentIdsByIdSelector = createSelector(
  resultsSelector,
  (_: StoreState, id: string) => id,
  (results, id) => results[id]
);

export const featuredContentIdsSelector = createSelector(containerChildrenIdMapSelector, (idMap) => {
  const contentIds = idMap[FEATURED_CONTAINER_ID];
  return contentIds ? contentIds.slice(0, FEATURED_CONTENTS_LIMIT) : FREEZED_EMPTY_ARRAY;
});
