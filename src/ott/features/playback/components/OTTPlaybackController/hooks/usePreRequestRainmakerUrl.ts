import { type Player, type AdPod, PLAYER_EVENTS, type AdResponseEventData, type AdPodEmptyEventData } from '@adrise/player';
import { fetchJsonAds } from '@adrise/player/lib/utils/adTools';
import { useEffect, useState, useRef } from 'react';

import OTTFireTVPreRequestRainmakerUrlOnAutoplay from 'common/experiments/config/ottFireTVPreRequestRainmakerUrlOnAutoplay';
import OTTFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview from 'common/experiments/config/ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview';
import useExperiment from 'common/hooks/useExperiment';
import type { Video } from 'common/types/video';

import { useGetAdUrl } from './useGetAdUrl';

// In-memory cache for preSetPrerollAds data (persists during current session)
let memoryCache: AdPod | undefined;

export const enum PreRequestFrom {
  Autoplay = 'autoplay',
  Preview = 'preview',
}

interface UsePreRequestRainmakerUrlProps {
  preRequestFrom: PreRequestFrom;
  enablePreRequest: boolean;
  player: Player | undefined;
  userId: number;
  isDeeplink: boolean;
  video: Video;
  autoplayContents?: Video[];
  autoplaySelectedTitleIndex?: number;
  requestTimeout?: number;
  requestDelay?: number;
  resumePosition?: number;
}

export const AUTOPLAY_MOVIE_FETCH_TASK_DELAY = 5_000;

export const usePreRequestRainmakerUrl = ({
  preRequestFrom,
  enablePreRequest,
  player,
  userId,
  isDeeplink,
  video,
  resumePosition = 0,
  requestTimeout = 5000,
  requestDelay = 0,
  autoplaySelectedTitleIndex = 0,
  autoplayContents = [],
}: UsePreRequestRainmakerUrlProps) => {
  const ottFireTVPreRequestRainmakerUrlOnAutoplay = useExperiment(OTTFireTVPreRequestRainmakerUrlOnAutoplay);
  const ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview = useExperiment(OTTFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview);

  // Initialize state with data from memory cache
  const [preSetPrerollAds, setPreSetPrerollAds] = useState<AdPod | undefined>(memoryCache);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    memoryCache = preSetPrerollAds;
  }, [preSetPrerollAds]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    setPreSetPrerollAds(undefined);
  }, [autoplaySelectedTitleIndex, video]);

  const targetVideo = preRequestFrom === PreRequestFrom.Autoplay ? autoplayContents[autoplaySelectedTitleIndex] : video;

  const { getAdUrl } = useGetAdUrl({
    isTrailer: false,
    adBreaks: [],
    isAutomaticAutoplay: preRequestFrom === PreRequestFrom.Autoplay,
    isDeeplink,
    userId,
    video: targetVideo,
  });

  const clearMemoryCache = (data: AdResponseEventData | AdPodEmptyEventData) => {
    /* istanbul ignore else */
    if (data.isPreroll) {
      setPreSetPrerollAds(undefined);
    }
  };

  useEffect(() => {
    if (!player) {
      return;
    }

    clearTimeout(fetchTimeoutRef.current);

    player.once(PLAYER_EVENTS.adResponse, clearMemoryCache);
    player.once(PLAYER_EVENTS.adPodEmpty, clearMemoryCache);

    /* istanbul ignore else */
    if (enablePreRequest && player) {
      const experiment = preRequestFrom === PreRequestFrom.Autoplay
        ? ottFireTVPreRequestRainmakerUrlOnAutoplay
        : ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview;

      experiment.logExposure();
      const enableFeature = experiment.getValue();
      if (enableFeature) {
        const rainmakerUrl = getAdUrl(resumePosition);
        /* istanbul ignore else */
        if (rainmakerUrl) {
          fetchTimeoutRef.current = setTimeout(() => {
            fetchJsonAds(rainmakerUrl, {
              requestProcessBeforeFetch: undefined,
              timeout: requestTimeout,
            }).then(({ ads }) => {
              setPreSetPrerollAds(ads);
            }).catch((error) => {
              // eslint-disable-next-line no-console
              console.error(`Error fetching preroll ads for ${preRequestFrom}:`, error);
            });
          }, requestDelay);
        }
      }
    }

    return () => {
      clearTimeout(fetchTimeoutRef.current);
      player.off(PLAYER_EVENTS.adResponse, clearMemoryCache);
      player.off(PLAYER_EVENTS.adPodEmpty, clearMemoryCache);
    };
  }, [
    enablePreRequest, player, getAdUrl,
    preRequestFrom, requestDelay, requestTimeout,
    resumePosition, autoplaySelectedTitleIndex,
    ottFireTVPreRequestRainmakerUrlOnAutoplay,
    ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview]);

  return {
    preSetPrerollAds,
  };
};
