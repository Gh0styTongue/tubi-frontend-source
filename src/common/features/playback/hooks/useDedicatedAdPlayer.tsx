import { getExperiment } from 'common/experimentV2';
import webottFireTVAfttDetachHlsCacheFragments from 'common/experimentV2/configs/webottFireTVAfttDetachHlsCacheFragments';
import useAppSelector from 'common/hooks/useAppSelector';
import { userAgentSelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { isSamsung2024, isSamsungBefore2017 } from 'common/utils/tizenTools';

export default function useDedicatedAdPlayer() {
  const userAgent = useAppSelector(userAgentSelector);
  const isAFTT = __OTTPLATFORM__ === 'FIRETV_HYB' && userAgent.ua.indexOf('AFTT ') !== -1;
  const afttEnableDetachHlsCacheFragments = getExperiment(webottFireTVAfttDetachHlsCacheFragments, { disableExposureLog: !isAFTT }).get('enable_detach_hls_cache_fragments_v0');

  if (!FeatureSwitchManager.isDefault(['Player', 'DedicatedAdPlayer'])) {
    return FeatureSwitchManager.isEnabled(['Player', 'DedicatedAdPlayer']);
  }

  if (__OTTPLATFORM__ === 'TIZEN') {
    return !isSamsungBefore2017() && !isSamsung2024();
  }

  if (isAFTT) {
    return !afttEnableDetachHlsCacheFragments;
  }

  return __SHOULD_USE_DEDICATED_AD_PLAYER__;
}
