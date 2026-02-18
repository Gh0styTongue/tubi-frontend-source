import { useCallback } from 'react';

import { getUse480pAds } from 'client/features/playback/utils/use480pAds';
import OTTFireTVUse480PAdsAfterAdHealthscoreLow from 'common/experiments/config/ottFireTVUse480PAdsAfterAdHealthscoreLow';
import OTTLGTVUse480pAdsAfterAdHealthScoreLow from 'common/experiments/config/ottLGTVUse480pAdsAfterAdHealthScoreLow';
import OTTPlayerFireTVUseHlsAds from 'common/experiments/config/ottPlayerFireTVUseHlsAds';
import OTTPlayerHisenseUseHlsAds from 'common/experiments/config/ottPlayerHisenseUseHlsAds';
import OTTPlayerSamsungUseHlsAdsNewer from 'common/experiments/config/ottPlayerSamsungUseHlsAdsNewer';
import OTTPlayerSamsungUseHlsAdsPreloading from 'common/experiments/config/ottPlayerSamsungUseHlsAdsPreloading';
import { getAdOrigin } from 'common/features/playback/utils/adOrigin';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { deviceIdSelector } from 'common/selectors/auth';
import { sponExpSelector } from 'common/selectors/container';
import { deviceDealSelector } from 'common/selectors/ottSystem';
import { isEspanolModeEnabledSelector, isKidsModeSelector, osNameSelector } from 'common/selectors/ui';
import FeatureSwitchManager, { AD_MOCK_LIST } from 'common/services/FeatureSwitchManager';
import { VIDEO_RESOURCE_RESOLUTION, type Video } from 'common/types/video';
import { getAppMode } from 'common/utils/appMode';
import { usePlaybackOriginFromQuery } from 'ott/features/playback/hooks/usePlaybackOriginFromQuery';

import { getOTTAdUrl } from '../../../utils/getOTTAdUrl';

function prerollDisabled(): boolean {
  return ['noPreroll', 'noOdd'].includes(FeatureSwitchManager.get(['Ad', 'Availability']) as string);
}

export type UseGetAdUrlProps = {
  isAutomaticAutoplay: boolean;
  isDeeplink: boolean;
  isTrailer: boolean;
  adBreaks: readonly number[];
  userId: number;
  video: Video;
};

export function useGetAdUrl(props: UseGetAdUrlProps) {
  const ottPlayerFireTVUseHlsAds = useExperiment(OTTPlayerFireTVUseHlsAds);
  const ottPlayerHisenseUseHlsAds = useExperiment(OTTPlayerHisenseUseHlsAds);
  const ottPlayerSamsungUseHlsAdsNewer = useExperiment(OTTPlayerSamsungUseHlsAdsNewer);
  const ottPlayerSamsungUseHlsAdsPreloading = useExperiment(OTTPlayerSamsungUseHlsAdsPreloading);
  const ottLGTVUse480pAdsAfterAdHealthScoreLow = useExperiment(OTTLGTVUse480pAdsAfterAdHealthScoreLow);
  const ottFireTVUse480pAdsAfterAdHealthScoreLow = useExperiment(OTTFireTVUse480PAdsAfterAdHealthscoreLow);
  const deviceDeal = useAppSelector(deviceDealSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isEspanolModeEnabled = useAppSelector(isEspanolModeEnabledSelector);
  const sponExp = useAppSelector(sponExpSelector);
  const deviceId = useAppSelector(deviceIdSelector);
  const osName = useAppSelector(osNameSelector);
  const adsDisabled = useCallback(() => {
    return ((__IS_ALPHA_ENV__ || !__PRODUCTION__) && FeatureSwitchManager.isDisabled(['Ad', 'Availability'])) || props.isTrailer;
  }, [props.isTrailer]);
  const { isFromAutoplay } = usePlaybackOriginFromQuery();

  const use480pAds = getUse480pAds();

  const isPrerollEnabled = useCallback(() => {
    return !adsDisabled() && !prerollDisabled() && props.adBreaks.indexOf(0) !== -1;
  }, [adsDisabled, props.adBreaks]);

  const getAdUrl = useCallback((position: number, resumeType?: string) => {
    if (adsDisabled()) {
      if (!AD_MOCK_LIST.EmptyAd) {
        throw new Error('Mock List Empty Ad should be a string');
      }
      return AD_MOCK_LIST.EmptyAd;
    }
    if (!FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
      const mockUrl = FeatureSwitchManager.get(['Ad', 'MockUrl']);
      if (typeof mockUrl !== 'string') {
        throw new Error('Mock URL should be string');
      }

      return mockUrl;
    }

    const { id: contentId, publisher_id: publisherId } = props.video;

    const useIPv4OnlyServer = __IS_COMCAST_PLATFORM_FAMILY__ === false || __OTTPLATFORM__ === 'ROGERS';

    const { origin, containerId } = getAdOrigin({
      isDeeplink: props.isDeeplink,
      isFromAutoplay,
      isAutomaticAutoplay: props.isAutomaticAutoplay,
    });

    if (use480pAds) {
      ottLGTVUse480pAdsAfterAdHealthScoreLow.logExposure();
      ottFireTVUse480pAdsAfterAdHealthScoreLow.logExposure();
    }

    const url = getOTTAdUrl({
      contentId,
      deviceDeal,
      deviceId,
      position,
      publisherId,
      userId: props.userId,
      useIPv4OnlyServer,
      appMode: getAppMode({ isKidsModeEnabled, isEspanolModeEnabled }),
      sponExp,
      resumeType,
      origin,
      containerId,
      os: osName,
      ...(use480pAds && (ottLGTVUse480pAdsAfterAdHealthScoreLow.getValue() || ottFireTVUse480pAdsAfterAdHealthScoreLow.getValue()) && { video_resolution: VIDEO_RESOURCE_RESOLUTION.RES_480P }),
    });

    const hlsAdsExperiments = [ottPlayerFireTVUseHlsAds, ottPlayerHisenseUseHlsAds, ottPlayerSamsungUseHlsAdsNewer, ottPlayerSamsungUseHlsAdsPreloading];

    hlsAdsExperiments.forEach((experiment) => experiment.logExposure());

    if (hlsAdsExperiments.some((experiment) => experiment.getValue())) {
      return url.replace('&content_type=mp4', '&video_type=hls');
    }

    return url;
  }, [adsDisabled, props.video, props.isDeeplink, isFromAutoplay, props.isAutomaticAutoplay, props.userId, use480pAds, deviceDeal, deviceId, isKidsModeEnabled, isEspanolModeEnabled, sponExp, osName, ottLGTVUse480pAdsAfterAdHealthScoreLow, ottFireTVUse480pAdsAfterAdHealthScoreLow, ottPlayerFireTVUseHlsAds, ottPlayerHisenseUseHlsAds, ottPlayerSamsungUseHlsAdsNewer, ottPlayerSamsungUseHlsAdsPreloading]);

  return {
    // exposed only for testing as of this commit
    adsDisabled,
    getAdUrl,
    isPrerollEnabled,
  };

}

