import type { GenMapKeyParams, LinearReminderState, ReminderResponse } from '../types/linearReminder';

export const getMapKey = ({ contentId, scheduleId }: GenMapKeyParams): string => `${contentId}-${scheduleId}`;

export const getMapKeyById = (id: string, state: LinearReminderState) => {
  const { idMap } = state;

  for (const key in idMap) {
    if (idMap[key] === id) {
      return key;
    }
  }

  return '';
};

export const tramsformReminderResponse = (response: ReminderResponse): Record<string, string> => {
  const { records } = response;
  const idMap = {};

  records.forEach((record) => {
    const { id, content_id: contentId, schedule_id: scheduleId } = record;
    idMap[getMapKey({ contentId, scheduleId })] = id;
  });

  return idMap;
};
