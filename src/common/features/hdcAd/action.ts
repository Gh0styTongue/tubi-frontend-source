import { getOngoingFetch, shouldFetch } from '@tubitv/refetch';
import type { Location } from 'history';
import isEmpty from 'lodash/isEmpty';
import type { ThunkAction } from 'redux-thunk';

import { getResolution } from 'client/features/playback/props/query';
import { getSystemApi } from 'client/systemApi/default';
import { getCookieCrossPlatform } from 'client/utils/localDataStorage';
import { resetOTTHomeSelectedState } from 'common/actions/fire';
import { batchAddVideos } from 'common/actions/video';
import getApiConfig from 'common/apiConfig';
import { LOAD_HDC_AD, LOAD_CONTAINERS, HDC_AD_PLAY_FINISHED, HDC_AD_RESET_FIRED_IMPRESSION, HDC_AD_SET_WRAPPER_VIDEO_PLAYED, HDC_AD_SET_FROM_WRAPPER_FULLSCREEN_PLAYBACK } from 'common/constants/action-types';
import { COOKIE_DEVICE_ID, DEVICE_RESOLUTION } from 'common/constants/constants';
import { COOKIE_ADVERTISER_ID } from 'common/constants/cookies';
import { FIRETV_HDC_AD_VARIANT } from 'common/experiments/config/ottFireTVHdcAd';
import { userSelector } from 'common/features/authentication/selectors/auth';
import { getMockHdcAd } from 'common/features/hdcAd/mockData';
import type ApiClient from 'common/helpers/ApiClient';
import { containerSelector } from 'common/selectors/container';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isHdcAdEnabledForAdultsAndHomepageSelector, isHdcAdEnabledSelector, ottFireTVHdcAdSelector } from 'common/selectors/experiments/ottFireTVHdcAdSelectors';
import { enable4KSelector } from 'common/selectors/fire';
import { isAdultsModeSelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { ContainerLoadState } from 'common/types/container';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { getAppMode } from 'common/utils/appMode';
import { fireTrackingPixel } from 'common/utils/fireTrackingPixel';
import { getAnalyticsPlatform } from 'common/utils/getAnalyticsPlatform';

import { HDC_CAROUSEL, HDC_CONTAINER_PREFIX, HDC_SPOTLIGHT, HDC_WRAPPER, HDC_WRAPPER_VIDEO } from './constants';
import { hdcAdSelector } from './selector';
import type { LoadHdcAdRequestData, HdcAdResponse, HdcAdCreativetype, HdcAdUnit } from './type';
import {
  convertHdcAdsToContainersAndContents,
  convertNativeCreativeMap,
  convertVideoCreativeMap,
  getOsVersion,
  trackHdcAdError,
} from './utils';
import { WRAPPER_CONTAINER_ID } from '../wrapper/constants';
import { shouldShowWrapperSelector } from '../wrapper/selector';

const apiConfig = getApiConfig();

const getWrapperRequestParams = () => ({
  homepage_video: {
    sizes: {
      rendering_codes: [HDC_WRAPPER_VIDEO],
    },
  },
  tubi_app_homepage: {
    sizes: {
      rendering_codes: [HDC_WRAPPER],
    },
  },
});

/**
 * Build HDC ad request parameters with device and user information
 * @param state Redux state
 * @returns Formatted request parameters for HDC ad API
 */
export async function buildHdcAdRequestParams(state: StoreState, shouldRequestWrapper?: boolean): Promise<LoadHdcAdRequestData> {
  const analyticsPlatform = getAnalyticsPlatform(__OTTPLATFORM__);
  const deviceId = deviceIdSelector(state) ?? await getCookieCrossPlatform(COOKIE_DEVICE_ID);
  const user = userSelector(state);
  const isAdultsMode = isAdultsModeSelector(state);

  // Get device dimensions with fallbacks
  const deviceResolution = await getCookieCrossPlatform(DEVICE_RESOLUTION);
  const [deviceWidth, deviceHeight] = deviceResolution ? deviceResolution.split('x').map(Number) : [1920, 1080];

  // Get OS version from state or user agent
  const osVersion = getOsVersion(state);

  // Get manufacturer from state or use platform as fallback
  const manufacturer = state.ottSystem?.deviceManufacturer || analyticsPlatform;

  // Get video resolution
  const videoResolution = await getResolution(enable4KSelector(state), false);

  // Get advertiser ID if available
  const idfa = isAdultsMode ? (await getCookieCrossPlatform(COOKIE_ADVERTISER_ID)) || getSystemApi().getAdvertiserId() : '';
  const appMode = getAppMode({ isKidsModeEnabled: state.ui?.isKidsModeEnabled, isEspanolModeEnabled: state.ui?.isEspanolModeEnabled });
  const isHdcSpotlight = ottFireTVHdcAdSelector(state) === FIRETV_HDC_AD_VARIANT.hdc_spotlight;

  return {
    viewer: {
      viewer_id: user?.userId?.toString() ?? '',
    },
    app: {
      app_install_id: deviceId,
      ifa: idfa,
      video_resoln: videoResolution,
    },
    device: {
      platform: analyticsPlatform,
      os: analyticsPlatform,
      os_version: osVersion,
      make: manufacturer,
      height: deviceHeight,
      width: deviceWidth,
    },
    ad_units: {
      hdc_row: {
        sizes: {
          rendering_codes: [isHdcSpotlight ? HDC_SPOTLIGHT : HDC_CAROUSEL],
        },
      },
      ...(shouldRequestWrapper ? getWrapperRequestParams() : null),
    },
    custom_kvps: {
      app_mode: appMode,
    },
  };
}

function makeLoadHdcAdRequest(data: LoadHdcAdRequestData): TubiThunkAction<ThunkAction<Promise<HdcAdResponse>, StoreState, ApiClient, any>> {
  return async (dispatch: TubiThunkDispatch, getState, client) => {
    const response = await client.post(apiConfig.hdcAdPrefix, {
      data: data as Record<string, unknown>,
      shouldTrackDuration: true,
      timeout: 5000, // follow the notion doc: https://www.notion.so/tubi/New-Showcase-Client-API-design-1d172557e9208065a8ecdfe34ab27e4b#1d172557e92080b4ad38e839508cde82
    });
    return response;
  };
}

/**
 * Insert ad containers and contents into the store, update children map, and batch add videos
 */
export function insertAdContainersIntoHome(location: Location, shouldResetHomeSelectedContainer: boolean = false): TubiThunkAction {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    if (!isHdcAdEnabledSelector(state, location.pathname) || !state.hdcAd.data || !state.hdcAd.data.ads?.ad_units) {
      return;
    }
    const adUnits = Object.values(state.hdcAd.data.ads.ad_units) as HdcAdUnit[];
    const { containers, contents, containerChildrenIdMap, rowPlacementMap } =
      convertHdcAdsToContainersAndContents(adUnits);

    // Get current containers and id maps
    const {
      containersList: containerIds,
      containerIdMap,
      containerLoadIdMap,
      containerChildrenIdMap: oldChildrenMap,
    } = containerSelector(state, { pathname: location.pathname });

    // Remove old HDC ad containers
    let updatedContainerIds = [...containerIds].filter((item) => !item.startsWith(HDC_CONTAINER_PREFIX) && item !== WRAPPER_CONTAINER_ID);
    const updatedIdMap = { ...containerIdMap };
    const updatedChildrenMap = { ...oldChildrenMap };
    const updatedLoadMap: Record<string, ContainerLoadState> = {};
    containerIds.forEach((id) => {
      updatedLoadMap[id] = { loading: false, loaded: true, cursor: 9, ttl: null };
    });
    const isWrapperAdEnabled = containerIds[0] === WRAPPER_CONTAINER_ID;

    // Insert new ad containers and update children map
    // 1. Collect all containers with their rowPlacement
    const adsWithPlacement = containers.map((container) => ({
      container,
      rowPlacement: rowPlacementMap[container.id] ?? 0,
    }));
    // 2. Sort by rowPlacement ascending
    adsWithPlacement.sort((a, b) => a.rowPlacement - b.rowPlacement);
    // 3. Insert in order, offsetting by number of already-inserted ads
    adsWithPlacement.forEach(({ container, rowPlacement }, idx) => {
      updatedIdMap[container.id] = container;
      updatedChildrenMap[container.id] = containerChildrenIdMap[container.id];
      const offset = isWrapperAdEnabled && container.id !== WRAPPER_CONTAINER_ID ? 1 : 0;
      const insertPosition = Math.min(rowPlacement + idx + offset, updatedContainerIds.length);
      updatedContainerIds = [
        ...updatedContainerIds.slice(0, insertPosition),
        container.id,
        ...updatedContainerIds.slice(insertPosition),
      ];
    });

    // Update the container state with the new list that includes the ads
    dispatch({
      type: LOAD_CONTAINERS.SUCCESS,
      payload: {
        containerIds: updatedContainerIds,
        idMap: updatedIdMap,
        loadMap: { ...containerLoadIdMap, ...updatedLoadMap },
        childrenMap: updatedChildrenMap,
        nextContainerIndexToLoad: state.container.nextContainerIndexToLoad,
        personalizationId: state.container.personalizationId,
      },
    });

    // Batch add videos (contents)
    dispatch(batchAddVideos(contents));

    // Reset OTT home selected state with first container if requested
    if (shouldResetHomeSelectedContainer && __ISOTT__ && updatedContainerIds.length > 0) {
      dispatch(resetOTTHomeSelectedState(location, updatedContainerIds[0]));
    }
  };
}

