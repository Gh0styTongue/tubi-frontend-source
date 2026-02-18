import camelCasify from 'camelcasify';
import type { ValueOf } from 'ts-essentials';

import type { VideoContentResponse } from 'client/utils/clientDataRequest';
import logger from 'common/helpers/logging';
import { HistoryWatchedState } from 'common/types/history';
import type { History, SeriesHistory, HistoryEpisode, HistoryState, HistoryResponseBodyContent, HistoryResponseBody } from 'common/types/history';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';

export const isHistoryValue = (item: ValueOf<HistoryState['contentIdMap']>): item is History => {
  return typeof item !== 'boolean' && typeof item !== 'string' && item !== null && item !== undefined;
};

export const getHistoryFromContentIdMap = (contentIdMap: HistoryState['contentIdMap'], id: string): History | undefined => {
  const item = contentIdMap[id];
  if (isHistoryValue(item)) {
    return item;
  }
};

export const getContentIdFromHistoryItem = (historyItem: History) => {
  const { contentId: historyContentId, contentType } = historyItem;
  const contentId = contentType === 'series'
    ? convertSeriesIdToContentId(String(historyContentId))
    : String(historyContentId);
  return contentId;
};

export const getRecentHistory = (
  { historyDataMap, maxLength }:
  { historyDataMap: HistoryState['contentIdMap'], maxLength?: number }
): History[] => {
  const historyList = Object.keys(historyDataMap)
    .filter((contentId: string) => {
      const historyItem = getHistoryFromContentIdMap(historyDataMap, contentId);
      if (!historyItem) {
        return false;
      }
      const { contentType, position, updatedAt } = historyItem;

      // For series, check if the current episode state is finished.
      const currentContent = contentType === 'series' ? (historyItem as SeriesHistory).episodes[position] : historyItem;
      return updatedAt && currentContent.state !== 'finished';
    })
    .map((contentId: string) => historyDataMap[contentId] as History);

  // currently we only the most recently watched content
  historyList.sort((contentA, contentB) => {
    return Date.parse(contentB.updatedAt) - Date.parse(contentA.updatedAt);
  });

  return maxLength ? historyList.slice(0, maxLength) : historyList;
};

export const getMostRecentTitle = (
  { historyDataMap, byId }:
  { historyDataMap: Record<string, History>, byId: { [key: string]: Video | Series } }
): Video | Series | undefined => {
  const history = getRecentHistory({ historyDataMap, maxLength: 1 });
  if (history && history[0]) {
    const contentId = getContentIdFromHistoryItem(history[0]);
    const content = byId[contentId];
    if (!content) {
      logger.error(new Error(`the content id is not found in byId: ${contentId}`), 'error in getMostRecentTitle');
    }
    return content;
  }
};

export const getResumePositionFromHistory = (history?: History | HistoryEpisode) => {
  if (!history) return 0;
  // If content has been finished, we should restart it from the beginning
  return history.state !== HistoryWatchedState.finished ? history.position : 0;
};

/**
 * Formulate series id in history api response
 */
export const formatSeriesIdInHistory = (body: HistoryResponseBody) => {
  const dataMap: Record<string, History> = {};

  body.items.forEach((item) => {
    const { content_id: contentId, content_type: type } = item;
    // convert contentId to string, and add leading `0` to seriesId
    const id = type === 'series' ? `0${contentId}` : `${contentId}`;

    dataMap[id] = camelCasify<History>(item);
  });

  return {
    dataMap,
  };
};

export const formatHistoryContents = (body: HistoryResponseBodyContent) => {
  let contents: VideoContentResponse[] = [];
  body.items.forEach((item) => {
    const { content_type: type } = item;
    if (type === 'series') {
      const { content: { children: seasons } } = item;
      seasons.forEach((season) => {
        contents = contents.concat(season.children);
      });
    }
    contents.push(item.content);
  });
  return contents;
};
