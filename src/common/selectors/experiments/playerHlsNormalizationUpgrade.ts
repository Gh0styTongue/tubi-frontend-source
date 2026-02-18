/* istanbul ignore file */
import { experimentConfig as ComcastConfig } from 'common/experiments/config/ottComcastHlsUpgrade';
import { experimentConfig as FiretvConfig } from 'common/experiments/config/ottFiretvHlsUpgrade';
import { experimentConfig as OTTHisenseHlsUpgrade } from 'common/experiments/config/ottHisenseHlsUpgrade';
import { experimentConfig as LGTVConfig } from 'common/experiments/config/ottLGTVHlsUpgrade';
import { getConfig as Samsung2015Config } from 'common/experiments/config/ottPlayerSamsungUseHls2015';
import { experimentConfig as PS5Config } from 'common/experiments/config/ottPS5HlsUpgrade';
import { getConfig as SamsungConfig } from 'common/experiments/config/ottSamsungHlsUpgrade';
import { experimentConfig as TivoConfig } from 'common/experiments/config/ottTivoHlsUpgrade';
import { experimentConfig as VizioConfig } from 'common/experiments/config/ottVizioHlsUpgrade';
import { experimentConfig as XboxoneConfig } from 'common/experiments/config/ottXboxoneHlsUpgrade';
import { experimentConfig as WebConfig } from 'common/experiments/config/webHlsUpgrade';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
import { isSamsungBefore2017 } from 'common/utils/tizenTools';

let config: ExperimentConfig<boolean, string>;
if (__WEBPLATFORM__ === 'WEB') {
  config = WebConfig();
} else if (__OTTPLATFORM__ === 'FIRETV_HYB') {
  config = FiretvConfig();
} else if (__OTTPLATFORM__ === 'COMCAST') {
  config = ComcastConfig();
} else if (__OTTPLATFORM__ === 'VIZIO') {
  config = VizioConfig();
} else if (__OTTPLATFORM__ === 'LGTV') {
  config = LGTVConfig();
} else if (__OTTPLATFORM__ === 'XBOXONE') {
  config = XboxoneConfig();
} else if (__OTTPLATFORM__ === 'TIVO') {
  config = TivoConfig();
} else if (__OTTPLATFORM__ === 'PS5') {
  config = PS5Config();
} else if (__OTTPLATFORM__ === 'TIZEN') {
  if (isSamsungBefore2017()) {
    config = Samsung2015Config();
  } else {
    config = SamsungConfig();
  }
} else if (__OTTPLATFORM__ === 'HISENSE') {
  config = OTTHisenseHlsUpgrade();
}

const GraduatedHlsNextPlatforms = [
  'FIRETV_HYB',
  'COMCAST', 'COMCASTHOSP', 'ROGERS', 'COX', 'SHAW',
  'VIZIO',
  'LGTV',
  'XBOXONE',
  'TIVO',
  'PS5',
  'PS4',
  'HISENSE',
];

export const playerHlsNormalizationUpgradeSelector = (state: StoreState): boolean => {
  if (FeatureSwitchManager.isEnabled(['Player', 'HlsVersion'])) return true;
  if (__WEBPLATFORM__ === 'WEB' || __WEBPLATFORM__ === 'WINDOWS') return true;
  if (GraduatedHlsNextPlatforms.includes(__OTTPLATFORM__)) return true;
  if (!config) return false;

  const result = popperExperimentsSelector(state, {
    namespace: config.namespace,
    parameter: config.parameter,
    config,
  });
  return result;
};
