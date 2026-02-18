import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { AddReminderData, ReminderResponse } from 'common/features/linearReminder/types/linearReminder';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

const linearReminderURL = getConfig().uapi.linearReminder;

export const getLinearReminders = (dispatch: TubiThunkDispatch) => dispatch(fetchWithToken<ReminderResponse>(linearReminderURL, {}));

export const deleteLinearReminder = async (dispatch: TubiThunkDispatch, id: string) => {
  const options: FetchWithTokenOptions = {
    method: 'del',
  };
  await dispatch(fetchWithToken(`${linearReminderURL}?id=${id}`, options));
};

export const postLinearReminder = async (dispatch: TubiThunkDispatch, data: AddReminderData) => {
  const { contentId: content_id, scheduleId: schedule_id, startTime: start_time } = data;
  const options: FetchWithTokenOptions = {
    method: 'post',
    data: {
      content_id,
      schedule_id,
      start_time,
    },
  };
  const result = await dispatch(fetchWithToken(linearReminderURL, options));
  return result;
};
