import { type Player, type PlayerName, PLAYER_EVENTS } from '@adrise/player';
import Analytics from '@tubitv/analytics';

import { setup as setupMonitoring, type Monitoring } from 'client/features/playback/monitoringLegacy/monitoring';
import { getVideoMonitoringDRM } from 'client/features/playback/utils/getVideoMonitoringDRM';
import {
  EXPERIMENT_MANAGER_EVENTS,
  YOUBORA_EXPERIMENT_OPTION,
} from 'common/constants/constants';
import ExposureEmitter, { type ExposedExperiment } from 'common/experimentV2/ExposureEmitter';
import type { YouboraContentTypes } from 'common/features/playback/constants/youbora';
import logger from 'common/helpers/logging';
import type { VIDEO_RESOURCE_CODEC, VideoResourceType } from 'common/types/video';

import type { LivePlayerWrapper } from '../live/LivePlayerWrapper';

export interface SetupYouboraOption {
  contentId: string;
  deviceId: string;
  playerName: PlayerName;
  contentType: YouboraContentTypes;
  title: string;
  duration: number;
  videoResourceType?: VideoResourceType;
  videoResourceCodec?: VIDEO_RESOURCE_CODEC;
  titanVersion?: string;
  generatorVersion?: string;
  ssaiVersion?: string;
  userId?: number;
  lang?: string;
  dimensions?: Record<string, string | number>;
  ignoreShortBuffering?: boolean;
}

export function setupYoubora(
  player: Player | LivePlayerWrapper,
  {
    userId,
    contentType,
    videoResourceType,
    videoResourceCodec,
    titanVersion,
    generatorVersion,
    ssaiVersion,
    contentId,
    title,
    lang,
    duration,
    dimensions,
    ignoreShortBuffering,
  }: SetupYouboraOption) {
  let monitoring: Monitoring;
  function handleExperimentExposure(experiment: ExposedExperiment) {
    if (!monitoring || !experiment.inYoubora) {
      return;
    }

    const { experimentName, treatment } = experiment;
    const experimentKey = [experimentName, treatment].filter(Boolean).join('-');
    const options = monitoring.getOptions();
    // ignore the type because the absence types of Youbora lib
    if (!options[YOUBORA_EXPERIMENT_OPTION]) {
      monitoring.setOptions(YOUBORA_EXPERIMENT_OPTION, experimentKey);
    } else {
      monitoring.setOptions(YOUBORA_EXPERIMENT_OPTION, `${options[YOUBORA_EXPERIMENT_OPTION]};${experimentKey}`);
    }
  }

  try {
    if (player.isDestroyed) return;
    monitoring = setupMonitoring(player, {
      analyticsConfig: Analytics.getAnalyticsConfig(),
      contentId,
      contentType,
      drm: getVideoMonitoringDRM(videoResourceType),
      duration,
      language: lang as string,
      playbackType: videoResourceType,
      playbackCodec: videoResourceCodec,
      title,
      userId,
      titanVersion,
      generatorVersion,
      ssaiVersion,
      dimensions,
      ignoreShortBuffering,
    });

    // in case experiment logExposure before youbora setup.
    const exposureEmitter = ExposureEmitter.getInstance();
    exposureEmitter.exposedExperiments.forEach(handleExperimentExposure);

    exposureEmitter.addListener(EXPERIMENT_MANAGER_EVENTS.logExposure, handleExperimentExposure);
    const handlePlayerRemove = () => {
      monitoring.remove();
      exposureEmitter.removeListener(EXPERIMENT_MANAGER_EVENTS.logExposure, handleExperimentExposure);
    };
    player.on(PLAYER_EVENTS.remove, handlePlayerRemove);
    return monitoring;
  } catch (err) {
    /* istanbul ignore next */
    logger.error(err, 'Failed to setup youbora');
  }
}

