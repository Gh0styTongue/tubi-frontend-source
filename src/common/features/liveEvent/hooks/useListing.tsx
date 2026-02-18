import { useQueries } from '@tanstack/react-query';
import { isEqual, union } from 'lodash';
import { useEffect, useMemo } from 'react';

import { fetchEPGListing } from 'common/api/epg';
import { LOAD_SCHEDULE_DATA_SUCCESS, UPDATE_CONTAINER_CHILDREN } from 'common/constants/action-types';
import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { byIdSelector } from 'common/selectors/video';
import type { ScheduleData } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';

import { liveEventContainersChildrenMapSelector } from '../selectors';
import { LiveEventContentStatus } from '../types';
import { getLiveEventContentStatus } from '../utils';

const liveEventContainersChildrenMapCache: Record<string, string[]> = {};

const updateLiveEventContainersChildrenMapCache = (map: Record<string, string[]>) => {
  Object.entries(map).forEach(([containerId, children]) => {
    liveEventContainersChildrenMapCache[containerId] = union([...(liveEventContainersChildrenMapCache[containerId] || []), ...children]);
  });
};

export const useListing = ({ ids, skip = false }: {ids?: string[], skip?: boolean}) => {
  const location = useLocation();
  const { pathname } = location;
  const liveEventContainersChildrenMap = useAppSelector(state => {
    const map = liveEventContainersChildrenMapSelector(state, { pathname });
    updateLiveEventContainersChildrenMapCache(map);
    return map;
  });
  const liveEventContainersChildrens = Object.values(liveEventContainersChildrenMapCache).flat();
  const currentDate = useAppSelector(state => state.ui.currentDate);
  const videos = useAppSelector(byIdSelector);
  const contentIds = ids ?? liveEventContainersChildrens;
  const scheduleIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    contentIds.forEach(id => {
      if (videos[id]?.schedule_data?.id) {
        map[id] = videos[id].schedule_data!.id;
      }
    });
    return map;
  }, [contentIds, videos]);
  const dispatch = useAppDispatch();
  const result = useQueries({
    queries: Object.entries(scheduleIdMap).map(([contentId, scheduleId]) => ({
      queryKey: ['listing', scheduleId],
      initialData: {
        ...videos[contentId]?.schedule_data,
        content_id: contentId,
      },
      queryFn: async () => {
        const result = await dispatch(fetchEPGListing(scheduleId));
        if (result) {
          dispatch(actionWrapper(LOAD_SCHEDULE_DATA_SUCCESS, {
            id: contentId,
            schedule_data: result,
          }));
        }
        return result;
      },
      refetchOnMount: 'always' as const,
      staleTime: 0,
      retry: false,
      enabled: !skip,
    })),
    combine: (results) => {
      const data: Record<string, ScheduleData> = {};
      results.forEach((result) => {
        if (result.data) {
          data[result.data.content_id] = result.data;
        }
      });
      return {
        data,
        loaded: results.every(result => result.isFetched),
      };
    },
  });
  const { loaded, data } = result;
  useEffect(() => {
    if (loaded) {
      // Filter out the contents that are ended
      Object.entries(liveEventContainersChildrenMap).forEach(([containerId, children]) => {
        const newChildren = liveEventContainersChildrenMapCache[containerId]?.filter(id => getLiveEventContentStatus(currentDate, data[id]) !== LiveEventContentStatus.Ended);
        if (isEqual(children, newChildren)) {
          return;
        }
        dispatch(actionWrapper(UPDATE_CONTAINER_CHILDREN, {
          id: containerId,
          children: newChildren,
        }));
      });
    }
  }, [loaded, liveEventContainersChildrenMap, dispatch, currentDate, data]);
  return result;
};
