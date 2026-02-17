import type { PlayerName } from '@adrise/player';
import { Player, PLAYER_EVENTS } from '@adrise/player';
import Analytics from '@tubitv/analytics';

import type { Monitoring } from 'client/features/playback/monitor/monitoring';
import { getVideoMonitoringDRM } from 'client/features/playback/utils/getVideoMonitoringDRM';
import {
  EXPERIMENT_MANAGER_EVENTS,
  YOUBORA_EXPERIMENT_OPTION,
} from 'common/constants/constants';
import type { Experiment } from 'common/experiments/Experiment';
import getManagerInstance from 'common/experiments/ExperimentManager';
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
  youboraExperimentMap: { [name: string]: Experiment };
  ignoreShortBuffering?: boolean;
}

export async function setupYoubora(
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
    youboraExperimentMap,
    dimensions,
    ignoreShortBuffering,
  }: SetupYouboraOption) {
  // NOTE when users fall in new player/ott loading experience experiment, either control or treatment group, we need to send
  // the experiment name and treatment name to Youbora in order to compare their metrics
  const runningExperiments = Object.values(youboraExperimentMap).filter(experiment => experiment.isInExperiment() && experiment.enabled);
  const runningExperiment: typeof runningExperiments[number] | undefined = runningExperiments[0];
  const experimentManager = getManagerInstance();
  let monitoring: Monitoring;
  function handleExperimentExposure(experiment: Experiment) {
    if (!monitoring || !experiment.inYoubora) {
      return;
    }

    const { experimentName, treatment } = experiment;

    // ignore the type because the absence types of Youbora lib
    if (!monitoring.plugin.options[YOUBORA_EXPERIMENT_OPTION]) {
      monitoring.plugin.options[YOUBORA_EXPERIMENT_OPTION] = '';
    }
    monitoring.plugin.options[YOUBORA_EXPERIMENT_OPTION] += `${[experimentName, treatment].filter(Boolean).join('-')};`;
  }

  try {
    const { setup: setupMonitoring } = await import(
      /* webpackChunkName: "youbora-monitoring", webpackPreload: true */ 'client/features/playback/monitor/monitoring'
    );
    if (player.isDestroyed) return;
    const runningExperimentsStr = runningExperiments.reduce((pre, cur) => {
      const { experimentName, treatment } = cur;
      return `${[experimentName, treatment].filter(Boolean).join('-')};`;
    }, '');
    monitoring = setupMonitoring(player, {
      analyticsConfig: Analytics.getAnalyticsConfig(),
      contentId,
      contentType,
      drm: getVideoMonitoringDRM(videoResourceType),
      duration,
      experimentName: runningExperiment?.experimentName,
      experimentTreatmentName: runningExperiment?.treatment ?? undefined,
      runningExperiments: runningExperimentsStr, // Will be consumed by customDimension.8
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

    if (experimentManager.exposuredExperiments.length > 0) {
      // in case experiment logExposure before youbora setup.
      experimentManager.exposuredExperiments.forEach(handleExperimentExposure);
    }

    experimentManager.addListener(EXPERIMENT_MANAGER_EVENTS.logExposure, handleExperimentExposure);
    const handlePlayerRemove = () => {
      monitoring.remove();
      experimentManager.removeListener(EXPERIMENT_MANAGER_EVENTS.logExposure, handleExperimentExposure);
    };
    /**
     * @FIXME (Leo Fu) same call due to signature conflicts between Player and LivePlayerWrapper
     */
    /* istanbul ignore next */
    if (player instanceof Player) {
      player.on(PLAYER_EVENTS.remove, handlePlayerRemove);
    } else {
      player.on(PLAYER_EVENTS.remove, handlePlayerRemove);
    }
    return monitoring;
  } catch (err) {
    /* istanbul ignore next */
    logger.error(err, 'Failed to setup youbora');
  }
}
