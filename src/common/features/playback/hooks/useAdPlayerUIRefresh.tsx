import { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import OTTFireTVPlayerUIRefreshAdPlayer from 'common/experiments/config/ottFireTVPlayerUIRefreshAdPlayer';
import useExperiment from 'common/hooks/useExperiment';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export function isInAdPlayerUIRefreshVariant(variant: AdPlayerUIRefreshVariant) {
  return variant && variant !== AdPlayerUIRefreshVariant.Default;
}

export function inGroupTotalAdTimeWithCleanMode(variant: AdPlayerUIRefreshVariant) {
  return variant === AdPlayerUIRefreshVariant.V2;
}

export function inGroupCurrentAdTimeWithCleanMode(variant: AdPlayerUIRefreshVariant) {
  return variant === AdPlayerUIRefreshVariant.V1;
}

export function inGroupTotalAdTime(variant: AdPlayerUIRefreshVariant) {
  return variant === AdPlayerUIRefreshVariant.V3;
}

export function inGroupCurrentAdTime(variant: AdPlayerUIRefreshVariant) {
  return variant === AdPlayerUIRefreshVariant.V4;
}

export default function useAdPlayerUIRefresh() {
  const ottFireTVPlayerUIRefreshAdPlayer = useExperiment(OTTFireTVPlayerUIRefreshAdPlayer);

  /* istanbul ignore next */
  if (!FeatureSwitchManager.isDefault(['Ad', 'AdPlayerUIRefresh'])) {
    return FeatureSwitchManager.get(['Ad', 'AdPlayerUIRefresh']) as unknown as AdPlayerUIRefreshVariant;
  }

  return ottFireTVPlayerUIRefreshAdPlayer.getValue();
}
