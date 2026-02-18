import { useQuery } from '@tanstack/react-query';

import { trackPerformanceMetrics, sendLog } from 'client/utils/datadog';
import ApiClient from 'common/helpers/ApiClient';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

const LISTING_URL = 'https://epg-cdn.production-public.tubi.io/api/v1/listing_proxy';

type ListingResponseItem = {
  asset: {
    description: string;
    image: string;
    genres: string[];
    images: {
      logoCenter: string;
      keyart_tablet_landscape: string;
      seriesDetail: string;
    };
    listing: {
      id: string;
      tubi_id: string;
      parent_id?: string;
      startDate: string;
      endDate: string;
      network: string;
      main_event?: boolean;
      enable_watch_history?: boolean;
    };
  };
  stream: {
    isUHD: boolean;
  };
};

type LiveEventListingItem = {
  id: string;
  startDate: string;
  endDate: string;
  tubi_id: string;
  parent_id?: string;
  network: string;
  description: string;
  genres: string[];
  logo: string;
  heroImage?: string;
  background: string;
  main_event?: boolean;
  isUHD?: boolean;
  enable_watch_history?: boolean;
};

const fetchLiveEventListing = async (): Promise<LiveEventListingItem[]> => {
  const client = ApiClient.create();
  try {
    const payload: ListingResponseItem[] = await client.get(LISTING_URL);
    const items = (payload || []).map((item) => {
      const { description, genres, images, listing } = item.asset;
      return {
        id: listing.id,
        startDate: listing.startDate,
        endDate: listing.endDate,
        tubi_id: listing.tubi_id,
        parent_id: listing.parent_id,
        network: listing.network,
        description,
        genres,
        logo: images.logoCenter,
        heroImage: images.keyart_tablet_landscape,
        background: images.seriesDetail,
        main_event: listing.main_event,
        isUHD: item.stream.isUHD,
        enable_watch_history: listing.enable_watch_history,
      };
    });

    // Force all listings to cover current time when feature switch is enabled
    if (FeatureSwitchManager.isEnabled('ForceLiveEventListingTime')) {
      const now = new Date();
      const startDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour before
      const endDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour after

      return items.map((item) => ({
        ...item,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }));
    }

    return items;
  } catch (error) {
    trackPerformanceMetrics({ 'seaTiger.errorBeforePlay': 1 }, {}, 'increment');
    sendLog(
      'seatiger_playback: listing load error',
      { errorMessage: String((error as any)?.message ?? error) },
      'error'
    );
    throw error;
  }
};

export const useLiveEventListing = () => {
  return useQuery({
    queryKey: ['liveEvent', 'listing'],
    queryFn: fetchLiveEventListing,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    retry: false,
  });
};