/**
 * Action creator for loading HDC advertisements
 * @param data Optional request parameters (will be merged with built params)
 * @returns Thunk action
 */
export function loadHdcAd(data: Partial<LoadHdcAdRequestData> & { insertToContainer?: boolean } = {
  insertToContainer: false,
}, location: Location, force?: boolean) {
  return async (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const { insertToContainer = false } = data;
    // only load hdc ad for homepage and adults mode
    if (!isHdcAdEnabledForAdultsAndHomepageSelector(state, location.pathname)) {
      return;
    }

    if (!force && !shouldFetch(state.hdcAd.hdcRefetchState)) {
      return getOngoingFetch(state.hdcAd.hdcRefetchState).then(res => {
        if (!res && insertToContainer) {
          dispatch(insertAdContainersIntoHome(location));
        }
        return res;
      });
    }

    try {
      dispatch({
        type: LOAD_HDC_AD.FETCH,
      });

      // Build request parameters with device and user information
      const shouldDisableWrapperInDev = (!__PRODUCTION__ || __IS_ALPHA_ENV__) && FeatureSwitchManager.isDisabled(['mockHdcAd', 'Wrapper']);
      const shouldRequestWrapper = shouldShowWrapperSelector(state, location.pathname) && !shouldDisableWrapperInDev;
      const builtParams = await buildHdcAdRequestParams(state, shouldRequestWrapper);
      const requestParams = { ...builtParams, ...data };

      const isMockHdcAdEnabled = FeatureSwitchManager.isEnabled(['mockHdcAd', 'UseMockApiData']);
      const isMockWrapperEnabled = FeatureSwitchManager.get(['mockHdcAd', 'UseMockApiData']) === 'enableWithMockWrapper';

      let response;
      if ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && (isMockHdcAdEnabled || isMockWrapperEnabled)) {
        response = getMockHdcAd({ isWrapperEnabled: isMockWrapperEnabled && shouldRequestWrapper });
      } else {
        response = await dispatch(makeLoadHdcAdRequest(requestParams));
      }

      const ads = response?.ads
        ? Object.entries(response.ads.ad_units).map(([key, adUnit]) => ({
          ...adUnit,
          code: key,
        }))
        : [];

      // Calculate validDuration from the first ad unit
      const validDuration = ads.length > 0 ? Math.min(...ads.map((ad) => ad.valid_duration)) : 0;

      await dispatch({
        type: LOAD_HDC_AD.SUCCESS,
        payload: {
          data: response,
          videoCreativeMap: convertVideoCreativeMap(ads),
          nativeCreativeMap: convertNativeCreativeMap(ads),
          validDuration,
        },
      });
      dispatch(actionWrapper(HDC_AD_RESET_FIRED_IMPRESSION));

      if (insertToContainer) {
        dispatch(insertAdContainersIntoHome(location));
      }

      return response;
    } catch (error) {
      dispatch({
        type: LOAD_HDC_AD.FAILURE,
        payload: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}

export function fireHdcAdPixels(containerId: string, type: HdcAdCreativetype = 'native'): TubiThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const pixelUrls: string[] = hdcAdSelector(state, { containerId, type }) || [];
    if (isEmpty(pixelUrls)) {
      trackHdcAdError({ message: `No imp pixel URLs found for hdc ad container ${containerId}, type ${type}` });
      return;
    }
    pixelUrls?.forEach((url) => fireTrackingPixel(url));
  };
}

export function setHdcAdPlayFinished(isAdPlayFinished: boolean) {
  return { type: HDC_AD_PLAY_FINISHED, payload: { isAdPlayFinished } };
}

export function setWrapperVideoPlayed(hasWrapperVideoPlayed: boolean) {
  return { type: HDC_AD_SET_WRAPPER_VIDEO_PLAYED, payload: { hasWrapperVideoPlayed } };
}

export function setFromWrapperFullscreenPlayback(isFromWrapperFullscreenPlayback: boolean) {
  return { type: HDC_AD_SET_FROM_WRAPPER_FULLSCREEN_PLAYBACK, payload: { isFromWrapperFullscreenPlayback } };
}
