import { PLAYER_EVENTS } from '@adrise/player';

import { useExperiment as useExperimentV2 } from 'common/experimentV2';
import { webottMajorsDiluteTimeEventV0 } from 'common/experimentV2/configs/webottMajorsDiluteTimeEventV0';

/**
 * Returns the appropriate time event based on the dilute time event experiment.
 * If the experiment is enabled, returns PLAYER_EVENTS.timeSeconds (fires on integer positions).
 * Otherwise, returns PLAYER_EVENTS.time (fires on every timeupdate).
 */
export default function useTimeEvent(): PLAYER_EVENTS {
  const enableDiluteTimeEvent = useExperimentV2(webottMajorsDiluteTimeEventV0, { disableExposureLog: true }).get('enable_dilute');
  return enableDiluteTimeEvent ? PLAYER_EVENTS.timeSeconds : PLAYER_EVENTS.time;
}

