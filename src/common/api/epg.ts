import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { LiveContentMode } from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import type { EPGContainer, EpgImages, Program } from 'common/types/epg';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { ScheduleData, VideoResource } from 'common/types/video';
import { getPlatform } from 'common/utils/platform';

const platform = getPlatform();

const CAPABILITY_HEADER_FOR_EPISODE_TITLE = '{"program_title_differ_with_episode_title": true}';

type EpgSubtitle = {
  language: string;
  url: string;
};

type EpgContent = {
  id: string;
  title: string;
  description: string;
  publisher_id: string;
  images: EpgImages;
  subtitles: EpgSubtitle[];
  video_resources: VideoResource[];
};

type EpgResponseBody = {
  containers: EPGContainer[],
  contents: Record<string, EpgContent>,
  valid_duration: number,
};

export const fetchEpg = (mode: LiveContentMode): TubiThunkAction<ThunkAction<Promise<EpgResponseBody>, StoreState, ApiClient, Action>> =>
  async (dispatch, getState) => {
    const state = getState();
    const {
      auth: {
        user,
        deviceId,
      },
    } = state;

    const params: {
      mode?: LiveContentMode;
      platform: string;
      device_id?: string;
      user_id?: number;
    } = {
      mode,
      platform,
      device_id: deviceId,
    };

    if (user?.userId) {
      params.user_id = user.userId;
    }

    const result = await dispatch(fetchWithToken<EpgResponseBody>(`${getConfig().tensorPrefixV2}/epg`, {
      params,
      retryCount: 2,
    }));

    return result;
  };

type EpgProgramming = {
  rows: {
    description: string;
    title: string;
    lang: string[];
    publisher_id: string;
    content_id: number;
    gracenote_id: string;
    is_cdc: boolean;
    video_resources: VideoResource[];
    images: EpgImages;
    needs_login: boolean;
    programs: Program[];
    has_subtitle: boolean;
  }[];
  valid_duration: number;
};

export const fetchEpgProgramming = (
  { limitResolutions, lookahead, contentIds, date }: {
    contentIds?: (string | number)[];
    limitResolutions?: string[];
    lookahead?: number;
    date?: string;
  } = {}
): TubiThunkAction<ThunkAction<Promise<EpgProgramming>, StoreState, ApiClient, Action>> =>
  async (dispatch, getState) => {
    const state = getState();
    const {
      auth: {
        user,
        deviceId,
      },
    } = state;
    const params: Record<string, unknown> = {
      platform,
      device_id: deviceId,
      limit_resolutions: limitResolutions,
      lookahead,
      content_id: contentIds?.join(','),
      date,
    };
    if (user?.userId) {
      params.user_id = user.userId;
    }
    const result = await dispatch(
      fetchWithToken<EpgProgramming>(
        `${getConfig().epgServicePrefix}/content/epg/programming`,
        {
          params,
          headers: {
            'x-capability': CAPABILITY_HEADER_FOR_EPISODE_TITLE,
          },
          qsStringifyOptions: {
            arrayFormat: 'brackets',
          },
          retryCount: 2,
        }
      )
    );
    return result;
  };

type EpgLiveProgrammingContent = {
  content_id: number;
  title: string;
  ratings: {
    system: string;
    value: string;
    code: string;
    descriptors: string[];
  }[];
  images: EpgImages;
  video_resources: VideoResource[];
  gracenode_id: string;
  publichser_id: string;
  programs: Program[];
};

type EpgLiveProgrammingResponseBody = {
  contents: EpgLiveProgrammingContent[];
  valid_duration: number;
  fingerprint: string;
  can_update_amazon: boolean;
};

type EpgLiveProgrammingResult = {
  fireTvLiveTabChannelIds: string[]
};

// retrieve a list of all FireTV live tab linear channel IDs
// https://docs.tubi.io/api_docs/tensor#operations-default-get-api-v1-live_programming
export const fetchEpgLiveProgramming = (): TubiThunkAction<ThunkAction<Promise<EpgLiveProgrammingResult>, StoreState, ApiClient, Action>> =>
  async (dispatch, getState) => {
    const params: Record<string, unknown> = {
      platform,
    };
    const isLoggedIn = isLoggedInSelector(getState());

    const body = await dispatch(fetchWithToken<EpgLiveProgrammingResponseBody>(
      `${getConfig().tensorPrefix}/live_programming`,
      {
        params,
        qsStringifyOptions: {
          arrayFormat: 'brackets',
        },
        retryCount: 1,
        useAnonymousToken: true,
        syncAnonymousTokenToHybApp: !isLoggedIn,
      },
    ));

    const linearResponse: EpgLiveProgrammingResult = {
      fireTvLiveTabChannelIds: [],
    };

    if (body.contents && body.contents.length) {
      linearResponse.fireTvLiveTabChannelIds = body.contents.map((content) => {
        return `${content.content_id}`;
      });
    }

    return linearResponse;
  };

export const fetchEPGListing = (id: string): TubiThunkAction<ThunkAction<Promise<ScheduleData>, StoreState, ApiClient, Action>> =>
  dispatch => dispatch(fetchWithToken<ScheduleData>(`${getConfig().epgServicePrefix}/api/v1/listing/${id}`, {}));
