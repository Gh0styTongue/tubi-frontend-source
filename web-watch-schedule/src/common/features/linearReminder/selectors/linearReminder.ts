import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

const linearReminderSelector = ({ linearReminder }: StoreState) => linearReminder;

export const isLoadingSelector = createSelector(linearReminderSelector, ({ loading }) => loading);

export const isLoadedSelector = createSelector(linearReminderSelector, ({ loaded }) => loaded);

const inProgressSelector = createSelector(linearReminderSelector, ({ inProgress }) => inProgress);

export const isInProgressSelector = createSelector(
  inProgressSelector,
  (_: StoreState, mapKey: string) => mapKey,
  (inProgress, mapKey) => !!inProgress[mapKey]
);

const idMapSelector = createSelector(linearReminderSelector, ({ idMap }) => idMap);

export const reminderIdSelector = createSelector(
  idMapSelector,
  (_: StoreState, mapKey: string) => mapKey,
  (idMap, mapKey) => idMap[mapKey]
);
