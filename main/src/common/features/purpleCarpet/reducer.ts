import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import { PurpleCarpetStatus } from 'common/features/purpleCarpet/type';

export interface PurpleCarpetState {
  status: PurpleCarpetStatus;
  listing: {
    id: string;
    startDate: string;
    endDate: string;
    tubi_id: string;
    network: string;
    description: string;
    genres: string[];
    logo: string;
    background: string;
    heroImage?: string;
    main_event?: boolean;
    isUHD?: boolean;
  }[];
  hasResetIndex?: boolean;
  listIsLoading?: boolean;
}

const initialState: PurpleCarpetState = {
  status: PurpleCarpetStatus.NotAvailable,
  listing: [],
  hasResetIndex: false,
  listIsLoading: false,
};

interface ListingResponseItem {
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
      tubi_id: string
      startDate: string;
      endDate: string;
      network: string;
      main_event?: boolean;
    }
  },
  stream: {
    isUHD: boolean;
  }
}

export default function PurpleCarpetReducer(state: PurpleCarpetState = initialState, action: AnyAction) {
  switch (action.type) {
    case actions.SET_PURPLE_CARPET_STATUS:
      return {
        ...state,
        status: action.status,
      };
    case actions.LOAD_PURPLE_CARPET_LISTING.SUCCESS: {
      const { payload = [] } = action;

      return {
        ...state,
        listing: payload.map((item:ListingResponseItem) => {
          const { description, genres, images, listing: { id, startDate, endDate, tubi_id, network, main_event } } = item.asset;
          return {
            id,
            startDate,
            endDate,
            tubi_id,
            network,
            description,
            genres,
            logo: images.logoCenter,
            heroImage: images.keyart_tablet_landscape,
            background: images.seriesDetail,
            main_event,
            isUHD: item.stream.isUHD,
          };
        }),
      };
    }
    case actions.SET_PURPLE_CARPET_INDEX_STATE: {
      const { hasResetIndex } = action;
      return {
        ...state,
        hasResetIndex,
      };
    }
    case actions.SET_PURPLE_CARPET_LIST_LOADING_STATE: {
      const { listIsLoading } = action;
      return {
        ...state,
        listIsLoading,
      };
    }
    default:
      return state;
  }
}
