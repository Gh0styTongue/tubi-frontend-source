import { mins } from '@adrise/utils/lib/time';
import flatMap from 'lodash/flatMap';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadEPGContentIds, loadEPGInfoByContentIds } from 'common/actions/epg';
import type { LiveContentMode } from 'common/constants/constants';
import { resetPriorityMap } from 'common/features/playback/utils/streamUrlPriority';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import type { ChannelEPGInfo } from 'common/types/epg';
import { getProgramDetailsByKey, transChannelInfo } from 'common/utils/epg';

// 310 mins can make sure that the programs fully fill the max width
const TIMELINE_DURATION = mins(310);
const LAZY_LOAD_THROTTLE_WAIT_MS = 250;

export const useLoadWebEPGData = (mode: LiveContentMode, contentIds: string[], timelineStart: number) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadEPGContentIds(mode));
  }, [dispatch, mode]);

  useEffect(() => {
    if (contentIds.length) {
      dispatch(loadEPGInfoByContentIds(contentIds));
    }
    // Update programs when timelineStart changes, the action will check the cache
  }, [contentIds, dispatch, timelineStart]);
};

export const useTimeline = () => {
  const currentTime = useAppSelector((state) => state.ui.currentDate);

  const startYear = currentTime.getFullYear();
  const startMonth = currentTime.getMonth();
  const startDate = currentTime.getDate();
  const startHour = currentTime.getHours();
  const startMinute = currentTime.getMinutes() >= 30 ? 30 : 0;
  const startTime = useMemo(
    () => new Date(startYear, startMonth, startDate, startHour, startMinute),
    [startYear, startMonth, startDate, startHour, startMinute]
  );
  const endTime = useMemo(() => new Date(startTime.getTime() + TIMELINE_DURATION), [startTime]);

  return { currentTime, startTime, endTime };
};

interface UseChannelInfoByIdParams {
  byId: Record<string, ChannelEPGInfo>;
  contentIds: string[];
  timelineStart: number;
  timelineEnd: number;
}

export const useChannelInfoById = ({ byId, contentIds, timelineStart, timelineEnd }: UseChannelInfoByIdParams) =>
  useMemo(
    () =>
      contentIds.reduce(
        (previousById, id) => ({
          ...previousById,
          [id]: transChannelInfo({
            id,
            channel: byId[id],
            timelineStart,
            timelineEnd,
          }),
        }),
        {}
      ),
    [byId, contentIds, timelineEnd, timelineStart]
  );

export const useWebEPGData = (mode: LiveContentMode, timelineStart: number, timelineEnd: number) => {
  const byId = useAppSelector((state) => state.epg.byId);
  const contentIdsByContainer = useAppSelector((state) => state.epg.contentIdsByContainer[mode]);
  const contentIds = useMemo(
    () => flatMap(contentIdsByContainer, (container) => container.contents),
    [contentIdsByContainer]
  );
  const contentIdsToFetchRef = useRef<Set<string>>(new Set<string>());
  const [contentIdsToFetch, setContentIdsToFetch] = useState<string[]>([]);
  const throttledSetContentIdsToFetch = useMemo(() => throttle(setContentIdsToFetch, LAZY_LOAD_THROTTLE_WAIT_MS), []);
  const onChannelEnteredView = useCallback(
    (id: string, index: number) => {
      // We will load the nearby channels in advance to render faster when scrolling
      const nearbyContentIds = contentIds.slice(Math.max(0, index - 10), Math.min(contentIds.length, index + 20));
      nearbyContentIds.forEach((contentId) => {
        contentIdsToFetchRef.current.add(contentId);
      });
      if (contentIdsToFetchRef.current.size > contentIdsToFetch.length) {
        throttledSetContentIdsToFetch(Array.from(contentIdsToFetchRef.current));
      }
    },
    [contentIds, contentIdsToFetch.length, throttledSetContentIdsToFetch]
  );

  useLoadWebEPGData(mode, contentIdsToFetch, timelineStart);

  useEffect(() => {
    return () => {
      // reset live stream priority map
      resetPriorityMap();
    };
  }, []);

  const containers = useMemo(
    () =>
      contentIdsByContainer
        .filter(({ contents }) => contents.length > 0)
        .map(({ container_slug, name, contents }) => ({
          id: container_slug,
          name,
          channelIds: contents,
        })),
    [contentIdsByContainer]
  );

  const channelInfoById = useChannelInfoById({
    byId,
    contentIds,
    timelineStart,
    timelineEnd,
  });

  const programDetailsByKey = useMemo(() => getProgramDetailsByKey(contentIds, byId), [byId, contentIds]);

  return {
    contentIds,
    containers,
    channelInfoById,
    programDetailsByKey,
    onChannelEnteredView,
  };
};

export const useEpgActiveChannelAndProgram = () => {
  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const activeChannelId = useAppSelector((state) => state.live.activeContentId);
  const byId = useAppSelector((state) => state.epg.byId);

  const activeChannel = byId[activeChannelId] as ChannelEPGInfo | undefined;

  const activeProgram = useMemo(
    () => activeChannel?.programs?.filter((program) => new Date(program.end_time) >= currentDate)?.[0],
    [activeChannel?.programs, currentDate]
  );

  return {
    activeChannelId,
    activeChannel,
    activeProgram,
  };
};
