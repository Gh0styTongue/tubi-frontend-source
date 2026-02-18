import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { QueueItemType, ContentType, QueueData, QueueItem } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

interface GetQueueResponse {
  queues: QueueItem[];
}

export const QUEUE_TIMEOUT_MS = 15000;

/* istanbul ignore next */
const userQueueURL = getConfig().userQueuePrefix;

export const getQueue = async (dispatch: TubiThunkDispatch) => {
  const option: FetchWithTokenOptions = {
    timeout: QUEUE_TIMEOUT_MS,
  };

  const response = await dispatch(fetchWithToken<GetQueueResponse>(userQueueURL, option));
  const ids: string[] = [];
  const dataMap: QueueData['dataMap'] = {};
  (response.queues || []).forEach((item) => {
    const { content_id: contentId, id: itemId, content_type: contentType } = item;
    const id = contentType === 'series' ? `0${contentId}` : `${contentId}`;
    ids.push(id);

    let dateAddedInMs = Date.now();
    try {
      dateAddedInMs = Date.parse(item.updated_at!);
    } catch (error) {
      // error parsing date, use default to Date.now()
    }
    dataMap[id] = {
      id: itemId,
      contentType,
      dateAddedInMs,
    };
  });
  return {
    list: ids,
    dataMap,
  };
};

export interface AddToQueueParams {
  contentId: string;
  contentType: ContentType;
  queueItemType: QueueItemType,
}

export const addToQueue = (dispatch: TubiThunkDispatch, { contentId, contentType: content_type, queueItemType }: AddToQueueParams) => {
  const option: FetchWithTokenOptions = {
    method: 'post',
    data: {
      type: queueItemType,
      content_id: parseInt(contentId, 10),
      content_type,
    },
    timeout: QUEUE_TIMEOUT_MS,
  };
  return dispatch(fetchWithToken<QueueItem>(userQueueURL, option));
};

export const deleteFromQueue = (dispatch: TubiThunkDispatch, id: string) => {
  const url = `${userQueueURL}?queue_id=${id}`;

  const option: FetchWithTokenOptions = {
    url,
    method: 'del',
    timeout: QUEUE_TIMEOUT_MS,
  };
  return dispatch(fetchWithToken(url, option));
};
