import { State } from '@adrise/player';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { trackThumbnailDataFetchError } from 'client/features/playback/track/client-log/trackThumbnailDataFetchError';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { playerStateSelector } from 'common/selectors/playerStore';
import { remoteConfigSelector } from 'common/selectors/remoteConfig';
import type { ThumbnailSprites, ThumbnailSpritesKeys } from 'common/types/video';
import { isBetweenStartAndEndTime } from 'common/utils/remoteConfig';

import { fetchAllContentThumbnailSpriteTypes } from './utils';

interface UseThumbnailSpriteParams {
  contentId: string;
  type?: ThumbnailSpritesKeys;
  options?: UseQueryOptions<ThumbnailSprites>;
}

// @todo-liam Consider grouping all playback related query keys into a single file or shape, like [playback, contentId, domain, ...options, etc]
export const buildThumbnailSpritesQueryKey = ({ contentId }: { contentId: string; }) => ['thumbnailSprites', contentId];

// This query fetches all thumbnail sprite types for a given contentId
export const useThumbnailSprites = ({ contentId, options }: UseThumbnailSpriteParams) => {
  const { major_event_failsafe_start, major_event_failsafe_end } = useAppSelector(remoteConfigSelector);
  const dispatch = useAppDispatch();
  const deviceId = useAppSelector(deviceIdSelector);
  const playerState = useAppSelector(playerStateSelector);

  // We disable the query if the player is not ready.
  const isPlayerReady = playerState && ![State.idle, State.inited].includes(playerState);
  const isThumbnailSpritesDisabled = isBetweenStartAndEndTime(major_event_failsafe_start, major_event_failsafe_end) || !deviceId || !isPlayerReady;

  return useQuery({
    queryKey: buildThumbnailSpritesQueryKey({ contentId }),
    queryFn: async () => {
      try {
        // Assert deviceId, the query is disabled if deviceId is not set
        return await fetchAllContentThumbnailSpriteTypes({ contentId, dispatch, deviceId: deviceId! });
      } catch (error) {
        trackThumbnailDataFetchError({ error });
        // Re-throw the error to trigger the error boundary
        throw error;
      }
    },
    enabled: !isThumbnailSpritesDisabled,
    ...options,
  });
};
