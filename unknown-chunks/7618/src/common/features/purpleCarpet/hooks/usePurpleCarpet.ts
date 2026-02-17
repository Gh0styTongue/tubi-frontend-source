import { isInProgress, isSameDay, mins, secs } from '@adrise/utils/lib/time';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { UPDATE_CURRENT_DATE } from 'common/constants/action-types';
import useAppSelector from 'common/hooks/useAppSelector';
import { byIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';

import {
  purpleCarpetContentsSelector,
  purpleCarpetContentStatusSelector,
  purpleCarpetCurrentContentIdsSelector,
} from '../selector';
import { PurpleCarpetStatus } from '../type';
import { getExactTimeFromListing } from '../util';

const calculateTimeDiff = (diffInMs: number) => {
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};

const timeDiffCache: Record<string, ReturnType<typeof calculateTimeDiff>> = {};

export const usePurpleCarpetCountdown = (startTime?: number, id?: string) => {
  const [timeDiff, setTimeDiff] = useState<ReturnType<typeof calculateTimeDiff> | null>(id ? timeDiffCache[id] : null);
  const status = useAppSelector((state) => state.purpleCarpet.status);
  const dispatch = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>();

  const resetTimeDiff = useCallback(() => { setTimeDiff(null); }, []);

  useEffect(() => {
    if (status === PurpleCarpetStatus.NotAvailable) {
      clearInterval(intervalRef.current);
      resetTimeDiff();
      return;
    }
    if (!startTime || !id) return;

    const updateTimeDiff = () => {
      const now = new Date();
      const diffInMs = startTime - now.getTime();

      clearInterval(intervalRef.current);

      // Dynamically adjust the setInterval frequency based on the time difference
      // If more than 1 minute remains, update every 1 minute
      // Else if less than 1 minute remains, update every second
      if (diffInMs > mins(1)) {
        intervalRef.current = setInterval(updateTimeDiff, mins(1));
      } else {
        if (diffInMs <= 0) {
          dispatch(actionWrapper(UPDATE_CURRENT_DATE));
          return;
        }
        intervalRef.current = setInterval(updateTimeDiff, secs(1));
      }
      const newTimeDiff = calculateTimeDiff(diffInMs);
      setTimeDiff(newTimeDiff);
      timeDiffCache[id] = newTimeDiff;
    };

    updateTimeDiff();

    return () => {
      clearInterval(intervalRef.current);

    };
  }, [startTime, status, id, dispatch, resetTimeDiff]);

  return useMemo(() => ({ timeDiff }), [timeDiff]);
};

export const useEventData = (content?: Video) => {
  const status = useAppSelector((state) => purpleCarpetContentStatusSelector(state, { id: content?.id || '' }));
  const currentDate = useAppSelector((state) => state.ui.currentDate);

  const listing = useAppSelector(state => state.purpleCarpet.listing);
  const time = getExactTimeFromListing(listing, content?.id || '');
  const startTime = useMemo(() => time.startTime || (content?.air_datetime ? new Date(content.air_datetime).getTime() : undefined), [time, content?.air_datetime]);
  const { timeDiff } = usePurpleCarpetCountdown(startTime, content?.id);
  const isToday = startTime ? isSameDay(new Date(startTime), currentDate) : false;

  if (!content) {
    return;
  }

  const {
    needs_login,
    tags,
    has_subtitle,
    images,
    title,
    description,
    player_type = 'fox',
    landscape_images,
    backgrounds,
    type,
    banner_images,
  } = content;

  const showLiveIcon = isInProgress(startTime, time.endTime, currentDate);

  return {
    id: content.id,
    title,
    titleArt: images?.title_art?.[0],
    banner_images,
    images,
    description,
    player_type,
    needs_login,
    backgroundImage: images?.backgrounds?.[0] || backgrounds[0] || '',
    landscapeImage: images?.landscape_images?.[0] || landscape_images[0] || '',
    status,
    startTime,
    tags,
    type,
    showCC: !!has_subtitle,
    showLiveIcon,
    timeDiff,
    isToday,
  };
};
export type PurpleCarpetEvent = ReturnType<typeof useEventData>;

export const usePurpleCarpet = (id?: string) => {
  const contents = useAppSelector(purpleCarpetContentsSelector);
  const currentId = id || contents[0]?.id;
  const currentContent = useAppSelector(byIdSelector)?.[currentId];

  const current = useEventData(currentContent);
  const notEndedContentIds = useAppSelector(purpleCarpetCurrentContentIdsSelector);
  const relatedEvents = useMemo(() => contents.filter((content) => {
    return content.id !== currentId && notEndedContentIds.includes(content.id);
  }), [contents, currentId, notEndedContentIds]);

  return {
    current,
    relatedEvents,
  };
};
